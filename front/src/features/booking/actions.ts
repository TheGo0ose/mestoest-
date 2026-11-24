'use server';

import { revalidatePath } from 'next/cache';
import { getLocale } from 'next-intl/server';
import { getCurrentUser } from '@/features/auth/session';
import * as store from './store';
import type { CancelBookingResult, CreateBookingResult } from './types';

// ВРЕМЕННО. Заглушки операций createBooking, cancelBooking, rescheduleBooking.
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function createBookingAction(input: {
  restaurantId: string;
  startsAt: string; // ровно так, как его предложил getAvailability
  guests: number;
  idempotencyKey: string;
}): Promise<CreateBookingResult> {
  const locale = await getLocale();
  if (!(await getCurrentUser())) {
    return { booking: null, problem: store.unauthenticatedProblem(locale) };
  }
  await delay(600);
  const result = store.createBooking({ ...input, locale });
  revalidatePath('/', 'layout');
  return result;
}

export async function cancelBookingAction(input: {
  bookingId: string;
}): Promise<CancelBookingResult> {
  const locale = await getLocale();
  if (!(await getCurrentUser())) return { problem: store.unauthenticatedProblem(locale) };
  await delay(400);
  const result = store.cancelBooking(input.bookingId, locale);
  revalidatePath('/', 'layout');
  return result;
}

export async function rescheduleBookingAction(input: {
  bookingId: string;
  startsAt: string;
}): Promise<CreateBookingResult> {
  const locale = await getLocale();
  if (!(await getCurrentUser())) {
    return { booking: null, problem: store.unauthenticatedProblem(locale) };
  }
  await delay(500);
  const result = store.rescheduleBooking(input.bookingId, input.startsAt, locale);
  revalidatePath('/', 'layout');
  return result;
}
