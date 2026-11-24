'use server';

import { revalidatePath } from 'next/cache';
import { getLocale } from 'next-intl/server';
import type { ApiProblem } from '@/api/problem';
import type { MenuSection } from '@/mocks/restaurants';
import { getCurrentUser } from '@/features/auth/session';
import { getReadiness } from './readiness';
import {
  getOwnerRestaurant,
  setStatus,
  updateDetails,
  updateHours,
  updateMenu,
  updateTables,
} from './store';
import type {
  DetailsState,
  HoursRow,
  HoursState,
  MenuState,
  OwnerTable,
  TablesState,
} from './types';

// ВРЕМЕННО. Заглушки операций updateRestaurant и setPublication.
// Настоящие проверки и сообщения (RU/EN) будут приходить от API.
const text = {
  ru: {
    validation: 'Проверьте отмеченные поля.',
    required: 'Заполните поле.',
    unauthenticated: 'Войдите, чтобы продолжить.',
    forbidden: 'У вас нет доступа к этому действию.',
    passwordChange: 'Задайте новый пароль, чтобы продолжить.',
    notReady:
      'Перед публикацией добавьте часы работы, активный столик и хотя бы одну позицию меню.',
    invalidTime: 'Закрытие должно быть позже открытия.',
    invalidSeats: 'Вместимость должна быть от 1 до 50.',
    duplicateLabel: 'Метки столиков должны быть уникальными.',
  },
  en: {
    validation: 'Please check the highlighted fields.',
    required: 'Fill in this field.',
    unauthenticated: 'Please sign in to continue.',
    forbidden: "You don't have access to this action.",
    passwordChange: 'Set a new password to continue.',
    notReady: 'Add opening hours, an active table and a menu item before publishing.',
    invalidTime: 'Closing must be later than opening.',
    invalidSeats: 'Capacity must be between 1 and 50.',
    duplicateLabel: 'Table labels must be unique.',
  },
};

type Texts = (typeof text)['ru'];

// Права: действия доступны только владельцу, сменившему временный пароль
async function ownerGate(tx: Texts): Promise<ApiProblem | null> {
  const user = await getCurrentUser();
  if (!user) return { code: 'UNAUTHENTICATED', title: tx.unauthenticated };
  if (user.role !== 'OWNER') return { code: 'FORBIDDEN', title: tx.forbidden };
  if (user.mustChangePassword) {
    return { code: 'PASSWORD_CHANGE_REQUIRED', title: tx.passwordChange };
  }
  return null;
}

const field = (fd: FormData, name: string) => String(fd.get(name) ?? '').trim();

export async function saveDetailsAction(
  _prev: DetailsState,
  formData: FormData,
): Promise<DetailsState> {
  const locale = await getLocale();
  const tx = text[locale === 'en' ? 'en' : 'ru'];

  const values = {
    name: field(formData, 'name'),
    description: field(formData, 'description'),
    address: field(formData, 'address'),
    phone: field(formData, 'phone'),
  };

  const denied = await ownerGate(tx);
  if (denied) return { values, saved: false, problem: denied };

  const fieldErrors: Record<string, string> = {};
  if (!values.name) fieldErrors.name = tx.required;
  if (!values.address) fieldErrors.address = tx.required;
  if (!values.phone) fieldErrors.phone = tx.required;
  if (Object.keys(fieldErrors).length > 0) {
    return {
      values,
      saved: false,
      problem: { code: 'VALIDATION_FAILED', title: tx.validation, fieldErrors },
    };
  }

  await new Promise((resolve) => setTimeout(resolve, 400));
  updateDetails(values);
  revalidatePath('/', 'layout');
  return { values, saved: true, problem: null };
}

export async function setPublicationAction(input: {
  published: boolean;
}): Promise<{ problem: ApiProblem | null }> {
  const locale = await getLocale();
  const tx = text[locale === 'en' ? 'en' : 'ru'];

  const denied = await ownerGate(tx);
  if (denied) return { problem: denied };

  // Снять с публикации можно всегда, опубликовать только готовый ресторан
  if (input.published && !getReadiness(getOwnerRestaurant()).canPublish) {
    return { problem: { code: 'RESTAURANT_NOT_READY', title: tx.notReady } };
  }

  await new Promise((resolve) => setTimeout(resolve, 400));
  setStatus(input.published ? 'PUBLISHED' : 'HIDDEN');
  revalidatePath('/', 'layout');
  return { problem: null };
}

// --- A4: Часы работы ---
export async function saveHoursAction(rows: HoursRow[]): Promise<HoursState> {
  const locale = await getLocale();
  const tx = text[locale === 'en' ? 'en' : 'ru'];

  const denied = await ownerGate(tx);
  if (denied) return { saved: false, problem: denied };

  // Проверяем только рабочие дни: закрытие > открытие
  for (const row of rows) {
    if (!row.open) continue;
    if (row.closes <= row.opens) {
      return { saved: false, problem: { code: 'VALIDATION_FAILED', title: tx.invalidTime } };
    }
  }

  await new Promise((resolve) => setTimeout(resolve, 400));
  updateHours(
    rows.filter((r) => r.open).map((r) => ({ day: r.day, opens: r.opens, closes: r.closes })),
  );
  revalidatePath('/', 'layout');
  return { saved: true, problem: null };
}

// --- A5: Столики ---
export async function saveTablesAction(tables: OwnerTable[]): Promise<TablesState> {
  const locale = await getLocale();
  const tx = text[locale === 'en' ? 'en' : 'ru'];

  const denied = await ownerGate(tx);
  if (denied) return { saved: false, problem: denied };

  for (const t of tables) {
    if (t.seats < 1 || t.seats > 50) {
      return { saved: false, problem: { code: 'VALIDATION_FAILED', title: tx.invalidSeats } };
    }
  }
  const labels = tables.map((t) => t.label.trim().toLowerCase());
  if (new Set(labels).size !== labels.length) {
    return { saved: false, problem: { code: 'VALIDATION_FAILED', title: tx.duplicateLabel } };
  }

  await new Promise((resolve) => setTimeout(resolve, 400));
  updateTables(tables);
  revalidatePath('/', 'layout');
  return { saved: true, problem: null };
}

// --- A6: Меню ---
export async function saveMenuAction(sections: MenuSection[]): Promise<MenuState> {
  const locale = await getLocale();
  const tx = text[locale === 'en' ? 'en' : 'ru'];

  const denied = await ownerGate(tx);
  if (denied) return { saved: false, problem: denied };

  await new Promise((resolve) => setTimeout(resolve, 400));
  updateMenu(sections);
  revalidatePath('/', 'layout');
  return { saved: true, problem: null };
}
