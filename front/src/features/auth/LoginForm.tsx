'use client';

import { useActionState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ApiMessage } from '@/components/ApiMessage';
import { Link } from '@/i18n/navigation';
import { loginAction } from './actions';
import { AuthField } from './AuthField';
import type { AuthState } from './types';

const initialState: AuthState = { problem: null, values: {} };

export function LoginForm({ next }: { next: string }) {
  const t = useTranslations('auth');
  const [state, formAction, pending] = useActionState(loginAction, initialState);
  const errors = state.problem?.fieldErrors ?? {};
  const registerHref = next ? { pathname: '/register', query: { next } } : '/register';

  return (
    <>
      <h1 className="text-center text-4xl font-bold">{t('loginTitle')}</h1>
      <p className="mt-3 text-center text-neutral-500">{t('loginSubtitle')}</p>

      <form action={formAction} noValidate className="mt-12 space-y-8">
        <input type="hidden" name="next" value={next} />

        <AuthField
          id="login-email"
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
          id="login-password"
          name="password"
          type="password"
          label={t('password')}
          autoComplete="current-password"
          error={errors.password}
          required
        />

        <div>
          <button
            type="submit"
            disabled={pending}
            className="mx-auto flex w-full max-w-[324px] items-center justify-center gap-2 rounded-full bg-orange-500 px-5 py-4 text-sm font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? t('loggingIn') : t('loginAction')}
            {!pending && <ArrowRight className="h-4 w-4" aria-hidden />}
          </button>
          <Link
            href={registerHref}
            className="mt-6 inline-block text-orange-500 underline underline-offset-4"
          >
            {t('toRegister')}
          </Link>
        </div>

        <div aria-live="polite">{state.problem && <ApiMessage problem={state.problem} />}</div>
      </form>
    </>
  );
}
