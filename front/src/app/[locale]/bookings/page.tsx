import { ArrowLeft } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { SiteHeader } from '@/components/SiteHeader';
import { requireUser } from '@/features/auth/guard';
import { StatusBadge } from '@/features/booking/StatusBadge';
import { isModifiable, listBookings } from '@/features/booking/store';
import { fetchRestaurant } from '@/features/restaurants/data';
import { Link } from '@/i18n/navigation';
import { formatDate, formatTime } from '@/lib/time';

export default async function BookingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tab?: string | string[] }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireUser(locale, '/bookings');
  const sp = await searchParams;
  const tab = sp.tab === 'past' ? 'past' : 'upcoming';

  const t = await getTranslations('bookings');

  const all = listBookings();
  const upcoming = all
    .filter((b) => isModifiable(b))
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  const past = all
    .filter((b) => !isModifiable(b))
    .sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime());
  const items = tab === 'past' ? past : upcoming;

  const restaurants = await Promise.all(items.map((b) => fetchRestaurant(b.restaurantId)));

  const tabClass = (active: boolean) =>
    `rounded-full px-6 py-3 text-sm font-semibold ${
      active
        ? 'bg-[#FDE7E0] text-orange-600'
        : 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200'
    }`;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 pt-8 pb-16">
        <Link
          href="/"
          className="flex w-fit items-center gap-2 text-sm text-orange-500 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {t('backToCatalog')}
        </Link>

        <h1 className="mt-6 text-3xl font-bold">{t('title')}</h1>
        <p className="mt-1 text-sm text-neutral-500">{t('subtitle')}</p>

        <section className="mt-6 max-w-3xl rounded-3xl bg-white p-8 shadow-sm">
          <nav className="flex gap-3" aria-label={t('title')}>
            <Link
              href="/bookings"
              aria-current={tab === 'upcoming' ? 'page' : undefined}
              className={tabClass(tab === 'upcoming')}
            >
              {t('tabUpcoming')}
            </Link>
            <Link
              href={{ pathname: '/bookings', query: { tab: 'past' } }}
              aria-current={tab === 'past' ? 'page' : undefined}
              className={tabClass(tab === 'past')}
            >
              {t('tabPast')}
            </Link>
          </nav>

          {items.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-neutral-500">
                {tab === 'past' ? t('emptyPast') : t('emptyUpcoming')}
              </p>
              {tab === 'upcoming' && (
                <Link
                  href="/"
                  className="mt-4 inline-block rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white hover:bg-orange-600"
                >
                  {t('findTable')}
                </Link>
              )}
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-neutral-100">
              {items.map((b, i) => (
                <li key={b.id} className="flex flex-wrap items-center justify-between gap-4 py-5">
                  <div className="min-w-0">
                    <Link
                      href={`/bookings/${b.id}`}
                      className="text-lg font-semibold hover:underline"
                    >
                      {restaurants[i]?.name ?? '—'}
                    </Link>
                    <p className="mt-1 text-sm text-neutral-500">
                      {formatDate(b.startsAt, locale)} · {formatTime(b.startsAt, locale)} ·{' '}
                      {t('guestsCount', { count: b.partySize })} · {b.reference}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={b.status} />
                    {isModifiable(b) && (
                      <Link
                        href={{
                          pathname: `/restaurants/${b.restaurantId}/book`,
                          query: { reschedule: b.id },
                        }}
                        className="rounded-full border border-orange-500 px-5 py-2 text-sm font-semibold text-orange-600 hover:bg-orange-50"
                      >
                        {t('reschedule')}
                      </Link>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}
