// ВРЕМЕННО. Заглушка серверной части. Лимит и хранение на самом деле делает API
// (5 запросов в час на IP или на пользователя Telegram). Здесь лимит общий.

import { RESTAURANT_UTC_OFFSET, addDaysToDate, todayInRestaurantZone } from '@/lib/time';

export type ContactRequest = {
  id: string;
  restaurantId: string;
  name: string;
  phone: string;
  email: string;
  message: string;
  source: 'WEB' | 'TELEGRAM';
  status: 'NEW' | 'HANDLED';
  createdAt: string;
  handledAt?: string; // когда отмечен обработанным
};

type Db = { items: ContactRequest[]; sentAt: number[] };
const g = globalThis as typeof globalThis & { __tmContacts?: Db };

// Демонстрационные запросы для кабинета владельца (экран A8). Все данные вымышленные.
function seed(): ContactRequest[] {
  const today = todayInRestaurantZone();
  const at = (daysAgo: number, time: string) =>
    new Date(`${addDaysToDate(today, -daysAgo)}T${time}:00${RESTAURANT_UTC_OFFSET}`).toISOString();
  const make = (
    n: number,
    name: string,
    phone: string,
    message: string,
    source: ContactRequest['source'],
    createdAt: string,
    handledAt?: string,
  ): ContactRequest => ({
    id: `seed-contact-${n}`,
    restaurantId: '1',
    name,
    phone,
    email: '',
    message,
    source,
    status: handledAt ? 'HANDLED' : 'NEW',
    createdAt,
    handledAt,
  });
  return [
    make(
      1,
      'Алина Белова',
      '+996 700 000 105',
      'Здравствуйте! Подскажите, пожалуйста, до скольки вы работаете в воскресенье? Хотим зайти вечером после прогулки.',
      'WEB',
      at(0, '13:42'),
    ),
    make(
      2,
      'Данияр Асанов',
      '+996 700 000 104',
      'Добрый день! Есть ли вегетарианские позиции? Приедем компанией, нужно знать заранее.',
      'TELEGRAM',
      at(0, '11:18'),
    ),
    make(
      3,
      'Элина Ким',
      '+996 700 000 107',
      'Подскажите, как добраться до ресторана на общественном транспорте? Какой маршрут ближайший?',
      'WEB',
      at(1, '18:30'),
    ),
    make(
      4,
      'Марат Алиев',
      '+996 700 000 108',
      'Можно ли прийти с детьми? Есть ли детское кресло?',
      'WEB',
      at(3, '09:15'),
      at(2, '10:05'),
    ),
  ];
}

const db: Db = (g.__tmContacts ??= { items: seed(), sentAt: [] });

const LIMIT = 5;
const WINDOW_MS = 60 * 60_000;

/** Через сколько секунд можно повторить; 0, если можно сейчас */
export function rateLimitRetryAfter(now = Date.now()): number {
  db.sentAt = db.sentAt.filter((t) => now - t < WINDOW_MS);
  if (db.sentAt.length < LIMIT) return 0;
  return Math.ceil((db.sentAt[0] + WINDOW_MS - now) / 1000);
}

export function addContactRequest(
  input: Omit<ContactRequest, 'id' | 'source' | 'status' | 'createdAt'>,
): ContactRequest {
  const item: ContactRequest = {
    ...input,
    id: crypto.randomUUID(),
    source: 'WEB',
    status: 'NEW',
    createdAt: new Date().toISOString(),
  };
  db.items.push(item);
  db.sentAt.push(Date.now());
  return item;
}

export function listContactRequests(): ContactRequest[] {
  return db.items.map((i) => ({ ...i }));
}

/** Переключает NEW и HANDLED: время обработки ставится или очищается (ТЗ, updateContactRequest) */
export function setContactStatus(id: string, status: ContactRequest['status']): boolean {
  const item = db.items.find((i) => i.id === id);
  if (!item) return false;
  item.status = status;
  item.handledAt = status === 'HANDLED' ? new Date().toISOString() : undefined;
  return true;
}
