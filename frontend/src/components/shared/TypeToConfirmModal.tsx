'use client';

import { useId, useState, type FormEvent, type ReactNode } from 'react';
import { dangerButtonClass, inputClass, Modal, secondaryButtonClass } from '@/components/ui';

/**
 * ยืนยันชั้นที่สองของการลบที่ย้อนกลับไม่ได้ — ต้องพิมพ์ข้อความ (เช่น รหัสห้อง) ให้ตรงก่อนปุ่มลบจะกดได้
 * ใช้ต่อจาก ConfirmDeleteModal (ชั้นแรกบอกว่าจะลบอะไรบ้าง) · ui-design-system.md ข้อ 8.3
 */
export function TypeToConfirmModal({
  open,
  title,
  phrase,
  description,
  confirmLabel,
  loading = false,
  error,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  /** ข้อความที่ต้องพิมพ์ให้ตรง */
  phrase: string;
  description?: ReactNode;
  confirmLabel: string;
  loading?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const id = useId();
  const [typed, setTyped] = useState('');
  const matches = typed.trim().toUpperCase() === phrase.trim().toUpperCase();
  const close = () => {
    if (loading) return;
    setTyped('');
    onClose();
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (matches && !loading) onConfirm();
  };

  return (
    <Modal open={open} title={title} onClose={close} dismissible={!loading}>
      <form onSubmit={submit} className="space-y-4">
        {description ? <div className="text-body-md text-on-surface-variant">{description}</div> : null}
        <div className="space-y-2">
          <label htmlFor={id} className="text-label-md text-on-surface">
            พิมพ์ <strong className="tabular-nums text-error">{phrase}</strong> เพื่อยืนยัน
          </label>
          <input
            id={id}
            data-autofocus
            autoComplete="off"
            spellCheck={false}
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
            className={inputClass}
          />
        </div>
        {error ? (
          <p
            role="alert"
            className="rounded-lg bg-error-container px-4 py-3 text-body-md text-on-error-container"
          >
            {error}
          </p>
        ) : null}
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={close} className={secondaryButtonClass} disabled={loading}>
            ยกเลิก
          </button>
          <button
            type="submit"
            disabled={!matches}
            aria-busy={loading}
            className={`${dangerButtonClass} ${loading ? 'btn-loading' : ''}`}
          >
            <span className="btn-text">{confirmLabel}</span>
            <span className="dots" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
