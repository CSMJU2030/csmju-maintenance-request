import { ROOM_TYPE_ORDER } from '@/lib/labels';
import type { Room } from '@/lib/types';

/** เรียงห้องตามรหัสแบบตัวเลข: CS-101 < CS-102 < CS-201 < CS-1001 (รหัสห้องบอกชั้นอยู่แล้ว ห้องที่ไม่ระบุชั้นไม่ตกท้าย) */
export const byRoomCode = (a: Pick<Room, 'code'>, b: Pick<Room, 'code'>) =>
  a.code.localeCompare(b.code, 'th', { numeric: true, sensitivity: 'base' });

/** จัดห้องเป็นหัวข้อตามประเภทห้อง (ตาม ROOM_TYPE_ORDER ข้ามประเภทที่ไม่มีห้อง) แล้วเรียงตามรหัสห้อง */
export function groupRoomsByType(rooms: Room[]) {
  return ROOM_TYPE_ORDER.map((type) => ({
    type,
    rooms: rooms.filter((room) => room.roomType === type).sort(byRoomCode),
  })).filter((group) => group.rooms.length > 0);
}
