import { useTranslations } from 'next-intl';
import type { RestaurantStatus } from './types';

const styles: Record<RestaurantStatus, string> = {
  DRAFT: 'bg-neutral-100 text-neutral-700',
  PUBLISHED: 'bg-[#E6F4EA] text-[#1E7B3C]',
  HIDDEN: 'bg-[#FFF1D6] text-[#8A5A00]',
};

const labels: Record<RestaurantStatus, string> = {
  DRAFT: 'statusDraft',
  PUBLISHED: 'statusPublished',
  HIDDEN: 'statusHidden',
};

export function RestaurantStatusBadge({ status }: { status: RestaurantStatus }) {
  const t = useTranslations('panel');

  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${styles[status]}`}>
      {t(labels[status])}
    </span>
  );
}
