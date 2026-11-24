import { setRequestLocale } from 'next-intl/server';
import { AuthShell } from '@/features/auth/AuthShell';
import { RegisterForm } from '@/features/auth/RegisterForm';
import { getCurrentUser } from '@/features/auth/session';
import { redirect } from '@/i18n/navigation';
import { landingPath } from '@/features/auth/guard';

export default async function RegisterPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const next = typeof sp.next === 'string' ? sp.next : '';

  const user = await getCurrentUser();
  if (user) redirect({ href: landingPath(user, next), locale });

  return (
    <AuthShell>
      <RegisterForm next={next} />
    </AuthShell>
  );
}
