import { getTranslations, setRequestLocale } from 'next-intl/server';
import { requireStaff } from '@/features/auth/guard';
import { OwnerShell } from '@/features/owner/OwnerShell';
import { MenuEditor } from '@/features/owner/MenuEditor';
import { getReadiness } from '@/features/owner/readiness';
import { getOwnerRestaurant, isMenuSaved } from '@/features/owner/store';
import { redirect } from '@/i18n/navigation';
export default async function MenuPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await requireStaff(locale, '/admin/menu');
  if (user.role !== 'OWNER') redirect({ href: '/admin', locale });

  const t = await getTranslations('panel');
  const restaurant = await getOwnerRestaurant();
  const readiness = getReadiness(restaurant);
  const menuSaved = isMenuSaved();

  const totalItems = restaurant.menu.reduce((n, s) => n + s.items.length, 0);

  return (
    <OwnerShell restaurant={restaurant} readiness={readiness} active="menu">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-wide text-orange-500 uppercase">
            {t('labelOnboarding')}
          </p>
          <h1 className="mt-1 text-4xl font-bold">{t('menuTitle')}</h1>
          <p className="mt-2 text-sm text-neutral-500">
            {t('menuSubtitle', { sections: restaurant.menu.length, items: totalItems })}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
            menuSaved
              ? 'border border-green-200 bg-green-50 text-green-700'
              : 'border border-amber-200 bg-amber-50 text-amber-700'
          }`}
        >
          {menuSaved ? t('detailsSaved') : t('stepTodo')}
        </span>
      </div>

      <MenuEditor
        initialSections={restaurant.menu}
        menuSaved={menuSaved}
        published={restaurant.status === 'PUBLISHED'}
      />
    </OwnerShell>
  );
}
