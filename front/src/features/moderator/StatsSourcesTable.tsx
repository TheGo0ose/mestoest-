'use client';

import { useTranslations } from 'next-intl';
import type { SourceStats } from './stats';

export function StatsSourcesTable({
  sources,
  totalBookings,
  totalConfirmed,
  totalCancelled,
  totalCovers,
}: {
  sources: SourceStats[];
  totalBookings: number;
  totalConfirmed: number;
  totalCancelled: number;
  totalCovers: number;
}) {
  const t = useTranslations('moderator');

  const web = sources.find((s) => s.source === 'WEB');
  const tg = sources.find((s) => s.source === 'TELEGRAM');

  return (
    <section className="rounded-3xl bg-white p-8 shadow-sm">
      <h2 className="text-xl font-semibold text-neutral-900">{t('sourcesTitle')}</h2>

      {/* Горизонтальная шкала распределения источников */}
      <div className="mt-6 flex h-2.5 w-full overflow-hidden rounded-full bg-[#FDE7E0]">
        <div
          style={{ width: `${web?.percent ?? 60}%` }}
          className="h-full rounded-l-full bg-orange-500"
        />
        <div
          style={{ width: `${tg?.percent ?? 40}%` }}
          className="h-full rounded-r-full bg-[#FDE7E0]"
        />
      </div>

      {/* Таблица источников */}
      <div className="mt-8 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-100 text-xs font-medium tracking-wide text-neutral-400 uppercase">
              <th className="pb-3 font-semibold">{t('colSource')}</th>
              <th className="pb-3 text-right font-semibold">{t('colTotal')}</th>
              <th className="pb-3 text-right font-semibold">{t('colConfirmed')}</th>
              <th className="pb-3 text-right font-semibold">{t('colCancelled')}</th>
              <th className="pb-3 text-right font-semibold">{t('colGuests')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {sources.map((s) => {
              const label =
                s.source === 'WEB'
                  ? t('sourceWeb', { percent: s.percent })
                  : t('sourceTelegram', { percent: s.percent });

              return (
                <tr key={s.source} className="hover:bg-neutral-50/50">
                  <td className="py-4 font-medium text-neutral-800">{label}</td>
                  <td className="py-4 text-right text-neutral-700">{s.total}</td>
                  <td className="py-4 text-right text-neutral-700">{s.confirmed}</td>
                  <td className="py-4 text-right text-neutral-700">{s.cancelled}</td>
                  <td className="py-4 text-right text-neutral-700">{s.covers}</td>
                </tr>
              );
            })}

            {/* Итоговая строка */}
            <tr className="border-t-2 border-neutral-200 font-semibold text-neutral-900">
              <td className="py-4">{t('sourceTotal')}</td>
              <td className="py-4 text-right">{totalBookings}</td>
              <td className="py-4 text-right">{totalConfirmed}</td>
              <td className="py-4 text-right">{totalCancelled}</td>
              <td className="py-4 text-right">{totalCovers}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
