import { getTranslations, setRequestLocale } from 'next-intl/server';
import { requireStaff } from '@/features/auth/guard';
import { CreateOwnerForm } from '@/features/moderator/CreateOwnerForm';
import { ModeratorShell } from '@/features/moderator/ModeratorShell';
import { Link, redirect } from '@/i18n/navigation';

export default async function ModeratorCreateOwnerPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await requireStaff(locale, '/admin/users/create');
  if (user.role !== 'MODERATOR') {
    redirect({ href: '/admin', locale });
  }

  const t = await getTranslations('moderator');

  return (
    <ModeratorShell active="users">
      <p className="text-xs font-semibold tracking-wide text-orange-500 uppercase">
        {t('labelM2')}
      </p>
      <h1 className="mt-5 text-4xl font-bold text-neutral-900">{t('createTitle')}</h1>
      <p className="mt-3 text-neutral-500">{t('createSubtitle')}</p>

      <div className="mt-4">
        <Link
          href="/admin/users"
          className="inline-flex items-center text-xs font-semibold text-orange-600 hover:underline"
        >
          {t('backToUsers')}
        </Link>
      </div>

      <div className="mt-6">
        <CreateOwnerForm locale={locale} />
      </div>
    </ModeratorShell>
  );
}
