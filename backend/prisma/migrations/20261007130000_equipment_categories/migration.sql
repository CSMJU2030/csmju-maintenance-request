-- ประเภทอุปกรณ์ตั้งต้นของสาขา (ชุดเดียวกับ prisma/seed.ts) — บน server ห้ามพึ่ง seed (deployment.md ข้อ 6.1)
-- ใส่เฉพาะชื่อที่ยังไม่มี ไม่ทับที่ผู้ดูแลแก้ไว้ · gen_random_uuid() มีในตัว PostgreSQL 16 ไม่ต้องใช้ extension
INSERT INTO "categories" ("id", "name", "symptoms", "icon", "sort_order", "is_active", "updated_at")
VALUES
  (gen_random_uuid(), 'คอมพิวเตอร์', ARRAY['เปิดไม่ติด', 'จอไม่แสดงภาพ', 'ช้า / ค้างบ่อย', 'เข้าอินเทอร์เน็ตไม่ได้', 'คีย์บอร์ด / เมาส์ไม่ทำงาน', 'โปรแกรมที่ใช้เรียนเปิดไม่ได้', 'มีเสียงดังผิดปกติ']::VARCHAR(100)[], 'computer', 0, true, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'จอภาพ', ARRAY['ไม่มีภาพ', 'ภาพกระพริบ', 'มีเส้น / จุดบนจอ', 'สีเพี้ยน', 'สายจอหลวม / หาย']::VARCHAR(100)[], 'monitor', 1, true, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'โปรเจกเตอร์', ARRAY['เปิดไม่ติด', 'ภาพไม่ขึ้น', 'ภาพมัว / สีเพี้ยน', 'ต่อสาย HDMI แล้วไม่ขึ้น', 'รีโมทใช้ไม่ได้']::VARCHAR(100)[], 'projector', 2, true, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'เครื่องปรับอากาศ', ARRAY['ไม่เย็น', 'มีน้ำหยด', 'มีเสียงดัง', 'เปิดไม่ติด', 'รีโมทหาย / ใช้ไม่ได้']::VARCHAR(100)[], 'aircon', 3, true, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'พัดลม', ARRAY['ไม่หมุน', 'หมุนช้า', 'มีเสียงดัง', 'ส่ายไม่ได้']::VARCHAR(100)[], 'fan', 4, true, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'ไฟฟ้า / แสงสว่าง', ARRAY['หลอดไฟดับ', 'ไฟกระพริบ', 'ปลั๊กไฟใช้ไม่ได้', 'สวิตช์เสีย', 'มีกลิ่นไหม้ / ประกายไฟ']::VARCHAR(100)[], 'light', 5, true, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'เครือข่าย / Wi-Fi', ARRAY['Wi-Fi ต่อไม่ได้', 'สาย LAN ใช้ไม่ได้', 'อินเทอร์เน็ตช้ามาก']::VARCHAR(100)[], 'network', 6, true, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'เครื่องเสียง / ไมโครโฟน', ARRAY['ไม่มีเสียง', 'เสียงหอน', 'ไมโครโฟนไม่มีเสียง', 'ถ่านไมค์หมด']::VARCHAR(100)[], 'audio', 7, true, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'โต๊ะ / เก้าอี้', ARRAY['ชำรุด / หัก', 'โยก / ไม่มั่นคง', 'ล้อเสีย']::VARCHAR(100)[], 'furniture', 8, true, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'อื่นๆ', ARRAY[]::VARCHAR(100)[], 'other', 9, true, CURRENT_TIMESTAMP)
ON CONFLICT ("name") DO NOTHING;
