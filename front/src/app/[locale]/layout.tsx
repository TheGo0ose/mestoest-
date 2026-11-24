import { NextIntlClientProvider } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import '../globals.css';
import { Inter } from 'next/font/google';
const inter = Inter({ subsets: ['latin', 'cyrillic'] });

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <html lang={locale}>
      <body
        className={
          inter.className + ' relative isolate min-h-screen bg-neutral-50 text-neutral-900'
        }
      >
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
