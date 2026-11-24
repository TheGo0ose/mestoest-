'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { DailyStats } from './stats';

export function ModernDailyBarChart({
  days,
  totalConfirmed,
  totalCancelled,
  totalBookings,
}: {
  days: DailyStats[];
  totalConfirmed: number;
  totalCancelled: number;
  totalBookings: number;
}) {
  const t = useTranslations('moderator');
  const [activeDay, setActiveDay] = useState<DailyStats | null>(null);

  const maxValue = 24; // Верхняя граница шкалы (как на макете)
  const yTicks = [24, 18, 12, 6, 0];

  return (
    <section className="rounded-3xl bg-white p-8 shadow-sm">
      {/* Шапка графика с легендой */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-neutral-900">{t('chartTitle')}</h2>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-full bg-[#E6F4EA] px-3.5 py-1 text-xs font-semibold text-[#1E7B3C]">
            <span className="h-2 w-2 rounded-full bg-[#1E7B3C]" aria-hidden />
            <span>{t('chartLegendConfirmed', { count: totalConfirmed })}</span>
          </div>

          <div className="flex items-center gap-2 rounded-full bg-[#FDE7E0] px-3.5 py-1 text-xs font-semibold text-orange-700">
            <span className="h-2 w-2 rounded-full bg-orange-600" aria-hidden />
            <span>{t('chartLegendCancelled', { count: totalCancelled })}</span>
          </div>
        </div>
      </div>

      {/* Область графика */}
      <div className="relative mt-8">
        {/* Интерактивный тултип при наведении */}
        <div className="h-10">
          {activeDay ? (
            <div className="animate-in fade-in flex flex-wrap items-center gap-4 rounded-xl bg-neutral-900 px-4 py-2 text-xs text-white shadow-lg transition-all duration-150">
              <span className="font-semibold text-neutral-200">{activeDay.fullLabel}</span>
              <span className="text-neutral-400">·</span>
              <span>{t('chartTooltipTotal', { count: activeDay.total })}</span>
              <span className="text-neutral-400">·</span>
              <span className="text-emerald-400">
                {t('chartTooltipConfirmed', { count: activeDay.confirmed })} (
                {Math.round((activeDay.confirmed / activeDay.total) * 100)}%)
              </span>
              <span className="text-neutral-400">·</span>
              <span className="text-orange-400">
                {t('chartTooltipCancelled', { count: activeDay.cancelled })} (
                {Math.round((activeDay.cancelled / activeDay.total) * 100)}%)
              </span>
            </div>
          ) : (
            <div className="flex items-center text-xs text-neutral-400">
              <span>{t('chartFootnote', { total: totalBookings })}</span>
            </div>
          )}
        </div>

        <div className="relative mt-4 flex">
          {/* Y-ось с метками шкалы */}
          <div className="flex h-64 flex-col justify-between pr-3 text-right text-xs text-neutral-400 select-none">
            {yTicks.map((tick) => (
              <span key={tick} className="leading-none">
                {tick}
              </span>
            ))}
          </div>

          {/* Сетка и столбцы */}
          <div className="relative flex-1">
            {/* Горизонтальные линии сетки */}
            <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
              {yTicks.map((tick) => (
                <div
                  key={tick}
                  className={`w-full border-b ${
                    tick === 0 ? 'border-neutral-200' : 'border-dashed border-neutral-100'
                  }`}
                />
              ))}
            </div>

            {/* Столбцы по дням */}
            <div className="relative grid h-64 grid-cols-7 items-end gap-2 px-2 sm:gap-6">
              {days.map((day) => {
                const totalHeightPct = (day.total / maxValue) * 100;
                const confirmedPct = (day.confirmed / day.total) * 100;
                const cancelledPct = (day.cancelled / day.total) * 100;

                const isHovered = activeDay?.date === day.date;

                return (
                  <div
                    key={day.date}
                    onMouseEnter={() => setActiveDay(day)}
                    onMouseLeave={() => setActiveDay(null)}
                    className="group relative flex h-full cursor-pointer flex-col items-center justify-end"
                  >
                    {/* Бейдж суммы над столбцом */}
                    <span
                      className={`mb-2 rounded-full px-2 py-0.5 text-xs font-bold transition-all duration-150 ${
                        isHovered
                          ? 'scale-110 bg-neutral-900 text-white shadow-sm'
                          : 'bg-neutral-100 text-neutral-700'
                      }`}
                    >
                      {day.total}
                    </span>

                    {/* Сам составной столбец */}
                    <div
                      style={{ height: `${totalHeightPct}%` }}
                      className={`flex w-9 flex-col-reverse overflow-hidden rounded-2xl shadow-sm transition-all duration-200 sm:w-14 ${
                        isHovered ? 'ring-2 ring-neutral-400 ring-offset-2' : ''
                      }`}
                    >
                      {/* Нижний сегмент: Подтверждены */}
                      <div
                        style={{ height: `${confirmedPct}%` }}
                        className="flex items-center justify-center bg-gradient-to-t from-[#166534] to-[#1E7B3C] text-[11px] font-bold text-white transition-colors"
                      >
                        {day.confirmed}
                      </div>

                      {/* Разделитель */}
                      {day.cancelled > 0 && <div className="h-[1px] bg-white/30" />}

                      {/* Верхний сегмент: Отменены */}
                      {day.cancelled > 0 && (
                        <div
                          style={{ height: `${cancelledPct}%` }}
                          className="flex items-center justify-center bg-gradient-to-t from-orange-500 to-orange-400 text-[11px] font-bold text-white transition-colors"
                        >
                          {day.cancelled}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* X-ось с подписями дней */}
        <div className="mt-3 grid grid-cols-7 gap-2 pr-2 pl-8 text-center text-xs sm:gap-6">
          {days.map((day) => {
            const isHovered = activeDay?.date === day.date;
            return (
              <span
                key={day.date}
                className={`transition-colors duration-150 ${
                  isHovered ? 'font-bold text-neutral-900' : 'text-neutral-500'
                }`}
              >
                {day.label}
              </span>
            );
          })}
        </div>
      </div>
    </section>
  );
}
