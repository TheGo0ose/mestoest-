'use client';

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { ApiProblem } from '@/api/problem';
import { useRouter } from '@/i18n/navigation';
import { cancelOwnerBookingAction } from './cabinetActions';

// Отмена по звонку гостя. Перед отменой просим подтвердить: действие нельзя вернуть.
export function CancelBookingButton({
  bookingId,
  reference,
}: {
  bookingId: string;
  reference: string;
}) {
  const t = useTranslations('workspace');
  const tc = useTranslations('cabinet');
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [problem, setProblem] = useState<ApiProblem | null>(null);
  const busy = useRef(false);

  async function cancel() {
    if (busy.current) return;
    busy.current = true;
    setPending(true);
    setProblem(null);
    try {
      const result = await cancelOwnerBookingAction(bookingId);
      if (result.problem) setProblem(result.problem);
      else setConfirming(false);
      router.refresh(); // список перечитается: статус станет «Отменена»
    } catch {
      setProblem({ code: 'NETWORK_ERROR', title: t('networkError') });
    } finally {
      busy.current = false;
      setPending(false);
    }
  }

  if (!confirming) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setConfirming(true)}
          aria-label={`${tc('actionCancel')} ${reference}`}
          className="text-xs font-semibold text-orange-600 hover:underline"
        >
          {tc('actionCancel')}
        </button>
        {problem && <p className="mt-1 text-xs text-[#B8432B]">{problem.title}</p>}
      </div>
    );
  }

  return (
    <div role="group" aria-label={t('cancelQuestion', { ref: reference })} className="space-y-2">
      <p className="text-xs font-semibold">{t('cancelQuestion', { ref: reference })}</p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={cancel}
          disabled={pending}
          className="rounded-full bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
        >
          {pending ? t('cancelling') : t('cancelYes')}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={pending}
          className="rounded-full border border-neutral-300 px-3 py-1.5 text-xs font-semibold hover:bg-neutral-50 disabled:opacity-60"
        >
          {t('cancelKeep')}
        </button>
      </div>
      {problem && <p className="text-xs text-[#B8432B]">{problem.title}</p>}
    </div>
  );
}
