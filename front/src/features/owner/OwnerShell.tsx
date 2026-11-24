import Image from 'next/image';
import type { ReactNode } from 'react';
import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { Readiness } from './readiness';
import { RestaurantStatusBadge } from './RestaurantStatusBadge';
import { SECTION_META } from './sections';
import { SECTION_KEYS, type OwnerRestaurant, type SectionKey } from './types';
import { ArrowRight, Check, LayoutGrid, Sprout } from 'lucide-react';

const footerStatus = {
  DRAFT: 'footerDraft',
  PUBLISHED: 'footerPublished',
  HIDDEN: 'footerHidden',
} as const;

export async function OwnerShell({
  restaurant,
  readiness,
  active,
  children,
}: {
  restaurant: OwnerRestaurant;
  readiness: Readiness;
  active: 'overview' | SectionKey;
  children: ReactNode;
}) {
  const t = await getTranslations('panel');
  const tw = await getTranslations('workspace');
  const locale = await getLocale();

  const percent = Math.round((readiness.readyCount / readiness.total) * 100);
  const missingNames = readiness.missing
    .map((k) => t(SECTION_META[k].nav).toLocaleLowerCase(locale))
    .join(', ');

  const itemBase = 'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm';
  const itemClass = (isActive: boolean) =>
    `${itemBase} ${
      isActive
        ? 'bg-[#FDE7E0] font-semibold text-orange-600'
        : 'text-neutral-800 hover:bg-neutral-100'
    }`;

  return (
    <div className="grid gap-8 lg:grid-cols-[256px_1fr]">
      <aside className="space-y-6">
        <div>
          <div className="relative h-28 overflow-hidden rounded-3xl bg-gradient-to-br from-orange-100 to-orange-50">
            {restaurant.image && (
              <Image src={restaurant.image} alt="" fill sizes="256px" className="object-cover" />
            )}
          </div>
          <div className="mt-4 flex items-center justify-between gap-2">
            <p className="truncate text-xl font-bold">{restaurant.name}</p>
            <Sprout className="h-4 w-4 shrink-0 text-orange-500" aria-hidden />
          </div>
          <p className="mt-1 text-xs text-neutral-500">
            {restaurant.city} · {restaurant.address}
          </p>
          <div className="mt-3">
            <RestaurantStatusBadge status={restaurant.status} />
          </div>
        </div>

        <nav aria-label={t('sidebarCaption')}>
          <p className="mb-3 text-xs font-semibold tracking-wide text-neutral-500 uppercase">
            {t('sidebarCaption')}
          </p>
          <ul className="space-y-1">
            <li>
              <Link
                href="/admin"
                aria-current={active === 'overview' ? 'page' : undefined}
                className={itemClass(active === 'overview')}
              >
                <LayoutGrid className="h-4 w-4 shrink-0" aria-hidden />
                <span className="grow">{t('navOverview')}</span>
              </Link>
            </li>
            {SECTION_KEYS.map((key) => {
              const meta = SECTION_META[key];
              const Icon = meta.icon;
              const done = readiness.done[key];
              return (
                <li key={key}>
                  <Link
                    href={meta.href}
                    aria-current={active === key ? 'page' : undefined}
                    className={itemClass(active === key)}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden />
                    <span className="grow">{t(meta.nav)}</span>
                    {done ? (
                      <Check className="h-4 w-4 text-[#1E7B3C]" aria-hidden />
                    ) : (
                      <span aria-hidden className="h-2 w-2 rounded-full bg-amber-500" />
                    )}
                    <span className="sr-only">{done ? t('stepDone') : t('stepTodo')}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs">
            <span className="text-neutral-500">{t('sectionsReady')}</span>
            <span className="font-semibold">
              {t('ratio', { ready: readiness.readyCount, total: readiness.total })}
            </span>
          </div>
          <div
            role="progressbar"
            aria-label={t('sectionsReady')}
            aria-valuemin={0}
            aria-valuemax={readiness.total}
            aria-valuenow={readiness.readyCount}
            className="mt-2 h-1.5 overflow-hidden rounded-full bg-neutral-200"
          >
            <div className="h-full rounded-full bg-orange-500" style={{ width: `${percent}%` }} />
          </div>
          <p className="mt-3 text-xs text-neutral-500">
            {readiness.missing.length > 0
              ? t('sidebarLeft', { sections: missingNames })
              : t('sidebarAllDone')}
          </p>
        </div>
        <Link
          href="/admin/bookings"
          className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold hover:bg-neutral-50"
        >
          {tw('openWorkspace')}
          <ArrowRight className="h-4 w-4 text-orange-500" aria-hidden />
        </Link>
      </aside>

      <div className="min-w-0">
        {children}
        <footer className="mt-10 flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-500">
          <span>{t('footerLabel')}</span>
          <span>{t(footerStatus[restaurant.status])}</span>
        </footer>
      </div>
    </div>
  );
}
