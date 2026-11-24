import Image from 'next/image';
import { ArrowRight, MapPin, Phone } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Restaurant } from '@/mocks/restaurants';
import { Link } from '@/i18n/navigation';

export function RestaurantHero({ restaurant }: { restaurant: Restaurant }) {
  const t = useTranslations('restaurant');

  return (
    <section className="relative mt-4 flex min-h-[520px] items-end overflow-hidden rounded-[32px] bg-gradient-to-br from-orange-100 to-orange-50 p-6 shadow-sm">
      {restaurant.image && (
        <Image
          src={restaurant.image}
          alt=""
          fill
          priority
          sizes="(min-width: 1152px) 1152px, 100vw"
          className="object-cover"
        />
      )}

      {/* «матовое стекло» */}
      <div className="relative grid w-full gap-8 rounded-[28px] border border-white/60 bg-white/40 p-8 backdrop-blur-xl lg:grid-cols-[1fr_360px]">
        <div>
          <p className="flex items-center gap-1 text-sm font-medium text-orange-500">
            <MapPin className="h-4 w-4" aria-hidden />
            {restaurant.city}
          </p>
          <h1 className="mt-4 text-5xl font-bold">{restaurant.name}</h1>
          <p className="mt-3 text-xl text-neutral-500">{restaurant.description}</p>
          <p className="mt-6 max-w-xl text-neutral-800">{restaurant.about}</p>
          <p className="mt-6 text-xs text-neutral-500">{t('demoNote')}</p>
        </div>

        <div className="self-start rounded-3xl border border-white/70 bg-white/50 p-5">
          <Link
            href={`/restaurants/${restaurant.id}/book`}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-orange-500 px-5 py-3 text-sm font-semibold text-white hover:bg-orange-600"
          >
            {t('book')}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <Link
            href={`/restaurants/${restaurant.id}/contact`}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-orange-600 hover:bg-orange-50"
          >
            <Phone className="h-4 w-4" aria-hidden />
            {t('contact')}
          </Link>
          <p className="mt-4 text-xs text-neutral-500">{t('bookHint')}</p>
        </div>
      </div>
    </section>
  );
}
