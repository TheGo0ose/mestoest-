'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { SelectField } from '@/components/SelectField';
import { useRouter } from '@/i18n/navigation';

export function RestaurantFilters({
  q,
  status,
  counts,
}: {
  q: string;
  status: string;
  counts: { draft: number; published: number; hidden: number };
}) {
  const t = useTranslations('moderator');
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState(q);

  function pushQuery(newQ: string, newStatus: string) {
    const query: Record<string, string> = {};
    if (newQ.trim()) query.q = newQ.trim();
    if (newStatus) query.status = newStatus;
    router.replace({ pathname: '/admin/restaurants', query });
  }

  // Дебаунс ввода поиска
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== q) {
        const query: Record<string, string> = {};
        if (searchTerm.trim()) query.q = searchTerm.trim();
        if (status) query.status = status;
        router.replace({ pathname: '/admin/restaurants', query });
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm, q, status, router]);

  return (
    <section className="rounded-3xl bg-white p-8 shadow-sm">
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="restaurant-search" className="text-sm font-semibold text-neutral-800">
            {t('searchRestaurantLabel')}
          </label>
          <input
            id="restaurant-search"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('searchRestaurantPlaceholder')}
            className="mt-3 w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3.5 text-sm outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>

        <SelectField
          id="restaurant-status-filter"
          label={t('filterStatus')}
          value={status}
          onChange={(v) => pushQuery(searchTerm, v)}
        >
          <option value="">{t('allStatuses')}</option>
          <option value="DRAFT">{t('statusDraft')}</option>
          <option value="PUBLISHED">{t('statusPublished')}</option>
          <option value="HIDDEN">{t('statusHidden')}</option>
        </SelectField>
      </div>

      {/* Бейджи статусов с количеством */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => pushQuery(searchTerm, status === 'DRAFT' ? '' : 'DRAFT')}
          className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
            status === 'DRAFT'
              ? 'bg-neutral-200 text-neutral-800 ring-2 ring-neutral-400'
              : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
          }`}
        >
          {t('badgeDraft', { count: counts.draft })}
        </button>

        <button
          type="button"
          onClick={() => pushQuery(searchTerm, status === 'PUBLISHED' ? '' : 'PUBLISHED')}
          className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
            status === 'PUBLISHED'
              ? 'bg-[#E6F4EA] text-[#1E7B3C] ring-2 ring-[#1E7B3C]'
              : 'bg-[#E6F4EA] text-[#1E7B3C] hover:opacity-80'
          }`}
        >
          {t('badgePublished', { count: counts.published })}
        </button>

        <button
          type="button"
          onClick={() => pushQuery(searchTerm, status === 'HIDDEN' ? '' : 'HIDDEN')}
          className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
            status === 'HIDDEN'
              ? 'bg-[#FEF3C7] text-[#B45309] ring-2 ring-[#B45309]'
              : 'bg-[#FEF3C7] text-[#B45309] hover:opacity-80'
          }`}
        >
          {t('badgeHidden', { count: counts.hidden })}
        </button>
      </div>
    </section>
  );
}
