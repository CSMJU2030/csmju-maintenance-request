'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect } from 'react';
import { api } from '@/lib/api';
import type { Notification } from '@/lib/types';

const POLL_MS = 60_000;
// top bar ของ CsmjuAppShell เท่านั้น (#main > header) — หน้าอื่นมี <header> ของตัวเองที่มีปุ่ม
const SEARCH = '#main > header input[type="search"]';
const BELL = '#main > header button[aria-label^="การแจ้งเตือน"]';
const USER = '#main > header button:not([aria-label])';

/**
 * ต่อปุ่มบน top bar ของ `CsmjuAppShell` (template · ห้ามแก้) เข้ากับงานของระบบนี้ โดยไม่แตะไฟล์ของ template
 * - ช่องค้นหา → เปิด CommandPalette (Ctrl K)
 * - กระดิ่ง → หน้าการแจ้งเตือน · จุดแดงเมื่อมีรายการที่ยังไม่อ่าน (ui-design-system.md ข้อ 5.1)
 * - ปุ่มผู้ใช้ → โปรไฟล์ของฉัน
 */
export function ShellBridge({ notificationsHref }: { notificationsHref: string }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const openSearch = (event: Event) => {
      const input = (event.target as Element | null)?.closest(SEARCH);
      if (!(input instanceof HTMLInputElement)) return;
      input.blur();
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
    };
    const onClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      if (target?.closest(BELL)) router.push(notificationsHref);
      else if (target?.closest(USER)) router.push('/profile');
    };
    document.addEventListener('focusin', openSearch);
    document.addEventListener('click', onClick);
    for (const input of document.querySelectorAll<HTMLInputElement>(SEARCH)) {
      input.readOnly = true;
      input.placeholder = 'ค้นหาใบแจ้งซ่อมหรือเมนู… (Ctrl K)';
    }
    return () => {
      document.removeEventListener('focusin', openSearch);
      document.removeEventListener('click', onClick);
    };
  }, [router, notificationsHref]);

  const refreshUnread = useCallback(async () => {
    try {
      const { meta } = await api<Notification[]>('/api/v1/notifications?isRead=false&limit=1');
      const unread = meta?.total ?? 0;
      for (const bell of document.querySelectorAll<HTMLButtonElement>(BELL)) {
        bell.toggleAttribute('data-unread', unread > 0);
        bell.setAttribute(
          'aria-label',
          unread > 0 ? `การแจ้งเตือน ยังไม่อ่าน ${unread} รายการ` : 'การแจ้งเตือน',
        );
      }
    } catch {
      // ไม่รบกวนผู้ใช้ด้วย error ของตัวนับ — ลองใหม่รอบถัดไป
    }
  }, []);

  useEffect(() => {
    void refreshUnread();
    const timer = window.setInterval(() => void refreshUnread(), POLL_MS);
    const onChanged = () => void refreshUnread();
    window.addEventListener('focus', onChanged);
    window.addEventListener('csmju:notifications-changed', onChanged);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', onChanged);
      window.removeEventListener('csmju:notifications-changed', onChanged);
    };
  }, [refreshUnread, pathname]);

  return null;
}
