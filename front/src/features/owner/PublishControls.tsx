'use client';

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { ApiProblem } from '@/api/problem';
import { ApiMessage } from '@/components/ApiMessage';
import { useRouter } from '@/i18n/navigation';
import { setPublicationAction } from './actions';
import type { RestaurantStatus } from './types';

export function PublishControls({
  status,
  canPublish,
}: {
  status: RestaurantStatus;
  canPublish: boolean;
}) {
  const t = useTranslations('panel');
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [problem, setProblem] = useState<ApiProblem | null>(null);
  const busy = useRef(false);

  const published = status === 'PUBLISHED';

  async function run() {
    if (busy.current) return;
    busy.current = true;
    setPending(true);
    setProblem(null);
    try {
      const result = await setPublicationAction({ published: !published });
      if (result.problem) setProblem(result.problem);
      router.refresh(); // страница перечитает статус и готовность
    } catch {
      setProblem({ code: 'NETWORK_ERROR', title: t('networkError') });
    } finally {
      busy.current = false;
      setPending(false);
    }
  }

  let label: string;
  if (published) label = pending ? t('unpublishing') : t('unpublish');
  else if (status === 'HIDDEN') label = pending ? t('publishing') : t('republish');
  else label = pending ? t('publishing') : t('publish');

  const className = published
    ? 'rounded-full border border-orange-500 px-6 py-3 text-sm font-semibold text-orange-600 hover:bg-orange-50 disabled:opacity-60'
    : 'rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-500';

  return (
    <div className="flex flex-col items-start gap-3 sm:items-end">
      <button
        type="button"
        onClick={run}
        disabled={pending || (!published && !canPublish)}
        className={className}
      >
        {label}
      </button>
      <div aria-live="polite" className="w-full">
        {problem && <ApiMessage problem={problem} />}
      </div>
    </div>
  );
}
