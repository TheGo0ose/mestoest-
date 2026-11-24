import type { LucideIcon } from 'lucide-react';
import { Users, Store, BarChart3 } from 'lucide-react';

// Разделы кабинета модератора (M1–M2 и будущие)
export type ModeratorSection = 'users' | 'restaurants' | 'stats';

export const MODERATOR_SECTIONS: ModeratorSection[] = ['users', 'restaurants', 'stats'];

export const MODERATOR_META: Record<
  ModeratorSection,
  { href: string; icon: LucideIcon; nav: string }
> = {
  users: { href: '/admin/users', icon: Users, nav: 'navUsers' },
  restaurants: { href: '/admin/restaurants', icon: Store, nav: 'navRestaurants' },
  stats: { href: '/admin/stats', icon: BarChart3, nav: 'navStats' },
};

// Пользователь платформы (виден модератору)
export type PlatformUser = {
  id: string;
  displayName: string;
  email: string;
  phone?: string;
  role: 'CUSTOMER' | 'OWNER' | 'MODERATOR';
  status: 'ACTIVE' | 'DISABLED';
  locale: 'ru' | 'en';
};

// Результат создания владельца
export type CreateOwnerResult = {
  user: PlatformUser;
  tempPassword: string;
};

// Ресторан платформы (виден модератору)
export type PlatformRestaurant = {
  id: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  description?: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  status: 'DRAFT' | 'PUBLISHED' | 'HIDDEN';
  createdAt: string;
};
