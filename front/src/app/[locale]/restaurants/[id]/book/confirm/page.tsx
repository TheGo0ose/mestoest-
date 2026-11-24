import { ArrowLeft } from 'lucide-react';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { SiteHeader } from '@/components/SiteHeader';
import { getCurrentUser } from '@/features/auth/session';
import { ConfirmCard } from '@/features/booking/ConfirmCard';
import { RestaurantAside } from '@/features/booking/RestaurantAside';
import { fetchRestaurant } from '@/features/restaurants/data';
import { Link, redirect } from '@/i18n/navigation';
import { dateInRestaurantZone } from '@/lib/time';

type SearchParams = { startsAt?: string | string[]; guests?: string | string[] };

const one = (v: string | string[] | undefined) => (typeof v === 'string' ? v : '');

export default async function ConfirmPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;

  const restaurant = await fetchRestaurant(id);
  if (!restaurant) notFound();

  // Если в адресе нет выбранного времени, возвращаем на шаг C3
  const startsAt = one(sp.startsAt);
  const guests = Number.parseInt(one(sp.guests), 10);
  const valid =
    startsAt !== '' &&
    !Number.isNaN(new Date(startsAt).getTime()) &&
    Number.isInteger(guests) &&
    guests >= 1;
  if (!valid) redirect({ href: `/restaurants/${restaurant.id}/book`, locale });

  const t = await getTranslations('booking');
  const user = await getCurrentUser();

  const backHref = {
    pathname: `/restaurants/${restaurant.id}/book`,
    query: { date: dateInRestaurantZone(new Date(startsAt)), guests, startsAt },
  };

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 pt-8 pb-16">
        <Link
          href={backHref}
          className="flex w-fit items-center gap-2 text-sm text-orange-500 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {t('backToTime')}
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold">{t('confirmTitle')}</h1>
              <p className="mt-1 text-sm text-neutral-500">{t('confirmSubtitle')}</p>
            </div>

            {user ? (
              <section className="rounded-3xl bg-white p-8 shadow-sm">
                <h2 className="text-lg font-semibold">
                  {t('signedInAs', { name: user.displayName })}
                </h2>
                <p className="mt-2 text-neutral-500">{t('accountHint')}</p>
              </section>
            ) : (
              <section className="rounded-3xl bg-white p-8 shadow-sm">
                <h2 className="text-lg font-semibold">{t('signInTitle')}</h2>
                <p className="mt-2 text-neutral-500">{t('signInHint')}</p>
                {/* Экрана входа C8 ещё нет: ссылка заработает, когда мы его сделаем */}
                <Link
                  href={{
                    pathname: '/login',
                    query: {
                      next: `/restaurants/${restaurant.id}/book/confirm?startsAt=${encodeURIComponent(startsAt)}&guests=${guests}`,
                    },
                  }}
                  className="mt-4 inline-block rounded-full bg-orange-500 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-600"
                >
                  {t('signInAction')}
                </Link>
              </section>
            )}

            <ConfirmCard
              restaurantId={restaurant.id}
              restaurantName={restaurant.name}
              address={restaurant.address}
              startsAt={startsAt}
              guests={guests}
              canConfirm={user !== null}
            />
          </div>

          <RestaurantAside restaurant={restaurant} />
        </div>
      </main>
    </>
  );
}
