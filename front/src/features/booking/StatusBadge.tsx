import { useTranslations } from 'next-intl';
import type { Booking } from './types';

export function StatusBadge({ status }: { status: Booking['status'] }) {
  const t = useTranslations('bookings');
  const confirmed = status === 'CONFIRMED';

  return (
    <span
      className={`inline-block rounded-full px-4 py-1.5 text-sm font-semibold ${
        confirmed ? 'bg-[#E6F4EA] text-[#1E7B3C]' : 'bg-neutral-100 text-neutral-600'
      }`}
    >
      {confirmed ? t('statusConfirmed') : t('statusCancelled')}
    </span>
  );
}
