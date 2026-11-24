'use client';

import { useTranslations } from 'next-intl';
import { SelectField } from '@/components/SelectField';
import { useRouter } from '@/i18n/navigation';
import type { PlatformRestaurant } from './moderator';

export function StatsFilters({
  restaurantId,
  restaurants,
}: {
  restaurantId: string;
  restaurants: PlatformRestaurant[];
}) {
  const t = useTranslations('moderator');
  const router = useRouter();

  function updateRestaurant(newId: string) {
    const query: Record<string, string> = {};
    if (newId) query.restaurant = newId;
    router.replace({ pathname: '/admin/stats', query });
  }

  return (
    <section className="rounded-3xl bg-white p-8 shadow-sm">
      <div className="grid gap-6 sm:grid-cols-2">
        <SelectField
          id="stats-date-range"
          label={t('filterDateRange')}
          value="week"
          onChange={() => {}}
        >
          <option value="week">{t('dateRangeWeek')}</option>
        </SelectField>

        <SelectField
          id="stats-restaurant"
          label={t('filterRestaurantLabel')}
          value={restaurantId}
          onChange={updateRestaurant}
        >
          <option value="">{t('allRestaurantsFilter')}</option>
          {restaurants.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </SelectField>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-neutral-100 pt-4 text-xs">
        <span className="text-neutral-500">{t('statsPlatformNote')}</span>
        <span className="rounded-full bg-orange-100 px-3 py-1 font-semibold text-orange-700">
          {t('stats7Days')}
        </span>
      </div>
    </section>
  );
}
