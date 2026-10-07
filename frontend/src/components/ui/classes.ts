import {
  cardClass as csmjuCardClass,
  dangerButtonClass as csmjuDangerButtonClass,
  iconButtonClass as csmjuIconButtonClass,
  iconDangerButtonClass as csmjuIconDangerButtonClass,
  inputClass as csmjuInputClass,
  primaryButtonClass as csmjuPrimaryButtonClass,
  secondaryButtonClass as csmjuSecondaryButtonClass,
  tdClass as csmjuTdClass,
  thClass as csmjuThClass,
} from '@/csmju';

/**
 * class ของ component — หน้าตา (สี ขอบ ตัวอักษร padding) มาจาก `src/csmju/ui.ts` ของ template ทุกตัว
 * ที่นี่เติมเฉพาะสิ่งที่สเปคบอกว่า "ต้องเพิ่ม" แต่ template ยังไม่มี (ui-design-system.md ข้อ 6.1, 7.2, 12):
 * จัดไอคอนกับข้อความในแนวเดียวกันเมื่อใช้กับลิงก์ · focus ring · สถานะ disabled · touch target 44px
 * ส่วนที่ template ไม่มีเลย (tonal, ตาราง, หัวการ์ด ฯลฯ) เป็น local component ตาม subsystem.yaml → ui.local_components
 */
const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container';
const buttonState = `relative min-h-11 ${focusRing} disabled:cursor-not-allowed disabled:opacity-40`;
const buttonExtras = `inline-flex items-center justify-center gap-2 ${buttonState}`;

// ปุ่มหลักของ template เป็น flex อยู่แล้ว — เติมแค่สถานะ
export const primaryButtonClass = `${csmjuPrimaryButtonClass} ${buttonState}`;
export const secondaryButtonClass = `${csmjuSecondaryButtonClass} ${buttonExtras}`;
export const dangerButtonClass = `${csmjuDangerButtonClass} ${buttonExtras}`;
export const tonalButtonClass = `rounded-lg bg-primary-container/10 px-4 py-2.5 text-label-md text-primary-container transition-colors hover:bg-primary-container/20 ${buttonExtras}`;
export const linkClass = `rounded-sm text-primary-container hover:underline ${focusRing}`;

const iconButtonExtras = `inline-flex h-11 w-11 items-center justify-center rounded-lg ${focusRing}`;
export const iconButtonClass = `${csmjuIconButtonClass} ${iconButtonExtras} hover:bg-surface-variant/50`;
export const iconDangerButtonClass = `${csmjuIconDangerButtonClass} ${iconButtonExtras} hover:bg-error-container`;
export const iconRoundButtonClass = `relative inline-flex h-11 w-11 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-variant/50 ${focusRing}`;

export const labelClass = 'text-label-md text-on-surface';
export const hintClass = 'text-label-sm font-normal text-on-surface-variant';
export const inputClass = `${csmjuInputClass} block disabled:cursor-not-allowed disabled:bg-surface-container-low disabled:text-on-surface-variant`;
export const fieldErrorClass = 'flex items-start gap-1 text-label-sm text-error';

export const cardClass = csmjuCardClass;
export const cardHeaderClass =
  'flex flex-col gap-3 border-b border-outline-variant/40 px-6 py-5 md:flex-row md:items-center md:justify-between';
export const cardTitleClass = 'font-display text-headline-md text-on-surface';
export const cardBodyClass = 'p-6';

export const tableClass = 'w-full border-collapse text-left';
export const theadRowClass =
  'border-b border-outline-variant/40 bg-surface text-label-md text-on-surface-variant';
export const tbodyRowClass =
  'border-b border-outline-variant/40 text-body-md last:border-0 hover:bg-surface/50';
export const thClass = csmjuThClass;
export const tdClass = csmjuTdClass;

export const tagClass = 'inline-flex items-center rounded-full px-2.5 py-1 text-label-sm';
export const sectionTitleClass =
  'border-l-4 border-primary-container pl-3 font-display text-headline-md text-on-surface';
