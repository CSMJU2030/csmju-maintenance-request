import { Injectable } from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { validationError } from '../shared/errors';

/**
 * รูปต่อ 1 ไฟล์ไม่เกิน 10 MB (deployment.md ข้อ 4.3 — ใช้เป็น limits.fileSize ของ multer ด้วย)
 * ครั้งละไม่เกิน 5 รูป · รวมต่อใบแจ้งซ่อมไม่เกิน 10 รูปต่อประเภท
 */
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_IMAGES_PER_UPLOAD = 5;
export const MAX_IMAGES_PER_KIND = 10;

export const IMAGE_TYPES = [
  { mimeType: 'image/jpeg', ext: 'jpg' },
  { mimeType: 'image/png', ext: 'png' },
  { mimeType: 'image/webp', ext: 'webp' },
] as const;
export type ImageType = (typeof IMAGE_TYPES)[number];

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** ดูชนิดไฟล์จาก magic bytes — ไม่เชื่อนามสกุลหรือ Content-Type ที่ client ส่งมา */
export function sniffImage(buffer: Buffer): ImageType | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff)
    return IMAGE_TYPES[0];
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(PNG_SIGNATURE)) return IMAGE_TYPES[1];
  if (
    buffer.length >= 12 &&
    buffer.toString('latin1', 0, 4) === 'RIFF' &&
    buffer.toString('latin1', 8, 12) === 'WEBP'
  ) {
    return IMAGE_TYPES[2];
  }
  return null;
}

export type UploadedImage = { buffer: Buffer; size: number; originalname?: string };
/** filename = stored_files.id (ชื่อ field คงเดิมเพราะคอลัมน์ในตารางธุรกิจยังชื่อ *_filename) */
export type StoredImage = { filename: string; mimeType: ImageType['mimeType']; size: number };
export type OpenedImage = { mimeType: string; content: Uint8Array; size: number };

/**
 * เก็บรูปที่ผู้ใช้อัปโหลดในตาราง stored_files ของฐานข้อมูลระบบนี้ — container อ่านอย่างเดียว ห้ามเขียนไฟล์ลงดิสก์
 * (deployment.md ข้อ 3.4/4.3) · เก็บไบต์เดิมตามที่อัปโหลด + sha256 · ตารางธุรกิจเก็บแค่ id
 */
@Injectable()
export class ImageStorage {
  constructor(private readonly prisma: PrismaService) {}

  /** ตรวจทุกไฟล์ก่อน (ขนาด + magic bytes) แล้วจึงบันทึกทั้งชุดในคำสั่งเดียว — ได้ทั้งหมดหรือไม่ได้เลย */
  async save(files: UploadedImage[], uploadedByCoreUserId: string | null = null): Promise<StoredImage[]> {
    if (files.length > MAX_IMAGES_PER_UPLOAD) {
      throw validationError([`แนบรูปได้ครั้งละไม่เกิน ${MAX_IMAGES_PER_UPLOAD} รูป`]);
    }
    const checked = files.map((file, index) => {
      const label = file.originalname ? `รูป "${file.originalname}"` : `รูปที่ ${index + 1}`;
      const size = file.buffer.length;
      if (file.size === 0 || size === 0) throw validationError([`${label} เป็นไฟล์ว่าง`]);
      if (file.size > MAX_IMAGE_BYTES || size > MAX_IMAGE_BYTES) {
        throw validationError([`${label} ใหญ่เกิน 10 MB`]);
      }
      const type = sniffImage(file.buffer);
      if (!type) throw validationError([`${label} ไม่ใช่ไฟล์ภาพ JPG, PNG หรือ WebP`]);
      return { id: randomUUID(), file, type, size };
    });
    if (checked.length === 0) return [];

    await this.prisma.storedFile.createMany({
      data: checked.map((item) => ({
        id: item.id,
        mimeType: item.type.mimeType,
        sizeBytes: item.size,
        sha256: createHash('sha256').update(item.file.buffer).digest('hex'),
        content: new Uint8Array(item.file.buffer),
        uploadedByCoreUserId,
      })),
    });
    return checked.map((item) => ({ filename: item.id, mimeType: item.type.mimeType, size: item.size }));
  }

  async remove(keys: string[]) {
    const ids = keys.filter((key) => UUID.test(key));
    if (ids.length === 0) return;
    await this.prisma.storedFile.deleteMany({ where: { id: { in: ids } } });
  }

  /** อ่านไฟล์เพื่อส่งให้ผู้ใช้ (ผู้เรียกตรวจสิทธิ์ก่อน) — คืน null เมื่อไม่มีไฟล์นี้ */
  async open(key: string): Promise<OpenedImage | null> {
    if (!UUID.test(key)) return null;
    const file = await this.prisma.storedFile.findUnique({
      where: { id: key },
      select: { mimeType: true, content: true },
    });
    if (!file) return null;
    return { mimeType: file.mimeType, content: file.content, size: file.content.byteLength };
  }
}

/**
 * ส่งรูปผ่าน @Res() เอง (ResponseInterceptor ของชั้นกลางห่อเฉพาะค่าที่ controller return)
 * nosniff + private, no-store ตาม deployment.md ข้อ 4.3 · inline เพราะเป็นรูปที่แสดงใน <img>
 */
export function sendImage(
  res: { setHeader(name: string, value: string): unknown; end(chunk: Uint8Array): unknown },
  file: OpenedImage,
) {
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Type', file.mimeType);
  res.setHeader('Content-Length', String(file.size));
  res.setHeader('Content-Disposition', 'inline');
  res.end(file.content);
}
