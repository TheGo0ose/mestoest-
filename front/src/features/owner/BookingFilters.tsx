'use client';

import { useTranslations } from 'next-intl';
import { SelectField } from '@/components/SelectField';
import { useRouter } from '@/i18n/navigation';

type Filters = { date: string; status: string; source: string };

export function BookingFilters({
  restaurantName,
  date,
  status,
  source,
}: {
  restaurantName: string;
  date: string;
  status: string;
  source: string;
}) {
  const t = useTranslations('cabinet');
  const router = useRouter();

  // Фильтры живут в адресе страницы: так ими можно делиться, а «Назад» работает
  function update(change: Partial<Filters>) {
    const next = { date, status, source, ...change };
    const query: Record<string, string> = {};
    if (next.date) query.date = next.date;
    if (next.status) query.status = next.status;
    if (next.source) query.source = next.source;
    router.replace({ pathname: '/admin/bookings', query });
  }

  return (
    <section className="rounded-3xl bg-white p-8 shadow-sm">
      <div className="grid gap-6 sm:grid-cols-2">
        <SelectField
          id="filter-restaurant"
          label={t('filterRestaurant')}
          value="own"
          onChange={() => {}}
        >
          <option value="own">{restaurantName}</option>
        </SelectField>

        <div>
          <label htmlFor="filter-date" className="text-sm font-semibold">
            {t('filterDay')}
          </label>
          <input
            id="filter-date"
            type="date"
            value={date}
            onChange={(e) => update({ date: e.target.value })}
            className="mt-3 w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>

        <SelectField
          id="filter-status"
          label={t('filterStatus')}
          value={status}
          onChange={(v) => update({ status: v })}
        >
          <option value="">{t('allStatuses')}</option>
          <option value="CONFIRMED">{t('statusConfirmed')}</option>
          <option value="CANCELLED">{t('statusCancelled')}</option>
        </SelectField>

        <SelectField
          id="filter-source"
          label={t('filterSource')}
          value={source}
          onChange={(v) => update({ source: v })}
        >
          <option value="">{t('allSources')}</option>
          <option value="WEB">WEB</option>
          <option value="TELEGRAM">TELEGRAM</option>
        </SelectField>
      </div>
    </section>
  );
}
