import { ChevronRight } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { requireStaff } from '@/features/auth/guard';
import { CabinetShell } from '@/features/owner/CabinetShell';
import { ContactFilters } from '@/features/owner/ContactFilters';
import { ContactStatusButton } from '@/features/owner/ContactStatusButton';
import { headline } from '@/features/contact/headline';
import { listContactRequests } from '@/features/contact/store';
import { fetchManagedRestaurant } from '@/features/restaurants/data';
import { Link, redirect } from '@/i18n/navigation';
import { formatFullDateTime, formatShortDateTime } from '@/lib/time';

type SearchParams = {
  tab?: string | string[];
  source?: string | string[];
  id?: string | string[];
};

const one = (v: string | string[] | undefined) => (typeof v === 'string' ? v : '');
const time = (iso: string) => new Date(iso).getTime();

export default async function OwnerContactsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireStaff(locale, '/admin/contacts');
  if (user.role !== 'OWNER') redirect({ href: '/admin', locale });

  const sp = await searchParams;
  const tab = one(sp.tab) === 'handled' ? 'handled' : 'new';
  const source = ['WEB', 'TELEGRAM'].includes(one(sp.source)) ? one(sp.source) : '';

  const t = await getTranslations('cabinet');
  const tw = await getTranslations('workspace');
  const restaurant = await fetchManagedRestaurant();

  // Только запросы этого ресторана; сначала самые свежие
  const all = listContactRequests().filter(
    (c) => c.restaurantId === restaurant.id && (!source || c.source === source),
  );
  const newItems = all
    .filter((c) => c.status === 'NEW')
    .sort((a, b) => time(b.createdAt) - time(a.createdAt));
  const handledItems = all
    .filter((c) => c.status === 'HANDLED')
    .sort((a, b) => time(b.handledAt ?? b.createdAt) - time(a.handledAt ?? a.createdAt));

  const list = tab === 'handled' ? handledItems : newItems;
  const selected = list.find((c) => c.id === one(sp.id)) ?? list[0] ?? null;

  // Параметры адреса, которые сохраняются при переходах
  const base: Record<string, string> = {};
  if (source) base.source = source;
  const tabQuery = (name: 'new' | 'handled') =>
    name === 'handled' ? { ...base, tab: name } : base;

  const tabClass = (active: boolean) =>
    `rounded-full px-4 py-2 text-xs font-semibold ${
      active
        ? 'bg-[#FDE7E0] text-orange-600'
        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
    }`;

  return (
    <CabinetShell restaurant={restaurant} active="contacts">
      <p className="text-xs font-semibold tracking-wide text-orange-500 uppercase">{t('label')}</p>
      <h1 className="mt-5 text-4xl font-bold">{t('contactsTitle')}</h1>
      <p className="mt-3 text-neutral-500">{t('contactsSubtitle')}</p>

      <section className="mt-6 rounded-3xl bg-white p-8 shadow-sm">
        <ContactFilters restaurantName={restaurant.name} tab={tab} source={source} />

        <nav className="mt-6 flex gap-3" aria-label={t('contactsTitle')}>
          <Link
            href={{ pathname: '/admin/contacts', query: tabQuery('new') }}
            aria-current={tab === 'new' ? 'page' : undefined}
            className={tabClass(tab === 'new')}
          >
            {tw('tabNewCount', { count: newItems.length })}
          </Link>
          <Link
            href={{ pathname: '/admin/contacts', query: tabQuery('handled') }}
            aria-current={tab === 'handled' ? 'page' : undefined}
            className={tabClass(tab === 'handled')}
          >
            {tw('tabHandledCount', { count: handledItems.length })}
          </Link>
        </nav>
        <p className="mt-4 text-xs text-neutral-500">
          {tw('requestsSummary', { total: all.length, shown: list.length })}
        </p>
      </section>

      {list.length === 0 || !selected ? (
        <p className="mt-6 rounded-3xl bg-white p-8 text-center text-neutral-500 shadow-sm">
          {tab === 'handled' ? tw('emptyHandled') : tw('emptyNew')}
        </p>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,320px)_1fr] lg:items-start">
          <div>
            <ul className="space-y-3">
              {list.map((c) => {
                const active = c.id === selected.id;
                return (
                  <li key={c.id}>
                    <Link
                      href={{ pathname: '/admin/contacts', query: { ...tabQuery(tab), id: c.id } }}
                      aria-current={active ? 'true' : undefined}
                      aria-label={tw('openRequest', { name: c.name })}
                      className={`block rounded-3xl border p-5 shadow-sm ${
                        active
                          ? 'border-[#F8CFC2] bg-[#FFF7F4]'
                          : 'border-transparent bg-white hover:border-neutral-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate font-semibold">{c.name}</p>
                        {active && (
                          <ChevronRight className="h-4 w-4 shrink-0 text-orange-500" aria-hidden />
                        )}
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm">{headline(c.message)}</p>
                      <div className="mt-3 flex items-center justify-between text-xs text-neutral-500">
                        <span>{formatShortDateTime(c.createdAt, locale)}</span>
                        <span className="tracking-wide">{c.source}</span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <p className="mt-4 text-xs text-neutral-500">{t('newestFirst')}</p>
          </div>

          <div>
            <article className="rounded-3xl bg-white p-8 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-2xl font-bold">{headline(selected.message)}</h2>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                    selected.status === 'NEW'
                      ? 'bg-[#FDE7E0] text-orange-600'
                      : 'bg-[#E6F4EA] text-[#1E7B3C]'
                  }`}
                >
                  {selected.status === 'NEW' ? t('badgeNew') : t('badgeHandled')}
                </span>
              </div>
              <p className="mt-3 text-sm text-neutral-500">
                {restaurant.name} · {formatFullDateTime(selected.createdAt, locale)} ·{' '}
                {selected.source}
              </p>
              {selected.handledAt && (
                <p className="mt-1 text-sm text-neutral-500">
                  {tw('handledAt', { when: formatFullDateTime(selected.handledAt, locale) })}
                </p>
              )}

              <dl className="mt-6 border-t border-neutral-100 pt-6">
                <dt className="text-xs font-medium tracking-wide text-neutral-500">
                  {t('detailName')}
                </dt>
                <dd className="mt-2 font-semibold">{selected.name}</dd>
                {selected.phone && (
                  <>
                    <dt className="mt-4 text-xs font-medium tracking-wide text-neutral-500">
                      {t('detailPhone')}
                    </dt>
                    <dd className="mt-2 text-lg font-semibold">{selected.phone}</dd>
                  </>
                )}
                {selected.email && (
                  <>
                    <dt className="mt-4 text-xs font-medium tracking-wide text-neutral-500">
                      {t('detailEmail')}
                    </dt>
                    <dd className="mt-2 text-lg font-semibold">{selected.email}</dd>
                  </>
                )}
              </dl>

              <div className="mt-6 border-t border-neutral-100 pt-6">
                <p className="text-xs font-medium tracking-wide text-neutral-500">
                  {t('detailMessage')}
                </p>
                <p className="mt-3 whitespace-pre-line">{selected.message}</p>
              </div>

              <div className="mt-8">
                <ContactStatusButton
                  id={selected.id}
                  status={selected.status}
                  tab={tab}
                  source={source}
                />
                {selected.status === 'NEW' && (
                  <p className="mt-4 text-xs text-neutral-500">{t('markHandledHint')}</p>
                )}
              </div>
            </article>
            <p className="mt-4 text-xs text-neutral-500">{t('contactsNotChat')}</p>
          </div>
        </div>
      )}
    </CabinetShell>
  );
}
