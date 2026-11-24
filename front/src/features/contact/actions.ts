'use server';

import { getLocale } from 'next-intl/server';
import { fetchRestaurant } from '@/features/restaurants/data';
import { addContactRequest, rateLimitRetryAfter } from './store';
import type { ContactState } from './types';

// ВРЕМЕННО. Заглушка операции createContactRequest.
// Настоящие проверки и сообщения (RU/EN) будут приходить от API.
const text = {
  ru: {
    validation: 'Проверьте отмеченные поля.',
    required: 'Заполните поле.',
    needContact: 'Укажите телефон или email.',
    consent: 'Чтобы продолжить, дайте согласие на обработку персональных данных.',
    notFound: 'Страница или запись не найдена.',
    rate: (s: number) => `Слишком много попыток. Повторите через ${s} с.`,
  },
  en: {
    validation: 'Please check the highlighted fields.',
    required: 'Fill in this field.',
    needContact: 'Enter a phone number or an email.',
    consent: 'Please agree to the processing of your personal data to continue.',
    notFound: 'This page or item was not found.',
    rate: (s: number) => `Too many attempts. Please try again in ${s} seconds.`,
  },
};

const field = (fd: FormData, name: string) => String(fd.get(name) ?? '').trim();

export async function submitContactRequestAction(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const locale = await getLocale();
  const tx = text[locale === 'en' ? 'en' : 'ru'];

  const restaurantId = field(formData, 'restaurantId');
  const name = field(formData, 'name');
  const phone = field(formData, 'phone');
  const email = field(formData, 'email');
  const message = field(formData, 'message');
  const consent = formData.get('consent') === 'on';
  const values = { name, phone, email, message };

  if (!(await fetchRestaurant(restaurantId))) {
    return { values, sent: false, problem: { code: 'NOT_FOUND', title: tx.notFound } };
  }

  const fieldErrors: Record<string, string> = {};
  if (!name) fieldErrors.name = tx.required;
  if (!message) fieldErrors.message = tx.required;
  if (!phone && !email) {
    fieldErrors.phone = tx.needContact;
    fieldErrors.email = tx.needContact;
  }
  if (Object.keys(fieldErrors).length > 0) {
    return {
      values,
      sent: false,
      problem: { code: 'VALIDATION_FAILED', title: tx.validation, fieldErrors },
    };
  }

  if (!consent) {
    return {
      values,
      sent: false,
      problem: {
        code: 'CONSENT_REQUIRED',
        title: tx.consent,
        fieldErrors: { consent: tx.consent },
      },
    };
  }

  const retryAfter = rateLimitRetryAfter();
  if (retryAfter > 0) {
    return {
      values,
      sent: false,
      problem: { code: 'RATE_LIMITED', title: tx.rate(retryAfter) },
    };
  }

  addContactRequest({ restaurantId, name, phone, email, message });
  return { values: {}, sent: true, problem: null };
}
