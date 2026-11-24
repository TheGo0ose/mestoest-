'use server';

import { revalidatePath } from 'next/cache';
import { getLocale } from 'next-intl/server';
import type { ApiProblem } from '@/api/problem';
import { setContactStatus } from '@/features/contact/store';
import { cancelOwnerBooking } from './cabinetStore';
import { ownerGate } from './gate';

// ВРЕМЕННО. Заглушки операций cancelBooking (владелец) и updateContactRequest.
// Сообщения об ошибках на самом деле присылает API на нужном языке.
const text = {
  ru: {
    notFound: 'Страница или запись не найдена.',
    notModifiable: 'Это бронирование уже нельзя изменить.',
  },
  en: {
    notFound: 'This page or item was not found.',
    notModifiable: 'This booking can no longer be changed.',
  },
};

type Result = { problem: ApiProblem | null };

export async function cancelOwnerBookingAction(bookingId: string): Promise<Result> {
  const locale = await getLocale();
  const tx = text[locale === 'en' ? 'en' : 'ru'];

  const denied = await ownerGate(locale);
  if (denied) return { problem: denied };

  await new Promise((resolve) => setTimeout(resolve, 400));
  const result = cancelOwnerBooking(bookingId);
  if (result === 'not_found') return { problem: { code: 'NOT_FOUND', title: tx.notFound } };
  if (result === 'not_modifiable') {
    return { problem: { code: 'BOOKING_NOT_MODIFIABLE', title: tx.notModifiable } };
  }
  revalidatePath('/', 'layout');
  return { problem: null };
}

export async function setContactStatusAction(input: {
  id: string;
  status: 'NEW' | 'HANDLED';
}): Promise<Result> {
  const locale = await getLocale();
  const tx = text[locale === 'en' ? 'en' : 'ru'];

  const denied = await ownerGate(locale);
  if (denied) return { problem: denied };

  await new Promise((resolve) => setTimeout(resolve, 300));
  if (!setContactStatus(input.id, input.status)) {
    return { problem: { code: 'NOT_FOUND', title: tx.notFound } };
  }
  revalidatePath('/', 'layout');
  return { problem: null };
}
