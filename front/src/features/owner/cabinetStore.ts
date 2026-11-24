import { RESTAURANT_UTC_OFFSET, todayInRestaurantZone } from '@/lib/time';
import type { OwnerBooking } from './cabinet';

// ВРЕМЕННО. Демонстрационные бронирования для экрана A7. Все данные вымышленные.
// Заменятся запросом listRestaurantBookings. Брони клиентов с экрана C4 сюда пока
// не попадают: их сведёт в один список API.

function seed(): OwnerBooking[] {
  const today = todayInRestaurantZone();
  const make = (
    ref: string,
    name: string,
    phone: string,
    from: string,
    to: string,
    party: number,
    table: string,
    source: OwnerBooking['source'],
    status: OwnerBooking['status'] = 'CONFIRMED',
  ): OwnerBooking => ({
    id: `ob-${ref}`,
    reference: ref,
    restaurantId: '1',
    guestName: name,
    guestPhone: phone,
    startsAt: `${today}T${from}:00${RESTAURANT_UTC_OFFSET}`,
    endsAt: `${today}T${to}:00${RESTAURANT_UTC_OFFSET}`,
    partySize: party,
    tableLabel: table,
    source,
    status,
  });

  return [
    make(
      'TM-4N8R2A',
      'Айдана Садыкова',
      '+996 700 000 101',
      '10:00',
      '12:00',
      2,
      'Столик 1',
      'WEB',
    ),
    make(
      'TM-6B2T9K',
      'Тимур Осмонов',
      '+996 700 000 102',
      '12:30',
      '14:30',
      1,
      'Столик 2',
      'TELEGRAM',
    ),
    make('TM-7K3Q9P', 'Яна Мирова', '+996 700 000 103', '15:30', '17:30', 2, 'Столик 1', 'WEB'),
    make(
      'TM-2D5L8M',
      'Данияр Асанов',
      '+996 700 000 104',
      '16:00',
      '18:00',
      2,
      'Столик 2',
      'TELEGRAM',
    ),
    make(
      'TM-9C4F7H',
      'Алина Белова',
      '+996 700 000 105',
      '17:00',
      '19:00',
      2,
      'Столик 3',
      'WEB',
      'CANCELLED',
    ),
    make('TM-3A6P8R', 'Нурлан Токтоев', '+996 700 000 106', '18:00', '20:00', 2, 'Столик 1', 'WEB'),
    make(
      'TM-5M1S4V',
      'Элина Ким',
      '+996 700 000 107',
      '19:00',
      '21:00',
      1,
      'Столик 4',
      'TELEGRAM',
      'CANCELLED',
    ),
    make('TM-8H2W6N', 'Марат Алиев', '+996 700 000 108', '20:30', '22:30', 2, 'Столик 2', 'WEB'),
  ];
}

type Store = { bookings: OwnerBooking[] };
const g = globalThis as typeof globalThis & { __tmCabinetBookings?: Store };
const store: Store = (g.__tmCabinetBookings ??= { bookings: seed() });

export function getOwnerBookings(): OwnerBooking[] {
  return store.bookings.map((b) => ({ ...b }));
}

export type CancelResult = 'ok' | 'not_found' | 'not_modifiable';

/** Отменить можно только подтверждённую бронь до начала (ТЗ: BOOKING_NOT_MODIFIABLE) */
export function cancelOwnerBooking(id: string): CancelResult {
  const b = store.bookings.find((x) => x.id === id);
  if (!b) return 'not_found';
  if (b.status !== 'CONFIRMED' || new Date(b.startsAt).getTime() <= Date.now()) {
    return 'not_modifiable';
  }
  b.status = 'CANCELLED';
  return 'ok';
}
