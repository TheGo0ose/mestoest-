import { Store } from 'lucide-react';
import type { ReactNode } from 'react';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { RestaurantStatusBadge } from './RestaurantStatusBadge';
import { CABINET_META, CABINET_SECTIONS, type CabinetSection } from './cabinet';
import type { OwnerRestaurant } from './types';

export async function CabinetShell({
  restaurant,
  active,
  children,
}: {
  restaurant: OwnerRestaurant;
  active: CabinetSection;
  children: ReactNode;
}) {
  const t = await getTranslations('cabinet');

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
        {/* Карточка ресторана */}
        <div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FDE7E0] text-orange-500">
            <Store className="h-6 w-6" aria-hidden />
          </div>

          <p className="mt-4 truncate text-xl font-bold">{restaurant.name}</p>
          <p className="mt-1 text-xs text-neutral-500">
            {restaurant.city} · {restaurant.address}
          </p>
          <div className="mt-3">
            <RestaurantStatusBadge status={restaurant.status} />
          </div>
        </div>

        {/* Навигация рабочего кабинета */}
        <nav aria-label={t('sidebarCaption')}>
          <p className="mb-3 text-xs font-semibold tracking-wide text-neutral-500 uppercase">
            {t('sidebarCaption')}
          </p>
          <ul className="space-y-1">
            {CABINET_SECTIONS.map((key) => {
              const meta = CABINET_META[key];
              const Icon = meta.icon;
              return (
                <li key={key}>
                  <Link
                    href={meta.href}
                    aria-current={active === key ? 'page' : undefined}
                    className={itemClass(active === key)}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden />
                    <span className="grow">{t(meta.nav)}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Информационный блок */}
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-neutral-700">{t('ownerOnly')}</p>
          <p className="mt-1 text-xs text-neutral-500">{t('ownerOnlyHint')}</p>
        </div>
      </aside>

      <div className="min-w-0">
        {children}
        <footer className="mt-10 flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-500">
          <span>{t('footerLabel')}</span>
          <span>{t('footerTz')}</span>
        </footer>
      </div>
    </div>
  );
}
