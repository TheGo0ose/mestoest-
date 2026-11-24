'use client';

import { useActionState } from 'react';
import { Lock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ApiMessage } from '@/components/ApiMessage';
import { changePasswordAction } from './actions';
import { PasswordField } from './PasswordField';
import type { AuthState } from './types';

const initialState: AuthState = { problem: null, values: {} };

export function ChangePasswordForm() {
  const t = useTranslations('owner');
  const [state, formAction, pending] = useActionState(changePasswordAction, initialState);
  const errors = state.problem?.fieldErrors ?? {};

  return (
    <form action={formAction} noValidate className="mt-6 space-y-6">
      <div aria-live="polite">{state.problem && <ApiMessage problem={state.problem} />}</div>

      <PasswordField
        id="current-password"
        name="currentPassword"
        label={t('currentPassword')}
        autoComplete="current-password"
        error={errors.currentPassword}
      />
      <PasswordField
        id="new-password"
        name="newPassword"
        label={t('newPassword')}
        autoComplete="new-password"
        hint={t('newPasswordHint')}
        error={errors.newPassword}
      />
      <PasswordField
        id="confirm-password"
        name="confirmPassword"
        label={t('confirmPassword')}
        autoComplete="new-password"
        error={errors.confirmPassword}
      />

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-orange-500 px-8 py-3 text-sm font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? t('savingPassword') : t('savePassword')}
      </button>

      <p className="flex items-start gap-3 rounded-2xl bg-white p-4 text-sm text-neutral-500 shadow-sm">
        <Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        {t('limitedAccess')}
      </p>
    </form>
  );
}
