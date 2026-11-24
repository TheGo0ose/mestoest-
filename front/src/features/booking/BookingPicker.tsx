'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { Minus, Plus, RotateCw } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { ApiMessage } from '@/components/ApiMessage';
import { Link } from '@/i18n/navigation';
import { formatDateOnly, formatTime } from '@/lib/time';
import { fetchAvailability } from './availability';
import { BookingSummary, primaryButtonClass } from './BookingSummary';
import { RescheduleButton } from './RescheduleButton';
import type { AvailabilityResult } from './types';

type Props = {
  restaurantId: string;
  restaurantName: string;
  initialDate: string; // 'YYYY-MM-DD', считается на сервере
  initialGuests: number;
  initialSlot: string | null;
  rescheduleBookingId?: string; // если задан, экран работает как перенос
};

export function BookingPicker({
  restaurantId,
  restaurantName,
  initialDate,
  initialGuests,
  initialSlot,
  rescheduleBookingId,
}: Props) {
  const t = useTranslations('booking');
  const locale = useLocale();
  const rescheduling = Boolean(rescheduleBookingId);

  const [date, setDate] = useState(initialDate);
  const [guests, setGuests] = useState(initialGuests);
  const [selected, setSelected] = useState<string | null>(initialSlot);
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ key: string; data: AvailabilityResult | null } | null>(
    null,
  );

  // Ключ запроса: если он изменился, прежний ответ считается устаревшим
  const key = `${restaurantId}|${date}|${guests}|${locale}|${attempt}`;

  useEffect(() => {
    let cancelled = false;
    fetchAvailability({ restaurantId, date, guests, locale })
      .then((data) => {
        if (!cancelled) setResult({ key, data });
      })
      .catch(() => {
        if (!cancelled) setResult({ key, data: null }); // null = запрос не удался
      });
    return () => {
      cancelled = true;
    };
  }, [key, restaurantId, date, guests, locale]);

  const current = result && result.key === key ? result : null;
  const loading = current === null;
  const failed = current !== null && current.data === null;
  const slots = current?.data?.slots ?? [];
  const problem = current?.data?.problem ?? null;

  // Выбранный слот действителен, только если он есть в свежем ответе
  const selectedSlot = selected && slots.includes(selected) ? selected : null;

  let content: ReactNode;
  if (loading) {
    content = <p className="text-neutral-500">{t('loading')}</p>;
  } else if (failed) {
    content = (
      <ApiMessage problem={{ code: 'NETWORK_ERROR', title: t('loadError') }}>
        <button
          type="button"
          onClick={() => setAttempt((a) => a + 1)}
          className="mt-2 flex items-center gap-1 font-medium text-orange-600 hover:underline"
        >
          <RotateCw className="h-3 w-3" aria-hidden />
          {t('retry')}
        </button>
      </ApiMessage>
    );
  } else if (problem) {
    content = <ApiMessage problem={problem} />;
  } else if (slots.length === 0) {
    content = <p className="text-neutral-500">{t('noSlots')}</p>;
  } else {
    content = (
      <ul className="grid grid-cols-4 gap-3 sm:grid-cols-6 md:grid-cols-7">
        {slots.map((slot) => {
          const isSelected = slot === selectedSlot;
          return (
            <li key={slot}>
              <button
                type="button"
                aria-pressed={isSelected}
                onClick={() => setSelected(slot)}
                className={
                  isSelected
                    ? 'w-full rounded-xl bg-orange-500 px-3 py-3 text-sm font-medium text-white'
                    : 'w-full rounded-xl bg-neutral-100 px-3 py-3 text-sm hover:bg-[#FDE7E0]'
                }
              >
                {formatTime(slot, locale)}
              </button>
            </li>
          );
        })}
      </ul>
    );
  }

  const guestButton =
    'flex h-7 w-7 items-center justify-center rounded-full bg-white text-orange-500 shadow-sm disabled:cursor-not-allowed disabled:opacity-40';

  let action: ReactNode;
  if (rescheduleBookingId) {
    action = <RescheduleButton bookingId={rescheduleBookingId} startsAt={selectedSlot} />;
  } else if (selectedSlot) {
    action = (
      <Link
        href={{
          pathname: `/restaurants/${restaurantId}/book/confirm`,
          query: { startsAt: selectedSlot, guests },
        }}
        className={primaryButtonClass}
      >
        {t('continue')}
      </Link>
    );
  } else {
    action = (
      <button
        type="button"
        disabled
        className={`${primaryButtonClass} cursor-not-allowed opacity-50 hover:bg-orange-500`}
      >
        {t('continue')}
      </button>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-white p-8 shadow-sm">
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="booking-date" className="text-sm text-neutral-500">
              {t('date')}
            </label>
            <input
              id="booking-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-2 w-full rounded-2xl bg-neutral-100 px-4 py-3 outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          <div role="group" aria-labelledby="guests-label">
            <span id="guests-label" className="text-sm text-neutral-500">
              {t('guests')}
            </span>
            <div className="mt-2 flex items-center justify-between rounded-2xl bg-neutral-100 px-4 py-3">
              <button
                type="button"
                aria-label={t('guestsDecrease')}
                disabled={rescheduling}
                onClick={() => setGuests((g) => Math.max(1, g - 1))}
                className={guestButton}
              >
                <Minus className="h-3 w-3" aria-hidden />
              </button>
              <output aria-live="polite" className="font-medium">
                {guests}
              </output>
              <button
                type="button"
                aria-label={t('guestsIncrease')}
                disabled={rescheduling}
                onClick={() => setGuests((g) => g + 1)}
                className={guestButton}
              >
                <Plus className="h-3 w-3" aria-hidden />
              </button>
            </div>
          </div>
        </div>

        <h2 className="mt-8 text-lg font-semibold">{t('freeTime')}</h2>
        <div className="mt-4" aria-live="polite">
          {content}
        </div>
        <p className="mt-6 text-sm text-neutral-500">{t('slotsHint')}</p>
      </section>

      <BookingSummary
        restaurantName={restaurantName}
        date={formatDateOnly(date, locale)}
        time={selectedSlot ? formatTime(selectedSlot, locale) : null}
        guests={guests}
        hint={rescheduling ? t('rescheduleHint') : t('autoTable')}
      >
        {action}
      </BookingSummary>
    </div>
  );
}
