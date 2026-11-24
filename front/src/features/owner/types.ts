import type { ApiProblem } from '@/api/problem';
import type { MenuSection, MenuItem, OpeningHours } from '@/mocks/restaurants';

export type RestaurantStatus = 'DRAFT' | 'PUBLISHED' | 'HIDDEN';

export type SectionKey = 'details' | 'hours' | 'tables' | 'menu';
export const SECTION_KEYS: SectionKey[] = ['details', 'hours', 'tables', 'menu'];

export type OwnerTable = {
  id: string;
  label: string;
  seats: number;
  active: boolean;
};

export type OwnerRestaurant = {
  id: string;
  city: string;
  image?: string;
  status: RestaurantStatus;
  name: string;
  description: string;
  address: string;
  phone: string;
  hours: OpeningHours[];
  tables: OwnerTable[];
  menu: MenuSection[];
};

export type DetailsValues = {
  name: string;
  description: string;
  address: string;
  phone: string;
};

export type DetailsState = {
  problem: ApiProblem | null;
  values: DetailsValues;
  saved: boolean;
};

// --- Hours ---
export type HoursRow = {
  day: number; // 1=Mon … 7=Sun
  open: boolean;
  opens: string; // 'HH:MM'
  closes: string; // 'HH:MM'
};

export type HoursState = {
  problem: ApiProblem | null;
  saved: boolean;
};

// --- Tables ---
export type TablesState = {
  problem: ApiProblem | null;
  saved: boolean;
};

// --- Menu ---
export type MenuItemDraft = MenuItem & { sectionId: string };

export type MenuState = {
  problem: ApiProblem | null;
  saved: boolean;
};
