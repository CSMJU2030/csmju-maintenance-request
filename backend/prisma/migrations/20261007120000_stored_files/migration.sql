-- ไฟล์ที่อัปโหลดเก็บในฐานข้อมูลของระบบนี้ (stored_files) แทนดิสก์ — container อ่านอย่างเดียว
-- (standards docs/deployment.md ข้อ 3.4/4.3) · คอลัมน์ชื่อไฟล์เดิมเก็บ stored_files.id แทน (ชื่อคอลัมน์คงเดิม)

-- CreateTable
CREATE TABLE "stored_files" (
    "id" UUID NOT NULL,
    "mime_type" VARCHAR(50) NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "sha256" CHAR(64) NOT NULL,
    "content" BYTEA NOT NULL,
    "uploaded_by_core_user_id" VARCHAR(64),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stored_files_pkey" PRIMARY KEY ("id")
);

-- CHECK constraints (Prisma ไม่สร้างให้) — รูป JPG/PNG/WebP ไม่เกิน 10 MB ต่อไฟล์
ALTER TABLE "stored_files"
  ADD CONSTRAINT "stored_files_mime_type_check" CHECK ("mime_type" IN ('image/jpeg', 'image/png', 'image/webp')),
  ADD CONSTRAINT "stored_files_size_bytes_check" CHECK ("size_bytes" BETWEEN 1 AND 10485760 AND "size_bytes" = octet_length("content")),
  ADD CONSTRAINT "stored_files_sha256_check" CHECK ("sha256" ~ '^[0-9a-f]{64}$');

-- คอลัมน์ชื่อไฟล์เดิม (UUID + นามสกุล) → stored_files.id (UUID ล้วน)
-- ไฟล์บนดิสก์ไม่ถูกย้ายมา: แถวเดิมในฐานข้อมูล dev จะชี้ไปยัง id ที่ไม่มีใน stored_files (ตอบ 404 ตอนเปิดรูป)
ALTER TABLE "repair_images" DROP CONSTRAINT "repair_images_filename_check";
ALTER TABLE "profiles" DROP CONSTRAINT "profiles_avatar_filename_check";
ALTER TABLE "rooms" DROP CONSTRAINT "rooms_photo_filename_check";
ALTER TABLE "equipment" DROP CONSTRAINT "equipment_photo_filename_check";

UPDATE "repair_images" SET "filename" = split_part("filename", '.', 1) WHERE "filename" LIKE '%.%';
UPDATE "profiles" SET "avatar_filename" = split_part("avatar_filename", '.', 1) WHERE "avatar_filename" LIKE '%.%';
UPDATE "rooms" SET "photo_filename" = split_part("photo_filename", '.', 1) WHERE "photo_filename" LIKE '%.%';
UPDATE "equipment" SET "photo_filename" = split_part("photo_filename", '.', 1) WHERE "photo_filename" LIKE '%.%';

ALTER TABLE "repair_images"
  ADD CONSTRAINT "repair_images_filename_check" CHECK ("filename" ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$');
ALTER TABLE "profiles"
  ADD CONSTRAINT "profiles_avatar_filename_check" CHECK ("avatar_filename" ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$');
ALTER TABLE "rooms"
  ADD CONSTRAINT "rooms_photo_filename_check" CHECK ("photo_filename" ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$');
ALTER TABLE "equipment"
  ADD CONSTRAINT "equipment_photo_filename_check" CHECK ("photo_filename" ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$');
