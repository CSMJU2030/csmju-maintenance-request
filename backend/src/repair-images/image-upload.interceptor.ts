import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  mixin,
  type NestInterceptor,
  PayloadTooLargeException,
  type Type,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { validationError } from '../shared/errors';
import { MAX_IMAGE_BYTES } from './image-storage';

type Limits = { files?: number; fields?: number; fieldSize?: number };

/**
 * multer เก็บไฟล์ในหน่วยความจำ (ไม่เขียนดิสก์) และตัดที่ limits.fileSize = 10 MB (deployment.md ข้อ 4.3)
 * ไฟล์ใหญ่เกิน → 400 VALIDATION_ERROR (multer ของ Nest ตอบ 413 ซึ่งไม่อยู่ใน error-codes ของมาตรฐาน)
 */
function withValidationErrors(Base: Type<NestInterceptor>, field: string): Type<NestInterceptor> {
  @Injectable()
  class ImageUploadInterceptor extends Base {
    async intercept(context: ExecutionContext, next: CallHandler) {
      try {
        return await super.intercept(context, next);
      } catch (error) {
        if (error instanceof PayloadTooLargeException) {
          throw validationError([`${field}: ไฟล์ต้องไม่เกิน ${MAX_IMAGE_BYTES / 1024 / 1024} MB`]);
        }
        throw error;
      }
    }
  }
  return mixin(ImageUploadInterceptor);
}

/** รูปเดียวในช่อง field */
export const ImageFileInterceptor = (field: string, limits: Limits = {}) =>
  withValidationErrors(
    FileInterceptor(field, { limits: { files: 1, fields: 0, ...limits, fileSize: MAX_IMAGE_BYTES } }),
    field,
  );

/** หลายรูปในช่อง field (ไม่เกิน maxCount) */
export const ImageFilesInterceptor = (field: string, maxCount: number, limits: Limits = {}) =>
  withValidationErrors(
    FilesInterceptor(field, maxCount, {
      limits: { files: maxCount, ...limits, fileSize: MAX_IMAGE_BYTES },
    }),
    field,
  );
