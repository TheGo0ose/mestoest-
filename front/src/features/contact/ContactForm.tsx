'use client';

import { useActionState } from 'react';
import { CircleCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ApiMessage } from '@/components/ApiMessage';
import { FormField } from '@/components/FormField';
import { Link } from '@/i18n/navigation';
import { submitContactRequestAction } from './actions';
import type { ContactState } from './types';

export function ContactForm({
  restaurantId,
  restaurantName,
  defaultName,
}: {
  restaurantId: string;
  restaurantName: string;
  defaultName: string;
}) {
  const t = useTranslations('contact');
  const initial: ContactState = { problem: null, values: { name: defaultName }, sent: false };
  const [state, formAction, pending] = useActionState(submitContactRequestAction, initial);
  const errors = state.problem?.fieldErrors ?? {};

  // Квитанция после успешной отправки
  if (state.sent) {
    return (
      <section
        aria-live="polite"
        className="max-w-3xl rounded-3xl bg-white p-8 text-center shadow-sm"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#E6F4EA] text-[#1E7B3C]">
          <CircleCheck className="h-6 w-6" aria-hidden />
        </div>
        <h2 className="mt-4 text-2xl font-bold">{t('sentTitle')}</h2>
        <p className="mt-2 text-neutral-500">{t('sentText', { restaurant: restaurantName })}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href={`/restaurants/${restaurantId}`}
            className="rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white hover:bg-orange-600"
          >
            {t('toRestaurant')}
          </Link>
          <Link
            href="/"
            className="rounded-full border border-orange-500 px-6 py-3 text-sm font-semibold text-orange-600 hover:bg-orange-50"
          >
            {t('toCatalog')}
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-3xl rounded-3xl bg-white p-8 shadow-sm">
      <form action={formAction} noValidate className="space-y-6">
        <input type="hidden" name="restaurantId" value={restaurantId} />

        <div className="grid gap-6 sm:grid-cols-2">
          <FormField
            id="contact-name"
            name="name"
            label={t('name')}
            placeholder={t('namePlaceholder')}
            autoComplete="name"
            defaultValue={state.values.name}
            error={errors.name}
            required
          />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <FormField
            id="contact-phone"
            name="phone"
            type="tel"
            label={t('phone')}
            placeholder={t('phonePlaceholder')}
            autoComplete="tel"
            defaultValue={state.values.phone}
            error={errors.phone}
          />
          <FormField
            id="contact-email"
            name="email"
            type="email"
            label={t('email')}
            placeholder={t('emailPlaceholder')}
            autoComplete="email"
            defaultValue={state.values.email}
            error={errors.email}
          />
        </div>

        <FormField
          id="contact-message"
          name="message"
          label={t('message')}
          placeholder={t('messagePlaceholder')}
          multiline
          rows={4}
          defaultValue={state.values.message}
          error={errors.message}
          required
        />

        <div>
          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              name="consent"
              aria-invalid={errors.consent ? true : undefined}
              aria-describedby={errors.consent ? 'contact-consent-error' : undefined}
              className="mt-0.5 h-4 w-4 shrink-0 accent-orange-500"
            />
            <span>
              {t('consent')} {/* Новая вкладка: иначе введённые поля формы пропадут */}
              <Link
                href="/privacy"
                target="_blank"
                rel="noopener"
                className="whitespace-nowrap text-neutral-500 underline underline-offset-4 hover:text-neutral-800"
              >
                {t('privacyLink')}
              </Link>
            </span>
          </label>
          {errors.consent && (
            <p id="contact-consent-error" className="mt-2 text-sm text-[#9A4A33]">
              {errors.consent}
            </p>
          )}
        </div>

        <div aria-live="polite">{state.problem && <ApiMessage problem={state.problem} />}</div>

        <div>
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-full bg-orange-500 px-5 py-3 text-sm font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? t('submitting') : t('submit')}
          </button>
          <p className="mt-4 text-sm text-neutral-500">{t('needContact')}</p>
        </div>
      </form>
    </section>
  );
}
