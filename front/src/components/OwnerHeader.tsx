import { LogOut } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { logoutAction } from '@/features/auth/actions';
import { getCurrentUser } from '@/features/auth/session';
import { fetchManagedRestaurant } from '@/features/restaurants/data';
import { Link } from '@/i18n/navigation';
import { LocaleSwitcher } from './LocaleSwitcher';

export async function OwnerHeader() {
  const t = await getTranslations('owner');
  const user = await getCurrentUser();
  // Владельцу показываем название его ресторана, остальным имя аккаунта
  const restaurant =
    user?.role === 'OWNER' && !user.mustChangePassword ? await fetchManagedRestaurant() : null;
  const accountLabel = restaurant?.name ?? user?.displayName;

  return (
    <header className="mx-auto mt-8 flex max-w-6xl items-center justify-between gap-4 rounded-full bg-white px-8 py-4 shadow-[0_0_40px_rgba(0,0,0,0.08)]">
      <div className="flex items-center gap-4">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[#FDE7E0]" />
          <span className="text-xl font-semibold">TableMint</span>
        </Link>
        <span aria-hidden className="hidden h-6 w-px bg-neutral-200 sm:block" />
        <span className="hidden text-sm text-neutral-500 sm:block">
          {user?.role === 'MODERATOR' ? t('cabinetModerator') : t('cabinetOwner')}
        </span>
      </div>

      <div className="flex items-center gap-4 text-sm">
        {accountLabel && (
          <span className="hidden max-w-[12rem] truncate sm:block">{accountLabel}</span>
        )}
        <LocaleSwitcher />
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex items-center gap-2 rounded-full px-3 py-2 text-neutral-600 hover:bg-neutral-100"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            {t('logout')}
          </button>
        </form>
      </div>
    </header>
  );
}
