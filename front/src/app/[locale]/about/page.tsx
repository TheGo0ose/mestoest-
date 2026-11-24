import { ArrowRight, Bot, ShieldCheck, Store, UtensilsCrossed } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { BackgroundDecor } from '@/components/BackgroundDecor';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import { Link } from '@/i18n/navigation';

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('about');

  return (
    <>
      <BackgroundDecor />
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-6 py-12">
        {/* ─── Hero Section ──────────────────────────────── */}
        <section className="text-center">
          <span className="inline-block rounded-full bg-orange-100 px-4 py-1.5 text-xs font-bold tracking-wider text-orange-600 uppercase">
            {t('badge')}
          </span>
          <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-extrabold tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl">
            {t('title')}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base text-neutral-600 sm:text-lg">
            {t('subtitle')}
          </p>
        </section>

        {/* ─── Stats Numbers ─────────────────────────────── */}
        <section className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-3xl border border-neutral-100 bg-white p-7 text-center shadow-sm">
            <span className="text-4xl font-extrabold text-[#E55B3C] sm:text-5xl">
              {t('statOverlapsValue')}
            </span>
            <p className="mt-2 text-xs font-semibold text-neutral-500 sm:text-sm">
              {t('statOverlapsLabel')}
            </p>
          </div>
          <div className="rounded-3xl border border-neutral-100 bg-white p-7 text-center shadow-sm">
            <span className="text-4xl font-extrabold text-neutral-900 sm:text-5xl">
              {t('statSittingValue')}
            </span>
            <p className="mt-2 text-xs font-semibold text-neutral-500 sm:text-sm">
              {t('statSittingLabel')}
            </p>
          </div>
          <div className="rounded-3xl border border-neutral-100 bg-white p-7 text-center shadow-sm">
            <span className="text-4xl font-extrabold text-neutral-900 sm:text-5xl">
              {t('statAdvanceValue')}
            </span>
            <p className="mt-2 text-xs font-semibold text-neutral-500 sm:text-sm">
              {t('statAdvanceLabel')}
            </p>
          </div>
        </section>

        {/* ─── Key Features Grid ─────────────────────────── */}
        <section className="mt-16">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-neutral-900 sm:text-3xl">
              {t('featuresTitle')}
            </h2>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Карточка 1: Для гостей */}
            <div className="rounded-3xl border border-neutral-100 bg-white p-8 shadow-sm transition hover:shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FDE7E0] text-[#E55B3C]">
                <UtensilsCrossed className="h-6 w-6" aria-hidden />
              </div>
              <h3 className="mt-5 text-xl font-bold text-neutral-900">{t('featureGuestsTitle')}</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                {t('featureGuestsDesc')}
              </p>
            </div>

            {/* Карточка 2: Без наложений */}
            <div className="rounded-3xl border border-neutral-100 bg-white p-8 shadow-sm transition hover:shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E6F4EA] text-[#1E7B3C]">
                <ShieldCheck className="h-6 w-6" aria-hidden />
              </div>
              <h3 className="mt-5 text-xl font-bold text-neutral-900">
                {t('featureOverlapsTitle')}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                {t('featureOverlapsDesc')}
              </p>
            </div>

            {/* Карточка 3: Для рестораторов */}
            <div className="rounded-3xl border border-neutral-100 bg-white p-8 shadow-sm transition hover:shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
                <Store className="h-6 w-6" aria-hidden />
              </div>
              <h3 className="mt-5 text-xl font-bold text-neutral-900">{t('featureOwnersTitle')}</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                {t('featureOwnersDesc')}
              </p>
            </div>

            {/* Карточка 4: Telegram-бот */}
            <div className="rounded-3xl border border-neutral-100 bg-white p-8 shadow-sm transition hover:shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <Bot className="h-6 w-6" aria-hidden />
              </div>
              <h3 className="mt-5 text-xl font-bold text-neutral-900">{t('featureBotTitle')}</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">{t('featureBotDesc')}</p>
            </div>
          </div>
        </section>

        {/* ─── How it works (3 Steps) ───────────────────── */}
        <section className="mt-16 rounded-3xl border border-neutral-100 bg-white p-8 shadow-sm sm:p-12">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-neutral-900 sm:text-3xl">{t('stepsTitle')}</h2>
            <p className="mt-2 text-sm text-neutral-500">{t('stepsSubtitle')}</p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Step 1 */}
            <div className="relative flex flex-col">
              <span className="text-3xl font-extrabold text-orange-400 sm:text-4xl">
                {t('step1Num')}
              </span>
              <h3 className="mt-3 text-lg font-bold text-neutral-900">{t('step1Title')}</h3>
              <p className="mt-2 text-xs leading-relaxed text-neutral-600 sm:text-sm">
                {t('step1Desc')}
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative flex flex-col">
              <span className="text-3xl font-extrabold text-orange-400 sm:text-4xl">
                {t('step2Num')}
              </span>
              <h3 className="mt-3 text-lg font-bold text-neutral-900">{t('step2Title')}</h3>
              <p className="mt-2 text-xs leading-relaxed text-neutral-600 sm:text-sm">
                {t('step2Desc')}
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative flex flex-col">
              <span className="text-3xl font-extrabold text-orange-400 sm:text-4xl">
                {t('step3Num')}
              </span>
              <h3 className="mt-3 text-lg font-bold text-neutral-900">{t('step3Title')}</h3>
              <p className="mt-2 text-xs leading-relaxed text-neutral-600 sm:text-sm">
                {t('step3Desc')}
              </p>
            </div>
          </div>
        </section>

        {/* ─── Call to Action ───────────────────────────── */}
        <section className="mt-16 rounded-3xl bg-neutral-900 p-8 text-center text-white sm:p-12">
          <h2 className="text-2xl font-bold sm:text-3xl lg:text-4xl">{t('ctaTitle')}</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-neutral-400 sm:text-base">
            {t('ctaSubtitle')}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600"
            >
              {t('ctaCatalog')}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 rounded-full border border-neutral-700 bg-neutral-800 px-6 py-3 text-sm font-semibold text-neutral-200 transition hover:bg-neutral-700"
            >
              {t('ctaCabinet')}
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
