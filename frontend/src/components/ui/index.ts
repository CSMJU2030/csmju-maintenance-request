/**
 * UI ของระบบแจ้งซ่อม — ของกลางมาจาก `@/csmju` (template csmju-subsystem-web · ห้ามแก้)
 * ส่วนที่ template ยังไม่มีเป็น local component (subsystem.yaml → ui.local_components · ui-design-system.md ข้อ 17.0)
 */
import { TONE_STYLES, type StatusTone } from '@/csmju';

export { CsmjuLogo, StatusBadge, TONE_STYLES, TONES } from '@/csmju';
export type { StatusTone } from '@/csmju';

export * from './classes';
export * from './icons';
export { Avatar } from './Avatar';
export { ConfirmDeleteModal } from './ConfirmDeleteModal';
export { Modal } from './Modal';
export { PageHeader } from './PageHeader';
export { Tabs } from './Tabs';
export type { TabItem } from './Tabs';

/** สีจุดของแต่ละ tone (กราฟ · รายการ) — มาจาก TONE_STYLES ของ template */
export const TONE_DOT_CLASS = Object.fromEntries(
  Object.entries(TONE_STYLES).map(([tone, style]) => [tone, style.dot]),
) as Record<StatusTone, string>;
