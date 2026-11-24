import { ArrowLeft } from 'lucide-react';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { SiteHeader } from '@/components/SiteHeader';
import { getCurrentUser } from '@/features/auth/session';
import { ContactForm } from '@/features/contact/ContactForm';
import { fetchRestaurant } from '@/features/restaurants/data';
import { Link } from '@/i18n/navigation';

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const restaurant = await fetchRestaurant(id);
  if (!restaurant) notFound();

  const t = await getTranslations('contact');
  const tr = await getTranslations('restaurant');
  const user = await getCurrentUser();

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 pt-8 pb-16">
        <Link
          href="/"
          className="flex w-fit items-center gap-2 text-sm text-orange-500 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {tr('breadcrumbBack')}
        </Link>

        <h1 className="mt-6 text-3xl font-bold">{t('title')}</h1>
        <p className="mt-1 text-sm text-neutral-500">
          {restaurant.name} · {restaurant.city}
        </p>

        <div className="mt-6">
          <ContactForm
            restaurantId={restaurant.id}
            restaurantName={restaurant.name}
            defaultName={user?.role === 'CUSTOMER' ? user.displayName : ''}
          />
        </div>
      </main>
    </>
  );
}
