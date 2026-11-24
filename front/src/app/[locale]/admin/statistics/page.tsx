import { Info } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { requireStaff } from '@/features/auth/guard';
import { ModernDailyBarChart } from '@/features/moderator/ModernDailyBarChart';
import { getPlatformStats } from '@/features/moderator/stats';
import { StatsSourcesTable } from '@/features/moderator/StatsSourcesTable';
import { CabinetShell } from '@/features/owner/CabinetShell';
import { fetchManagedRestaurant } from '@/features/restaurants/data';
import { redirect } from '@/i18n/navigation';

export default async function StatisticsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireStaff(locale, '/admin/statistics');
  if (user.role === 'MODERATOR') redirect({ href: '/admin/stats', locale });
  if (user.role !== 'OWNER') redirect({ href: '/admin', locale });

  const t = await getTranslations('moderator');
  const tc = await getTranslations('cabinet');
  const restaurant = await fetchManagedRestaurant();
  const stats = getPlatformStats(restaurant?.id);

  return (
    <CabinetShell restaurant={restaurant} active="statistics">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
            {tc('navStats')}
          </h1>
          <p className="mt-1 text-sm text-neutral-500">{t('statsSubtitle')}</p>
        </div>
        <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs font-semibold text-neutral-700 shadow-2xs sm:mt-0">
          <span>{stats.periodLabel}</span>
          <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-600">
            {t('filterDaysCount', { days: 7 })}
          </span>
        </div>
      </div>

      {/* 3 карточки основных метрик */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {/* Карточка 1: Всего бронирований */}
        <section className="rounded-3xl border border-neutral-100 bg-white p-6 shadow-sm">
          <p className="text-sm text-neutral-500">{t('metricTotal')}</p>
          <p className="mt-2 text-4xl font-bold text-neutral-900">{stats.totalBookings}</p>
          <p className="mt-2 text-xs text-neutral-400">
            {t('metricTotalHint', {
              confirmed: stats.confirmedBookings,
              cancelled: stats.cancelledBookings,
            })}
          </p>
        </section>

        {/* Карточка 2: Гостей · covers */}
        <section className="rounded-3xl border border-neutral-100 bg-white p-6 shadow-sm">
          <p className="text-sm text-neutral-500">{t('metricCovers')}</p>
          <p className="mt-2 text-4xl font-bold text-neutral-900">{stats.covers}</p>
          <p className="mt-2 text-xs text-neutral-400">{t('metricCoversHint')}</p>
        </section>

        {/* Карточка 3: Отмены */}
        <section className="rounded-3xl border border-neutral-100 bg-white p-6 shadow-sm">
          <p className="text-sm text-neutral-500">{t('metricCancelled')}</p>
          <p className="mt-2 text-4xl font-bold text-neutral-900">{stats.cancelledBookings}</p>
          <p className="mt-2 text-xs text-neutral-400">
            {t('metricCancelledHint', { rate: stats.cancellationRate })}
          </p>
        </section>
      </div>

      {/* График бронирований по дням */}
      <div className="mt-6">
        <ModernDailyBarChart
          days={stats.days}
          totalConfirmed={stats.confirmedBookings}
          totalCancelled={stats.cancelledBookings}
          totalBookings={stats.totalBookings}
        />
      </div>

      {/* Таблица источников бронирований */}
      <div className="mt-6">
        <StatsSourcesTable
          sources={stats.sources}
          totalBookings={stats.totalBookings}
          totalConfirmed={stats.confirmedBookings}
          totalCancelled={stats.cancelledBookings}
          totalCovers={stats.covers}
        />
      </div>

      {/* Информационная плашка внизу */}
      <div className="mt-6 flex items-start gap-3 rounded-2xl bg-neutral-100/70 p-4 text-xs text-neutral-500">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
        <div>
          <p className="font-semibold text-neutral-700">{t('statsInfoTitle')}</p>
          <p className="mt-0.5">
            {t('statsInfoText', {
              cancelled: stats.cancelledBookings,
              total: stats.totalBookings,
            })}
          </p>
        </div>
      </div>
    </CabinetShell>
  );
}
