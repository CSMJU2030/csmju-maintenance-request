import { sectionTitleClass } from '@/components/ui';
import {
  BulkSelectProvider,
  BulkToolbar,
  GroupSelectButton,
  SelectableItem,
} from '@/components/shared/BulkSelect';
import { CollapsibleGroup } from '@/components/shared/CollapsibleGroup';
import { formatNumber } from '@/lib/format';
import { ROOM_TYPE_LABEL } from '@/lib/labels';
import type { Room } from '@/lib/types';
import type { groupRoomsByType } from './group-rooms';
import { RoomCard } from './RoomCard';

/**
 * ห้องแยกตามประเภท (พับ/กางได้) — ผู้ดูแลระบบเลือกหลายห้องเพื่อเปิด/ปิดใช้งานหรือลบพร้อมกันได้
 * ใช้ทั้งหน้าอาคารและห้องทั้งหมด และหน้าอาคารรายอาคาร
 */
export function RoomSections({
  sections,
  manage,
}: {
  sections: ReturnType<typeof groupRoomsByType>;
  manage: boolean;
}) {
  const content = (
    <div className="space-y-8">
      {sections.map(({ type, rooms }) => (
        <section key={type} aria-labelledby={`type-${type}`}>
          <CollapsibleGroup
            id={`type-${type}`}
            heading="h2"
            titleClassName={sectionTitleClass}
            title={ROOM_TYPE_LABEL[type]}
            meta={<span className="text-body-md">{formatNumber(rooms.length)} ห้อง</span>}
            actions={
              manage ? (
                <GroupSelectButton ids={rooms.map((room) => room.id)} name={ROOM_TYPE_LABEL[type]} />
              ) : null
            }
          >
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {rooms.map((room: Room) => (
                <li key={room.id}>
                  {manage ? (
                    <SelectableItem id={room.id} label={`${room.code} ${room.name}`}>
                      <RoomCard room={room} />
                    </SelectableItem>
                  ) : (
                    <RoomCard room={room} />
                  )}
                </li>
              ))}
            </ul>
          </CollapsibleGroup>
        </section>
      ))}
    </div>
  );
  if (!manage) return content;
  return (
    <BulkSelectProvider>
      <div className="space-y-6">
        <BulkToolbar
          allIds={sections.flatMap((section) => section.rooms.map((room) => room.id))}
          noun="ห้อง"
          endpoint="/api/v1/rooms"
          deleteConsequence="ลบได้เฉพาะห้องที่ยังไม่มีอุปกรณ์และใบแจ้งซ่อม ห้องอื่นให้ปิดใช้งานแทน"
        />
        {content}
      </div>
    </BulkSelectProvider>
  );
}
