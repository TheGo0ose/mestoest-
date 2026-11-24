'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { SelectField } from '@/components/SelectField';
import { useRouter } from '@/i18n/navigation';

export function UserFilters({ q, role, status }: { q: string; role: string; status: string }) {
  const t = useTranslations('moderator');
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState(q);

  function pushQuery(newQ: string, newRole: string, newStatus: string) {
    const query: Record<string, string> = {};
    if (newQ.trim()) query.q = newQ.trim();
    if (newRole) query.role = newRole;
    if (newStatus) query.status = newStatus;
    router.replace({ pathname: '/admin/users', query });
  }

  // Дебаунс ввода поиска
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== q) {
        const query: Record<string, string> = {};
        if (searchTerm.trim()) query.q = searchTerm.trim();
        if (role) query.role = role;
        if (status) query.status = status;
        router.replace({ pathname: '/admin/users', query });
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm, q, role, status, router]);

  return (
    <section className="rounded-3xl bg-white p-8 shadow-sm">
      <div className="space-y-4">
        <div>
          <label htmlFor="user-search" className="text-sm font-semibold text-neutral-800">
            {t('searchLabel')}
          </label>
          <input
            id="user-search"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="mt-3 w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3.5 text-sm outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            id="user-role-filter"
            label={t('filterRole')}
            value={role}
            onChange={(v) => pushQuery(searchTerm, v, status)}
          >
            <option value="">{t('allRoles')}</option>
            <option value="MODERATOR">{t('roleModerator')}</option>
            <option value="OWNER">{t('roleOwner')}</option>
            <option value="CUSTOMER">{t('roleCustomer')}</option>
          </SelectField>

          <SelectField
            id="user-status-filter"
            label={t('filterStatus')}
            value={status}
            onChange={(v) => pushQuery(searchTerm, role, v)}
          >
            <option value="">{t('allStatuses')}</option>
            <option value="ACTIVE">{t('statusActive')}</option>
            <option value="DISABLED">{t('statusDisabled')}</option>
          </SelectField>
        </div>
      </div>
    </section>
  );
}
