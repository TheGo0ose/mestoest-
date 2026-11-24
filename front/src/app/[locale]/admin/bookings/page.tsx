import { getTranslations, setRequestLocale } from 'next-intl/server';
import { requireStaff } from '@/features/auth/guard';
import { BookingFilters } from '@/features/owner/BookingFilters';
import { CabinetShell } from '@/features/owner/CabinetShell';
import { getOwnerBookings } from '@/features/owner/cabinetStore';
import { CancelBookingButton } from '@/features/owner/CancelBookingButton';
import { fetchManagedRestaurant } from '@/features/restaurants/data';
import { redirect } from '@/i18n/navigation';
import {
  dateInRestaurantZone,
  formatDateOnly,
  formatTime,
  formatWeekdayDate,
  nowMs,
  todayInRestaurantZone,
} from '@/lib/time';

type SearchParams = {
  date?: string | string[];
  status?: string | string[];
  source?: string | string[];
};

const one = (v: string | string[] | undefined) => (typeof v === 'string' ? v : '');

const COLUMNS = 'md:grid-cols-[150px_1.3fr_110px_100px_150px_1fr]';

export default async function OwnerBookingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireStaff(locale, '/admin/bookings');
  if (user.role !== 'OWNER') redirect({ href: '/admin', locale });

  const sp = await searchParams;
  const today = todayInRestaurantZone();
  const date = /^\d{4}-\d{2}-\d{2}$/.test(one(sp.date)) ? one(sp.date) : today;
  const status = ['CONFIRMED', 'CANCELLED'].includes(one(sp.status)) ? one(sp.status) : '';
  const source = ['WEB', 'TELEGRAM'].includes(one(sp.source)) ? one(sp.source) : '';

  const t = await getTranslations('cabinet');
  const tw = await getTranslations('workspace');
  const restaurant = await fetchManagedRestaurant();

  // Все брони выбранного дня этого ресторана, по времени начала
  const day = getOwnerBookings()
    .filter(
      (b) =>
        b.restaurantId === restaurant.id && dateInRestaurantZone(new Date(b.startsAt)) === date,
    )
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());

  const confirmed = day.filter((b) => b.status === 'CONFIRMED');
  const cancelled = day.filter((b) => b.status === 'CANCELLED');
  const confirmedGuests = confirmed.reduce((n, b) => n + b.partySize, 0);
  const web = day.filter((b) => b.source === 'WEB').length;
  const telegram = day.filter((b) => b.source === 'TELEGRAM').length;

  const shown = day.filter(
    (b) => (!status || b.status === status) && (!source || b.source === source),
  );
  const filtered = Boolean(status || source);
  const isToday = date === today;
  const now = nowMs();

  const stats = [
    { label: t('totalBookings'), value: day.length, hint: t('totalBookingsHint') },
    {
      label: t('confirmed'),
      value: confirmed.length,
      hint: tw('confirmedGuests', { guests: confirmedGuests }),
    },
    { label: t('cancelled'), value: cancelled.length, hint: t('cancelledHint') },
  ];

  return (
    <CabinetShell restaurant={restaurant} active="bookings">
      <p className="text-xs font-semibold tracking-wide text-orange-500 uppercase">{t('label')}</p>
      <h1 className="mt-5 text-4xl font-bold">{t('bookingsTitle')}</h1>
      <p className="mt-3 text-neutral-500">{t('bookingsSubtitle')}</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <section key={s.label} className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-sm text-neutral-500">{s.label}</p>
            <p className="mt-3 text-4xl font-bold">{s.value}</p>
            <p className="mt-3 text-xs text-neutral-500">{s.hint}</p>
          </section>
        ))}
      </div>

      <div className="mt-6">
        <BookingFilters
          restaurantName={restaurant.name}
          date={date}
          status={status}
          source={source}
        />
      </div>

      <section className="mt-6 rounded-3xl bg-white p-8 shadow-sm">
        <h2 className="text-xl font-semibold">
          {isToday ? t('todayTitle') : tw('dayTitle', { date: formatDateOnly(date, locale) })}
        </h2>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-neutral-500">
            {isToday
              ? t('todaySubtitle', {
                  day: formatWeekdayDate(date, locale),
                  time: formatTime(new Date(now).toISOString(), locale),
                })
              : formatWeekdayDate(date, locale)}
          </p>
          <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-600">
            {t('bookingsCount', { count: shown.length })}
          </span>
        </div>

        {shown.length === 0 ? (
          <p className="mt-8 rounded-2xl bg-neutral-50 p-6 text-center text-neutral-500">
            {filtered && day.length > 0 ? tw('emptyFiltered') : tw('emptyDay')}
          </p>
        ) : (
          <>
            <div
              className={`mt-8 hidden gap-4 border-b border-neutral-200 pb-3 text-xs font-medium tracking-wide text-neutral-500 uppercase md:grid ${COLUMNS}`}
            >
              <span>{t('colRef')}</span>
              <span>{t('colGuest')}</span>
              <span>{t('colSeating')}</span>
              <span>{t('colSource')}</span>
              <span>{t('colStatus')}</span>
              <span>{t('colActions')}</span>
            </div>

            <ul>
              {shown.map((b) => {
                const started = new Date(b.startsAt).getTime() <= now;
                return (
                  <li
                    key={b.id}
                    className={`grid gap-3 border-b border-neutral-100 py-5 md:items-center md:gap-4 ${COLUMNS}`}
                  >
                    <div>
                      <p className="text-sm font-semibold text-orange-600">{b.reference}</p>
                      <p className="mt-1 text-sm">
                        {formatTime(b.startsAt, locale)}–{formatTime(b.endsAt, locale)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{b.guestName}</p>
                      <p className="mt-1 text-xs text-neutral-500">{b.guestPhone}</p>
                    </div>
                    <div>
                      <p className="text-sm">{t('guests', { count: b.partySize })}</p>
                      <p className="mt-1 text-xs text-neutral-500">{b.tableLabel}</p>
                    </div>
                    <span className="text-xs tracking-wide text-neutral-500">{b.source}</span>
                    <span>
                      <span
                        className={`inline-block rounded-full px-3 py-1.5 text-xs font-semibold ${
                          b.status === 'CONFIRMED'
                            ? 'bg-[#E6F4EA] text-[#1E7B3C]'
                            : 'bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        {b.status === 'CONFIRMED' ? t('statusConfirmed') : t('statusCancelled')}
                      </span>
                    </span>
                    <div className="text-xs">
                      {b.status !== 'CONFIRMED' ? (
                        <span className="text-neutral-400">—</span>
                      ) : started ? (
                        <span className="text-neutral-500">{t('actionStarted')}</span>
                      ) : (
                        <CancelBookingButton bookingId={b.id} reference={b.reference} />
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>

            <p className="mt-6 text-xs text-neutral-500">
              {filtered
                ? tw('shownFiltered', { shown: shown.length, total: day.length })
                : t('shownAll', { count: day.length, web, tg: telegram })}
            </p>
          </>
        )}
      </section>

      <p className="mt-6 text-xs text-neutral-500">{t('bookingsNote')}</p>
    </CabinetShell>
  );
}
