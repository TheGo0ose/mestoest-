'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function PasswordField({
  id,
  name,
  label,
  autoComplete,
  error,
  hint,
}: {
  id: string;
  name: string;
  label: string;
  autoComplete: string;
  error?: string;
  hint?: string;
}) {
  const t = useTranslations('owner');
  const [visible, setVisible] = useState(false);

  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  // Подсказка видна до отправки. Если есть ошибка, она сама называет правило.
  const showHint = Boolean(hint) && !error;
  const describedBy = error ? errorId : showHint ? hintId : undefined;

  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <div className="relative mt-2">
        <input
          id={id}
          name={name}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`block w-full rounded-2xl border bg-white px-5 py-4 pr-14 outline-none focus:ring-2 focus:ring-orange-400 ${
            error ? 'border-[#B8432B]' : 'border-neutral-200'
          }`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-pressed={visible}
          aria-label={visible ? t('hidePassword') : t('showPassword')}
          className="absolute top-1/2 right-3 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100"
        >
          {visible ? (
            <EyeOff className="h-4 w-4" aria-hidden />
          ) : (
            <Eye className="h-4 w-4" aria-hidden />
          )}
        </button>
      </div>
      {showHint && (
        <p id={hintId} className="mt-2 text-xs text-neutral-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="mt-2 text-sm text-[#B8432B]">
          {error}
        </p>
      )}
    </div>
  );
}
