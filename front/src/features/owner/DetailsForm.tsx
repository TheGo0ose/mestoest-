'use client';

import { useActionState } from 'react';
import { Info } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ApiMessage } from '@/components/ApiMessage';
import { FormField } from '@/components/FormField';
import { Link } from '@/i18n/navigation';
import { saveDetailsAction } from './actions';
import { LockedField } from './LockedField';
import type { DetailsState, DetailsValues } from './types';

// Справочные параметры сервиса (ТЗ, раздел 1.13). Менять их в кабинете нельзя.
const FIXED = { sittingMinutes: 120, slotMinutes: 30, horizonDays: 60, leadMinutes: 60 };

export function DetailsForm({
  initial,
  city,
  published,
}: {
  initial: DetailsValues;
  city: string;
  published: boolean;
}) {
  const t = useTranslations('panel');
  const initialState: DetailsState = { problem: null, values: initial, saved: false };
  const [state, formAction, pending] = useActionState(saveDetailsAction, initialState);
  const errors = state.problem?.fieldErrors ?? {};

  return (
    <form action={formAction} noValidate className="mt-6 space-y-6">
      <section className="rounded-3xl bg-white p-8 shadow-sm">
        <h2 className="text-xl font-semibold">{t('mainInfo')}</h2>

        <div className="mt-6 space-y-6">
          <FormField
            id="details-name"
            name="name"
            variant="outlined"
            label={t('fieldName')}
            autoComplete="organization"
            defaultValue={state.values.name}
            error={errors.name}
            required
          />
          <FormField
            id="details-description"
            name="description"
            variant="outlined"
            label={t('fieldDescription')}
            multiline
            rows={3}
            defaultValue={state.values.description}
            error={errors.description}
          />
          <div className="grid gap-6 sm:grid-cols-2">
            <FormField
              id="details-address"
              name="address"
              variant="outlined"
              label={t('fieldAddress')}
              autoComplete="street-address"
              defaultValue={state.values.address}
              error={errors.address}
              hint={city}
              required
            />
            <FormField
              id="details-phone"
              name="phone"
              type="tel"
              variant="outlined"
              label={t('fieldPhone')}
              autoComplete="tel"
              defaultValue={state.values.phone}
              error={errors.phone}
              hint={t('phoneHint')}
              required
            />
          </div>
        </div>
      </section>

      <section className="rounded-3xl bg-white p-8 shadow-sm">
        <h2 className="text-xl font-semibold">{t('regionTitle')}</h2>
        <p className="mt-2 text-sm text-neutral-500">{t('regionIntro')}</p>

        <dl className="mt-6 grid gap-6 sm:grid-cols-2">
          <LockedField label={t('timeZone')} value="Asia/Bishkek" hint={t('timeZoneHint')} />
          <LockedField label={t('currency')} value={t('currencyValue')} hint={t('fixedHint')} />
          <LockedField
            label={t('sitting')}
            value={t('minutes', { minutes: FIXED.sittingMinutes })}
            hint={t('fixedHint')}
          />
          <LockedField
            label={t('slotStep')}
            value={t('minutes', { minutes: FIXED.slotMinutes })}
            hint={t('fixedHint')}
          />
        </dl>

        <div className="mt-6 flex gap-3 rounded-2xl bg-[#EAF1FF] p-4 text-sm text-[#1F3F7A]">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <div>
            <p>{t('horizonInfo', { days: FIXED.horizonDays, minutes: FIXED.leadMinutes })}</p>
            <p className="mt-1 text-xs opacity-80">{t('horizonNote')}</p>
          </div>
        </div>
      </section>

      <div aria-live="polite" className="space-y-3">
        {state.problem && <ApiMessage problem={state.problem} />}
        {state.saved && !state.problem && (
          <p className="rounded-2xl bg-[#E6F4EA] px-4 py-3 text-sm font-semibold text-[#1E7B3C]">
            {t('detailsSavedMessage')}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/admin"
          className="rounded-full border border-neutral-300 bg-white px-6 py-3 text-sm font-semibold hover:bg-neutral-50"
        >
          {t('toOverview')}
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-orange-500 px-8 py-3 text-sm font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? t('savingDetails') : t('saveDetails')}
        </button>
      </div>
      <p className="text-right text-xs text-neutral-500">
        {published ? t('liveNote') : t('draftNote')}
      </p>
    </form>
  );
}
