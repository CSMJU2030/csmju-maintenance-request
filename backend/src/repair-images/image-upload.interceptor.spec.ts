import {
  Controller,
  type INestApplication,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AllExceptionsFilter } from '../common/filters/all-exceptions.filter';
import { MAX_IMAGE_BYTES, type UploadedImage } from './image-storage';
import { ImageFileInterceptor, ImageFilesInterceptor } from './image-upload.interceptor';

const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);

@Controller('upload')
class UploadController {
  @Post('one')
  @UseInterceptors(ImageFileInterceptor('photo'))
  one(@UploadedFile() file: UploadedImage | undefined) {
    return { size: file?.size ?? 0, inMemory: Buffer.isBuffer(file?.buffer) };
  }

  @Post('many')
  @UseInterceptors(ImageFilesInterceptor('photos', 2))
  many(@UploadedFiles() files: UploadedImage[]) {
    return { count: files.length };
  }
}

describe('image upload interceptors (multer limits.fileSize = 10 MB, memory only)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ controllers: [UploadController] }).compile();
    app = moduleRef.createNestApplication({ logger: false });
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();
  });
  afterAll(() => app.close());

  it('keeps an accepted file in memory', async () => {
    const res = await request(app.getHttpServer())
      .post('/upload/one')
      .attach('photo', JPEG, 'a.jpg')
      .expect(201);
    expect(res.body).toEqual({ size: JPEG.length, inMemory: true });
  });

  it('answers 400 VALIDATION_ERROR (not 413) for a file over 10 MB', async () => {
    const big = Buffer.alloc(MAX_IMAGE_BYTES + 1, 0xff);
    for (const [path, field] of [
      ['/upload/one', 'photo'],
      ['/upload/many', 'photos'],
    ]) {
      const res = await request(app.getHttpServer()).post(path).attach(field, big, 'big.jpg').expect(400);
      expect(res.body).toMatchObject({
        success: false,
        error: { code: 'VALIDATION_ERROR', details: [`${field}: ไฟล์ต้องไม่เกิน 10 MB`] },
      });
    }
  });

  it('still accepts a file of exactly 10 MB', async () => {
    const edge = Buffer.alloc(MAX_IMAGE_BYTES, 0xff);
    const res = await request(app.getHttpServer())
      .post('/upload/one')
      .attach('photo', edge, 'edge.jpg')
      .expect(201);
    expect(res.body.size).toBe(MAX_IMAGE_BYTES);
  });
});
