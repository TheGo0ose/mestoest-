import Image from 'next/image';
import { MapPin } from 'lucide-react';
import type { Restaurant } from '@/mocks/restaurants';

export function RestaurantAside({ restaurant }: { restaurant: Restaurant }) {
  return (
    <aside className="relative min-h-[600px] overflow-hidden rounded-[32px] bg-gradient-to-br from-orange-100 to-orange-50 shadow-sm lg:self-start">
      {restaurant.image && (
        <Image src={restaurant.image} alt="" fill sizes="320px" className="object-cover" />
      )}

      <div className="relative m-4 rounded-3xl border border-white/60 bg-white/40 p-5 backdrop-blur-xl">
        <p className="flex items-center gap-1 text-sm font-medium text-orange-500">
          <MapPin className="h-4 w-4" aria-hidden />
          {restaurant.city}
        </p>
        <h2 className="mt-2 text-3xl font-bold">{restaurant.name}</h2>
        <p className="mt-2 text-neutral-500">{restaurant.description}</p>
        <p className="mt-4 text-xs text-neutral-800">{restaurant.about}</p>
      </div>
    </aside>
  );
}
