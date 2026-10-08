'use client';

import { useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import {
  BlockIcon,
  CheckIcon,
  ConfirmDeleteModal,
  DeleteIcon,
  PlayIcon,
  secondaryButtonClass,
  tonalButtonClass,
} from '@/components/ui';
import { TypeToConfirmModal } from '@/components/shared/TypeToConfirmModal';
import { useToast } from '@/components/shared/Toast';
import { api, ApiRequestError } from '@/lib/api';
import { formatNumber } from '@/lib/format';

type BulkSelection = {
  selecting: boolean;
  selected: ReadonlySet<string>;
  isSelected: (id: string) => boolean;
  toggle: (id: string) => void;
  setMany: (ids: string[], on: boolean) => void;
  start: () => void;
  stop: () => void;
};

const Context = createContext<BulkSelection | null>(null);

function useBulk() {
  const value = useContext(Context);
  if (!value) throw new Error('ใช้ได้ภายใน <BulkSelectProvider> เท่านั้น');
  return value;
}

/** สถานะ "เลือกหลายรายการ" ของหนึ่งหน้า — ครอบรายการที่เลือกได้และแถบเครื่องมือ (BulkToolbar) */
export function BulkSelectProvider({ children }: { children: ReactNode }) {
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());

  const toggle = useCallback((id: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);
  const setMany = useCallback((ids: string[], on: boolean) => {
    setSelected((current) => {
      const next = new Set(current);
      for (const id of ids) {
        if (on) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  }, []);
  const value = useMemo<BulkSelection>(
    () => ({
      selecting,
      selected,
      isSelected: (id) => selected.has(id),
      toggle,
      setMany,
      start: () => setSelecting(true),
      stop: () => {
        setSelecting(false);
        setSelected(new Set());
      },
    }),
    [selecting, selected, toggle, setMany],
  );
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

/**
 * การ์ดที่เลือกได้ — ปกติเป็นลิงก์ตามเดิม · ตอนเลือกหลายรายการมีช่องติ๊กคลุมทั้งการ์ด (กดตรงไหนก็เลือก ไม่เปิดหน้าใหม่)
 */
export function SelectableItem({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  const { selecting, isSelected, toggle } = useBulk();
  const checked = isSelected(id);
  return (
    <div className="relative h-full">
      {children}
      {selecting ? (
        <label
          className={`absolute inset-0 z-10 cursor-pointer rounded-xl ring-inset transition-colors ${
            checked ? 'bg-primary-container/10 ring-2 ring-primary-container' : 'hover:bg-on-surface/5'
          }`}
        >
          <input
            type="checkbox"
            checked={checked}
            onChange={() => toggle(id)}
            aria-label={`เลือก ${label}`}
            className="absolute left-2 top-2 h-5 w-5 cursor-pointer accent-primary-container"
          />
        </label>
      ) : null}
    </div>
  );
}

/** ช่องติ๊กเลือกแถวในตาราง/รายการ (แสดงเฉพาะตอนเลือกหลายรายการ) */
export function SelectCheckbox({ id, label }: { id: string; label: string }) {
  const { selecting, isSelected, toggle } = useBulk();
  if (!selecting) return null;
  return (
    <input
      type="checkbox"
      checked={isSelected(id)}
      onChange={() => toggle(id)}
      aria-label={`เลือก ${label}`}
      className="h-5 w-5 shrink-0 cursor-pointer accent-primary-container"
    />
  );
}

/** ปุ่มเลือก/ยกเลิกทั้งกลุ่ม (เช่น คอมพิวเตอร์ 30 ชิ้น) — วางในหัวกลุ่มที่พับ/กางได้ก็ได้ */
export function GroupSelectButton({ ids, name }: { ids: string[]; name: string }) {
  const { selecting, isSelected, setMany } = useBulk();
  if (!selecting || ids.length === 0) return null;
  const all = ids.every(isSelected);
  return (
    <button
      type="button"
      onClick={(event) => {
        // อยู่ใน <summary> ได้ — ไม่ให้การกดปุ่มไปพับ/กางกลุ่ม
        event.preventDefault();
        event.stopPropagation();
        setMany(ids, !all);
      }}
      className="rounded-full border border-outline-variant px-3 py-1 text-label-sm text-primary-container hover:bg-primary-container/10"
    >
      {all ? `ยกเลิกเลือก${name}` : `เลือก${name}ทั้งหมด`}
    </button>
  );
}

type Action = 'activate' | 'deactivate' | 'delete';

/**
 * แถบเครื่องมือของผู้ดูแลระบบ: [เลือกหลายรายการ] → เลือกแล้ว N · เลือกทั้งหมด · เปิดใช้งาน · ปิดใช้งาน · ลบ · เสร็จ
 * ส่งคำขอทีละรายการ (PATCH isActive / DELETE ของ endpoint เดิม) แล้วสรุปผล — รายการที่ลบไม่ได้ (409) บอกเหตุผล
 */
export function BulkToolbar({
  allIds,
  noun,
  endpoint,
  deleteConsequence,
  typeToConfirm = false,
}: {
  allIds: string[];
  /** เช่น "อุปกรณ์" "ห้อง" "ประเภท" */
  noun: string;
  /** path ของรายการ เช่น /api/v1/equipment (ต่อด้วย /:id) — เป็น string เพราะส่งมาจาก server component */
  endpoint: string;
  deleteConsequence?: string;
  /** ลบแล้วกระทบข้อมูลอื่นด้วย (เช่น ห้องพร้อมเครื่องในห้อง) — ยืนยันชั้นที่สองด้วยการพิมพ์จำนวนที่จะลบ */
  typeToConfirm?: boolean;
}) {
  const { selecting, selected, start, stop, setMany } = useBulk();
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState<Action | null>(null);
  const [confirming, setConfirming] = useState<'warn' | 'type' | null>(null);
  const ids = allIds.filter((id) => selected.has(id));
  const count = ids.length;
  const allSelected = count > 0 && count === allIds.length;

  const run = async (action: Action) => {
    setBusy(action);
    const failures: string[] = [];
    let done = 0;
    for (const id of ids) {
      try {
        if (action === 'delete') await api(`${endpoint}/${id}`, { method: 'DELETE' });
        else await api(`${endpoint}/${id}`, { method: 'PATCH', json: { isActive: action === 'activate' } });
        done += 1;
      } catch (failure) {
        failures.push(failure instanceof ApiRequestError ? failure.message : 'ไม่สำเร็จ');
      }
    }
    const verb = action === 'delete' ? 'ลบ' : action === 'activate' ? 'เปิดใช้งาน' : 'ปิดใช้งาน';
    if (done > 0) toast.success(`${verb}${noun} ${formatNumber(done)} รายการแล้ว`);
    if (failures.length > 0) {
      const reason = [...new Set(failures)][0];
      toast.error(
        `${verb}ไม่สำเร็จ ${formatNumber(failures.length)} รายการ — ${reason}${
          action === 'delete' ? ' (ใช้ “ปิดใช้งาน” แทนได้)' : ''
        }`,
      );
    }
    setBusy(null);
    setConfirming(null);
    stop();
    router.refresh();
  };

  if (!selecting) {
    if (allIds.length === 0) return null;
    return (
      <button type="button" onClick={start} className={secondaryButtonClass}>
        <CheckIcon className="h-4 w-4" />
        เลือกหลายรายการ
      </button>
    );
  }

  const disabled = count === 0 || busy !== null;
  return (
    <div
      role="toolbar"
      aria-label={`จัดการ${noun}ที่เลือก`}
      className="sticky top-20 z-20 flex flex-wrap items-center gap-2 rounded-xl border border-primary-container/30 bg-surface-container-lowest p-3 shadow-md"
    >
      <p className="mr-auto text-label-md text-on-surface" aria-live="polite">
        เลือกแล้ว {formatNumber(count)} {noun}
      </p>
      <button type="button" onClick={() => setMany(allIds, !allSelected)} className={secondaryButtonClass}>
        {allSelected ? 'ยกเลิกทั้งหมด' : `เลือกทั้งหมด (${formatNumber(allIds.length)})`}
      </button>
      <button
        type="button"
        disabled={disabled}
        aria-busy={busy === 'activate' || undefined}
        onClick={() => void run('activate')}
        className={tonalButtonClass}
      >
        <PlayIcon className="h-4 w-4" />
        เปิดใช้งาน
      </button>
      <button
        type="button"
        disabled={disabled}
        aria-busy={busy === 'deactivate' || undefined}
        onClick={() => void run('deactivate')}
        className={secondaryButtonClass}
      >
        <BlockIcon className="h-4 w-4" />
        ปิดใช้งาน
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setConfirming('warn')}
        className={`${secondaryButtonClass} text-error hover:bg-error-container`}
      >
        <DeleteIcon className="h-4 w-4" />
        ลบ
      </button>
      <button type="button" onClick={stop} disabled={busy !== null} className={secondaryButtonClass}>
        เสร็จ
      </button>
      <ConfirmDeleteModal
        open={confirming === 'warn'}
        title={`ลบ${noun}ที่เลือก${typeToConfirm ? ' (ขั้นที่ 1 จาก 2)' : ''}`}
        itemName={`${noun} ${formatNumber(count)} รายการ`}
        consequence={deleteConsequence}
        confirmLabel={typeToConfirm ? 'ต่อไป' : `ลบ ${formatNumber(count)} รายการ`}
        loading={busy === 'delete'}
        onConfirm={() => (typeToConfirm ? setConfirming('type') : void run('delete'))}
        onClose={() => setConfirming(null)}
      />
      {typeToConfirm ? (
        <TypeToConfirmModal
          open={confirming === 'type'}
          title={`ลบ${noun}ที่เลือก (ขั้นที่ 2 จาก 2)`}
          phrase={String(count)}
          description={`ลบ${noun} ${formatNumber(count)} รายการถาวร ย้อนกลับไม่ได้ — พิมพ์จำนวนที่จะลบให้ตรง`}
          confirmLabel={`ลบ ${formatNumber(count)} รายการถาวร`}
          loading={busy === 'delete'}
          onConfirm={() => void run('delete')}
          onClose={() => setConfirming(null)}
        />
      ) : null}
    </div>
  );
}
