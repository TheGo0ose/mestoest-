'use client';

import { useState } from 'react';
import { AlertCircle, ArrowRight, Check, Copy, Info, Lock, UserPlus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ApiProblem } from '@/api/problem';
import { Link } from '@/i18n/navigation';
import { createOwnerAction } from './actions';
import type { CreateOwnerResult } from './moderator';

export function CreateOwnerForm({ locale }: { locale: string }) {
  const t = useTranslations('moderator');

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [accountLocale, setAccountLocale] = useState<'ru' | 'en'>(locale === 'en' ? 'en' : 'ru');

  const [pending, setPending] = useState(false);
  const [problem, setProblem] = useState<ApiProblem | null>(null);
  const [result, setResult] = useState<CreateOwnerResult | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;

    setPending(true);
    setProblem(null);

    try {
      const res = await createOwnerAction(locale, {
        displayName,
        email,
        phone,
        locale: accountLocale,
      });

      if (res.problem) {
        setProblem(res.problem);
      } else if (res.result) {
        setResult(res.result);
      }
    } catch {
      setProblem({ code: 'NETWORK_ERROR', title: 'Network error' });
    } finally {
      setPending(false);
    }
  }

  async function handleCopy() {
    if (!result) return;
    const textToCopy = `Email: ${result.user.email}\nPassword: ${result.tempPassword}`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
    }
  }

  // ─── Состояние после успешного создания ───────────────────
  if (result) {
    return (
      <div className="space-y-6">
        <section className="rounded-3xl bg-white p-8 shadow-sm">
          {/* Заголовок результата */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-neutral-900">{t('resultTitle')}</h2>
            <span className="rounded-full bg-[#E6F4EA] px-3 py-1 text-xs font-semibold text-[#1E7B3C]">
              {t('resultBadge')}
            </span>
          </div>

          {/* Карточка созданного пользователя */}
          <div className="mt-6 flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#E6F4EA] text-[#1E7B3C]">
              <Check className="h-6 w-6" aria-hidden />
            </div>
            <div>
              <h3 className="text-xl font-bold text-neutral-900">{result.user.displayName}</h3>
              <p className="mt-0.5 text-xs text-neutral-500">
                {t('resultSummary', {
                  role: t('roleOwner'),
                  locale: result.user.locale === 'ru' ? 'Русский' : 'English',
                })}
              </p>
            </div>
          </div>

          {/* Данные для входа */}
          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-neutral-100 bg-neutral-50 p-4">
              <p className="text-[11px] font-semibold tracking-wide text-neutral-400 uppercase">
                {t('resultEmailLabel')}
              </p>
              <p className="mt-1 text-base font-semibold text-neutral-900">{result.user.email}</p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-neutral-100 bg-neutral-50 p-4">
              <div>
                <p className="text-[11px] font-semibold tracking-wide text-neutral-400 uppercase">
                  {t('resultPasswordLabel')}
                </p>
                <p className="mt-1 font-mono text-2xl font-bold tracking-wider text-neutral-900">
                  {result.tempPassword}
                </p>
              </div>

              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-[#1E7B3C]" aria-hidden />
                    <span>{t('dataCopied')}</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 text-neutral-500" aria-hidden />
                    <span>{t('copyData')}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Предупреждение о сохранении */}
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />
            <div className="text-xs">
              <p className="font-semibold text-amber-900">{t('saveWarningTitle')}</p>
              <p className="mt-0.5 text-amber-800">{t('saveWarningText')}</p>
            </div>
          </div>

          {/* Примечание */}
          <p className="mt-6 text-xs text-neutral-500">{t('resultNote')}</p>

          {/* Кнопки перехода */}
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
            <Link
              href="/admin/users"
              className="rounded-full border border-neutral-300 px-6 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
            >
              {t('toUsers')}
            </Link>

            <Link
              href="/admin/restaurants"
              className="flex items-center gap-2 rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-orange-600"
            >
              <span>{t('createRestaurant')}</span>
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </section>

        <p className="text-xs text-neutral-400">{t('resultFictional')}</p>
      </div>
    );
  }

  // ─── Форма до отправки ─────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="rounded-3xl bg-white p-8 shadow-sm">
        {/* Заголовок формы */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-neutral-900">{t('formTitle')}</h2>
          <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
            {t('formBadge')}
          </span>
        </div>
        <p className="mt-2 text-xs text-neutral-500">{t('formHint')}</p>

        {/* Поля ввода */}
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          {/* Имя */}
          <div>
            <label htmlFor="owner-name" className="text-sm font-semibold text-neutral-800">
              {t('fieldName')} *
            </label>
            <input
              id="owner-name"
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Мира Асанова"
              className="mt-2 w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-400"
            />
            {problem?.fieldErrors?.displayName && (
              <p className="mt-1 text-xs text-[#B8432B]">{problem.fieldErrors.displayName}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="owner-email" className="text-sm font-semibold text-neutral-800">
              {t('fieldEmail')} *
            </label>
            <input
              id="owner-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="mira.owner@example.com"
              className="mt-2 w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-400"
            />
            {problem?.fieldErrors?.email && (
              <p className="mt-1 text-xs text-[#B8432B]">{problem.fieldErrors.email}</p>
            )}
          </div>

          {/* Телефон */}
          <div>
            <label htmlFor="owner-phone" className="text-sm font-semibold text-neutral-800">
              {t('fieldPhone')}
            </label>
            <input
              id="owner-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+996 700 000 201"
              className="mt-2 w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          {/* Язык аккаунта */}
          <div>
            <label className="text-sm font-semibold text-neutral-800">{t('fieldLocale')} *</label>
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAccountLocale('ru')}
                className={`rounded-full px-5 py-2.5 text-xs font-semibold transition ${
                  accountLocale === 'ru'
                    ? 'bg-orange-500 text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                {t('localeRu')}
              </button>
              <button
                type="button"
                onClick={() => setAccountLocale('en')}
                className={`rounded-full px-5 py-2.5 text-xs font-semibold transition ${
                  accountLocale === 'en'
                    ? 'bg-orange-500 text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                {t('localeEn')}
              </button>
            </div>
            <p className="mt-1.5 text-xs text-neutral-400">{t('localeHint')}</p>
          </div>
        </div>

        {/* Фиксированная роль */}
        <div className="mt-6 flex items-center justify-between rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
          <div>
            <p className="text-sm font-semibold text-neutral-900">{t('lockedRole')}</p>
            <p className="mt-0.5 text-xs text-neutral-500">{t('lockedRoleHint')}</p>
          </div>
          <Lock className="h-4 w-4 text-neutral-400" aria-hidden />
        </div>

        {/* Информация о создании пароля */}
        <div className="mt-6 flex items-start gap-3 rounded-2xl bg-neutral-50 p-4">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
          <div className="text-xs">
            <p className="font-semibold text-neutral-800">{t('passwordSystemInfo')}</p>
            <p className="mt-0.5 text-neutral-500">{t('passwordSystemHint')}</p>
          </div>
        </div>

        {/* Общая ошибка */}
        {problem && <p className="mt-4 text-xs font-semibold text-[#B8432B]">{problem.title}</p>}

        {/* Кнопки формы */}
        <div className="mt-8 flex items-center justify-between">
          <Link
            href="/admin/users"
            className="rounded-full border border-neutral-300 px-6 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
          >
            {t('cancelForm')}
          </Link>

          <button
            type="submit"
            disabled={pending}
            className="flex items-center gap-2 rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-orange-600 disabled:opacity-60"
          >
            <UserPlus className="h-4 w-4" aria-hidden />
            <span>{pending ? t('creating') : t('submitCreateOwner')}</span>
          </button>
        </div>
      </section>
    </form>
  );
}
