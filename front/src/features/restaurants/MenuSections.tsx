import { CakeSlice, CookingPot, CupSoda, Leaf } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import type { MenuSection } from '@/mocks/restaurants';

function SectionIcon({ index }: { index: number }) {
  const props = { className: 'h-5 w-5', 'aria-hidden': true } as const;
  switch (index % 4) {
    case 0:
      return <Leaf {...props} />;
    case 1:
      return <CookingPot {...props} />;
    case 2:
      return <CakeSlice {...props} />;
    default:
      return <CupSoda {...props} />;
  }
}

export function MenuSections({ menu }: { menu: MenuSection[] }) {
  const t = useTranslations('restaurant');
  const locale = useLocale();
  const money = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'KGS',
    maximumFractionDigits: 0,
  });

  // скрываем недоступные позиции и пустые разделы (требование ТЗ)
  const sections = menu
    .map((s) => ({ ...s, items: s.items.filter((i) => i.available) }))
    .filter((s) => s.items.length > 0);
  const total = sections.reduce((n, s) => n + s.items.length, 0);

  return (
    <section className="mt-12">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold">{t('menu')}</h2>
          <p className="mt-1 text-sm text-neutral-500">{t('menuHint')}</p>
        </div>
        {sections.length > 0 && (
          <p className="text-sm text-neutral-500">
            {t('sectionsCount', { count: sections.length })} · {t('itemsCount', { count: total })}
          </p>
        )}
      </div>

      {sections.length === 0 ? (
        <p className="mt-6 rounded-3xl bg-white p-6 text-neutral-500">{t('menuEmpty')}</p>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap gap-2">
            {sections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="rounded-full bg-white px-4 py-2 text-sm text-neutral-600 shadow-sm hover:bg-[#FDE7E0]"
              >
                {s.name}
              </a>
            ))}
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            {sections.map((s, index) => (
              <article
                key={s.id}
                id={s.id}
                className="scroll-mt-6 rounded-3xl bg-white p-6 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FDE7E0] text-orange-500">
                      <SectionIcon index={index} />
                    </div>
                    <h3 className="text-xl font-bold">{s.name}</h3>
                  </div>
                  <span className="text-xs text-neutral-500">
                    {t('itemsCount', { count: s.items.length })}
                  </span>
                </div>

                <ul className="mt-4 divide-y divide-neutral-100">
                  {s.items.map((i) => (
                    <li key={i.id} className="py-4">
                      <div className="flex items-baseline justify-between gap-4">
                        <p className="font-semibold">{i.name}</p>
                        <span className="font-semibold whitespace-nowrap">
                          {money.format(Number(i.price))}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-neutral-500">{i.description}</p>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
