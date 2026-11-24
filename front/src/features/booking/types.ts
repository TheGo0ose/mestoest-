import type { ApiProblem } from '@/api/problem';

export type AvailabilityResult = {
  slots: string[]; // startsAt в RFC 3339 со смещением, как отдаёт API
  problem: ApiProblem | null;
};

export type Booking = {
  id: string;
  reference: string; // код вида TM-7K3Q9P
  restaurantId: string;
  startsAt: string;
  endsAt: string;
  partySize: number;
  status: 'CONFIRMED' | 'CANCELLED';
};

export type CreateBookingResult = {
  booking: Booking | null;
  problem: ApiProblem | null;
};

export type CancelBookingResult = {
  problem: ApiProblem | null;
};
