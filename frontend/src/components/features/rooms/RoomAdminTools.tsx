'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  AddIcon,
  BlockIcon,
  ConfirmDeleteModal,
  DeleteIcon,
  EditIcon,
  PlayIcon,
  primaryButtonClass,
  QrCodeIcon,
  secondaryButtonClass,
} from '@/components/ui';
import { LoadingButton } from '@/components/shared/LoadingButton';
import { TypeToConfirmModal } from '@/components/shared/TypeToConfirmModal';
import { useToast } from '@/components/shared/Toast';
import { api } from '@/lib/api';
import type { RoomDetail } from '@/lib/types';
import { EquipmentFormModal, type EquipmentCategoryOption } from './EquipmentFormModal';
import { PhotoManagerButton } from './PhotoManagerButton';
import { RoomFormModal } from './RoomFormModal';
import { RoomPhotoFallback } from './room-visuals';

/** ปุ่ม "เพิ่มห้อง" บนหน้าอาคาร (ผู้ดูแลระบบ) */
export function AddRoomButton({
  buildingCode,
  buildings,
}: {
  buildingCode: string;
  buildings?: { code: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={primaryButtonClass}>
        <AddIcon className="h-4 w-4" />
        เพิ่มห้อง
      </button>
      <RoomFormModal
        open={open}
        onClose={() => setOpen(false)}
        buildingCode={buildingCode}
        buildings={buildings}
      />
    </>
  );
}

/** ปุ่ม "เพิ่มอุปกรณ์" (ทีละชิ้นหรือหลายชิ้น) ใช้ได้ทั้งในแถบเครื่องมือและใน empty state ของผังห้อง */
export function AddEquipmentButton({
  roomId,
  categories,
  className = primaryButtonClass,
}: {
  roomId: string;
  categories: EquipmentCategoryOption[];
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        <AddIcon className="h-4 w-4" />
        เพิ่มอุปกรณ์
      </button>
      <EquipmentFormModal
        open={open}
        onClose={() => setOpen(false)}
        roomId={roomId}
        categories={categories}
      />
    </>
  );
}

/**
 * เครื่องมือผู้ดูแลระบบบนหน้าห้อง: เพิ่มอุปกรณ์ · แก้ไขห้อง · รูปห้อง · พิมพ์ QR · เปิด/ปิดใช้งาน · ลบ
 * ลบห้อง = ยืนยันสองชั้น: (1) บอกว่าเครื่องในห้องจะถูกลบด้วยและใบแจ้งซ่อมยังอยู่เป็นประวัติ (2) พิมพ์รหัสห้อง
 */
export function RoomAdminTools({
  room,
  categories,
}: {
  room: Pick<
    RoomDetail,
    | 'id'
    | 'code'
    | 'name'
    | 'floor'
    | 'description'
    | 'roomType'
    | 'capacity'
    | 'photoUrl'
    | 'buildingCode'
    | 'isActive'
    | 'openRequestCount'
  > & { equipmentCount: number };
  categories: EquipmentCategoryOption[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [deleteStep, setDeleteStep] = useState<'warn' | 'type' | null>(null);
  const [busy, setBusy] = useState<'toggle' | 'delete' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggle = async () => {
    setBusy('toggle');
    try {
      await api(`/api/v1/rooms/${room.id}`, { method: 'PATCH', json: { isActive: !room.isActive } });
      toast.success(room.isActive ? `ปิดใช้งานห้อง ${room.code} แล้ว` : `เปิดใช้งานห้อง ${room.code} แล้ว`);
      router.refresh();
    } catch (failure) {
      toast.error(failure instanceof Error ? failure.message : 'บันทึกไม่สำเร็จ');
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    setBusy('delete');
    setError(null);
    try {
      await api(`/api/v1/rooms/${room.id}`, { method: 'DELETE' });
      toast.success(`ลบห้อง ${room.code} แล้ว`);
      router.push(`/buildings/${room.buildingCode}`);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'ลบไม่สำเร็จ');
      setBusy(null);
    }
  };

  const consequence = [
    room.equipmentCount > 0 ? `อุปกรณ์ในห้อง ${room.equipmentCount} ชิ้นจะถูกลบไปด้วย` : null,
    room.openRequestCount > 0
      ? `ใบแจ้งซ่อมที่ยังไม่ปิด ${room.openRequestCount} ใบจะยังอยู่ แต่ไม่ผูกกับห้องนี้แล้ว`
      : 'ใบแจ้งซ่อมเดิมยังอยู่เป็นประวัติ',
    'สติกเกอร์ QR ของห้องและเครื่องในห้องจะใช้ไม่ได้อีก',
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="จัดการห้อง (ผู้ดูแลระบบ)">
      <AddEquipmentButton roomId={room.id} categories={categories} />
      <button type="button" onClick={() => setEditing(true)} className={secondaryButtonClass}>
        <EditIcon className="h-4 w-4" />
        แก้ไขห้อง
      </button>
      <PhotoManagerButton
        endpoint={`/api/v1/rooms/${room.id}/photo`}
        photoUrl={room.photoUrl}
        title={`รูปห้อง ${room.code}`}
        alt={`รูปห้อง ${room.code} ${room.name}`}
        fallback={<RoomPhotoFallback code={room.code} roomType={room.roomType} />}
        buttonLabel="รูปห้อง"
      />
      <Link href={`/rooms/${room.id}/qr`} className={secondaryButtonClass}>
        <QrCodeIcon className="h-4 w-4" />
        พิมพ์ QR
      </Link>
      <LoadingButton
        type="button"
        loading={busy === 'toggle'}
        disabled={busy !== null}
        onClick={() => void toggle()}
        className={secondaryButtonClass}
      >
        {room.isActive ? <BlockIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
        {room.isActive ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
      </LoadingButton>
      <button
        type="button"
        onClick={() => (setError(null), setDeleteStep('warn'))}
        className={`${secondaryButtonClass} hover:text-error`}
      >
        <DeleteIcon className="h-4 w-4" />
        ลบห้อง
      </button>

      <RoomFormModal
        open={editing}
        onClose={() => setEditing(false)}
        buildingCode={room.buildingCode}
        room={room}
      />
      <ConfirmDeleteModal
        open={deleteStep === 'warn'}
        title="ลบห้อง (ขั้นที่ 1 จาก 2)"
        itemName={`${room.code} ${room.name}`}
        consequence={consequence}
        confirmLabel="ต่อไป"
        onConfirm={() => setDeleteStep('type')}
        onClose={() => setDeleteStep(null)}
      />
      <TypeToConfirmModal
        open={deleteStep === 'type'}
        title="ลบห้อง (ขั้นที่ 2 จาก 2)"
        phrase={room.code}
        description={
          <>
            ลบห้อง <strong className="text-on-surface">{room.code}</strong> ถาวร ย้อนกลับไม่ได้ —
            ถ้าแค่ไม่ใช้ห้องนี้ชั่วคราว ให้กด “ปิดใช้งาน” แทน
          </>
        }
        confirmLabel="ลบห้องถาวร"
        loading={busy === 'delete'}
        error={error}
        onConfirm={() => void remove()}
        onClose={() => setDeleteStep(null)}
      />
    </div>
  );
}
