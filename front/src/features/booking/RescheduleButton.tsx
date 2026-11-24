'use client';

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { ApiProblem } from '@/api/problem';
import { ApiMessage } from '@/components/ApiMessage';
import { useRouter } from '@/i18n/navigation';
import { rescheduleBookingAction } from './actions';

export function RescheduleButton({
  bookingId,
  startsAt,
}: {
  bookingId: string;
  startsAt: string | null;
}) {
  const t = useTranslations('booking');
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [problem, setProblem] = useState<ApiProblem | null>(null);
  const busy = useRef(false);

  async function run() {
    if (!startsAt || busy.current) return;
    busy.current = true;
    setPending(true);
    setProblem(null);
    let navigating = false;
    try {
      const result = await rescheduleBookingAction({ bookingId, startsAt });
      if (result.booking) {
        navigating = true;
        router.push(`/bookings/${result.booking.id}`);
      } else {
        setProblem(result.problem);
      }
    } catch {
      setProblem({ code: 'NETWORK_ERROR', title: t('networkError') });
    } finally {
      busy.current = navigating;
      if (!navigating) setPending(false);
    }
  }

  return (
    <>
      <div className="mt-4" aria-live="polite">
        {problem && <ApiMessage problem={problem} />}
      </div>
      <button
        type="button"
        onClick={run}
        disabled={!startsAt || pending}
        className="mt-6 w-full rounded-full bg-orange-500 px-5 py-3 text-sm font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-orange-500"
      >
        {pending ? t('rescheduling') : t('rescheduleAction')}
      </button>
    </>
  );
}
