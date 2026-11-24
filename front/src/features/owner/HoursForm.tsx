'use client';

import { useState, useTransition } from 'react';
import { Copy, Info } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import type { OpeningHours } from '@/mocks/restaurants';
import { saveHoursAction } from './actions';
import { ApiMessage } from '@/components/ApiMessage';
import type { HoursRow, HoursState } from './types';

const DAY_KEYS = ['d1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7'] as const;
const DEFAULT_OPENS = '10:00';
const DEFAULT_CLOSES = '23:00';

function toRows(hours: OpeningHours[]): HoursRow[] {
  return [1, 2, 3, 4, 5, 6, 7].map((day) => {
    const h = hours.find((x) => x.day === day);
    return {
      day,
      open: Boolean(h),
      opens: h?.opens ?? DEFAULT_OPENS,
      closes: h?.closes ?? DEFAULT_CLOSES,
    };
  });
}

export function HoursForm({
  initialHours,
  published,
}: {
  initialHours: OpeningHours[];
  published: boolean;
}) {
  const t = useTranslations('panel');
  const [rows, setRows] = useState<HoursRow[]>(() => toRows(initialHours));
  const [state, setState] = useState<HoursState>({ problem: null, saved: false });
  const [pending, startTransition] = useTransition();

  function setRow(day: number, patch: Partial<HoursRow>) {
    setRows((prev) => prev.map((r) => (r.day === day ? { ...r, ...patch } : r)));
    setState({ problem: null, saved: false });
  }

  function copyRowToAll(source: HoursRow) {
    setRows((prev) =>
      prev.map((r) => ({ ...r, open: source.open, opens: source.opens, closes: source.closes })),
    );
    setState({ problem: null, saved: false });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await saveHoursAction(rows);
      setState(result);
    });
  }

  const monday = rows[0]!;

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-6">
      {/* Карточка расписания */}
      <section className="rounded-3xl bg-white p-8 shadow-sm">
        <h2 className="text-xl font-semibold">{t('hoursWeekTitle')}</h2>
        <p className="mt-1 text-sm text-neutral-500">{t('hoursWeekHint')}</p>

        {/* Строка «Копировать часы» */}
        <div className="mt-6 flex items-center justify-between gap-4 rounded-2xl bg-neutral-50 px-4 py-3">
          <div className="flex items-center gap-3 text-sm">
            <Copy className="h-4 w-4 text-orange-500" aria-hidden />
            <div>
              <p className="font-semibold">{t('copyFrom')}</p>
              <p className="text-xs text-neutral-400">{t('copyFromHint')}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => copyRowToAll(monday)}
            className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-neutral-50"
          >
            {t('copyHours')}
          </button>
        </div>

        {/* Заголовок таблицы */}
        <div className="mt-6 hidden grid-cols-[180px_160px_1fr_1fr_48px] gap-4 border-b border-neutral-100 pb-2 text-xs font-semibold tracking-wide text-neutral-400 uppercase sm:grid">
          <span>{t('colDay')}</span>
          <span>{t('colWorkday')}</span>
          <span>{t('colOpens')}</span>
          <span>{t('colCloses')}</span>
          <span>{t('colCopy')}</span>
        </div>

        {/* Строки дней */}
        <div className="divide-y divide-neutral-100">
          {rows.map((row, idx) => (
            <div
              key={row.day}
              className="grid items-center gap-4 py-4 sm:grid-cols-[180px_160px_1fr_1fr_48px]"
            >
              {/* День */}
              <span className="font-medium">{t(DAY_KEYS[idx]!)}</span>

              {/* Toggle рабочий/выходной */}
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <span
                  role="switch"
                  aria-checked={row.open}
                  onClick={() => setRow(row.day, { open: !row.open })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-within:ring-2 focus-within:ring-orange-400 ${
                    row.open ? 'bg-orange-500' : 'bg-neutral-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={row.open}
                    onChange={() => setRow(row.day, { open: !row.open })}
                  />
                  <span
                    className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                      row.open ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </span>
                <span className={row.open ? 'font-semibold text-neutral-900' : 'text-neutral-400'}>
                  {row.open ? t('workday') : t('dayoff')}
                </span>
              </label>

              {/* Открытие */}
              <label className="flex items-center gap-2">
                <input
                  type="time"
                  value={row.opens}
                  disabled={!row.open}
                  onChange={(e) => setRow(row.day, { opens: e.target.value })}
                  className="w-32 rounded-xl border border-neutral-200 px-3 py-2 font-mono text-sm disabled:opacity-40"
                />
              </label>

              {/* Закрытие */}
              <label className="flex items-center gap-2">
                <input
                  type="time"
                  value={row.closes}
                  disabled={!row.open}
                  onChange={(e) => setRow(row.day, { closes: e.target.value })}
                  className="w-32 rounded-xl border border-neutral-200 px-3 py-2 font-mono text-sm disabled:opacity-40"
                />
              </label>

              {/* Копировать строку */}
              <button
                type="button"
                title={t('copyRow')}
                onClick={() => copyRowToAll(row)}
                className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-neutral-100"
              >
                <Copy className="h-4 w-4 text-neutral-400" aria-hidden />
                <span className="sr-only">{t('copyRow')}</span>
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Info-блок */}
      <div className="flex gap-3 rounded-2xl bg-[#EAF1FF] p-4 text-sm text-[#1F3F7A]">
        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <div>
          <p className="font-semibold">{t('hoursInfoTitle')}</p>
          <p className="mt-0.5 text-xs opacity-80">{t('hoursInfoNote')}</p>
        </div>
      </div>

      {/* Статус сохранения */}
      <div aria-live="polite" className="space-y-3">
        {state.problem && <ApiMessage problem={state.problem} />}
        {state.saved && !state.problem && (
          <p className="rounded-2xl bg-[#E6F4EA] px-4 py-3 text-sm font-semibold text-[#1E7B3C]">
            {t('hoursSaved')}
          </p>
        )}
      </div>

      {/* Кнопки */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/admin"
          className="rounded-full border border-neutral-300 bg-white px-6 py-3 text-sm font-semibold hover:bg-neutral-50"
        >
          {t('toOverview')}
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-orange-500 px-8 py-3 text-sm font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? t('savingHours') : t('saveHours')}
        </button>
      </div>
      <p className="text-right text-xs text-neutral-500">
        {published ? t('liveNote') : t('draftNote')}
      </p>
    </form>
  );
}
