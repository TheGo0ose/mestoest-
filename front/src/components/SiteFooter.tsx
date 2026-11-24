import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';

export function SiteFooter() {
  const t = useTranslations('footer');

  return (
    <footer className="mx-auto mt-12 flex max-w-6xl items-center justify-between border-t border-neutral-200 px-6 py-6 text-sm">
      <span className="font-semibold">TableMint</span>
      <Link href="/" className="flex items-center gap-1 text-orange-500 hover:underline">
        {t('back')}
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    </footer>
  );
}
