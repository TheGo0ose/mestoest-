'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Globe } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';

export function LocaleSwitcher() {
  const t = useTranslations('locale');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Закрытие при клике снаружи и по клавише Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const currentShort = locale === 'en' ? t('enShort') : t('ruShort');

  const handleSelect = (code: string) => {
    setIsOpen(false);
    if (code !== locale) {
      router.replace(pathname, { locale: code });
    }
  };

  return (
    <div ref={dropdownRef} className="relative inline-block text-left">
      <button
        type="button"
        aria-label={t('label')}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        className="group inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-neutral-700 shadow-xs transition hover:border-neutral-300 hover:bg-neutral-50 focus:ring-2 focus:ring-orange-400 focus:ring-offset-1 focus:outline-none"
      >
        <Globe
          className="h-3.5 w-3.5 text-neutral-400 transition-colors group-hover:text-orange-500"
          aria-hidden
        />
        <span>{currentShort}</span>
        <ChevronDown
          className={`h-3 w-3 text-neutral-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-orange-500' : ''
          }`}
          aria-hidden
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label={t('label')}
          className="absolute right-0 z-50 mt-2 w-44 origin-top-right rounded-2xl border border-neutral-100 bg-white p-1.5 shadow-[0_10px_25px_rgba(0,0,0,0.08)] ring-1 ring-black/5"
        >
          {routing.locales.map((code) => {
            const isSelected = code === locale;
            const title = code === 'en' ? t('en') : t('ru');
            const badge = code === 'en' ? t('enShort') : t('ruShort');

            return (
              <button
                key={code}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(code)}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs transition ${
                  isSelected
                    ? 'bg-[#FDE7E0]/70 font-semibold text-[#E55B3C]'
                    : 'text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span>{title}</span>
                  <span className="text-[10px] text-neutral-400">({badge})</span>
                </span>
                {isSelected && <Check className="h-3.5 w-3.5 text-[#E55B3C]" aria-hidden />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
