import { SECTION_KEYS, type OwnerRestaurant, type SectionKey } from './types';

export type Readiness = {
  done: Record<SectionKey, boolean>;
  missing: SectionKey[];
  readyCount: number;
  total: number;
  // Для публикации нужны часы работы, активный столик и позиция меню (ТЗ, B07).
  // Раздел «Сведения» в проверке публикации не участвует, но входит в обзор.
  canPublish: boolean;
};

export function activeTables(r: OwnerRestaurant) {
  return r.tables.filter((t) => t.active);
}

export function menuItemCount(r: OwnerRestaurant) {
  return r.menu.reduce((n, s) => n + s.items.length, 0);
}

export function getReadiness(r: OwnerRestaurant): Readiness {
  const done: Record<SectionKey, boolean> = {
    details: Boolean(r.name.trim() && r.address.trim() && r.phone.trim()),
    hours: r.hours.length > 0,
    tables: activeTables(r).length > 0,
    menu: menuItemCount(r) > 0,
  };
  const missing = SECTION_KEYS.filter((k) => !done[k]);
  return {
    done,
    missing,
    readyCount: SECTION_KEYS.length - missing.length,
    total: SECTION_KEYS.length,
    canPublish: done.hours && done.tables && done.menu,
  };
}
