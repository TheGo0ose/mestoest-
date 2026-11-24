'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { Restaurant } from '@/mocks/restaurants';
import { RestaurantGrid } from './RestaurantGrid';

export function RestaurantCatalog({ items }: { items: Restaurant[] }) {
  const t = useTranslations('catalog');
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();
  const filtered = q
    ? items.filter((r) =>
        [r.name, r.city, r.description].some((field) => field.toLowerCase().includes(q)),
      )
    : items;

  return (
    <>
      <section>
        <p className="text-sm font-medium text-orange-500">{t('region')}</p>
        <h1 className="mt-2 text-5xl font-bold">{t('title')}</h1>
        <p className="mt-3 text-neutral-500">{t('subtitle')}</p>

        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('search')}
          aria-label={t('search')}
          className="mt-8 w-full rounded-2xl bg-white px-5 py-4 shadow-sm outline-none focus:ring-2 focus:ring-orange-400"
        />

        <p className="mt-6 rounded-2xl border border-[#FDE7E0] bg-[#FFF7F4] px-5 py-4 text-sm text-[#9A4A33]">
          {t('notice')}
        </p>
      </section>

      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <div>
            <h2 className="text-xl font-bold">{t('listTitle')}</h2>
            <p className="text-xs text-neutral-500">{t('listHint')}</p>
          </div>
          <span className="text-sm text-neutral-500">{t('count', { count: filtered.length })}</span>
        </div>

        {filtered.length > 0 ? (
          <RestaurantGrid items={filtered} />
        ) : (
          <p className="rounded-2xl bg-white p-6 text-neutral-500">{t('empty')}</p>
        )}
      </section>
    </>
  );
}
