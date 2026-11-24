import type { Role } from './session';

// ВРЕМЕННО. Имитация учётных записей. Роли и временные пароли на самом деле
// хранит API (владельцев создаёт модератор).
const g = globalThis as typeof globalThis & { __tmChangedPasswords?: Set<string> };
const changed = (g.__tmChangedPasswords ??= new Set<string>());

export function roleFor(email: string): Role {
  const e = email.toLowerCase();
  if (/^moderator\d*@tablemint\.local$/.test(e)) return 'MODERATOR';
  if (/^owner\d*@tablemint\.local$/.test(e)) return 'OWNER';
  return 'CUSTOMER';
}

export function mustChangePasswordFor(email: string): boolean {
  return roleFor(email) === 'OWNER' && !changed.has(email.toLowerCase());
}

export function markPasswordChanged(email: string) {
  changed.add(email.toLowerCase());
}
