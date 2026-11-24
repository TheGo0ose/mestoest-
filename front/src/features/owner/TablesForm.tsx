'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ApiMessage } from '@/components/ApiMessage';
import { saveTablesAction } from './actions';
import type { OwnerTable, TablesState } from './types';

let _idCounter = 100;
function nextId() {
  return `nt${++_idCounter}`;
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm">
      <span
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-orange-500' : 'bg-neutral-300'
        }`}
      >
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={() => onChange(!checked)}
        />
        <span
          className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </span>
      <span className={checked ? 'font-semibold text-neutral-900' : 'text-neutral-400'}>
        {label}
      </span>
    </label>
  );
}

export function TablesForm({
  initialTables,
  published,
}: {
  initialTables: OwnerTable[];
  published: boolean;
}) {
  const t = useTranslations('panel');
  const [tables, setTables] = useState<OwnerTable[]>(initialTables);
  const [state, setState] = useState<TablesState>({ problem: null, saved: false });
  const [pending, startTransition] = useTransition();

  // Bulk-форма
  const [bulkCount, setBulkCount] = useState(4);
  const [bulkSeats, setBulkSeats] = useState(2);
  const [bulkPrefix, setBulkPrefix] = useState('Столик');

  function patchTable(id: string, patch: Partial<OwnerTable>) {
    setTables((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    setState({ problem: null, saved: false });
  }

  function addBulk() {
    const startNum = tables.length + 1;
    const newTables: OwnerTable[] = Array.from({ length: bulkCount }, (_, i) => ({
      id: nextId(),
      label: `${bulkPrefix} ${startNum + i}`,
      seats: bulkSeats,
      active: true,
    }));
    setTables((prev) => [...prev, ...newTables]);
    setState({ problem: null, saved: false });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await saveTablesAction(tables);
      setState(result);
    });
  }

  // Вычисляем статистику для заголовка
  const activeTables = tables.filter((t) => t.active);
  const totalSeats = activeTables.reduce((sum, t) => sum + t.seats, 0);

  // Превью bulk
  const startNum = tables.length + 1;
  const endNum = tables.length + bulkCount;
  const bulkFrom = `${bulkPrefix} ${startNum}`;
  const bulkTo = `${bulkPrefix} ${endNum}`;

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-6">
      {/* Имеющиеся столики */}
      <section className="rounded-3xl bg-white p-8 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">{t('existingTablesTitle')}</h2>
            {activeTables.length > 0 && (
              <p className="mt-1 text-sm text-neutral-500">
                {t('tablesExistingSummary', {
                  tables: activeTables.length,
                  seats: totalSeats,
                })}
              </p>
            )}
          </div>
          {activeTables.length > 0 && (
            <span className="shrink-0 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
              {t('tablesConfigured')}
            </span>
          )}
        </div>

        {/* Заголовок колонок */}
        {tables.length > 0 && (
          <div className="mt-6 hidden grid-cols-[1fr_140px_200px_80px] gap-4 border-b border-neutral-100 pb-2 text-xs font-semibold tracking-wide text-neutral-400 uppercase sm:grid">
            <span>{t('colLabel')}</span>
            <span>{t('colSeats')}</span>
            <span>{t('colActive')}</span>
            <span />
          </div>
        )}

        {/* Список столиков */}
        <div className="divide-y divide-neutral-100">
          {tables.map((table) => (
            <div
              key={table.id}
              className="grid items-center gap-4 py-4 sm:grid-cols-[1fr_140px_200px_80px]"
            >
              <input
                type="text"
                value={table.label}
                maxLength={50}
                onChange={(e) => patchTable(table.id, { label: e.target.value })}
                className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
              />
              <input
                type="number"
                min={1}
                max={50}
                value={table.seats}
                onChange={(e) => patchTable(table.id, { seats: Number(e.target.value) })}
                className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
              />
              <Toggle
                checked={table.active}
                onChange={(v) => patchTable(table.id, { active: v })}
                label={table.active ? t('tableActive') : t('tableInactive')}
              />
              <span className="text-sm text-neutral-500">
                {t('tableSeatsCount', { count: table.seats })}
              </span>
            </div>
          ))}
        </div>

        {tables.length > 0 && (
          <p className="mt-4 text-xs text-neutral-400">{t('tableLabelHint')}</p>
        )}
      </section>

      {/* Добавить столики пакетом */}
      <section className="rounded-3xl bg-white p-8 shadow-sm">
        <h2 className="text-xl font-semibold">{t('bulkTitle')}</h2>
        <p className="mt-1 text-sm text-neutral-500">{t('bulkSubtitle')}</p>

        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          <div className="space-y-1">
            <label className="text-sm font-medium text-neutral-700">{t('bulkCount')}</label>
            <input
              type="number"
              min={1}
              max={50}
              value={bulkCount}
              onChange={(e) => setBulkCount(Math.max(1, Number(e.target.value)))}
              className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-neutral-700">{t('bulkSeats')}</label>
            <input
              type="number"
              min={1}
              max={50}
              value={bulkSeats}
              onChange={(e) => setBulkSeats(Math.max(1, Number(e.target.value)))}
              className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
            />
            <p className="text-xs text-neutral-400">{t('bulkSeatsHint')}</p>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-neutral-700">{t('bulkPrefix')}</label>
            <input
              type="text"
              value={bulkPrefix}
              maxLength={30}
              onChange={(e) => setBulkPrefix(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
            />
          </div>
        </div>

        {/* Превью + кнопка добавить */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-neutral-50 px-4 py-3">
          <div className="text-sm">
            <p className="font-semibold">
              {t('bulkPreviewLabel', { from: bulkFrom, to: bulkTo, seats: bulkSeats })}
            </p>
            <p className="text-xs text-neutral-400">{t('bulkPreviewSub', { count: bulkCount })}</p>
          </div>
          <button
            type="button"
            onClick={addBulk}
            className="rounded-full bg-orange-500 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-600"
          >
            {t('bulkAdd', { count: bulkCount })}
          </button>
        </div>
      </section>

      {/* Статус */}
      <div aria-live="polite" className="space-y-3">
        {state.problem && <ApiMessage problem={state.problem} />}
        {state.saved && !state.problem && (
          <p className="rounded-2xl bg-[#E6F4EA] px-4 py-3 text-sm font-semibold text-[#1E7B3C]">
            {t('tablesSaved')}
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
          {pending ? t('savingTables') : t('saveTables')}
        </button>
      </div>
      <p className="text-right text-xs text-neutral-500">
        {published ? t('liveNote') : t('tablesSavedNote')}
      </p>
    </form>
  );
}
