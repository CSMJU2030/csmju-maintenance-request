import type { ReactNode } from 'react';
import { PageHeader as CsmjuPageHeader } from '@/csmju';

/**
 * ชื่อหน้า (h1) + คำอธิบาย จาก `PageHeader` ของ template — เติมแถวป้ายเหนือชื่อ (eyebrow)
 * และปุ่ม action ของหน้าไว้ด้านขวา (ui-design-system.md ข้อ 5.2) ซึ่ง template ยังไม่มี
 */
export function PageHeader({
  title,
  description = '',
  actions,
  eyebrow,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  eyebrow?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0 space-y-2">
        {eyebrow ? <div className="fade-slide-up flex flex-wrap items-center gap-2">{eyebrow}</div> : null}
        <CsmjuPageHeader title={title} description={description} />
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-3 print:hidden">{actions}</div>
      ) : null}
    </div>
  );
}
