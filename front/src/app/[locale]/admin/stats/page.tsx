import { Info } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { requireStaff } from '@/features/auth/guard';
import { ModeratorShell } from '@/features/moderator/ModeratorShell';
import { listPlatformRestaurants } from '@/features/moderator/moderatorStore';
import { ModernDailyBarChart } from '@/features/moderator/ModernDailyBarChart';
import { getPlatformStats } from '@/features/moderator/stats';
import { StatsFilters } from '@/features/moderator/StatsFilters';
import { StatsSourcesTable } from '@/features/moderator/StatsSourcesTable';
import { redirect } from '@/i18n/navigation';

type SearchParams = {
  restaurant?: string | string[];
};

const one = (v: string | string[] | undefined) => (typeof v === 'string' ? v : '');

export default async function ModeratorStatsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const currentUser = await requireStaff(locale, '/admin/stats');
  if (currentUser.role !== 'MODERATOR') {
    redirect({ href: '/admin', locale });
  }

  const sp = await searchParams;
  const restaurantId = one(sp.restaurant);

  const t = await getTranslations('moderator');
  const restaurants = listPlatformRestaurants();
  const stats = getPlatformStats(restaurantId);

  return (
    <ModeratorShell active="stats">
      <p className="text-xs font-semibold tracking-wide text-orange-500 uppercase">
        {t('labelS1')}
      </p>
      <h1 className="mt-5 text-4xl font-bold text-neutral-900">{t('statsTitle')}</h1>
      <p className="mt-3 text-neutral-500">{t('statsSubtitle')}</p>

      {/* Верхний фильтр периода и ресторана */}
      <div className="mt-6">
        <StatsFilters restaurantId={restaurantId} restaurants={restaurants} />
      </div>

      {/* 3 карточки основных метрик */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {/* Карточка 1: Всего бронирований */}
        <section className="rounded-3xl bg-white p-6 shadow-sm">
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
        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm text-neutral-500">{t('metricCovers')}</p>
          <p className="mt-2 text-4xl font-bold text-neutral-900">{stats.covers}</p>
          <p className="mt-2 text-xs text-neutral-400">{t('metricCoversHint')}</p>
        </section>

        {/* Карточка 3: Отменены */}
        <section className="rounded-3xl bg-white p-6 shadow-sm">
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

      {/* Информационный блок */}
      <div className="mt-6 flex items-start gap-3 rounded-2xl bg-neutral-50 p-4">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
        <div className="text-xs">
          <p className="font-semibold text-neutral-800">{t('statsInfoTitle')}</p>
          <p className="mt-0.5 text-neutral-500">
            {t('statsInfoText', {
              cancelled: stats.cancelledBookings,
              total: stats.totalBookings,
            })}
          </p>
        </div>
      </div>
    </ModeratorShell>
  );
}
