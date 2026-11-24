import Image from 'next/image';
import { MapPin } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import type { Restaurant } from '@/mocks/restaurants';

export function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  const t = useTranslations('catalog');

  return (
    <article className="rounded-3xl bg-white p-3 shadow-sm">
      <div className="relative h-40 overflow-hidden rounded-2xl bg-gradient-to-br from-orange-100 to-orange-50">
        {restaurant.image && (
          <Image
            src={restaurant.image}
            alt=""
            fill
            sizes="(min-width: 1024px) 330px, 100vw"
            className="object-cover"
          />
        )}
        <span className="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-white/80 px-3 py-1 text-xs font-medium backdrop-blur">
          <MapPin className="h-3 w-3 text-orange-500" aria-hidden />
          {restaurant.city}
        </span>
      </div>

      <div className="flex items-end justify-between gap-3 p-3">
        <div className="min-w-0">
          <h3 className="line-clamp-2 text-lg font-bold">{restaurant.name}</h3>
          <p className="line-clamp-2 text-sm text-neutral-500">{restaurant.description}</p>
        </div>
        <Link
          href={`/restaurants/${restaurant.id}`}
          className="shrink-0 rounded-full bg-orange-500 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-600"
        >
          {t('book')}
        </Link>
      </div>
    </article>
  );
}
