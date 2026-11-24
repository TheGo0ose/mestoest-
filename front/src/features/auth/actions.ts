'use server';

import { cookies } from 'next/headers';
import { getLocale } from 'next-intl/server';
import { redirect } from '@/i18n/navigation';
import { landingPath } from './guard';
import { markPasswordChanged, mustChangePasswordFor, roleFor } from './mockAccounts';
import { MOCK_SESSION_COOKIE, encodeSession, getCurrentUser, type StoredSession } from './session';
import type { AuthState } from './types';

// ВРЕМЕННО. Заглушки операций login, registerCustomer, logout и changePassword.
// Настоящие проверки и сообщения (RU/EN) будут приходить от API.
const text = {
  ru: {
    validation: 'Проверьте отмеченные поля.',
    invalid: 'Неверный email или пароль.',
    taken: 'Аккаунт с таким email уже существует.',
    consent: 'Чтобы продолжить, дайте согласие на обработку персональных данных.',
    required: 'Заполните поле.',
    password: 'Пароль не короче 10 символов.',
    mismatch: 'Пароли не совпадают.',
    currentInvalid: 'Текущий пароль указан неверно.',
    unauthenticated: 'Войдите, чтобы продолжить.',
  },
  en: {
    validation: 'Please check the highlighted fields.',
    invalid: 'Wrong email or password.',
    taken: 'An account with this email already exists.',
    consent: 'Please agree to the processing of your personal data to continue.',
    required: 'Fill in this field.',
    password: 'Password must be at least 10 characters.',
    mismatch: 'The passwords do not match.',
    currentInvalid: 'The current password is wrong.',
    unauthenticated: 'Please sign in to continue.',
  },
};

// Принимаем только внутренние адреса, иначе возможен редирект на чужой сайт
function safeNext(value: FormDataEntryValue | null): string {
  const s = typeof value === 'string' ? value : '';
  return s.startsWith('/') && !s.startsWith('//') && !s.includes('\\') ? s : '/';
}

function nameFromEmail(email: string): string {
  const local = email.split('@')[0] || email;
  return local.charAt(0).toUpperCase() + local.slice(1);
}

async function startSession(session: StoredSession) {
  (await cookies()).set(MOCK_SESSION_COOKIE, encodeSession(session), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
}

function field(formData: FormData, name: string) {
  return String(formData.get(name) ?? '').trim();
}

export async function loginAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const locale = await getLocale();
  const tx = text[locale === 'en' ? 'en' : 'ru'];

  const email = field(formData, 'email');
  const password = String(formData.get('password') ?? '');
  const next = safeNext(formData.get('next'));

  const fieldErrors: Record<string, string> = {};
  if (!email) fieldErrors.email = tx.required;
  if (!password) fieldErrors.password = tx.required;
  if (Object.keys(fieldErrors).length > 0) {
    return {
      values: { email },
      problem: { code: 'VALIDATION_FAILED', title: tx.validation, fieldErrors },
    };
  }

  // Демо-сценарий неверного входа: пароль «wrong»
  if (password === 'wrong') {
    return { values: { email }, problem: { code: 'INVALID_CREDENTIALS', title: tx.invalid } };
  }

  const role = roleFor(email);
  const mustChange = mustChangePasswordFor(email);
  await startSession({ email, name: nameFromEmail(email), role, mustChange });
  redirect({ href: landingPath({ role, mustChangePassword: mustChange }, next), locale });
  return { problem: null, values: {} }; // недостижимо: redirect выше уже прервал функцию
}

export async function registerAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const locale = await getLocale();
  const tx = text[locale === 'en' ? 'en' : 'ru'];

  const displayName = field(formData, 'displayName');
  const email = field(formData, 'email');
  const phone = field(formData, 'phone');
  const password = String(formData.get('password') ?? '');
  const consent = formData.get('consent') === 'on';
  const next = safeNext(formData.get('next'));
  const values = { email, displayName, phone };

  const fieldErrors: Record<string, string> = {};
  if (!displayName) fieldErrors.displayName = tx.required;
  if (!email) fieldErrors.email = tx.required;
  if (!password) fieldErrors.password = tx.required;
  else if (password.length < 10) fieldErrors.password = tx.password;
  if (Object.keys(fieldErrors).length > 0) {
    return { values, problem: { code: 'VALIDATION_FAILED', title: tx.validation, fieldErrors } };
  }

  if (!consent) {
    return {
      values,
      problem: {
        code: 'CONSENT_REQUIRED',
        title: tx.consent,
        fieldErrors: { consent: tx.consent },
      },
    };
  }

  // Демо-сценарий занятого email
  if (email.toLowerCase() === 'taken@example.kg') {
    return {
      values,
      problem: {
        code: 'EMAIL_ALREADY_REGISTERED',
        title: tx.taken,
        fieldErrors: { email: tx.taken },
      },
    };
  }

  // Самостоятельно регистрируются только клиенты
  await startSession({ email, name: displayName, role: 'CUSTOMER', mustChange: false });
  redirect({ href: next, locale });
  return { problem: null, values: {} }; // недостижимо: redirect выше уже прервал функцию
}

export async function changePasswordAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const locale = await getLocale();
  const tx = text[locale === 'en' ? 'en' : 'ru'];

  const user = await getCurrentUser();
  if (!user) {
    return { values: {}, problem: { code: 'UNAUTHENTICATED', title: tx.unauthenticated } };
  }

  const currentPassword = String(formData.get('currentPassword') ?? '');
  const newPassword = String(formData.get('newPassword') ?? '');
  const confirmPassword = String(formData.get('confirmPassword') ?? '');

  const fieldErrors: Record<string, string> = {};
  if (!currentPassword) fieldErrors.currentPassword = tx.required;
  if (!newPassword) fieldErrors.newPassword = tx.required;
  else if (newPassword.length < 10) fieldErrors.newPassword = tx.password;
  if (!confirmPassword) fieldErrors.confirmPassword = tx.required;
  else if (newPassword && confirmPassword !== newPassword) {
    fieldErrors.confirmPassword = tx.mismatch;
  }
  if (Object.keys(fieldErrors).length > 0) {
    return {
      values: {},
      problem: { code: 'VALIDATION_FAILED', title: tx.validation, fieldErrors },
    };
  }

  // Демо-сценарий неверного текущего пароля: «wrong»
  if (currentPassword === 'wrong') {
    return {
      values: {},
      problem: {
        code: 'CURRENT_PASSWORD_INVALID',
        title: tx.currentInvalid,
        fieldErrors: { currentPassword: tx.currentInvalid },
      },
    };
  }

  markPasswordChanged(user.email);
  await startSession({
    email: user.email,
    name: user.displayName,
    role: user.role,
    mustChange: false,
  });
  redirect({ href: '/admin', locale });
  return { problem: null, values: {} }; // недостижимо: redirect выше уже прервал функцию
}

export async function logoutAction(): Promise<void> {
  const locale = await getLocale();
  (await cookies()).delete(MOCK_SESSION_COOKIE);
  redirect({ href: '/', locale });
}
