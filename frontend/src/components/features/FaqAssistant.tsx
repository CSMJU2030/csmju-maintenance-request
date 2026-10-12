'use client';

import { useRef, useState, type FormEvent } from 'react';
import { api, ApiRequestError } from '@/lib/api';
import type { FaqAnswer, FaqItem } from '@/lib/types';
import {
  cardBodyClass,
  cardClass,
  cardHeaderClass,
  inputClass,
  primaryButtonClass,
  tagClass,
} from '@/components/ui/classes';

type Message = {
  id: number;
  role: 'user' | 'assistant';
  text: string;
  mode?: 'ai' | 'faq';
  relatedFaqIds?: string[];
};

const SUGGESTED_QUESTIONS = [
  'แจ้งซ่อมได้อย่างไร?',
  'ดูสถานะใบแจ้งซ่อมได้ที่ไหน?',
  'ถ้ามีคนแจ้งปัญหาเดียวกันแล้ว ต้องแจ้งซ้ำไหม?',
];

function HelpCircleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M9.6 9a2.5 2.5 0 0 1 4.8 1c0 1.7-2.4 2.1-2.4 3.7M12 17.2h.01" />
    </svg>
  );
}

export function FaqAssistant({
  items,
  assistantAvailable,
}: {
  items: FaqItem[];
  assistantAvailable: boolean;
}) {
  const [question, setQuestion] = useState('');
  const [filter, setFilter] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messageId = useRef(0);

  const visibleItems = items.filter((item) =>
    `${item.question} ${item.answer}`.toLocaleLowerCase('th').includes(filter.trim().toLocaleLowerCase('th')),
  );

  async function ask(value: string) {
    const text = value.trim();
    if (pending || text.length < 2) return;

    const userMessageId = messageId.current + 1;
    messageId.current = userMessageId;
    setMessages((current) => [...current, { id: userMessageId, role: 'user', text }]);
    setQuestion('');
    setError(null);
    setPending(true);
    try {
      const result = await api<FaqAnswer>('/api/v1/faq/ask', { method: 'POST', json: { question: text } });
      const answerMessageId = messageId.current + 1;
      messageId.current = answerMessageId;
      setMessages((current) => [
        ...current,
        {
          id: answerMessageId,
          role: 'assistant',
          text: result.data.answer,
          mode: result.data.mode,
          relatedFaqIds: result.data.relatedFaqIds,
        },
      ]);
    } catch (cause) {
      setError(cause instanceof ApiRequestError ? cause.message : 'ส่งคำถามไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setPending(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void ask(question);
  }

  return (
    <div className="space-y-8">
      <section className={cardClass} aria-labelledby="faq-assistant-title">
        <div className={cardHeaderClass}>
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-container/10 text-primary-container">
              <HelpCircleIcon className="h-6 w-6" />
            </span>
            <div>
              <h2 id="faq-assistant-title" className="font-display text-headline-md text-on-surface">
                ผู้ช่วยตอบคำถาม
              </h2>
              <p className="mt-1 text-body-md text-on-surface-variant">
                {assistantAvailable
                  ? 'ถามเรื่องการใช้งานระบบได้ คำตอบยึดตามข้อมูล FAQ ของระบบแจ้งซ่อม'
                  : 'ขณะนี้ AI ยังไม่เชื่อมต่อ ระบบจะค้นคำตอบจาก FAQ ให้แทน'}
              </p>
            </div>
          </div>
          <span
            className={`${tagClass} ${assistantAvailable ? 'bg-sso-container text-on-surface' : 'bg-surface-container text-on-surface-variant'}`}
          >
            {assistantAvailable ? 'AI พร้อมตอบ' : 'ค้นจาก FAQ'}
          </span>
        </div>

        <div className={cardBodyClass}>
          <div className="space-y-4" aria-live="polite" aria-relevant="additions text">
            {messages.length === 0 ? (
              <div className="rounded-xl bg-surface-container-low px-4 py-4 text-body-md text-on-surface-variant">
                สวัสดีครับ ถามเกี่ยวกับการแจ้งซ่อม การติดตามสถานะ หรือการใช้ระบบได้เลย
              </div>
            ) : null}
            {messages.map((message) => {
              const related = message.relatedFaqIds
                ?.map((id) => items.find((item) => item.id === id))
                .filter((item): item is FaqItem => Boolean(item));
              const alignment = message.role === 'user' ? 'ml-6 sm:ml-16' : 'mr-6 sm:mr-16';
              return (
                <div key={message.id} className={alignment}>
                  <div
                    className={`whitespace-pre-wrap rounded-xl px-4 py-3 text-body-md ${
                      message.role === 'user'
                        ? 'bg-primary-container text-on-primary'
                        : 'bg-surface-container-low text-on-surface'
                    }`}
                  >
                    {message.text}
                  </div>
                  {message.role === 'assistant' ? (
                    <div className="mt-1.5 space-y-1 px-1 text-caption text-on-surface-variant">
                      <p>{message.mode === 'ai' ? 'คำตอบจาก AI · อิงจาก FAQ' : 'คำตอบจาก FAQ'}</p>
                      {related?.length ? (
                        <p>หัวข้อที่เกี่ยวข้อง: {related.map((item) => item.question).join(' · ')}</p>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            })}
            {pending ? (
              <p
                className="mr-6 rounded-xl bg-surface-container-low px-4 py-3 text-body-md text-on-surface-variant sm:mr-16"
                role="status"
              >
                กำลังค้นคำตอบ…
              </p>
            ) : null}
            {error ? (
              <p
                className="rounded-lg bg-error-container px-4 py-3 text-body-md text-on-error-container"
                role="alert"
              >
                {error}
              </p>
            ) : null}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {SUGGESTED_QUESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                disabled={pending}
                onClick={() => void ask(suggestion)}
                className="min-h-11 rounded-full border border-outline-variant px-3 py-2 text-label-sm text-on-surface-variant transition-colors hover:bg-surface-container disabled:opacity-50"
              >
                {suggestion}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="mt-5 flex flex-col gap-3 sm:flex-row">
            <label className="sr-only" htmlFor="faq-question">
              พิมพ์คำถาม
            </label>
            <input
              id="faq-question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              maxLength={1200}
              placeholder="เช่น ถ้าแจ้งซ่อมแล้วจะติดตามได้ที่ไหน?"
              className={`${inputClass} min-w-0 flex-1`}
              disabled={pending}
            />
            <button
              type="submit"
              className={`${primaryButtonClass} shrink-0`}
              disabled={pending || question.trim().length < 2}
            >
              {pending ? 'กำลังตอบ…' : 'ถามผู้ช่วย'}
            </button>
          </form>
          <p className="mt-3 text-caption text-on-surface-variant">
            ข้อความคำถามอาจถูกส่งให้ผู้ให้บริการ AI ตามการตั้งค่าของระบบ กรุณาอย่าใส่ชื่อ เลขประจำตัว เบอร์โทร
            หรือข้อมูลส่วนบุคคล
          </p>
        </div>
      </section>

      <section className={cardClass} aria-labelledby="faq-list-title">
        <div className={cardHeaderClass}>
          <div>
            <h2 id="faq-list-title" className="font-display text-headline-md text-on-surface">
              คำถามที่พบบ่อย
            </h2>
            <p className="mt-1 text-body-md text-on-surface-variant">
              เลือกหัวข้อเพื่ออ่านคำแนะนำเกี่ยวกับระบบ
            </p>
          </div>
          <label className="w-full sm:max-w-xs">
            <span className="sr-only">ค้นหาคำถามที่พบบ่อย</span>
            <input
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              placeholder="ค้นหาคำถาม…"
              className={inputClass}
            />
          </label>
        </div>
        {visibleItems.length ? (
          <div className="divide-y divide-outline-variant/40 px-4 md:px-6">
            {visibleItems.map((item) => (
              <details key={item.id} id={`faq-${item.id}`} className="group py-4">
                <summary className="min-h-11 cursor-pointer list-none py-2 text-label-md text-on-surface marker:hidden focus-visible:rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-container [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center justify-between gap-4">
                    {item.question}
                    <span
                      aria-hidden="true"
                      className="text-xl text-primary-container transition-transform group-open:rotate-45"
                    >
                      +
                    </span>
                  </span>
                </summary>
                <p className="max-w-4xl pb-2 pr-8 text-body-md text-on-surface-variant">{item.answer}</p>
              </details>
            ))}
          </div>
        ) : (
          <p className="px-6 py-10 text-center text-body-md text-on-surface-variant">
            ไม่พบคำถามที่ตรงกับคำค้น
          </p>
        )}
      </section>
    </div>
  );
}
