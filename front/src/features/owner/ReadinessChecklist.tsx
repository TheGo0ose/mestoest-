import { Check, ChevronRight } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { activeTables, menuItemCount, type Readiness } from './readiness';
import { SECTION_META } from './sections';
import { SECTION_KEYS, type OwnerRestaurant, type SectionKey } from './types';

export async function ReadinessChecklist({
  restaurant,
  readiness,
}: {
  restaurant: OwnerRestaurant;
  readiness: Readiness;
}) {
  const t = await getTranslations('panel');

  function summary(key: SectionKey): string {
    switch (key) {
      case 'details':
        return readiness.done.details
          ? t('summaryDetailsDone', { name: restaurant.name, city: restaurant.city })
          : t('summaryDetailsTodo');
      case 'hours': {
        const hours = restaurant.hours;
        const first = hours[0];
        if (!first) return t('summaryHoursNone');
        const daily =
          hours.length === 7 &&
          hours.every((h) => h.opens === first.opens && h.closes === first.closes);
        return daily
          ? t('summaryHoursDaily', { from: first.opens, to: first.closes })
          : t('summaryHoursDays', { count: hours.length });
      }
      case 'tables': {
        const tables = activeTables(restaurant);
        if (tables.length === 0) return t('summaryTablesNone');
        const seats = tables.reduce((n, x) => n + x.seats, 0);
        return t('summaryTablesDone', { tables: tables.length, seats });
      }
      case 'menu': {
        const count = menuItemCount(restaurant);
        return count > 0 ? t('summaryMenuDone', { count }) : t('summaryMenuNone');
      }
    }
  }

  return (
    <section className="rounded-3xl bg-white px-8 py-2 shadow-sm">
      <ul className="divide-y divide-neutral-100">
        {SECTION_KEYS.map((key) => {
          const meta = SECTION_META[key];
          const Icon = meta.icon;
          const done = readiness.done[key];
          return (
            <li key={key}>
              <Link href={meta.href} className="flex items-center gap-4 py-6 hover:opacity-90">
                <span
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                    done ? 'bg-[#E6F4EA] text-[#1E7B3C]' : 'bg-[#FDE7E0] text-orange-500'
                  }`}
                >
                  {done ? (
                    <Check className="h-5 w-5" aria-hidden />
                  ) : (
                    <Icon className="h-5 w-5" aria-hidden />
                  )}
                </span>
                <span className="min-w-0 grow">
                  <span className="block text-lg font-semibold">{t(meta.nav)}</span>
                  <span className="mt-1 block text-sm text-neutral-500">{summary(key)}</span>
                </span>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                    done ? 'bg-[#E6F4EA] text-[#1E7B3C]' : 'bg-[#FFF1D6] text-[#8A5A00]'
                  }`}
                >
                  {done ? t('stepDone') : t('stepTodo')}
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
