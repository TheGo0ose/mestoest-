'use client';

import { useRef, useState } from 'react';
import { Check, Undo2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ApiProblem } from '@/api/problem';
import { ApiMessage } from '@/components/ApiMessage';
import { useRouter } from '@/i18n/navigation';
import { setContactStatusAction } from './cabinetActions';

export function ContactStatusButton({
  id,
  status,
  tab,
  source,
}: {
  id: string;
  status: 'NEW' | 'HANDLED';
  tab: string;
  source: string;
}) {
  const t = useTranslations('cabinet');
  const tw = useTranslations('workspace');
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [problem, setProblem] = useState<ApiProblem | null>(null);
  const busy = useRef(false);

  const toHandled = status === 'NEW';

  async function run() {
    if (busy.current) return;
    busy.current = true;
    setPending(true);
    setProblem(null);
    try {
      const result = await setContactStatusAction({
        id,
        status: toHandled ? 'HANDLED' : 'NEW',
      });
      if (result.problem) {
        setProblem(result.problem);
      } else {
        // Запрос ушёл в другую вкладку: возвращаемся к списку без выбранного id
        const query: Record<string, string> = {};
        if (tab === 'handled') query.tab = 'handled';
        if (source) query.source = source;
        router.replace({ pathname: '/admin/contacts', query });
        router.refresh();
      }
    } catch {
      setProblem({ code: 'NETWORK_ERROR', title: tw('networkError') });
    } finally {
      busy.current = false;
      setPending(false);
    }
  }

  const Icon = toHandled ? Check : Undo2;

  return (
    <div>
      <button
        type="button"
        onClick={run}
        disabled={pending}
        className={`flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold disabled:opacity-60 ${
          toHandled
            ? 'bg-orange-500 text-white hover:bg-orange-600'
            : 'border border-orange-500 text-orange-600 hover:bg-orange-50'
        }`}
      >
        <Icon className="h-4 w-4" aria-hidden />
        {pending ? tw('saving') : toHandled ? t('markHandled') : t('markNew')}
      </button>
      <div aria-live="polite" className="mt-3">
        {problem && <ApiMessage problem={problem} />}
      </div>
    </div>
  );
}
