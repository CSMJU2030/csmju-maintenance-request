import { describe, expect, it } from 'vitest';
import type { Room } from '@/lib/types';
import { groupRoomsByType } from './group-rooms';

const room = (code: string, roomType: Room['roomType'], floor: number | null = null) =>
  ({ id: code, code, roomType, floor }) as Room;

describe('groupRoomsByType', () => {
  it('orders rooms by code numerically, whether or not the floor is set', () => {
    const [labs] = groupRoomsByType([
      room('CS-201', 'LAB', 2),
      room('CS-1001', 'LAB'),
      room('CS-102', 'LAB'),
      room('CS-101', 'LAB', 1),
      room('CS-20', 'LAB'),
    ]);
    expect(labs.rooms.map((r) => r.code)).toEqual(['CS-20', 'CS-101', 'CS-102', 'CS-201', 'CS-1001']);
  });

  it('groups by room type in the standard order and skips empty types', () => {
    const groups = groupRoomsByType([room('CS-301', 'MEETING'), room('CS-201', 'LAB')]);
    expect(groups.map((group) => group.type)).toEqual(['LAB', 'MEETING']);
  });
});
