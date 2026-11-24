import { getTranslations, setRequestLocale } from 'next-intl/server';
import { requireStaff } from '@/features/auth/guard';
import { CreateRestaurantForm } from '@/features/moderator/CreateRestaurantForm';
import { ModeratorShell } from '@/features/moderator/ModeratorShell';
import { listActiveOwners, listPlatformRestaurants } from '@/features/moderator/moderatorStore';
import { RestaurantFilters } from '@/features/moderator/RestaurantFilters';
import { redirect } from '@/i18n/navigation';

type SearchParams = {
  q?: string | string[];
  status?: string | string[];
};

const one = (v: string | string[] | undefined) => (typeof v === 'string' ? v : '');

const COLUMNS = 'md:grid-cols-[1.5fr_1.2fr_1fr]';

export default async function ModeratorRestaurantsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const currentUser = await requireStaff(locale, '/admin/restaurants');
  if (currentUser.role !== 'MODERATOR') {
    redirect({ href: '/admin', locale });
  }

  const sp = await searchParams;
  const q = one(sp.q).trim();
  const status = ['DRAFT', 'PUBLISHED', 'HIDDEN'].includes(one(sp.status)) ? one(sp.status) : '';

  const t = await getTranslations('moderator');
  const all = listPlatformRestaurants();
  const activeOwners = listActiveOwners();

  const counts = {
    draft: all.filter((r) => r.status === 'DRAFT').length,
    published: all.filter((r) => r.status === 'PUBLISHED').length,
    hidden: all.filter((r) => r.status === 'HIDDEN').length,
  };

  const shown = all.filter((r) => {
    if (q) {
      const matchName = r.name.toLowerCase().includes(q.toLowerCase());
      const matchAddr = r.address.toLowerCase().includes(q.toLowerCase());
      const matchCity = r.city.toLowerCase().includes(q.toLowerCase());
      if (!matchName && !matchAddr && !matchCity) return false;
    }
    if (status && r.status !== status) return false;
    return true;
  });

  const isFiltered = Boolean(q || status);

  const statusBadges: Record<string, { label: string; className: string }> = {
    DRAFT: {
      label: t('statusDraft'),
      className: 'bg-neutral-100 text-neutral-600',
    },
    PUBLISHED: {
      label: t('statusPublished'),
      className: 'bg-[#E6F4EA] text-[#1E7B3C]',
    },
    HIDDEN: {
      label: t('statusHidden'),
      className: 'bg-[#FEF3C7] text-[#B45309]',
    },
  };

  return (
    <ModeratorShell active="restaurants">
      <p className="text-xs font-semibold tracking-wide text-orange-500 uppercase">
        {t('labelM3')}
      </p>
      <h1 className="mt-5 text-4xl font-bold text-neutral-900">{t('restaurantsTitle')}</h1>
      <p className="mt-3 text-neutral-500">{t('restaurantsSubtitle')}</p>

      {/* Верхний блок фильтров */}
      <div className="mt-6">
        <RestaurantFilters q={q} status={status} counts={counts} />
      </div>

      {/* Таблица всех ресторанов */}
      <section className="mt-6 rounded-3xl bg-white p-8 shadow-sm">
        <h2 className="text-xl font-semibold text-neutral-900">{t('allRestaurants')}</h2>

        {shown.length === 0 ? (
          <p className="mt-8 rounded-2xl bg-neutral-50 p-6 text-center text-neutral-500">
            {t('noRestaurantsFound')}
          </p>
        ) : (
          <>
            <div
              className={`mt-8 hidden gap-4 border-b border-neutral-200 pb-3 text-xs font-medium tracking-wide text-neutral-500 uppercase md:grid ${COLUMNS}`}
            >
              <span>{t('colRestaurant')}</span>
              <span>{t('colOwner')}</span>
              <span>{t('colStatus')}</span>
            </div>

            <ul>
              {shown.map((r) => {
                const badge = statusBadges[r.status] ?? statusBadges.DRAFT;

                return (
                  <li
                    key={r.id}
                    className={`grid gap-3 border-b border-neutral-100 py-5 md:items-center md:gap-4 ${COLUMNS}`}
                  >
                    <div>
                      <p className="text-sm font-semibold text-neutral-900">{r.name}</p>
                      <p className="mt-0.5 text-xs text-neutral-500">
                        {r.city} · {r.address}
                      </p>
                    </div>

                    <span className="text-sm text-neutral-700">{r.ownerName}</span>

                    <div>
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>

            <p className="mt-6 text-xs text-neutral-500">
              {isFiltered
                ? t('shownFilteredRestaurants', { shown: shown.length, total: all.length })
                : t('shownRestaurants', { count: all.length })}
            </p>
          </>
        )}
      </section>

      {/* Форма создания ресторана */}
      <div className="mt-6">
        <CreateRestaurantForm locale={locale} owners={activeOwners} />
      </div>

      {/* Примечание */}
      <p className="mt-6 text-xs text-neutral-400">{t('restaurantsFictional')}</p>
    </ModeratorShell>
  );
}
