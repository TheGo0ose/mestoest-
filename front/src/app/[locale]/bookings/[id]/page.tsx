import { ArrowLeft } from 'lucide-react';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { SiteHeader } from '@/components/SiteHeader';
import { requireUser } from '@/features/auth/guard';
import { BookingActions } from '@/features/booking/BookingActions';
import { DetailRows } from '@/features/booking/DetailRows';
import { StatusBadge } from '@/features/booking/StatusBadge';
import { getBooking, isModifiable } from '@/features/booking/store';
import { fetchRestaurant } from '@/features/restaurants/data';
import { Link } from '@/i18n/navigation';
import { formatDate, formatTime } from '@/lib/time';

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  await requireUser(locale, `/bookings/${id}`);

  // Чужая или несуществующая бронь: «не найдено» (правило ТЗ)
  const booking = getBooking(id);
  if (!booking) notFound();
  const restaurant = await fetchRestaurant(booking.restaurantId);
  if (!restaurant) notFound();

  const t = await getTranslations('bookings');

  const rows: [string, string][] = [
    [t('rowRestaurant'), restaurant.name],
    [t('rowDate'), formatDate(booking.startsAt, locale)],
    [t('rowTime'), formatTime(booking.startsAt, locale)],
    [t('rowGuests'), String(booking.partySize)],
    [t('rowAddress'), `${restaurant.address}, ${restaurant.city}`],
    [t('rowPhone'), restaurant.phone],
  ];

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 pt-8 pb-16">
        <nav aria-label={t('breadcrumbLabel')} className="flex items-center gap-3 text-sm">
          <Link
            href="/bookings"
            className="flex items-center gap-2 text-orange-500 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            {t('title')}
          </Link>
          <span className="text-neutral-400">/</span>
          <span className="text-neutral-500">{booking.reference}</span>
        </nav>

        <h1 className="mt-6 text-3xl font-bold">{t('detailTitle')}</h1>
        <p className="mt-1 text-sm text-neutral-500">
          {restaurant.name} · {restaurant.city}
        </p>

        <div className="mt-6 max-w-xl space-y-4">
          <section className="rounded-3xl bg-white p-8 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="rounded-2xl bg-[#FFE3DB] px-8 py-3 text-2xl font-bold tracking-wide text-orange-500">
                {booking.reference}
              </p>
              <StatusBadge status={booking.status} />
            </div>
            <div className="mt-4">
              <DetailRows rows={rows} />
            </div>
          </section>

          <section className="rounded-3xl bg-white p-8 shadow-sm">
            <h2 className="text-lg font-semibold">{t('manageTitle')}</h2>
            <div className="mt-4">
              <BookingActions
                bookingId={booking.id}
                rescheduleHref={{
                  pathname: `/restaurants/${restaurant.id}/book`,
                  query: { reschedule: booking.id },
                }}
                modifiable={isModifiable(booking)}
                layout="stack"
              />
            </div>
            <p className="mt-4 text-sm text-neutral-500">{t('manageHint')}</p>
          </section>
        </div>
      </main>
    </>
  );
}
