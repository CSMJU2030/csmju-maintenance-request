/**
 * ตัวช่วยสำหรับ unit test ของโดเมนเท่านั้น (ไม่ถูก build)
 * ชั้นกลาง (auth · core-hub) ใช้ตัวช่วยของ reference ใน test/helpers/
 */
import type { RepairActor } from '../actor/repair-actor';
import { SubsystemRole } from '../auth/core-hub-identity';
import { ROLE_PERMISSIONS } from '../auth/permissions';

/** ผู้เรียกในมุมของโดเมนตาม role ที่ใช้จริง */
export function identity(role: `${SubsystemRole}`, coreUserId = `user-${role.toLowerCase()}`): RepairActor {
  const subsystemRole = role as SubsystemRole;
  return {
    coreUserId,
    personCode: coreUserId,
    email: `${coreUserId}@core.local`,
    coreRole: subsystemRole === SubsystemRole.ADMIN ? 'admin' : 'staff',
    subsystemRole,
    permissions: new Set(ROLE_PERMISSIONS[subsystemRole]),
    tokenExpiresAt: Math.floor(Date.now() / 1000) + 900,
  };
}

type StoredFileRow = {
  id: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
  content: Uint8Array;
  uploadedByCoreUserId: string | null;
};

/** ตาราง stored_files ปลอมในหน่วยความจำ — เฉพาะ method ที่ ImageStorage ใช้ */
export function fakeStoredFiles() {
  const rows = new Map<string, StoredFileRow>();
  const storedFile = {
    createMany: jest.fn(async ({ data }: { data: StoredFileRow[] }) => {
      for (const row of data) rows.set(row.id, { ...row });
      return { count: data.length };
    }),
    findUnique: jest.fn(async ({ where }: { where: { id: string } }) => rows.get(where.id) ?? null),
    deleteMany: jest.fn(async ({ where }: { where: { id: { in: string[] } } }) => {
      let count = 0;
      for (const id of where.id.in) if (rows.delete(id)) count++;
      return { count };
    }),
  };
  return { rows, storedFile };
}
