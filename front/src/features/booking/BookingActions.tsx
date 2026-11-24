'use client';

import { useState, type ComponentProps } from 'react';
import { CircleAlert } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ApiProblem } from '@/api/problem';
import { ApiMessage } from '@/components/ApiMessage';
import { Link, useRouter } from '@/i18n/navigation';
import { cancelBookingAction } from './actions';

type LinkHref = ComponentProps<typeof Link>['href'];

const base = 'block rounded-full px-6 py-3 text-center text-sm font-semibold';
const primary = `${base} bg-orange-500 text-white hover:bg-orange-600`;
const outline = `${base} border border-orange-500 text-orange-600 hover:bg-orange-50 disabled:opacity-50`;

export function BookingActions({
  bookingId,
  rescheduleHref,
  modifiable,
  layout,
}: {
  bookingId: string;
  rescheduleHref: LinkHref;
  modifiable: boolean;
  layout: 'row' | 'stack'; // row: экран C5, stack: экран C7
}) {
  const t = useTranslations('bookings');
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [problem, setProblem] = useState<ApiProblem | null>(null);

  async function cancel() {
    if (pending) return;
    setPending(true);
    setProblem(null);
    try {
      const result = await cancelBookingAction({ bookingId });
      if (result.problem) setProblem(result.problem);
      else setConfirming(false);
      router.refresh(); // страница перечитает бронь: статус станет «Отменена»
    } catch {
      setProblem({ code: 'NETWORK_ERROR', title: t('networkError') });
    } finally {
      setPending(false);
    }
  }

  if (!modifiable) {
    return <p className="text-sm text-neutral-500">{t('notModifiable')}</p>;
  }

  const stack = layout === 'stack';

  return (
    <div>
      <div className={stack ? 'space-y-3' : 'flex flex-wrap gap-3'}>
        {!stack && (
          <Link href="/bookings" className={`${primary} grow`}>
            {t('toMyBookings')}
          </Link>
        )}
        <Link href={rescheduleHref} className={stack ? primary : outline}>
          {t('reschedule')}
        </Link>
        <button
          type="button"
          onClick={() => setConfirming(true)}
          disabled={confirming}
          className={`${outline} ${stack ? 'w-full' : ''}`}
        >
          {stack ? t('cancelBooking') : t('cancel')}
        </button>
      </div>

      {confirming && (
        <div
          role="group"
          aria-labelledby="cancel-question"
          className="mt-4 max-w-sm rounded-2xl border border-[#FDE7E0] bg-[#FFF7F4] p-4"
        >
          <p id="cancel-question" className="flex items-center gap-2 text-sm font-semibold">
            <CircleAlert className="h-4 w-4 text-orange-500" aria-hidden />
            {t('cancelQuestion')}
          </p>
          <p className="mt-1 text-xs text-neutral-500">{t('cancelNote')}</p>
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={cancel}
              disabled={pending}
              className="rounded-full bg-orange-500 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
            >
              {pending ? t('cancelling') : t('cancelYes')}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={pending}
              className="rounded-full border border-orange-500 px-5 py-2 text-sm font-semibold text-orange-600 hover:bg-orange-50 disabled:opacity-60"
            >
              {t('cancelKeep')}
            </button>
          </div>
        </div>
      )}

      <div className="mt-4" aria-live="polite">
        {problem && <ApiMessage problem={problem} />}
      </div>
    </div>
  );
}
