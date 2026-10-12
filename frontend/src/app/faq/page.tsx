import type { Metadata } from 'next';
import { FaqAssistant } from '@/components/features/FaqAssistant';
import { ApiFailure } from '@/components/shared/ApiFailure';
import { serverApi } from '@/lib/server-api';
import type { FaqIndex } from '@/lib/types';

export const metadata: Metadata = { title: 'ศูนย์ช่วยเหลือระบบแจ้งซ่อม' };

export default async function FaqPage() {
  const result = await serverApi<FaqIndex>('/api/v1/faq');
  if (!result.ok) return <ApiFailure result={result} />;

  return <FaqAssistant items={result.data.items} assistantAvailable={result.data.assistantAvailable} />;
}
