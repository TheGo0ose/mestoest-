'use client';

import { useState } from 'react';
import { Check, Info, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ApiProblem } from '@/api/problem';
import { SelectField } from '@/components/SelectField';
import { useRouter } from '@/i18n/navigation';
import { createRestaurantAction } from './actions';
import type { PlatformUser } from './moderator';

export function CreateRestaurantForm({
  locale,
  owners,
}: {
  locale: string;
  owners: PlatformUser[];
}) {
  const t = useTranslations('moderator');
  const router = useRouter();

  const [name, setName] = useState('');
  const [city, setCity] = useState('Бишкек');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [ownerId, setOwnerId] = useState(owners[0]?.id ?? '');
  const [description, setDescription] = useState('');

  const [pending, setPending] = useState(false);
  const [problem, setProblem] = useState<ApiProblem | null>(null);
  const [success, setSuccess] = useState(false);

  const selectedOwner = owners.find((o) => o.id === ownerId) ?? owners[0];

  function handleClear() {
    setName('');
    setCity('Бишкек');
    setAddress('');
    setPhone('');
    setOwnerId(owners[0]?.id ?? '');
    setDescription('');
    setProblem(null);
    setSuccess(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;

    setPending(true);
    setProblem(null);
    setSuccess(false);

    try {
      const res = await createRestaurantAction(locale, {
        name,
        city,
        address,
        phone,
        ownerId,
        description,
      });

      if (res.problem) {
        setProblem(res.problem);
      } else {
        setSuccess(true);
        setName('');
        setAddress('');
        setPhone('');
        setDescription('');
        router.refresh();
      }
    } catch {
      setProblem({ code: 'NETWORK_ERROR', title: 'Network error' });
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl bg-white p-8 shadow-sm">
      {/* Шапка формы */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-neutral-900">{t('createRestaurantTitle')}</h2>
        <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-600">
          {t('createRestaurantBadge')}
        </span>
      </div>
      <p className="mt-2 text-xs text-neutral-500">{t('createRestaurantSubtitle')}</p>

      {/* Поля формы */}
      <div className="mt-6 space-y-4">
        {/* Ряд 1: Название и Город */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="rest-name" className="text-sm font-semibold text-neutral-800">
              {t('fieldRestaurantName')} *
            </label>
            <input
              id="rest-name"
              type="text"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setSuccess(false);
              }}
              placeholder="Тихий сад"
              className="mt-2 w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-400"
            />
            {problem?.fieldErrors?.name && (
              <p className="mt-1 text-xs text-[#B8432B]">{problem.fieldErrors.name}</p>
            )}
          </div>

          <SelectField
            id="rest-city"
            label={`${t('fieldCity')} *`}
            value={city}
            onChange={(v) => {
              setCity(v);
              setSuccess(false);
            }}
          >
            <option value="Бишкек">{t('cityBishkek')}</option>
            <option value="Ош">{t('cityOsh')}</option>
          </SelectField>
        </div>

        {/* Ряд 2: Адрес */}
        <div>
          <label htmlFor="rest-address" className="text-sm font-semibold text-neutral-800">
            {t('fieldAddress')} *
          </label>
          <input
            id="rest-address"
            type="text"
            required
            value={address}
            onChange={(e) => {
              setAddress(e.target.value);
              setSuccess(false);
            }}
            placeholder="ул. Раззакова, 24"
            className="mt-2 w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-400"
          />
          {problem?.fieldErrors?.address && (
            <p className="mt-1 text-xs text-[#B8432B]">{problem.fieldErrors.address}</p>
          )}
        </div>

        {/* Ряд 3: Телефон и Владелец */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="rest-phone" className="text-sm font-semibold text-neutral-800">
              {t('fieldRestaurantPhone')} *
            </label>
            <input
              id="rest-phone"
              type="tel"
              required
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setSuccess(false);
              }}
              placeholder="+996 312 000 204"
              className="mt-2 w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-400"
            />
            {problem?.fieldErrors?.phone && (
              <p className="mt-1 text-xs text-[#B8432B]">{problem.fieldErrors.phone}</p>
            )}
          </div>

          <div>
            <SelectField
              id="rest-owner"
              label={`${t('fieldOwner')} *`}
              value={ownerId}
              onChange={(v) => {
                setOwnerId(v);
                setSuccess(false);
              }}
            >
              {owners.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.displayName}
                </option>
              ))}
            </SelectField>
            {selectedOwner && (
              <p className="mt-1.5 text-xs text-neutral-400">
                {t('ownerActiveAccount', { email: selectedOwner.email })}
              </p>
            )}
            {problem?.fieldErrors?.ownerId && (
              <p className="mt-1 text-xs text-[#B8432B]">{problem.fieldErrors.ownerId}</p>
            )}
          </div>
        </div>

        {/* Ряд 4: Краткое описание */}
        <div>
          <label htmlFor="rest-desc" className="text-sm font-semibold text-neutral-800">
            {t('fieldShortDescription')}
          </label>
          <input
            id="rest-desc"
            type="text"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setSuccess(false);
            }}
            placeholder="Спокойное городское кафе с сезонной кухней."
            className="mt-2 w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>
      </div>

      {/* Информационный коллаут */}
      <div className="mt-6 flex items-start gap-3 rounded-2xl bg-neutral-50 p-4">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
        <div className="text-xs">
          <p className="font-semibold text-neutral-800">{t('restaurantDraftCalloutTitle')}</p>
          <p className="mt-0.5 text-neutral-500">{t('restaurantDraftCalloutText')}</p>
        </div>
      </div>

      {/* Параметры посадки */}
      <div className="mt-6 flex flex-wrap items-center justify-between border-t border-neutral-100 pt-4 text-xs text-neutral-400">
        <span>{t('sittingDuration')}</span>
        <span>{t('slotStepInfo')}</span>
      </div>

      {/* Сообщения об ошибке или успехе */}
      {problem && <p className="mt-4 text-xs font-semibold text-[#B8432B]">{problem.title}</p>}
      {success && (
        <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-[#1E7B3C]">
          <Check className="h-4 w-4" aria-hidden />
          <span>{t('restaurantCreatedSuccess')}</span>
        </div>
      )}

      {/* Кнопки формы */}
      <div className="mt-6 flex items-center justify-between">
        <button
          type="button"
          onClick={handleClear}
          className="rounded-full border border-neutral-300 px-6 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
        >
          {t('clearForm')}
        </button>

        <button
          type="submit"
          disabled={pending}
          className="flex items-center gap-2 rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-orange-600 disabled:opacity-60"
        >
          <Plus className="h-4 w-4" aria-hidden />
          <span>{pending ? t('creatingDraft') : t('submitCreateDraft')}</span>
        </button>
      </div>
    </form>
  );
}
