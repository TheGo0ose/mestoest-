'use client';

import { useState, useTransition } from 'react';
import { ChevronDown, ChevronUp, Info, Pencil } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ApiMessage } from '@/components/ApiMessage';
import { saveMenuAction } from './actions';
import type { MenuSection, MenuItem } from '@/mocks/restaurants';
import type { MenuState } from './types';

let _counter = 0;
function uid() {
  return `m${Date.now()}_${++_counter}`;
}

type EditingItem = { sectionId: string; itemId: string } | null;

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <span
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 cursor-pointer items-center rounded-full transition-colors ${
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
  );
}

export function MenuEditor({
  initialSections,
  menuSaved,
  published,
}: {
  initialSections: MenuSection[];
  menuSaved: boolean;
  published: boolean;
}) {
  const t = useTranslations('panel');
  const [sections, setSections] = useState<MenuSection[]>(initialSections);
  const [editing, setEditing] = useState<EditingItem>(null);
  const [state, setState] = useState<MenuState>({ problem: null, saved: menuSaved });
  const [pending, startTransition] = useTransition();

  const totalItems = sections.reduce((n, s) => n + s.items.length, 0);
  const hasUnsaved = !state.saved || !menuSaved;

  // --- helpers ---
  function markDirty() {
    setState({ problem: null, saved: false });
  }

  function updateSection(id: string, patch: Partial<MenuSection>) {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    markDirty();
  }

  function moveSectionUp(id: string) {
    setSections((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      if (idx <= 0) return prev;
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx]!, next[idx - 1]!];
      return next;
    });
    markDirty();
  }

  function moveSectionDown(id: string) {
    setSections((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      if (idx < 0 || idx >= prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1]!, next[idx]!];
      return next;
    });
    markDirty();
  }

  function addSection() {
    const id = uid();
    setSections((prev) => [...prev, { id, name: 'Новый раздел', items: [] }]);
    markDirty();
  }

  function updateItem(sectionId: string, itemId: string, patch: Partial<MenuItem>) {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? { ...s, items: s.items.map((it) => (it.id === itemId ? { ...it, ...patch } : it)) }
          : s,
      ),
    );
    markDirty();
  }

  function addItem(sectionId: string) {
    const id = uid();
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              items: [
                ...s.items,
                { id, name: '', description: '', price: '0.00', available: true },
              ],
            }
          : s,
      ),
    );
    setEditing({ sectionId, itemId: id });
    markDirty();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await saveMenuAction(sections);
      setState(result);
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
      {/* Alert несохранённых изменений */}
      {hasUnsaved && totalItems > 0 && (
        <div className="flex gap-3 rounded-2xl bg-[#FFF8E6] p-4 text-sm text-[#7A4F00]">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" aria-hidden />
          <div>
            <p className="font-semibold">{t('menuUnsavedAlert')}</p>
            <p className="mt-0.5 text-xs opacity-80">
              {t('menuUnsavedNote', { count: totalItems })}
            </p>
          </div>
        </div>
      )}

      {/* Верхняя панель: Добавить раздел + Сохранить меню */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={addSection}
          className="rounded-full border border-neutral-300 bg-white px-5 py-2 text-sm font-semibold hover:bg-neutral-50"
        >
          {t('addSection')}
        </button>
        <button
          type="submit"
          disabled={pending}
          className="ml-auto rounded-full bg-orange-500 px-6 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
        >
          {pending ? t('savingMenu') : t('saveMenu')}
        </button>
      </div>

      {/* Список разделов */}
      {sections.map((section, sIdx) => (
        <section key={section.id} className="overflow-hidden rounded-3xl bg-white shadow-sm">
          {/* Шапка раздела */}
          <div className="flex items-center gap-3 border-b border-neutral-100 px-6 py-4">
            <div className="min-w-0 flex-1">
              <p className="mb-1 text-xs font-semibold tracking-wide text-neutral-400 uppercase">
                {t('colSectionName')}
              </p>
              <input
                type="text"
                value={section.name}
                onChange={(e) => updateSection(section.id, { name: e.target.value })}
                className="w-full border-b border-neutral-200 bg-transparent pb-0.5 text-lg font-semibold focus:border-orange-400 focus:outline-none"
              />
            </div>
            <div className="flex shrink-0 items-center gap-2 text-sm text-neutral-500">
              <span className="text-xs font-semibold tracking-wide uppercase">{t('colOrder')}</span>
              <span className="font-semibold">{sIdx + 1}</span>
              <button
                type="button"
                onClick={() => moveSectionUp(section.id)}
                disabled={sIdx === 0}
                className="rounded-lg p-1 hover:bg-neutral-100 disabled:opacity-30"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => moveSectionDown(section.id)}
                disabled={sIdx === sections.length - 1}
                className="rounded-lg p-1 hover:bg-neutral-100 disabled:opacity-30"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
              <span className="ml-4 text-xs font-semibold tracking-wide uppercase">
                {t('colItems')}
              </span>
              <span className="font-semibold">{section.items.length}</span>
            </div>
          </div>

          {/* Заголовок колонок позиций */}
          {section.items.length > 0 && (
            <div className="hidden grid-cols-[1fr_120px_120px_60px_40px] gap-4 border-b border-neutral-50 bg-neutral-50 px-6 py-2 text-xs font-semibold tracking-wide text-neutral-400 uppercase sm:grid">
              <span>{t('colItemName')}</span>
              <span>{t('colPrice')}</span>
              <span>{t('colAvailable')}</span>
              <span>{t('colItemOrder')}</span>
              <span />
            </div>
          )}

          {/* Позиции */}
          <div className="divide-y divide-neutral-50 px-6">
            {section.items.map((item, iIdx) => {
              const isEditing = editing?.sectionId === section.id && editing?.itemId === item.id;

              if (isEditing) {
                return (
                  <div
                    key={item.id}
                    className="my-3 rounded-2xl border border-orange-200 bg-orange-50 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-orange-600">{t('editingItem')}</p>
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                        {t('itemDraft')}
                      </span>
                    </div>
                    <div className="mt-3 grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-neutral-500">
                          {t('fieldItemName')}
                        </label>
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) =>
                            updateItem(section.id, item.id, { name: e.target.value })
                          }
                          className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-neutral-500">
                          {t('fieldItemPrice')}
                        </label>
                        <input
                          type="text"
                          value={item.price}
                          onChange={(e) =>
                            updateItem(section.id, item.id, { price: e.target.value })
                          }
                          className="w-full rounded-xl border border-neutral-200 px-3 py-2 font-mono text-sm"
                        />
                        <p className="text-xs text-neutral-400">{t('priceHint')}</p>
                      </div>
                    </div>
                    <div className="mt-3 space-y-1">
                      <label className="text-xs font-medium text-neutral-500">
                        {t('fieldItemDescription')}
                      </label>
                      <textarea
                        value={item.description}
                        onChange={(e) =>
                          updateItem(section.id, item.id, { description: e.target.value })
                        }
                        rows={2}
                        className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-6">
                      <label className="flex items-center gap-2 text-sm">
                        <Toggle
                          checked={item.available}
                          onChange={(v) => updateItem(section.id, item.id, { available: v })}
                        />
                        <span>{t('availableInMenu')}</span>
                      </label>
                      <label className="flex items-center gap-2 text-sm text-neutral-500">
                        <span>{t('orderInSection')}</span>
                        <span className="font-semibold">{iIdx + 1}</span>
                      </label>
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-4">
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setEditing(null)}
                          className="rounded-full bg-orange-500 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-600"
                        >
                          {t('saveRow')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditing(null)}
                          className="rounded-full border border-neutral-300 px-5 py-2 text-sm font-semibold hover:bg-neutral-50"
                        >
                          {t('cancelEdit')}
                        </button>
                      </div>
                      <span className="text-xs text-neutral-400">{t('noLeave')}</span>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={item.id}
                  className="grid items-center gap-4 py-3 text-sm sm:grid-cols-[1fr_120px_120px_60px_40px]"
                >
                  <div>
                    <p className="font-medium">{item.name || '—'}</p>
                    {item.description && (
                      <p className="text-xs text-neutral-400">{item.description}</p>
                    )}
                  </div>
                  <span className="font-mono">{item.price} сом</span>
                  <div className="flex items-center gap-2">
                    <Toggle
                      checked={item.available}
                      onChange={(v) => updateItem(section.id, item.id, { available: v })}
                    />
                    <span className="text-xs text-neutral-500">{t('inMenu')}</span>
                  </div>
                  <span className="text-neutral-400">{iIdx + 1}</span>
                  <button
                    type="button"
                    onClick={() => setEditing({ sectionId: section.id, itemId: item.id })}
                    className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-neutral-100"
                  >
                    <Pencil className="h-4 w-4 text-neutral-400" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Добавить позицию */}
          <div className="px-6 pt-2 pb-5">
            <button
              type="button"
              onClick={() => addItem(section.id)}
              className="text-sm font-semibold text-orange-500 hover:text-orange-600"
            >
              {t('addItem')}
            </button>
          </div>
        </section>
      ))}

      {/* Сноска */}
      {sections.length > 0 && <p className="text-xs text-neutral-400">{t('menuFootnote')}</p>}

      {/* Статус */}
      <div aria-live="polite" className="space-y-3">
        {state.problem && <ApiMessage problem={state.problem} />}
        {state.saved && !state.problem && (
          <p className="rounded-2xl bg-[#E6F4EA] px-4 py-3 text-sm font-semibold text-[#1E7B3C]">
            {t('menuSaved')}
          </p>
        )}
      </div>

      {/* Нижние кнопки */}
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
          className="rounded-full bg-orange-500 px-8 py-3 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
        >
          {pending ? t('savingMenu') : t('saveMenu')}
        </button>
      </div>
      <p className="text-right text-xs text-neutral-500">
        {published ? t('liveNote') : t('menuFooterNote')}
      </p>
    </form>
  );
}
