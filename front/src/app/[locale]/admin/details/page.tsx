import { getTranslations, setRequestLocale } from 'next-intl/server';
import { requireStaff } from '@/features/auth/guard';
import { DetailsForm } from '@/features/owner/DetailsForm';
import { OwnerShell } from '@/features/owner/OwnerShell';
import { getReadiness } from '@/features/owner/readiness';
import { fetchManagedRestaurant } from '@/features/restaurants/data';
import { redirect } from '@/i18n/navigation';

export default async function DetailsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireStaff(locale, '/admin/details');
  if (user.role !== 'OWNER') redirect({ href: '/admin', locale });

  const t = await getTranslations('panel');
  const restaurant = await fetchManagedRestaurant();
  const readiness = getReadiness(restaurant);
  const saved = readiness.done.details;

  return (
    <OwnerShell restaurant={restaurant} readiness={readiness} active="details">
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs font-semibold tracking-wide text-orange-500 uppercase">
          {t('labelOnboarding')}
        </p>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            saved ? 'bg-[#E6F4EA] text-[#1E7B3C]' : 'bg-[#FFF1D6] text-[#8A5A00]'
          }`}
        >
          {saved ? t('detailsSaved') : t('stepTodo')}
        </span>
      </div>

      <h1 className="mt-5 text-4xl font-bold">{t('detailsTitle')}</h1>
      <p className="mt-3 text-neutral-500">{t('detailsSubtitle', { name: restaurant.name })}</p>

      <DetailsForm
        initial={{
          name: restaurant.name,
          description: restaurant.description,
          address: restaurant.address,
          phone: restaurant.phone,
        }}
        city={restaurant.city}
        published={restaurant.status === 'PUBLISHED'}
      />
    </OwnerShell>
  );
}
