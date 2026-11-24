import { getTranslations, setRequestLocale } from 'next-intl/server';
import { requireStaff } from '@/features/auth/guard';
import { OwnerShell } from '@/features/owner/OwnerShell';
import { HoursForm } from '@/features/owner/HoursForm';
import { getReadiness } from '@/features/owner/readiness';
import { fetchManagedRestaurant } from '@/features/restaurants/data';
import { redirect } from '@/i18n/navigation';

export default async function HoursPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await requireStaff(locale, '/admin/hours');
  if (user.role !== 'OWNER') redirect({ href: '/admin', locale });

  const t = await getTranslations('panel');
  const restaurant = await fetchManagedRestaurant();
  const readiness = getReadiness(restaurant);

  return (
    <OwnerShell restaurant={restaurant} readiness={readiness} active="hours">
      <p className="text-xs font-semibold tracking-wide text-orange-500 uppercase">
        {t('labelOnboarding')}
      </p>
      <h1 className="mt-1 text-4xl font-bold">{t('hoursTitle')}</h1>
      <p className="mt-2 text-sm text-neutral-500">{t('hoursSubtitle')}</p>

      <HoursForm initialHours={restaurant.hours} published={restaurant.status === 'PUBLISHED'} />
    </OwnerShell>
  );
}
