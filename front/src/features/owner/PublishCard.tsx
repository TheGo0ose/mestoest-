import { CircleAlert } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import type { Readiness } from './readiness';
import { PublishControls } from './PublishControls';
import { SECTION_META } from './sections';
import type { OwnerRestaurant, SectionKey } from './types';

// Разделы, без которых публикация невозможна (ТЗ: RESTAURANT_NOT_READY)
const REQUIRED: SectionKey[] = ['hours', 'tables', 'menu'];

export async function PublishCard({
  restaurant,
  readiness,
}: {
  restaurant: OwnerRestaurant;
  readiness: Readiness;
}) {
  const t = await getTranslations('panel');
  const locale = await getLocale();

  const names = (keys: SectionKey[]) =>
    keys.map((k) => t(SECTION_META[k].nav).toLocaleLowerCase(locale)).join(', ');
  const missing = REQUIRED.filter((k) => !readiness.done[k]);
  const added = REQUIRED.filter((k) => readiness.done[k]);
  const published = restaurant.status === 'PUBLISHED';

  return (
    <section id="publication" className="scroll-mt-6 rounded-3xl bg-white p-8 shadow-sm">
      <h2 className="text-2xl font-bold">{t('publicationTitle')}</h2>
      <p className="mt-3 text-sm text-neutral-500">
        {published ? t('publicationLive') : t('publicationIntro')}
      </p>

      {!readiness.canPublish && (
        <div
          role="status"
          className="mt-6 flex gap-3 rounded-2xl bg-[#FFF4DB] p-4 text-sm text-[#7A4B00]"
        >
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>{t('notReady')}</p>
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div className="text-sm">
          {readiness.canPublish ? (
            <p className="font-semibold">{published ? t('stateLive') : t('allReadyToPublish')}</p>
          ) : (
            <>
              <p className="font-semibold">{t('missingNow', { items: names(missing) })}</p>
              {added.length > 0 && (
                <p className="mt-1 text-neutral-500">
                  {t('alreadyAdded', { items: names(added) })}
                </p>
              )}
            </>
          )}
        </div>
        <PublishControls status={restaurant.status} canPublish={readiness.canPublish} />
      </div>
    </section>
  );
}
