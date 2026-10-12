'use client';

import { useRef, useState, type FormEvent } from 'react';
import { ChevronDownIcon, SearchIcon, SendIcon } from '@/components/ui';
import { inputClass } from '@/components/ui/classes';
import { api, ApiRequestError } from '@/lib/api';
import type { FaqAnswer, FaqItem } from '@/lib/types';

type Message = {
  id: number;
  role: 'user' | 'assistant';
  text: string;
  mode?: 'ai' | 'faq';
  relatedFaqIds?: string[];
};

const FAQ_CATEGORIES = [
  { id: 'all', label: 'ภาพรวม', faqIds: undefined },
  { id: 'request', label: 'การแจ้งซ่อม', faqIds: ['report-repair', 'duplicate-request', 'scan-qr'] },
  {
    id: 'tracking',
    label: 'ติดตามงาน',
    faqIds: ['track-request', 'request-statuses', 'cancel-request', 'comment-technician', 'sla-targets'],
  },
  { id: 'account', label: 'บัญชีและการเข้าใช้', faqIds: ['sign-in'] },
] as const;

type FaqCategoryId = (typeof FAQ_CATEGORIES)[number]['id'];

export function FaqAssistant({
  items,
  assistantAvailable,
}: {
  items: FaqItem[];
  assistantAvailable: boolean;
}) {
  const [question, setQuestion] = useState('');
  const [activeCategory, setActiveCategory] = useState<FaqCategoryId>('all');
  const [messages, setMessages] = useState<Message[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messageId = useRef(0);

  const activeCategoryInfo = FAQ_CATEGORIES.find((category) => category.id === activeCategory);
  const normalizedQuestion = question.trim().toLocaleLowerCase('th');
  const visibleItems = items.filter(
    (item) =>
      (!activeCategoryInfo?.faqIds || activeCategoryInfo.faqIds.includes(item.id)) &&
      `${item.question} ${item.answer}`.toLocaleLowerCase('th').includes(normalizedQuestion),
  );

  async function ask(value: string) {
    const text = value.trim();
    if (pending || text.length < 2) return;

    const userMessageId = messageId.current + 1;
    messageId.current = userMessageId;
    setMessages([{ id: userMessageId, role: 'user', text }]);
    setQuestion('');
    setActiveCategory('all');
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
      setError(cause instanceof ApiRequestError ? cause.message : 'ค้นหาคำตอบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setPending(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void ask(question);
  }

  return (
    <div className="space-y-10">
      <section
        aria-labelledby="faq-title"
        className="relative isolate overflow-hidden rounded-3xl bg-on-surface px-5 py-12 text-center text-surface-container-lowest sm:px-8 md:py-16"
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-0 -z-10 h-64 w-64 -translate-x-1/2 rounded-full bg-primary-container/20 blur-3xl"
        />
        <div className="mx-auto max-w-4xl">
          <p className="text-label-sm font-semibold tracking-[0.18em] text-surface-dim">
            ศูนย์ช่วยเหลือ · ระบบแจ้งซ่อม
          </p>
          <h1
            id="faq-title"
            className="mx-auto mt-5 max-w-3xl whitespace-pre-line font-display text-headline-lg font-bold leading-tight text-surface-container-lowest md:text-display-lg"
          >
            เรื่องแจ้งซ่อมและการใช้งานระบบ
            <br className="hidden sm:block" />
            หาคำตอบได้ที่นี่
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-body-md text-surface-dim md:text-body-lg">
            เริ่มจากเลือกหัวข้อ หรือพิมพ์สิ่งที่อยากรู้ได้เลย
          </p>

          <form
            onSubmit={submit}
            className="mx-auto mt-8 flex max-w-2xl flex-col gap-2 rounded-2xl bg-surface-container-lowest p-2 shadow-lg sm:flex-row sm:items-center sm:rounded-full"
          >
            <label className="sr-only" htmlFor="faq-question">
              ค้นหาหรือพิมพ์คำถาม
            </label>
            <span className="flex min-w-0 flex-1 items-center gap-2 pl-3">
              <SearchIcon className="h-5 w-5 shrink-0 text-outline" />
              <input
                id="faq-question"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                maxLength={1200}
                placeholder="เช่น ติดตามสถานะใบแจ้งซ่อมได้อย่างไร?"
                className={`${inputClass} min-h-11 min-w-0 flex-1 border-0 bg-transparent px-1 shadow-none focus:border-transparent focus:shadow-none`}
                disabled={pending}
              />
            </span>
            <button
              type="submit"
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary-container px-5 text-label-md text-on-primary transition-colors hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container disabled:cursor-not-allowed disabled:opacity-40 sm:rounded-full"
              disabled={pending || question.trim().length < 2}
            >
              <SendIcon className="h-4 w-4" />
              {pending ? 'กำลังค้นหา…' : 'ค้นคำตอบ'}
            </button>
          </form>
          <p className="mx-auto mt-3 max-w-2xl text-caption text-surface-dim">
            {assistantAvailable
              ? 'คำตอบอ้างอิงจาก FAQ · คำถามอาจส่งให้ผู้ให้บริการ AI ตามการตั้งค่าระบบ กรุณาอย่าใส่ข้อมูลส่วนบุคคล'
              : 'ขณะนี้ค้นคำตอบจาก FAQ ในระบบ · กรุณาอย่าใส่ข้อมูลส่วนบุคคล'}
          </p>

          <div className="mt-9">
            <p className="mb-3 text-label-sm text-surface-dim">เลือกดูตามหัวข้อ</p>
            <nav aria-label="หมวดหมู่คำถามที่พบบ่อย" className="flex flex-wrap justify-center gap-2.5">
              {FAQ_CATEGORIES.map((category) => {
                const selected = category.id === activeCategory;
                return (
                  <button
                    key={category.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setActiveCategory(category.id)}
                    className={`min-h-11 rounded-full border px-5 py-2 text-label-md transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-surface-container-lowest ${
                      selected
                        ? 'border-surface-container-lowest bg-surface-container-lowest text-on-surface'
                        : 'border-surface-dim/40 bg-surface-container-lowest/5 text-surface-container-lowest hover:bg-surface-container-lowest/15'
                    }`}
                  >
                    {category.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </section>

      {messages.length || pending || error ? (
        <section
          aria-label="คำตอบ"
          aria-live="polite"
          aria-relevant="additions text"
          className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest px-5 py-6 md:px-8"
        >
          {messages.map((message) => {
            if (message.role === 'user') {
              return (
                <div key={message.id} className="mb-6 border-l-2 border-primary-container pl-4">
                  <p className="text-label-sm text-on-surface-variant">คำถามของคุณ</p>
                  <p className="mt-1 text-body-lg text-on-surface">{message.text}</p>
                </div>
              );
            }

            const related = message.relatedFaqIds
              ?.map((id) => items.find((item) => item.id === id))
              .filter((item): item is FaqItem => Boolean(item));

            return (
              <article key={message.id}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="font-display text-headline-md text-on-surface">คำตอบ</h2>
                  <p className="text-caption text-on-surface-variant">
                    {message.mode === 'ai' ? 'เรียบเรียงโดยผู้ช่วย · อ้างอิงจาก FAQ' : 'จากคำถามที่พบบ่อย'}
                  </p>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-body-md leading-relaxed text-on-surface">
                  {message.text}
                </p>
                {related?.length ? (
                  <div className="mt-5 border-t border-outline-variant/40 pt-4">
                    <p className="text-label-sm text-on-surface-variant">อ่านต่อในหัวข้อ</p>
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {related.map((item) => (
                        <li key={item.id}>
                          <a
                            href={`#faq-${item.id}`}
                            className="inline-flex min-h-11 items-center rounded-full border border-outline-variant/60 px-4 py-2 text-label-sm text-on-surface transition-colors hover:bg-surface-container-low focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container"
                          >
                            {item.question}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </article>
            );
          })}
          {pending ? (
            <p className="text-body-md text-on-surface-variant" role="status">
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
        </section>
      ) : null}

      <section aria-labelledby="faq-list-title" className="space-y-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-label-sm font-semibold tracking-[0.14em] text-primary-container">
              คำตอบจากระบบ
            </p>
            <h2 id="faq-list-title" className="mt-1 font-display text-headline-lg text-on-surface">
              คำถามที่พบบ่อย
            </h2>
          </div>
          <p className="text-label-sm text-on-surface-variant">{visibleItems.length} หัวข้อ</p>
        </div>

        {visibleItems.length ? (
          <ol className="divide-y divide-outline-variant/50 border-y border-outline-variant/50">
            {visibleItems.map((item, index) => (
              <li key={item.id}>
                <details id={`faq-${item.id}`} className="group">
                  <summary className="grid min-h-14 cursor-pointer list-none grid-cols-[2.5rem_1fr_auto] items-center gap-3 py-4 text-label-md text-on-surface marker:hidden focus-visible:rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-container [&::-webkit-details-marker]:hidden sm:gap-4">
                    <span className="text-caption font-semibold tabular-nums text-outline">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span>{item.question}</span>
                    <ChevronDownIcon className="h-5 w-5 text-outline transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="max-w-4xl pb-5 pl-11 pr-8 text-body-md text-on-surface-variant sm:pl-14">
                    {item.answer}
                  </p>
                </details>
              </li>
            ))}
          </ol>
        ) : (
          <p className="border-y border-outline-variant/50 py-8 text-center text-body-md text-on-surface-variant">
            ไม่พบหัวข้อในหมวดนี้ ลองเปลี่ยนคำค้นหรือเลือกภาพรวม
          </p>
        )}
      </section>
    </div>
  );
}
