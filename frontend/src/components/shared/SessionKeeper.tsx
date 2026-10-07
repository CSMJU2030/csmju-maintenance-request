'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { UNAUTHORIZED_EVENT } from '@/lib/api';
import { loginHref } from '@/lib/config';
import { currentPath, hasUnsavedForm, startReSso } from '@/lib/sso';

/** ต่ออายุล่วงหน้าตอนเปลี่ยนหน้า ถ้า token จะหมดภายในเวลานี้ (auth-contract.md ข้อ 7) */
const RENEW_BEFORE_MS = 60_000;

/**
 * 401 flow ของหน้าเว็บ (auth-contract.md 1.2 ข้อ 7) — วางไว้ใน CsmjuAppShell ของ template
 * - API ตอบ 401 → silent re-SSO ผ่าน /auth/login?next=<หน้านี้> พร้อมกันวน 30 วินาที (lib/sso.ts)
 * - หน้าที่มีฟอร์มกรอกค้างไม่ถูก redirect ทับ — ขึ้นแถบให้ต่ออายุในแท็บใหม่แทน
 * - token ใกล้หมดตอนเปลี่ยนหน้า → ต่ออายุก่อน ผู้ใช้จึงไม่เจอ 401 กลางฟอร์ม
 */
export function SessionKeeper({ expiresAt }: { expiresAt?: string | null }) {
  const pathname = usePathname();
  const [notice, setNotice] = useState<'unsaved' | 'retry' | null>(null);

  useEffect(() => {
    const onUnauthorized = () => {
      if (hasUnsavedForm()) {
        setNotice('unsaved');
        return;
      }
      if (!startReSso()) setNotice('retry');
    };
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, []);

  useEffect(() => {
    if (!expiresAt) return;
    const left = new Date(expiresAt).getTime() - Date.now();
    if (left < RENEW_BEFORE_MS && !hasUnsavedForm()) startReSso();
  }, [pathname, expiresAt]);

  if (!notice) return null;
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center gap-3 rounded-xl border border-error/30 bg-error-container px-4 py-3 text-body-md text-on-error-container print:hidden"
    >
      <p className="min-w-0 flex-1">
        {notice === 'unsaved'
          ? 'เซสชันหมดอายุ ข้อมูลที่กรอกไว้ยังอยู่ — กด “ต่ออายุในแท็บใหม่” แล้วกลับมากดส่งอีกครั้ง'
          : 'ยังเข้าสู่ระบบไม่สำเร็จ กรุณากดเข้าสู่ระบบอีกครั้ง'}
      </p>
      {notice === 'unsaved' ? (
        <a
          href={loginHref()}
          target="_blank"
          rel="noopener"
          onClick={() => setNotice(null)}
          className="rounded-full bg-error px-4 py-2 text-label-md text-on-primary hover:opacity-90"
        >
          ต่ออายุในแท็บใหม่
        </a>
      ) : (
        <a
          href={loginHref(currentPath())}
          className="rounded-full bg-error px-4 py-2 text-label-md text-on-primary hover:opacity-90"
        >
          เข้าสู่ระบบอีกครั้ง
        </a>
      )}
    </div>
  );
}
