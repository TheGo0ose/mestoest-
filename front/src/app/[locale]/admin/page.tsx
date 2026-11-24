import { ArrowRight } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { requireStaff } from '@/features/auth/guard';
import { OwnerShell } from '@/features/owner/OwnerShell';
import { PublishCard } from '@/features/owner/PublishCard';
import { getReadiness } from '@/features/owner/readiness';
import { ReadinessChecklist } from '@/features/owner/ReadinessChecklist';
import { RestaurantStatusBadge } from '@/features/owner/RestaurantStatusBadge';
import { SECTION_META } from '@/features/owner/sections';
import { fetchManagedRestaurant } from '@/features/restaurants/data';
import { Link, redirect } from '@/i18n/navigation';

export default async function AdminHomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireStaff(locale, '/admin');

  if (user.role === 'MODERATOR') {
    redirect({ href: '/admin/users', locale });
  }

  // Экраны модератора (M1–M3) будут позже
  if (user.role !== 'OWNER') {
    const to = await getTranslations('owner');
    return (
      <section className="rounded-3xl bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold">{to('dashboardTitle')}</h1>
        <p className="mt-2 text-neutral-500">{to('dashboardNext')}</p>
      </section>
    );
  }

  const t = await getTranslations('panel');
  const tw = await getTranslations('workspace');
  const restaurant = await fetchManagedRestaurant();
  const readiness = getReadiness(restaurant);

  const sectionName = (key: keyof typeof SECTION_META) => t(SECTION_META[key].nav);
  const lower = (key: keyof typeof SECTION_META) => sectionName(key).toLocaleLowerCase(locale);
  const next = readiness.missing[0];
  const percent = Math.round((readiness.readyCount / readiness.total) * 100);

  let title: string;
  let subtitle: string;
  if (restaurant.status === 'PUBLISHED') {
    title = t('overviewTitlePublished');
    subtitle = t('overviewSubPublished', { name: restaurant.name });
  } else if (!next) {
    title = t('overviewTitleReady');
    subtitle = t('overviewSubReady');
  } else if (readiness.missing.length === 1) {
    title = t('overviewTitleAlmost');
    subtitle = t('overviewSubAlmost', { name: restaurant.name, section: lower(next) });
  } else {
    title = t('overviewTitleSetup');
    subtitle = t('overviewSubSetup', {
      name: restaurant.name,
      count: readiness.missing.length,
    });
  }

  return (
    <OwnerShell restaurant={restaurant} readiness={readiness} active="overview">
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs font-semibold tracking-wide text-orange-500 uppercase">
          {t('labelOnboarding')}
        </p>
        <RestaurantStatusBadge status={restaurant.status} />
      </div>

      <h1 className="mt-5 text-4xl font-bold">{title}</h1>
      <p className="mt-3 text-neutral-500">{subtitle}</p>

      <section className="mt-6 rounded-3xl bg-white p-8 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">
              {t('progressTitle', { ready: readiness.readyCount, total: readiness.total })}
            </h2>
            <p className="mt-2 text-sm text-neutral-500">
              {next
                ? t('progressHintMissing', { section: sectionName(next) })
                : t('progressHintDone')}
            </p>
          </div>
          {next ? (
            <Link
              href={SECTION_META[next].href}
              className="flex items-center gap-2 rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white hover:bg-orange-600"
            >
              <ArrowRight className="h-4 w-4" aria-hidden />
              {t(SECTION_META[next].action)}
            </Link>
          ) : restaurant.status === 'PUBLISHED' ? (
            <Link
              href="/admin/bookings"
              className="flex items-center gap-2 rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white hover:bg-orange-600"
            >
              <ArrowRight className="h-4 w-4" aria-hidden />
              {tw('openWorkspace')}
            </Link>
          ) : (
            <a
              href="#publication"
              className="flex items-center gap-2 rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white hover:bg-orange-600"
            >
              <ArrowRight className="h-4 w-4" aria-hidden />
              {t('actionPublish')}
            </a>
          )}
        </div>
        <div
          role="progressbar"
          aria-label={t('progressTitle', { ready: readiness.readyCount, total: readiness.total })}
          aria-valuemin={0}
          aria-valuemax={readiness.total}
          aria-valuenow={readiness.readyCount}
          className="mt-6 h-1.5 overflow-hidden rounded-full bg-neutral-200"
        >
          <div className="h-full rounded-full bg-orange-500" style={{ width: `${percent}%` }} />
        </div>
      </section>

      <div className="mt-6">
        <ReadinessChecklist restaurant={restaurant} readiness={readiness} />
      </div>

      <div className="mt-6">
        <PublishCard restaurant={restaurant} readiness={readiness} />
      </div>
    </OwnerShell>
  );
}
