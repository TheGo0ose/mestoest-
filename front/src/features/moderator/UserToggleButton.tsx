'use client';

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { ApiProblem } from '@/api/problem';
import { useRouter } from '@/i18n/navigation';
import { toggleUserStatusAction } from './actions';

export function UserToggleButton({
  userId,
  userName,
  status,
  locale,
}: {
  userId: string;
  userName: string;
  status: 'ACTIVE' | 'DISABLED';
  locale: string;
}) {
  const t = useTranslations('moderator');
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [problem, setProblem] = useState<ApiProblem | null>(null);
  const busy = useRef(false);

  const isActive = status === 'ACTIVE';

  async function handleToggle() {
    if (busy.current) return;
    busy.current = true;
    setPending(true);
    setProblem(null);
    try {
      const result = await toggleUserStatusAction(locale, userId);
      if (result.problem) {
        setProblem(result.problem);
      } else {
        setConfirming(false);
        router.refresh();
      }
    } catch {
      setProblem({ code: 'NETWORK_ERROR', title: 'Network error' });
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
          onClick={() => {
            setProblem(null);
            setConfirming(true);
          }}
          className="text-xs font-semibold text-orange-600 hover:underline"
        >
          {isActive ? t('actionDisable') : t('actionEnable')}
        </button>
        {problem && <p className="mt-1 text-xs text-[#B8432B]">{problem.title}</p>}
      </div>
    );
  }

  return (
    <div
      role="group"
      aria-label={
        isActive
          ? t('disableQuestion', { name: userName })
          : t('enableQuestion', { name: userName })
      }
      className="space-y-1.5"
    >
      <p className="text-xs font-semibold text-neutral-800">
        {isActive
          ? t('disableQuestion', { name: userName })
          : t('enableQuestion', { name: userName })}
      </p>
      <p className="text-[11px] text-neutral-500">
        {isActive ? t('disableNote') : t('enableNote')}
      </p>
      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={handleToggle}
          disabled={pending}
          className="rounded-full bg-orange-500 px-3 py-1 text-xs font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
        >
          {pending
            ? isActive
              ? t('disabling')
              : t('enabling')
            : isActive
              ? t('disableYes')
              : t('enableYes')}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={pending}
          className="rounded-full border border-neutral-300 px-3 py-1 text-xs font-semibold hover:bg-neutral-50 disabled:opacity-60"
        >
          {isActive ? t('disableKeep') : t('enableKeep')}
        </button>
      </div>
      {problem && <p className="text-xs text-[#B8432B]">{problem.title}</p>}
    </div>
  );
}
