'use client';

import { useTranslations } from 'next-intl';
import { SelectField } from '@/components/SelectField';
import { useRouter } from '@/i18n/navigation';

export function ContactFilters({
  restaurantName,
  tab,
  source,
}: {
  restaurantName: string;
  tab: string;
  source: string;
}) {
  const t = useTranslations('cabinet');
  const router = useRouter();

  function changeSource(next: string) {
    const query: Record<string, string> = {};
    if (tab === 'handled') query.tab = 'handled';
    if (next) query.source = next;
    router.replace({ pathname: '/admin/contacts', query });
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <SelectField
        id="contacts-restaurant"
        label={t('filterRestaurant')}
        value="own"
        onChange={() => {}}
      >
        <option value="own">{restaurantName}</option>
      </SelectField>
      <SelectField
        id="contacts-source"
        label={t('filterSource')}
        value={source}
        onChange={changeSource}
      >
        <option value="">{t('allSources')}</option>
        <option value="WEB">WEB</option>
        <option value="TELEGRAM">TELEGRAM</option>
      </SelectField>
    </div>
  );
}
