import type { Metadata, Viewport } from 'next';
import { Noto_Sans_Thai, Plus_Jakarta_Sans } from 'next/font/google';
import { cookies } from 'next/headers';
import { CsmjuAppShell, type NavItem } from '@/csmju';
import { CommandPalette } from '@/components/features/CommandPalette';
import { ErrorState } from '@/components/shared/ErrorState';
import { ForbiddenState } from '@/components/shared/ForbiddenState';
import { SessionKeeper } from '@/components/shared/SessionKeeper';
import { SessionRedirect } from '@/components/shared/SessionRedirect';
import { ShellBridge } from '@/components/shared/ShellBridge';
import { SignedOut } from '@/components/shared/SignedOut';
import { ToastProvider } from '@/components/shared/Toast';
import { initialsOf } from '@/components/ui/initials';
import { coreHubHomeUrl, DISPLAY_NAME, SESSION_COOKIE } from '@/lib/config';
import { CORE_ROLE_LABEL, SUBSYSTEM_ROLE_LABEL } from '@/lib/labels';
import { can, P } from '@/lib/permissions';
import { getMe } from '@/lib/session';
import type { Me } from '@/lib/types';
import './app.css';

const jakarta = Plus_Jakarta_Sans({
  variable: '--font-jakarta',
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  display: 'swap',
});
const notoSansThai = Noto_Sans_Thai({
  variable: '--font-noto-thai',
  subsets: ['latin', 'thai'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: { default: `${DISPLAY_NAME} · CSMJU`, template: `%s · ${DISPLAY_NAME} · CSMJU` },
  description: 'แจ้งซ่อมอาคารและอุปกรณ์ของสาขาวิชาวิทยาการคอมพิวเตอร์ คณะวิทยาศาสตร์ มหาวิทยาลัยแม่โจ้',
  applicationName: DISPLAY_NAME,
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

// ข้อมูลทุกหน้าขึ้นกับตัวตนผู้ใช้ — ห้าม cache (ui-design-system.md ข้อ 16.1.1)
export const dynamic = 'force-dynamic';

/** เมนูตามสิทธิ์ (ข้อ 10) — icon ใช้ชื่อจาก NavIconName ของ template */
function navFor(user: Me): NavItem[] {
  const items: NavItem[] = [{ label: 'Home', href: '/', icon: 'dashboard' }];
  if (can(user, P.REQUEST_CREATE))
    items.push({ label: 'ใบแจ้งซ่อมของฉัน', labelEn: 'My requests', href: '/requests', icon: 'description' });
  items.push(
    { label: 'อาคารและห้อง', labelEn: 'Rooms', href: '/buildings', icon: 'meeting-room' },
    { label: 'ประเภทอุปกรณ์', labelEn: 'Equipment', href: '/equipment', icon: 'menu-book' },
  );
  // บอร์ดงานรวมคิวงานและความเคลื่อนไหวล่าสุดไว้หน้าเดียว
  if (can(user, P.JOB_ACCEPT))
    items.push({ label: 'บอร์ดงานซ่อม', labelEn: 'Board', href: '/board', icon: 'event' });
  if (can(user, P.STATISTICS_READ))
    items.push({ label: 'สถิติการแจ้งซ่อม', labelEn: 'Statistics', href: '/dashboard', icon: 'receipt' });
  if (can(user, P.CATEGORY_CREATE))
    items.push({
      label: 'หมวดหมู่งานซ่อม',
      labelEn: 'Categories',
      href: '/admin/categories',
      icon: 'settings',
    });
  if (!can(user, P.JOB_ACCEPT))
    items.push({ label: 'การแจ้งเตือน', labelEn: 'Notifications', href: '/notifications', icon: 'campaign' });
  return items;
}

async function Shell({ children }: { children: React.ReactNode }) {
  const [me, cookieStore] = await Promise.all([getMe(), cookies()]);
  const hasSession = Boolean(cookieStore.get(SESSION_COOKIE)?.value);
  if (!me.ok) {
    // มีคุกกี้แต่หมดอายุ = ต่ออายุเงียบ ๆ · ยังไม่เคยเข้าสู่ระบบ = หน้าต้อนรับพร้อมลิงก์ (แบบ reference)
    if (me.status === 401) return hasSession ? <SessionRedirect /> : <SignedOut />;
    return (
      <main id="main" className="mx-auto flex min-h-dvh max-w-xl items-center p-4">
        <div className="w-full">
          {me.status === 403 ? (
            <ForbiddenState message={me.message} backHref={coreHubHomeUrl() ?? '/'} />
          ) : (
            <ErrorState message={me.message} />
          )}
        </div>
      </main>
    );
  }

  const user = me.data;
  const roleLabel =
    user.subsystemRole === 'USER'
      ? (CORE_ROLE_LABEL[user.coreRole] ?? SUBSYSTEM_ROLE_LABEL.USER)
      : `${CORE_ROLE_LABEL[user.coreRole] ?? ''} · ${SUBSYSTEM_ROLE_LABEL[user.subsystemRole]}`;

  return (
    <ToastProvider>
      <CsmjuAppShell
        displayName={DISPLAY_NAME}
        nav={navFor(user)}
        primaryAction={can(user, P.REQUEST_CREATE) ? { label: 'แจ้งซ่อม', href: '/requests/new' } : undefined}
        user={{ initials: initialsOf(user.displayName), roleLabel }}
        coreHubUrl={coreHubHomeUrl() ?? undefined}
      >
        <SessionKeeper expiresAt={user.session.expiresAt} />
        <ShellBridge notificationsHref={can(user, P.JOB_ACCEPT) ? '/board' : '/notifications'} />
        <CommandPalette canSeeAll={can(user, P.REQUEST_READ_ANY)} isAdmin={can(user, P.PROFILE_READ_ANY)} />
        {children}
      </CsmjuAppShell>
    </ToastProvider>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={`${jakarta.variable} ${notoSansThai.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-background text-on-surface">
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
