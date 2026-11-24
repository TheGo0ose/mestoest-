import Image from 'next/image';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ChangePasswordForm } from '@/features/auth/ChangePasswordForm';
import { requireStaff } from '@/features/auth/guard';
import { fetchManagedRestaurant } from '@/features/restaurants/data';
import { redirect } from '@/i18n/navigation';

export default async function FirstLoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await requireStaff(locale, '/admin/password', { allowPasswordChange: true });
  // Пароль уже сменён: здесь делать нечего
  if (!user.mustChangePassword) redirect({ href: '/admin', locale });

  const t = await getTranslations('owner');
  const restaurant = user.role === 'OWNER' ? await fetchManagedRestaurant() : null;

  return (
    <div className={`grid gap-8 ${restaurant ? 'lg:grid-cols-[440px_1fr]' : ''}`}>
      {restaurant && (
        <aside className="relative min-h-[560px] overflow-hidden rounded-[32px] bg-gradient-to-br from-orange-100 to-orange-50 shadow-sm lg:min-h-[760px]">
          {restaurant.image && (
            <Image
              src={restaurant.image}
              alt=""
              fill
              priority
              sizes="440px"
              className="object-cover"
            />
          )}
          <div className="absolute inset-x-4 bottom-4 rounded-3xl border border-white/60 bg-white/40 p-6 backdrop-blur-xl">
            <p className="text-xs font-semibold tracking-wide text-orange-500 uppercase">
              {t('yourRestaurant')}
            </p>
            <h2 className="mt-3 text-3xl font-bold">{restaurant.name}</h2>
            <p className="mt-3 text-neutral-800">{restaurant.description}</p>
            <hr className="my-4 border-white/70" />
            <p className="text-sm text-neutral-800">{t('moderatorCreated')}</p>
          </div>
        </aside>
      )}

      <section className="w-full max-w-2xl">
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs font-semibold tracking-wide text-orange-500 uppercase">
            {t('firstLogin')}
          </p>
          <span className="rounded-full bg-[#FDE7E0] px-4 py-1.5 text-xs font-semibold text-orange-600">
            {t('requiredStep')}
          </span>
        </div>

        <h1 className="mt-6 max-w-md text-5xl font-bold text-balance">{t('passwordTitle')}</h1>
        <p className="mt-4 text-neutral-500">{t('passwordIntro')}</p>

        <ChangePasswordForm />
      </section>
    </div>
  );
}
