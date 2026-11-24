import Image from 'next/image';
import type { ReactNode } from 'react';
import { MapPin } from 'lucide-react';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { fetchRestaurants } from '@/features/restaurants/data';
import { Link } from '@/i18n/navigation';

export async function AuthShell({ children }: { children: ReactNode }) {
  const restaurants = (await fetchRestaurants()).slice(0, 3);

  return (
    <main className="grid min-h-screen lg:grid-cols-[45%_1fr]">
      {/* Декоративная панель: карточки ресторанов на оранжевом фоне */}
      <aside
        aria-hidden
        className="sticky top-0 hidden h-screen overflow-hidden bg-orange-500 lg:block"
      >
        <div className="absolute inset-x-0 -top-20 flex flex-col items-center gap-10">
          {restaurants.map((r) => (
            <div
              key={r.id}
              className="relative h-[440px] w-[352px] max-w-[78%] shrink-0 overflow-hidden rounded-[32px] bg-orange-100"
            >
              {r.image && (
                <Image src={r.image} alt="" fill sizes="352px" className="object-cover" />
              )}
              <div className="absolute inset-x-6 bottom-6 rounded-3xl border border-white/60 bg-white/40 p-5 backdrop-blur-xl">
                <p className="flex items-center gap-1 text-xs font-medium text-orange-500">
                  <MapPin className="h-3 w-3" />
                  {r.city}
                </p>
                <p className="mt-2 text-2xl font-bold">{r.name}</p>
                <p className="mt-1 line-clamp-2 text-sm text-neutral-500">{r.description}</p>
              </div>
            </div>
          ))}
        </div>
      </aside>

      <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-24">
        <div className="absolute top-6 right-6 left-6 flex items-center justify-between">
          <Link href="/" className="text-lg font-semibold">
            TableMint
          </Link>
          <LocaleSwitcher />
        </div>

        <div className="w-full max-w-[452px]">{children}</div>

        <Image
          src="/images/plate-right.png"
          alt=""
          aria-hidden
          width={160}
          height={237}
          quality={95}
          className="pointer-events-none absolute -right-12 -bottom-12 hidden lg:block"
        />
      </section>
    </main>
  );
}
