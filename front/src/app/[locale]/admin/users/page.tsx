import { Info, UserPlus } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { requireStaff } from '@/features/auth/guard';
import { ModeratorShell } from '@/features/moderator/ModeratorShell';
import { listPlatformUsers } from '@/features/moderator/moderatorStore';
import { UserFilters } from '@/features/moderator/UserFilters';
import { UserToggleButton } from '@/features/moderator/UserToggleButton';
import { Link, redirect } from '@/i18n/navigation';

type SearchParams = {
  q?: string | string[];
  role?: string | string[];
  status?: string | string[];
};

const one = (v: string | string[] | undefined) => (typeof v === 'string' ? v : '');

const COLUMNS = 'md:grid-cols-[1.5fr_1fr_1fr_1fr]';

export default async function ModeratorUsersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const currentUser = await requireStaff(locale, '/admin/users');
  if (currentUser.role !== 'MODERATOR') {
    redirect({ href: '/admin', locale });
  }

  const sp = await searchParams;
  const q = one(sp.q).trim();
  const role = ['MODERATOR', 'OWNER', 'CUSTOMER'].includes(one(sp.role)) ? one(sp.role) : '';
  const status = ['ACTIVE', 'DISABLED'].includes(one(sp.status)) ? one(sp.status) : '';

  const t = await getTranslations('moderator');
  const allUsers = listPlatformUsers();

  const total = allUsers.length;
  const activeCount = allUsers.filter((u) => u.status === 'ACTIVE').length;
  const disabledCount = allUsers.filter((u) => u.status === 'DISABLED').length;

  const shown = allUsers.filter((u) => {
    if (q) {
      const matchName = u.displayName.toLowerCase().includes(q.toLowerCase());
      const matchEmail = u.email.toLowerCase().includes(q.toLowerCase());
      if (!matchName && !matchEmail) return false;
    }
    if (role && u.role !== role) return false;
    if (status && u.status !== status) return false;
    return true;
  });

  const roleLabels: Record<string, string> = {
    MODERATOR: t('roleModerator'),
    OWNER: t('roleOwner'),
    CUSTOMER: t('roleCustomer'),
  };

  return (
    <ModeratorShell active="users">
      <p className="text-xs font-semibold tracking-wide text-orange-500 uppercase">{t('label')}</p>
      <h1 className="mt-5 text-4xl font-bold">{t('usersTitle')}</h1>
      <p className="mt-3 text-neutral-500">{t('usersSubtitle')}</p>

      {/* Верхняя плашка статистики и кнопка создания владельца */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-neutral-600">
          {t('usersSummary', {
            total,
            active: activeCount,
            disabled: disabledCount,
          })}
        </p>

        <Link
          href="/admin/users/create"
          className="flex items-center gap-2 rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-orange-600"
        >
          <UserPlus className="h-4 w-4" aria-hidden />
          <span>{t('createOwner')}</span>
        </Link>
      </div>

      {/* Фильтры */}
      <div className="mt-6">
        <UserFilters q={q} role={role} status={status} />
      </div>

      {/* Таблица пользователей */}
      <section className="mt-6 rounded-3xl bg-white p-8 shadow-sm">
        <h2 className="text-xl font-semibold text-neutral-900">{t('usersTitle')}</h2>

        {shown.length === 0 ? (
          <p className="mt-8 rounded-2xl bg-neutral-50 p-6 text-center text-neutral-500">
            {t('shownAll', { count: 0 })}
          </p>
        ) : (
          <>
            <div
              className={`mt-8 hidden gap-4 border-b border-neutral-200 pb-3 text-xs font-medium tracking-wide text-neutral-500 uppercase md:grid ${COLUMNS}`}
            >
              <span>{t('colUser')}</span>
              <span>{t('colRole')}</span>
              <span>{t('colStatus')}</span>
              <span>{t('colActions')}</span>
            </div>

            <ul>
              {shown.map((u) => {
                const isSelf =
                  u.email.toLowerCase() === currentUser.email.toLowerCase() ||
                  (u.id === 'mod-1' &&
                    currentUser.role === 'MODERATOR' &&
                    !allUsers.some(
                      (x) => x.email.toLowerCase() === currentUser.email.toLowerCase(),
                    ));

                return (
                  <li
                    key={u.id}
                    className={`grid gap-3 border-b border-neutral-100 py-5 md:items-center md:gap-4 ${COLUMNS}`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-neutral-900">
                          {u.displayName}
                        </span>
                        {isSelf && (
                          <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700">
                            {t('selfBadge')}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-neutral-500">{u.email}</p>
                    </div>

                    <span className="text-sm text-neutral-700">{roleLabels[u.role] ?? u.role}</span>

                    <div>
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                          u.status === 'ACTIVE'
                            ? 'bg-[#E6F4EA] text-[#1E7B3C]'
                            : 'bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        {u.status === 'ACTIVE' ? t('statusActive') : t('statusDisabled')}
                      </span>
                    </div>

                    <div className="text-xs">
                      {isSelf ? (
                        <span className="text-neutral-400">{t('actionUnavailable')}</span>
                      ) : (
                        <UserToggleButton
                          userId={u.id}
                          userName={u.displayName}
                          status={u.status}
                          locale={locale}
                        />
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>

            <p className="mt-6 text-xs text-neutral-500">
              {t('shownAll', { count: shown.length })}
            </p>
          </>
        )}
      </section>

      {/* Информационный блок */}
      <div className="mt-6 flex items-start gap-3 rounded-2xl bg-neutral-50 p-4">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
        <div className="text-xs text-neutral-600">
          <p className="font-semibold text-neutral-800">{t('cannotDisableSelf')}</p>
          <p className="mt-0.5 text-neutral-500">{t('disableWarning')}</p>
        </div>
      </div>

      {/* Примечание */}
      <p className="mt-4 text-xs text-neutral-400">{t('fictionalNote')}</p>
    </ModeratorShell>
  );
}
