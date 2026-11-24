import type { ReactNode } from 'react';
import { Clock, MapPin, Phone } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Restaurant } from '@/mocks/restaurants';

function InfoCard({
  icon,
  label,
  value,
  hint,
  children,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  hint?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex items-start gap-4 rounded-3xl bg-white p-5 shadow-sm">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FDE7E0] text-orange-500">
        {icon}
      </div>
      <div>
        <p className="text-xs text-neutral-500">{label}</p>
        <p className="mt-1 font-semibold">{value}</p>
        {hint && <p className="mt-1 text-xs text-neutral-500">{hint}</p>}
        {children}
      </div>
    </div>
  );
}

export function InfoCards({ restaurant }: { restaurant: Restaurant }) {
  const t = useTranslations('restaurant');

  const first = restaurant.hours[0];
  const daily =
    !!first &&
    restaurant.hours.length === 7 &&
    restaurant.hours.every((h) => h.opens === first.opens && h.closes === first.closes);

  let hoursValue = '—';
  if (first) {
    hoursValue = daily ? `${t('hoursDaily')} · ${first.opens}–${first.closes}` : t('hoursVaries');
  }

  return (
    <section className="mt-8 grid gap-4 md:grid-cols-3">
      <InfoCard
        icon={<MapPin className="h-5 w-5" aria-hidden />}
        label={t('address')}
        value={restaurant.address}
        hint={restaurant.city}
      />
      <InfoCard
        icon={<Clock className="h-5 w-5" aria-hidden />}
        label={t('hours')}
        value={hoursValue}
        hint={daily ? t('hoursRange') : undefined}
      >
        {first && !daily && (
          <ul className="mt-2 space-y-1 text-xs text-neutral-500">
            {restaurant.hours.map((h) => (
              <li key={h.day}>
                {t(`d${h.day}`)}: {h.opens}–{h.closes}
              </li>
            ))}
          </ul>
        )}
      </InfoCard>
      <InfoCard
        icon={<Phone className="h-5 w-5" aria-hidden />}
        label={t('phone')}
        value={restaurant.phone}
        hint={t('phoneHint')}
      />
    </section>
  );
}
