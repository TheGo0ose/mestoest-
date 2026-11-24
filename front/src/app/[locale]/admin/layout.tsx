import type { ReactNode } from 'react';
import { setRequestLocale } from 'next-intl/server';
import { OwnerHeader } from '@/components/OwnerHeader';

export default async function AdminLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <OwnerHeader />
      <main className="mx-auto max-w-6xl px-6 pt-8 pb-16">{children}</main>
    </>
  );
}
