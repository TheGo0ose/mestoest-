import { getTranslations, setRequestLocale } from 'next-intl/server';
import { requireStaff } from '@/features/auth/guard';
import { OwnerShell } from '@/features/owner/OwnerShell';
import { TablesForm } from '@/features/owner/TablesForm';
import { getReadiness } from '@/features/owner/readiness';
import { fetchManagedRestaurant } from '@/features/restaurants/data';
import { redirect } from '@/i18n/navigation';

export default async function TablesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await requireStaff(locale, '/admin/tables');
  if (user.role !== 'OWNER') redirect({ href: '/admin', locale });

  const t = await getTranslations('panel');
  const restaurant = await fetchManagedRestaurant();
  const readiness = getReadiness(restaurant);

  return (
    <OwnerShell restaurant={restaurant} readiness={readiness} active="tables">
      <p className="text-xs font-semibold tracking-wide text-orange-500 uppercase">
        {t('labelOnboarding')}
      </p>
      <h1 className="mt-1 text-4xl font-bold">{t('tablesTitle')}</h1>
      <p className="mt-2 text-sm text-neutral-500">{t('tablesSubtitle')}</p>

      <TablesForm initialTables={restaurant.tables} published={restaurant.status === 'PUBLISHED'} />
    </OwnerShell>
  );
}
