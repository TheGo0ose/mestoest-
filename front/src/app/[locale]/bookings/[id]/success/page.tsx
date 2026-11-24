import { ArrowLeft, Check } from 'lucide-react';
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

export default async function BookingSuccessPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  await requireUser(locale, `/bookings/${id}/success`);

  const booking = getBooking(id);
  if (!booking) notFound();
  const restaurant = await fetchRestaurant(booking.restaurantId);
  if (!restaurant) notFound();

  const t = await getTranslations('bookings');
  const tr = await getTranslations('restaurant');

  const rows: [string, string][] = [
    [t('rowRestaurant'), restaurant.name],
    [t('rowDate'), formatDate(booking.startsAt, locale)],
    [t('rowTime'), formatTime(booking.startsAt, locale)],
    [t('rowGuests'), String(booking.partySize)],
  ];

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 pt-8 pb-16">
        <Link
          href="/"
          className="flex w-fit items-center gap-2 text-sm text-orange-500 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {tr('breadcrumbBack')}
        </Link>

        <section className="mx-auto mt-16 max-w-[512px] rounded-[32px] bg-white p-8 shadow-sm">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#E6F4EA] text-[#1E7B3C]">
              <Check className="h-6 w-6" aria-hidden />
            </div>
            <h1 className="mt-4 text-2xl font-bold">{t('successTitle')}</h1>
            <p className="mt-6 rounded-2xl bg-[#FFE3DB] px-10 py-3 text-2xl font-bold tracking-wide text-orange-500">
              {booking.reference}
            </p>
          </div>

          <div className="mt-6">
            <DetailRows rows={rows} />
            <div className="flex items-center justify-between gap-4 border-t border-neutral-100 py-4">
              <span className="text-neutral-500">{t('rowStatus')}</span>
              <StatusBadge status={booking.status} />
            </div>
          </div>

          <div className="mt-4">
            <BookingActions
              bookingId={booking.id}
              rescheduleHref={{
                pathname: `/restaurants/${restaurant.id}/book`,
                query: { reschedule: booking.id },
              }}
              modifiable={isModifiable(booking)}
              layout="row"
            />
          </div>
        </section>
      </main>
    </>
  );
}
