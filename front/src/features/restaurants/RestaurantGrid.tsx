import type { Restaurant } from '@/mocks/restaurants';
import { RestaurantCard } from './RestaurantCard';

export function RestaurantGrid({ items }: { items: Restaurant[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {items.map((r) => (
        <RestaurantCard key={r.id} restaurant={r} />
      ))}
    </div>
  );
}
