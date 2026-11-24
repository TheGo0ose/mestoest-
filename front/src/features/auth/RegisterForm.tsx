'use client';

import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { ApiMessage } from '@/components/ApiMessage';
import { Link } from '@/i18n/navigation';
import { registerAction } from './actions';
import { AuthField } from './AuthField';
import type { AuthState } from './types';

const initialState: AuthState = { problem: null, values: {} };

export function RegisterForm({ next }: { next: string }) {
  const t = useTranslations('auth');
  const [state, formAction, pending] = useActionState(registerAction, initialState);
  const errors = state.problem?.fieldErrors ?? {};
  const loginHref = next ? { pathname: '/login', query: { next } } : '/login';

  return (
    <>
      <h1 className="text-center text-4xl font-bold">{t('registerTitle')}</h1>
      <p className="mt-3 text-center text-neutral-500">{t('registerSubtitle')}</p>

      <form action={formAction} noValidate className="mt-12 space-y-8">
        <input type="hidden" name="next" value={next} />

        <AuthField
          id="register-name"
          name="displayName"
          label={t('displayName')}
          autoComplete="name"
          defaultValue={state.values.displayName}
          error={errors.displayName}
          required
        />
        <AuthField
          id="register-email"
          name="email"
          type="email"
          label={t('email')}
          placeholder={t('emailPlaceholder')}
          autoComplete="email"
          defaultValue={state.values.email}
          error={errors.email}
          required
        />
        <AuthField
          id="register-phone"
          name="phone"
          type="tel"
          label={t('phone')}
          autoComplete="tel"
          defaultValue={state.values.phone}
          error={errors.phone}
        />
        <AuthField
          id="register-password"
          name="password"
          type="password"
          label={t('password')}
          autoComplete="new-password"
          hint={t('passwordHint')}
          error={errors.password}
          required
        />

        <div>
          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              name="consent"
              aria-invalid={errors.consent ? true : undefined}
              aria-describedby={errors.consent ? 'register-consent-error' : undefined}
              className="mt-0.5 h-4 w-4 accent-orange-500"
            />
            <span>{t('consent')}</span>
          </label>
          {errors.consent && (
            <p id="register-consent-error" className="mt-2 text-sm text-[#9A4A33]">
              {errors.consent}
            </p>
          )}
        </div>

        <div>
          <button
            type="submit"
            disabled={pending}
            className="mx-auto flex w-full max-w-[324px] items-center justify-center rounded-full bg-orange-500 px-5 py-4 text-sm font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? t('registering') : t('registerAction')}
          </button>
          <Link
            href={loginHref}
            className="mt-6 inline-block text-orange-500 underline underline-offset-4"
          >
            {t('toLogin')}
          </Link>
        </div>

        <div aria-live="polite">{state.problem && <ApiMessage problem={state.problem} />}</div>
      </form>
    </>
  );
}
