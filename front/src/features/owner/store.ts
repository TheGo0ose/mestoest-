import { menu, restaurants } from '@/mocks/restaurants';
import type { MenuSection, OpeningHours } from '@/mocks/restaurants';
import type { DetailsValues, OwnerRestaurant, OwnerTable, RestaurantStatus } from './types';

// ВРЕМЕННО. Заглушка серверной части: ресторан владельца.
// Заменится запросами listManagedRestaurants, updateRestaurant, setPublication.

const SEED_DESCRIPTION =
  'Современная кухня и светлый зал. Светлое место для неспешного обеда и тёплых встреч. Знакомые вкусы в современном прочтении, сезонные овощи и домашние десерты.';

function seed(): OwnerRestaurant {
  const base = restaurants[0];
  return {
    id: base?.id ?? '1',
    city: base?.city ?? '',
    image: base?.image,
    status: 'DRAFT',
    name: base?.name ?? '',
    description: SEED_DESCRIPTION,
    address: base?.address ?? '',
    phone: base?.phone ?? '',
    hours: base ? base.hours.map((h) => ({ ...h })) : [],
    // 4 активных столика по 2 места: «4 активных столика · 8 мест», как на макете A2
    tables: [1, 2, 3, 4].map((n) => ({
      id: `t${n}`,
      label: `Столик ${n}`,
      seats: 2,
      active: true,
    })),
    // Меню: демонстрационные данные (не сохранённые), как на макете A6
    menu,
  };
}

type Store = { restaurant: OwnerRestaurant; menuSaved: boolean };
const g = globalThis as typeof globalThis & { __tmOwnerStore?: Store };

// globalThis, чтобы данные не терялись при горячей перезагрузке в dev
const store: Store = (g.__tmOwnerStore ??= { restaurant: seed(), menuSaved: false });

export function getOwnerRestaurant(): OwnerRestaurant {
  return structuredClone(store.restaurant);
}

export function isMenuSaved(): boolean {
  return store.menuSaved;
}

export function updateDetails(values: DetailsValues) {
  store.restaurant = { ...store.restaurant, ...values };
}

export function setStatus(status: RestaurantStatus) {
  store.restaurant = { ...store.restaurant, status };
}

export function updateHours(hours: OpeningHours[]) {
  store.restaurant = { ...store.restaurant, hours };
}

export function updateTables(tables: OwnerTable[]) {
  store.restaurant = { ...store.restaurant, tables };
}

export function updateMenu(sections: MenuSection[]) {
  store.restaurant = { ...store.restaurant, menu: sections };
  store.menuSaved = true;
}
