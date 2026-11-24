import { RESTAURANT_TIME_ZONE, RESTAURANT_UTC_OFFSET, todayInRestaurantZone } from '@/lib/time';
import type { AvailabilityResult } from './types';

// ВРЕМЕННО. Это замена операции getAvailability.
// Все правила ниже по ТЗ считает API, а не браузер. Когда появится бэк,
// тело функции заменится запросом через сгенерированный клиент,
// а компоненты останутся без изменений.

const OPENS = 10 * 60;
const CLOSES = 23 * 60;
const SITTING = 120;
const STEP = 30;
const MIN_LEAD = 60;
const MAX_DAYS = 60;
const MAX_GUESTS = 6;

const messages = {
  ru: {
    partySize: `В одном бронировании может быть не более ${MAX_GUESTS} гостей.`,
    tooFar: `Бронировать можно максимум на ${MAX_DAYS} дн. вперёд.`,
  },
  en: {
    partySize: `We can seat at most ${MAX_GUESTS} guests per booking.`,
    tooFar: `You can book at most ${MAX_DAYS} days ahead.`,
  },
};

const pad = (n: number) => String(n).padStart(2, '0');

function dayNumber(date: string) {
  const [y, m, d] = date.split('-').map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
}

function minutesNowInZone(now: Date) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: RESTAURANT_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const h = Number(parts.find((p) => p.type === 'hour')?.value);
  const m = Number(parts.find((p) => p.type === 'minute')?.value);
  return h * 60 + m;
}

export async function fetchAvailability(params: {
  restaurantId: string;
  date: string; // 'YYYY-MM-DD'
  guests: number;
  locale: string;
}): Promise<AvailabilityResult> {
  const { date, guests, locale } = params;
  await new Promise((resolve) => setTimeout(resolve, 400)); // чтобы было видно «загрузку»

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { slots: [], problem: null };

  const text = messages[locale === 'en' ? 'en' : 'ru'];
  const daysAhead = dayNumber(date) - dayNumber(todayInRestaurantZone());

  if (guests > MAX_GUESTS) {
    return { slots: [], problem: { code: 'BOOKING_PARTY_SIZE', title: text.partySize } };
  }
  if (daysAhead > MAX_DAYS) {
    return { slots: [], problem: { code: 'BOOKING_TOO_FAR', title: text.tooFar } };
  }

  // Демо-поведение, чтобы увидеть все состояния экрана:
  // 6 гостей: свободного времени нет; 5 гостей: вечер занят
  if (daysAhead < 0 || guests === 6) return { slots: [], problem: null };

  const nowMinutes = minutesNowInZone(new Date());
  const slots: string[] = [];
  for (let t = OPENS; t <= CLOSES - SITTING; t += STEP) {
    if (daysAhead === 0 && t < nowMinutes + MIN_LEAD) continue;
    if (guests === 5 && t >= 19 * 60 && t < 21 * 60) continue;
    slots.push(`${date}T${pad(Math.floor(t / 60))}:${pad(t % 60)}:00${RESTAURANT_UTC_OFFSET}`);
  }
  return { slots, problem: null };
}
