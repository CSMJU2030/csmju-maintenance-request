import type { ReactNode } from 'react';
import { ChevronRightIcon } from '@/components/ui';

/**
 * หัวข้อกลุ่มที่พับ/กางได้ (เช่น ประเภทอุปกรณ์ในห้อง · ประเภทห้องในอาคาร) — ใช้ <details> ของ HTML
 * จึงพับ/กางได้ทันทีโดยไม่ต้องรอ JavaScript และใช้คีย์บอร์ดได้ (Enter/Space ที่หัวข้อ)
 */
export function CollapsibleGroup({
  id,
  title,
  meta,
  icon,
  actions,
  heading = 'h3',
  titleClassName = 'text-label-md text-on-surface',
  children,
}: {
  id: string;
  title: ReactNode;
  /** ข้อความรองต่อท้ายชื่อ เช่น "30 ชิ้น · มีปัญหา 2" */
  meta?: ReactNode;
  icon?: ReactNode;
  /** ปุ่มในหัวข้อ (เช่น เลือกทั้งกลุ่ม) — ต้องกันการพับ/กางเอง */
  actions?: ReactNode;
  heading?: 'h2' | 'h3';
  titleClassName?: string;
  children: ReactNode;
}) {
  const Heading = heading;
  return (
    <details open className="group/collapse">
      <summary className="flex cursor-pointer list-none flex-wrap items-center gap-2 rounded-lg py-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container [&::-webkit-details-marker]:hidden">
        <ChevronRightIcon
          aria-hidden="true"
          className="h-5 w-5 shrink-0 text-on-surface-variant transition-transform group-open/collapse:rotate-90"
        />
        {icon}
        <Heading id={id} className={`flex flex-wrap items-center gap-2 ${titleClassName}`}>
          {title}
          {meta ? <span className="font-normal text-on-surface-variant">{meta}</span> : null}
        </Heading>
        {actions}
      </summary>
      <div className="mt-3">{children}</div>
    </details>
  );
}
