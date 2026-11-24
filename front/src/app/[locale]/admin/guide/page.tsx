import {
  AlertCircle,
  ArrowRight,
  Calendar,
  CalendarX2,
  CheckCircle2,
  Clock,
  FileText,
  KeyRound,
  LogOut,
  RotateCw,
  ShieldAlert,
  UserX,
} from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { requireStaff } from '@/features/auth/guard';
import {
  StateActionButton,
  StateAlert,
  StateCard,
  StateDisabledButton,
  StateNeutralAlert,
  StateOutlineButton,
} from '@/features/moderator/StateCard';
import { redirect } from '@/i18n/navigation';

export default async function StatesGuidePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await requireStaff(locale, '/admin/guide');
  if (user.role !== 'MODERATOR') {
    redirect({ href: '/admin', locale });
  }

  const t = await getTranslations('guide');

  return (
    <div className="pb-12">
      {/* Шапка страницы: бейдж/хлебные крошки, H1 и подзаголовок */}
      <div>
        <p className="text-xs font-semibold tracking-wider text-[#E55B3C] uppercase">
          {t('label')}
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
          {t('title')}
        </h1>
        <p className="mt-2 text-sm text-neutral-500 sm:text-base">{t('subtitle')}</p>
      </div>

      {/* Сетка карточек 2 колонки */}
      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* ─── 1. Загрузка ──────────────────────────────── */}
        <StateCard label={t('loadingLabel')} icon={RotateCw}>
          <h3 className="text-base font-bold text-neutral-900 sm:text-lg">{t('loadingTitle')}</h3>
          <p className="mt-1 text-xs text-neutral-500">{t('loadingText')}</p>

          {/* Скелетоны */}
          <div className="mt-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-3.5 w-28 rounded-full bg-neutral-100" />
              <div className="h-3.5 w-52 rounded-full bg-neutral-100" />
            </div>
            <div className="flex items-center gap-3">
              <div className="h-3.5 w-28 rounded-full bg-neutral-100" />
              <div className="h-3.5 w-60 rounded-full bg-neutral-100" />
            </div>
            <div className="flex items-center gap-3">
              <div className="h-3.5 w-28 rounded-full bg-neutral-100" />
              <div className="h-3.5 w-40 rounded-full bg-neutral-100" />
            </div>
          </div>
        </StateCard>

        {/* ─── 2. Пустой список A7 ─────────────────────── */}
        <StateCard label={t('emptyLabel')} icon={Calendar}>
          <h3 className="text-base font-bold text-neutral-900 sm:text-lg">{t('emptyTitle')}</h3>
          <p className="mt-1 text-xs text-neutral-500">{t('emptyText')}</p>
          <div className="mt-5">
            <StateActionButton icon={Calendar}>{t('emptyAction')}</StateActionButton>
          </div>
        </StateCard>

        {/* ─── 3. 403 Доступ ───────────────────────────── */}
        <StateCard label={t('forbiddenLabel')} icon={ShieldAlert}>
          <h3 className="text-base font-bold text-neutral-900 sm:text-lg">{t('forbiddenTitle')}</h3>
          <div className="mt-3">
            <StateAlert>{t('forbiddenAlert')}</StateAlert>
          </div>
          <p className="mt-3 text-xs text-neutral-500">{t('forbiddenText')}</p>
          <div className="mt-5">
            <StateActionButton>{t('forbiddenAction')}</StateActionButton>
          </div>
        </StateCard>

        {/* ─── 4. 404 Не найдено ───────────────────────── */}
        <StateCard label={t('notFoundLabel')} icon={FileText}>
          <h3 className="text-base font-bold text-neutral-900 sm:text-lg">{t('notFoundTitle')}</h3>
          <div className="mt-3">
            <StateNeutralAlert>{t('notFoundAlert')}</StateNeutralAlert>
          </div>
          <p className="mt-3 text-xs text-neutral-500">{t('notFoundText')}</p>
          <div className="mt-5">
            <StateActionButton>{t('notFoundAction')}</StateActionButton>
          </div>
        </StateCard>

        {/* ─── 5. Конфликт (бронь изменилась) ──────────── */}
        <StateCard label={t('conflictLabel')} icon={CalendarX2}>
          <h3 className="text-base font-bold text-neutral-900 sm:text-lg">{t('conflictTitle')}</h3>
          <div className="mt-3">
            <StateAlert>{t('conflictAlert')}</StateAlert>
          </div>
          <p className="mt-3 text-xs text-neutral-500">{t('conflictText')}</p>
          <div className="mt-5">
            <StateActionButton icon={RotateCw}>{t('conflictAction')}</StateActionButton>
          </div>
        </StateCard>

        {/* ─── 6. Лимит попыток 429 ────────────────────── */}
        <StateCard label={t('rateLimitLabel')} icon={Clock}>
          <h3 className="text-base font-bold text-neutral-900 sm:text-lg">{t('rateLimitTitle')}</h3>
          <div className="mt-3">
            <StateAlert>{t('rateLimitAlert')}</StateAlert>
          </div>
          <p className="mt-3 text-xs text-neutral-500">{t('rateLimitText')}</p>
          <div className="mt-5">
            <StateDisabledButton>{t('rateLimitAction')}</StateDisabledButton>
          </div>
        </StateCard>

        {/* ─── 7. Валидация формы (смена пароля) ────────── */}
        <StateCard label={t('validationLabel')} icon={KeyRound}>
          <h3 className="text-base font-bold text-neutral-900 sm:text-lg">
            {t('validationTitle')}
          </h3>
          <div className="mt-3">
            <StateAlert>{t('validationAlert')}</StateAlert>
          </div>

          <div className="mt-4 space-y-3">
            <div>
              <label className="text-xs font-semibold text-neutral-800">
                {t('validationCurrentPwd')}
              </label>
              <input
                type="password"
                readOnly
                value="••••••••••••"
                className="mt-1 w-full rounded-2xl border border-[#E55B3C] bg-white px-4 py-2.5 text-sm tracking-widest text-neutral-800 outline-none"
              />
              <p className="mt-1 text-xs text-[#E55B3C]">{t('validationCurrentError')}</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-800">
                {t('validationNewPwd')}
              </label>
              <input
                type="password"
                readOnly
                value="••••••"
                className="mt-1 w-full rounded-2xl border border-[#E55B3C] bg-white px-4 py-2.5 text-sm tracking-widest text-neutral-800 outline-none"
              />
              <p className="mt-1 text-xs text-[#E55B3C]">{t('validationNewHint')}</p>
            </div>
          </div>

          <div className="mt-5">
            <StateActionButton>{t('validationAction')}</StateActionButton>
          </div>
        </StateCard>

        {/* ─── 8. Сессия истекла ────────────────────────── */}
        <StateCard label={t('sessionLabel')} icon={LogOut}>
          <h3 className="text-base font-bold text-neutral-900 sm:text-lg">{t('sessionTitle')}</h3>
          <div className="mt-3">
            <StateAlert>{t('sessionAlert')}</StateAlert>
          </div>
          <p className="mt-3 text-xs text-neutral-500">{t('sessionText')}</p>

          <div className="mt-4 rounded-2xl border border-neutral-100 bg-neutral-50/70 p-4">
            <h4 className="text-xs font-semibold text-neutral-900">{t('sessionSecurityTitle')}</h4>
            <p className="mt-1 text-xs text-neutral-500">{t('sessionSecurityText')}</p>
          </div>

          <div className="mt-5">
            <StateActionButton iconRight={ArrowRight}>{t('sessionAction')}</StateActionButton>
          </div>
        </StateCard>

        {/* ─── 9. Подтверждение отмены брони ────────────── */}
        <StateCard label={t('cancelBookingLabel')} icon={CalendarX2}>
          <h3 className="text-base font-bold text-neutral-900 sm:text-lg">
            {t('cancelBookingTitle')}
          </h3>
          <div className="mt-2 text-xs">
            <p className="font-semibold text-neutral-800">{t('cancelBookingRef')}</p>
            <p className="mt-0.5 text-neutral-500">{t('cancelBookingDetails')}</p>
          </div>

          <div className="mt-3 rounded-2xl border border-[#FDE0D7] bg-[#FFF4EE] p-3 text-xs text-[#9B381E] sm:p-3.5">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#E55B3C]" />
              <div>
                <p className="font-semibold">{t('cancelBookingAlertTitle')}</p>
                <p className="mt-0.5">{t('cancelBookingAlertText')}</p>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <StateOutlineButton>{t('cancelBookingKeep')}</StateOutlineButton>
            <StateActionButton>{t('cancelBookingConfirm')}</StateActionButton>
          </div>
        </StateCard>

        {/* ─── 10. Отключение пользователя ─────────────── */}
        <StateCard label={t('disableUserLabel')} icon={UserX}>
          <h3 className="text-base font-bold text-neutral-900 sm:text-lg">
            {t('disableUserTitle')}
          </h3>
          <div className="mt-2 text-xs">
            <p className="font-semibold text-neutral-800">{t('disableUserName')}</p>
            <p className="mt-0.5 text-neutral-500">{t('disableUserEmail')}</p>
          </div>

          <div className="mt-3 rounded-2xl border border-[#FDE0D7] bg-[#FFF4EE] p-3 text-xs text-[#9B381E] sm:p-3.5">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#E55B3C]" />
              <div>
                <p className="font-semibold">{t('disableUserAlertTitle')}</p>
                <p className="mt-0.5">{t('disableUserAlertText')}</p>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <StateOutlineButton>{t('disableUserKeep')}</StateOutlineButton>
            <StateActionButton>{t('disableUserConfirm')}</StateActionButton>
          </div>
        </StateCard>
      </div>

      {/* ─── 11. Запрос обработан (широкая карточка внизу) ── */}
      <div className="mt-6 rounded-3xl border border-neutral-100 bg-white p-6 shadow-sm sm:p-7">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-base font-bold text-neutral-900 sm:text-lg">{t('successTitle')}</h3>
          <span className="rounded-full bg-[#E6F4EA] px-3 py-1 text-[11px] font-semibold tracking-wide text-[#1E7B3C]">
            {t('successLabel')}
          </span>
        </div>

        {/* Зелёный баннер подтверждения */}
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-[#D5EEDC] bg-[#EAF6ED] p-4 text-xs text-[#1E7B3C]">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#1E7B3C]" />
          <div>
            <p className="font-semibold">{t('successAlert')}</p>
            <p className="mt-0.5 text-[#2F855A]">{t('successHandledAt')}</p>
          </div>
        </div>

        {/* Карточка обращения */}
        <div className="mt-4 rounded-2xl border border-neutral-200/70 bg-neutral-50/80 p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h4 className="text-sm font-bold text-neutral-900">{t('successGuest')}</h4>
              <p className="mt-0.5 text-xs text-neutral-500">{t('successDetails')}</p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="rounded-full bg-[#EAF6ED] px-3 py-1 text-xs font-semibold text-[#1E7B3C]">
                {t('successHandled')}
              </span>
              <button
                type="button"
                className="rounded-full border border-neutral-200 bg-white px-4 py-1.5 text-xs font-semibold text-neutral-700 shadow-2xs hover:bg-neutral-50"
              >
                {t('successReturnNew')}
              </button>
            </div>
          </div>
          <p className="mt-3 border-t border-neutral-200/60 pt-3 text-xs text-neutral-700">
            {t('successMessage')}
          </p>
        </div>

        <p className="mt-3 text-[11px] text-neutral-400">{t('successNote')}</p>
      </div>

      {/* Футер */}
      <p className="mt-8 text-xs text-neutral-400">{t('footerNote')}</p>
    </div>
  );
}
