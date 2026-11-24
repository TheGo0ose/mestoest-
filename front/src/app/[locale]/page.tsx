import { BackgroundDecor } from '@/components/BackgroundDecor';
import { SiteHeader } from '@/components/SiteHeader';
import { fetchRestaurants } from '@/features/restaurants/data';
import { RestaurantCatalog } from '@/features/restaurants/RestaurantCatalog';

export default async function CatalogPage() {
  const items = await fetchRestaurants();

  return (
    <>
      <BackgroundDecor />
      <SiteHeader />
      <main className="mx-auto grid max-w-6xl gap-10 px-6 py-12 lg:grid-cols-[380px_1fr]">
        <RestaurantCatalog items={items} />
      </main>
    </>
  );
}
