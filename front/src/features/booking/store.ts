import type { ApiProblem } from '@/api/problem';
import { RESTAURANT_UTC_OFFSET, formatTime, todayInRestaurantZone } from '@/lib/time';
import type { Booking, CreateBookingResult } from './types';

// ВРЕМЕННО. Заглушка серверной части: все правила (столик, время, права)
// на самом деле проверяет API. Заменится запросами к /api/v1/bookings.

const SITTING_MS = 120 * 60_000;
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

type Store = { bookings: Booking[]; snapshots: Map<string, Booking> };
const g = globalThis as typeof globalThis & { __tmBookingStore?: Store };

function addDays(date: string, days: number) {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

function seed(): Booking[] {
  const today = todayInRestaurantZone();
  const make = (
    reference: string,
    restaurantId: string,
    days: number,
    time: string,
    partySize: number,
    status: Booking['status'] = 'CONFIRMED',
  ): Booking => {
    const startsAt = `${addDays(today, days)}T${time}:00${RESTAURANT_UTC_OFFSET}`;
    return {
      id: `seed-${reference}`,
      reference,
      restaurantId,
      startsAt,
      endsAt: new Date(new Date(startsAt).getTime() + SITTING_MS).toISOString(),
      partySize,
      status,
    };
  };
  return [
    make('TM-7K3Q9P', '1', 3, '15:30', 1),
    make('TM-2M8R4T', '3', 12, '13:00', 3),
    make('TM-5H2D8W', '2', -9, '19:00', 2),
    make('TM-9C4N6B', '4', -20, '12:30', 4, 'CANCELLED'),
  ];
}

// globalThis, чтобы данные не терялись при горячей перезагрузке в dev
const store: Store = (g.__tmBookingStore ??= { bookings: seed(), snapshots: new Map() });

const messages = {
  ru: {
    notModifiable: 'Это бронирование уже нельзя изменить.',
    noTable: 'На это время нет свободных столиков. Выберите другое время.',
    notFound: 'Страница или запись не найдена.',
    unauthenticated: 'Войдите, чтобы продолжить.',
  },
  en: {
    notModifiable: 'This booking can no longer be changed.',
    noTable: 'No free table at this time. Please choose another time.',
    notFound: 'This page or item was not found.',
    unauthenticated: 'Please sign in to continue.',
  },
};

function text(locale: string) {
  return messages[locale === 'en' ? 'en' : 'ru'];
}

export function unauthenticatedProblem(locale: string): ApiProblem {
  return { code: 'UNAUTHENTICATED', title: text(locale).unauthenticated };
}

function makeReference() {
  for (;;) {
    let ref = 'TM-';
    for (let i = 0; i < 6; i++) ref += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
    if (!store.bookings.some((b) => b.reference === ref)) return ref;
  }
}

// Можно ли менять бронь: подтверждена и ещё не началась
export function isModifiable(b: Booking): boolean {
  return b.status === 'CONFIRMED' && new Date(b.startsAt).getTime() > Date.now();
}

export function listBookings(): Booking[] {
  return store.bookings.map((b) => ({ ...b }));
}

export function getBooking(id: string): Booking | null {
  const b = store.bookings.find((x) => x.id === id);
  return b ? { ...b } : null;
}

// Демо: 20:00 всегда занято, чтобы увидеть ошибку «нет свободного столика»
const isBusy = (startsAt: string) => formatTime(startsAt, 'ru') === '20:00';

export function createBooking(input: {
  restaurantId: string;
  startsAt: string;
  guests: number;
  idempotencyKey: string;
  locale: string;
}): CreateBookingResult {
  // Тот же ключ: возвращаем СОХРАНЁННЫЙ ответ создания, а не текущий статус
  const saved = store.snapshots.get(input.idempotencyKey);
  if (saved) return { booking: { ...saved }, problem: null };

  if (isBusy(input.startsAt)) {
    return {
      booking: null,
      problem: { code: 'BOOKING_NO_AVAILABILITY', title: text(input.locale).noTable },
    };
  }

  const booking: Booking = {
    id: crypto.randomUUID(),
    reference: makeReference(),
    restaurantId: input.restaurantId,
    startsAt: input.startsAt,
    endsAt: new Date(new Date(input.startsAt).getTime() + SITTING_MS).toISOString(),
    partySize: input.guests,
    status: 'CONFIRMED',
  };
  store.bookings.push(booking);
  store.snapshots.set(input.idempotencyKey, { ...booking });
  return { booking: { ...booking }, problem: null };
}

export function cancelBooking(id: string, locale: string): { problem: ApiProblem | null } {
  const b = store.bookings.find((x) => x.id === id);
  if (!b) return { problem: { code: 'NOT_FOUND', title: text(locale).notFound } };
  if (!isModifiable(b)) {
    return { problem: { code: 'BOOKING_NOT_MODIFIABLE', title: text(locale).notModifiable } };
  }
  b.status = 'CANCELLED';
  return { problem: null };
}

export function rescheduleBooking(
  id: string,
  startsAt: string,
  locale: string,
): CreateBookingResult {
  const b = store.bookings.find((x) => x.id === id);
  if (!b) return { booking: null, problem: { code: 'NOT_FOUND', title: text(locale).notFound } };
  if (!isModifiable(b)) {
    return {
      booking: null,
      problem: { code: 'BOOKING_NOT_MODIFIABLE', title: text(locale).notModifiable },
    };
  }
  if (isBusy(startsAt)) {
    return {
      booking: null,
      problem: { code: 'BOOKING_NO_AVAILABILITY', title: text(locale).noTable },
    };
  }
  // Код брони сохраняется, меняется только время
  b.startsAt = startsAt;
  b.endsAt = new Date(new Date(startsAt).getTime() + SITTING_MS).toISOString();
  return { booking: { ...b }, problem: null };
}
