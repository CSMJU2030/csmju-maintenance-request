import { createHash } from 'node:crypto';
import { fakeStoredFiles } from '../__tests__/fixtures';
import type { PrismaService } from '../prisma/prisma.service';
import { ApiError } from '../shared/errors';
import { ImageStorage, MAX_IMAGE_BYTES, sendImage, sniffImage } from './image-storage';

const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
const WEBP = Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBPVP8 ')]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const file = (buffer: Buffer, originalname = 'photo.jpg') => ({ buffer, size: buffer.length, originalname });

describe('image sniffing (magic bytes, not the file name)', () => {
  it('recognises JPEG, PNG and WebP', () => {
    expect(sniffImage(JPEG)?.mimeType).toBe('image/jpeg');
    expect(sniffImage(PNG)?.mimeType).toBe('image/png');
    expect(sniffImage(WEBP)?.mimeType).toBe('image/webp');
  });

  it('rejects anything else, including SVG and HTML renamed to .jpg', () => {
    expect(sniffImage(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'))).toBeNull();
    expect(sniffImage(Buffer.from('<html><script>alert(1)</script>'))).toBeNull();
    expect(sniffImage(Buffer.alloc(0))).toBeNull();
  });
});

describe('ImageStorage (stored_files in the database, never the disk)', () => {
  let db: ReturnType<typeof fakeStoredFiles>;
  let storage: ImageStorage;

  beforeEach(() => {
    db = fakeStoredFiles();
    storage = new ImageStorage({ storedFile: db.storedFile } as unknown as PrismaService);
  });

  it('allows 10 MB per file', () => {
    expect(MAX_IMAGE_BYTES).toBe(10 * 1024 * 1024);
  });

  it('stores the original bytes with the sniffed type, size, sha256 and uploader under a UUID key', async () => {
    const stored = await storage.save([file(JPEG), file(PNG, 'scan.jpg')], 'user-001');
    expect(stored.map((s) => s.mimeType)).toEqual(['image/jpeg', 'image/png']);
    for (const image of stored) expect(image.filename).toMatch(UUID);
    expect(db.storedFile.createMany).toHaveBeenCalledTimes(1);

    const png = db.rows.get(stored[1].filename);
    expect(png).toMatchObject({
      mimeType: 'image/png',
      sizeBytes: PNG.length,
      sha256: createHash('sha256').update(PNG).digest('hex'),
      uploadedByCoreUserId: 'user-001',
    });
    expect(Buffer.from(png!.content).equals(PNG)).toBe(true);
  });

  it('validates every file before storing any (400 VALIDATION_ERROR)', async () => {
    await expect(
      storage.save([file(JPEG), file(Buffer.from('not an image'), 'evil.jpg')]),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
    expect(db.storedFile.createMany).not.toHaveBeenCalled();
    expect(db.rows.size).toBe(0);
  });

  it('refuses oversize, empty and too many files', async () => {
    const big = { buffer: JPEG, size: MAX_IMAGE_BYTES + 1, originalname: 'big.jpg' };
    await expect(storage.save([big])).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      details: ['รูป "big.jpg" ใหญ่เกิน 10 MB'],
    });
    await expect(storage.save([file(Buffer.alloc(0))])).rejects.toBeInstanceOf(ApiError);
    await expect(storage.save(Array.from({ length: 6 }, () => file(JPEG)))).rejects.toBeInstanceOf(ApiError);
    expect(db.rows.size).toBe(0);
  });

  it('stores nothing for an empty upload', async () => {
    expect(await storage.save([])).toEqual([]);
    expect(db.storedFile.createMany).not.toHaveBeenCalled();
  });

  it('opens stored files by key, and returns null for unknown or malformed keys', async () => {
    const [stored] = await storage.save([file(WEBP)]);
    const opened = await storage.open(stored.filename);
    expect(opened).toMatchObject({ mimeType: 'image/webp', size: WEBP.length });
    expect(Buffer.from(opened!.content).equals(WEBP)).toBe(true);

    expect(await storage.open('00000000-0000-4000-8000-000000000000')).toBeNull();
    // ค่ารูปแบบเดิม (ชื่อไฟล์บนดิสก์) หรือ path ไม่ถูกส่งไปถึงฐานข้อมูลเลย
    db.storedFile.findUnique.mockClear();
    expect(await storage.open(`${stored.filename}.jpg`)).toBeNull();
    expect(await storage.open('../package.json')).toBeNull();
    expect(db.storedFile.findUnique).not.toHaveBeenCalled();
  });

  it('removes stored files and ignores keys that are not UUIDs', async () => {
    const stored = await storage.save([file(JPEG), file(PNG)]);
    await storage.remove([stored[0].filename, 'not-a-key']);
    expect(db.storedFile.deleteMany).toHaveBeenCalledWith({ where: { id: { in: [stored[0].filename] } } });
    expect([...db.rows.keys()]).toEqual([stored[1].filename]);

    db.storedFile.deleteMany.mockClear();
    await storage.remove(['x.jpg']);
    expect(db.storedFile.deleteMany).not.toHaveBeenCalled();
  });
});

describe('sendImage', () => {
  it('sends the bytes inline with nosniff and no caching', () => {
    const headers: Record<string, string> = {};
    let body: Uint8Array | undefined;
    sendImage(
      {
        setHeader: (name, value) => (headers[name] = value),
        end: (chunk) => (body = chunk),
      },
      { mimeType: 'image/png', content: PNG, size: PNG.length },
    );
    expect(headers).toEqual({
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
      'Content-Type': 'image/png',
      'Content-Length': String(PNG.length),
      'Content-Disposition': 'inline',
    });
    expect(body).toBe(PNG);
  });
});
