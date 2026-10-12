import type { Metadata } from 'next';
import { PageHeader } from '@/csmju';
import { FaqAssistant } from '@/components/features/FaqAssistant';
import { ApiFailure } from '@/components/shared/ApiFailure';
import { serverApi } from '@/lib/server-api';
import type { FaqIndex } from '@/lib/types';

export const metadata: Metadata = { title: 'คำถามที่พบบ่อยและผู้ช่วย AI' };

export default async function FaqPage() {
  const result = await serverApi<FaqIndex>('/api/v1/faq');
  if (!result.ok) return <ApiFailure result={result} />;

  return (
    <>
      <PageHeader
        title="คำถามที่พบบ่อยและผู้ช่วย AI"
        description="ค้นหาคำตอบและถามผู้ช่วยเกี่ยวกับการแจ้งซ่อมและการใช้งานระบบ"
      />
      <FaqAssistant items={result.data.items} assistantAvailable={result.data.assistantAvailable} />
    </>
  );
}
