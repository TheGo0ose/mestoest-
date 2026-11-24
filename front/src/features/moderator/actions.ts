'use server';

import { moderatorGate } from './gate';
import {
  toggleUserStatus,
  createOwnerAccount,
  listPlatformUsers,
  createPlatformRestaurant,
} from './moderatorStore';
import { getCurrentUser } from '@/features/auth/session';
import type { ApiProblem } from '@/api/problem';
import type { CreateOwnerResult, PlatformRestaurant } from './moderator';

// ─── Toggle user status ───────────────────────────────────

export async function toggleUserStatusAction(
  locale: string,
  userId: string,
): Promise<{ ok: boolean; problem?: ApiProblem }> {
  const problem = await moderatorGate(locale);
  if (problem) return { ok: false, problem };

  const me = await getCurrentUser();
  const all = listPlatformUsers();
  const target = all.find((u) => u.id === userId);
  if (!target) {
    return {
      ok: false,
      problem: { code: 'NOT_FOUND', title: 'User not found' },
    };
  }

  // Нельзя отключить самого себя
  if (
    me &&
    (target.email.toLowerCase() === me.email.toLowerCase() ||
      (target.id === 'mod-1' &&
        me.role === 'MODERATOR' &&
        !all.some((u) => u.email.toLowerCase() === me.email.toLowerCase())))
  ) {
    return {
      ok: false,
      problem: { code: 'FORBIDDEN', title: 'Cannot disable own account' },
    };
  }

  const updated = toggleUserStatus(userId);
  if (!updated) {
    return {
      ok: false,
      problem: { code: 'NOT_FOUND', title: 'User not found' },
    };
  }
  return { ok: true };
}

// ─── Create owner account ─────────────────────────────────

type CreateOwnerInput = {
  displayName: string;
  email: string;
  phone?: string;
  locale: 'ru' | 'en';
};

export async function createOwnerAction(
  locale: string,
  input: CreateOwnerInput,
): Promise<{ ok: boolean; result?: CreateOwnerResult; problem?: ApiProblem }> {
  const problem = await moderatorGate(locale);
  if (problem) return { ok: false, problem };

  const fieldErrors: Record<string, string> = {};
  if (!input.displayName.trim()) fieldErrors.displayName = 'Required';
  if (!input.email.trim()) fieldErrors.email = 'Required';
  if (input.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) {
    fieldErrors.email = 'Invalid email';
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      problem: { code: 'VALIDATION', title: 'Validation failed', fieldErrors },
    };
  }

  const result = createOwnerAccount({
    displayName: input.displayName.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone?.trim() || undefined,
    locale: input.locale,
  });

  return { ok: true, result };
}

// ─── Create restaurant draft ──────────────────────────────

type CreateRestaurantInput = {
  name: string;
  city: string;
  address: string;
  phone: string;
  ownerId: string;
  description?: string;
};

export async function createRestaurantAction(
  locale: string,
  input: CreateRestaurantInput,
): Promise<{ ok: boolean; restaurant?: PlatformRestaurant; problem?: ApiProblem }> {
  const problem = await moderatorGate(locale);
  if (problem) return { ok: false, problem };

  const fieldErrors: Record<string, string> = {};
  if (!input.name.trim()) fieldErrors.name = 'Required';
  if (!input.city.trim()) fieldErrors.city = 'Required';
  if (!input.address.trim()) fieldErrors.address = 'Required';
  if (!input.phone.trim()) fieldErrors.phone = 'Required';
  if (!input.ownerId.trim()) fieldErrors.ownerId = 'Required';

  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      problem: { code: 'VALIDATION', title: 'Validation failed', fieldErrors },
    };
  }

  const restaurant = createPlatformRestaurant({
    name: input.name.trim(),
    city: input.city.trim(),
    address: input.address.trim(),
    phone: input.phone.trim(),
    ownerId: input.ownerId.trim(),
    description: input.description?.trim() || undefined,
  });

  return { ok: true, restaurant };
}
