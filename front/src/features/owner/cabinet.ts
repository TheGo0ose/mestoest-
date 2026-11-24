import type { LucideIcon } from 'lucide-react';
import { CalendarDays, MessageSquare, BarChart3, SlidersHorizontal } from 'lucide-react';

// Разделы рабочего кабинета (A7–A8 и будущие)
export type CabinetSection = 'bookings' | 'contacts' | 'statistics' | 'settings';

export const CABINET_SECTIONS: CabinetSection[] = [
  'bookings',
  'contacts',
  'statistics',
  'settings',
];

export const CABINET_META: Record<CabinetSection, { href: string; icon: LucideIcon; nav: string }> =
  {
    bookings: { href: '/admin/bookings', icon: CalendarDays, nav: 'navBookings' },
    contacts: { href: '/admin/contacts', icon: MessageSquare, nav: 'navContacts' },
    statistics: { href: '/admin/statistics', icon: BarChart3, nav: 'navStats' },
    settings: { href: '/admin', icon: SlidersHorizontal, nav: 'navSettings' },
  };

// Бронирование с точки зрения владельца (данные, видимые в кабинете)
export type OwnerBooking = {
  id: string;
  reference: string; // TM-4N8R2A
  restaurantId: string;
  guestName: string;
  guestPhone: string;
  startsAt: string; // ISO с UTC-offset
  endsAt: string;
  partySize: number;
  tableLabel: string; // «Столик 1»
  source: 'WEB' | 'TELEGRAM';
  status: 'CONFIRMED' | 'CANCELLED';
};
