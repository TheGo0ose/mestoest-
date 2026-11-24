import { ArrowLeft } from 'lucide-react';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import { fetchMenu, fetchRestaurant } from '@/features/restaurants/data';
import { InfoCards } from '@/features/restaurants/InfoCards';
import { MenuSections } from '@/features/restaurants/MenuSections';
import { RestaurantHero } from '@/features/restaurants/RestaurantHero';
import { Link } from '@/i18n/navigation';

export default async function RestaurantPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const [restaurant, menu] = await Promise.all([fetchRestaurant(id), fetchMenu(id)]);
  if (!restaurant) notFound();

  const t = await getTranslations('restaurant');

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 pt-8">
        <nav aria-label={t('breadcrumbLabel')} className="flex items-center gap-3 text-sm">
          <Link href="/" className="flex items-center gap-2 text-orange-500 hover:underline">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            {t('breadcrumbBack')}
          </Link>
          <span className="text-neutral-400">/</span>
          <span className="text-neutral-500">{restaurant.name}</span>
        </nav>

        <RestaurantHero restaurant={restaurant} />
        <InfoCards restaurant={restaurant} />
        <MenuSections menu={menu} />
      </main>
      <SiteFooter />
    </>
  );
}
