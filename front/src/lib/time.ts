export const RESTAURANT_TIME_ZONE = 'Asia/Bishkek';
export const RESTAURANT_UTC_OFFSET = '+06:00';

function intlLocale(locale: string) {
  return locale === 'en' ? 'en-GB' : 'ru-RU';
}

/** Дата момента в часовом поясе ресторана: 'YYYY-MM-DD' */
export function dateInRestaurantZone(d: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: RESTAURANT_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

/** Сегодняшняя дата в часовом поясе ресторана */
export function todayInRestaurantZone(now: Date = new Date()): string {
  return dateInRestaurantZone(now);
}

/** '2026-10-29T19:00:00+06:00' -> '19:00' (во времени ресторана) */
export function formatTime(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(intlLocale(locale), {
    timeZone: RESTAURANT_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(iso));
}

/** '2026-10-29' -> '29 октября' */
export function formatDateOnly(date: string, locale: string): string {
  const d = new Date(`${date}T12:00:00${RESTAURANT_UTC_OFFSET}`);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat(intlLocale(locale), {
    timeZone: RESTAURANT_TIME_ZONE,
    day: 'numeric',
    month: 'long',
  }).format(d);
}

/** '2026-10-29T19:00:00+06:00' -> '29 октября' */
export function formatDate(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(intlLocale(locale), {
    timeZone: RESTAURANT_TIME_ZONE,
    day: 'numeric',
    month: 'long',
  }).format(new Date(iso));
}
function intlLocaleOf(locale: string) {
  return locale === 'en' ? 'en-GB' : 'ru-RU';
}

function capitalize(s: string) {
  return s.charAt(0).toLocaleUpperCase() + s.slice(1);
}

/** '2026-11-02' + 1 -> '2026-11-03' */
export function addDaysToDate(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** '2026-11-02' -> 'Понедельник, 2 ноября' */
export function formatWeekdayDate(date: string, locale: string): string {
  const d = new Date(`${date}T12:00:00${RESTAURANT_UTC_OFFSET}`);
  if (Number.isNaN(d.getTime())) return '—';
  return capitalize(
    new Intl.DateTimeFormat(intlLocaleOf(locale), {
      timeZone: RESTAURANT_TIME_ZONE,
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(d),
  );
}

/** ISO -> '2 нояб · 13:42' */
export function formatShortDateTime(iso: string, locale: string): string {
  const day = new Intl.DateTimeFormat(intlLocaleOf(locale), {
    timeZone: RESTAURANT_TIME_ZONE,
    day: 'numeric',
    month: 'short',
  })
    .format(new Date(iso))
    .replace('.', '');
  return `${day} · ${formatTime(iso, locale)}`;
}

/** ISO -> '2 ноября 2026, 13:42' */
export function formatFullDateTime(iso: string, locale: string): string {
  const day = new Intl.DateTimeFormat(intlLocaleOf(locale), {
    timeZone: RESTAURANT_TIME_ZONE,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
    .format(new Date(iso))
    .replace(/\s?г\.$/, '');
  return `${day}, ${formatTime(iso, locale)}`;
}

/** Текущий момент в миллисекундах. Вынесено в функцию, чтобы страница не вызывала Date.now() прямо при отрисовке */
export function nowMs(): number {
  return Date.now();
}
