import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { AlertCircle, FileQuestion } from 'lucide-react';

/** Карточка-пример состояния UI в гайде. */
export function StateCard({
  label,
  icon: Icon,
  iconClassName,
  children,
}: {
  label: string;
  icon: LucideIcon;
  iconClassName?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-neutral-100 bg-white p-6 shadow-sm sm:p-7">
      {/* Шапка: категория/код слева, круглая иконка справа */}
      <div className="flex items-start justify-between gap-4">
        <span className="text-[11px] font-semibold tracking-wider text-neutral-400 uppercase">
          {label}
        </span>
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
            iconClassName ?? 'bg-[#FDE7E0] text-[#E55B3C]'
          }`}
        >
          <Icon className="h-4 w-4" aria-hidden />
        </div>
      </div>

      {/* Содержимое карточки */}
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** Персиково-оранжевое предупреждение внутри карточки. */
export function StateAlert({
  children,
  icon: Icon = AlertCircle,
}: {
  children: ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <div className="flex items-start gap-2.5 rounded-2xl border border-[#FDE0D7] bg-[#FFF4EE] p-3 text-xs text-[#9B381E] sm:p-3.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#E55B3C]" aria-hidden />
      <div className="leading-relaxed">{children}</div>
    </div>
  );
}

/** Нейтральное информационное предупреждение (для 404). */
export function StateNeutralAlert({
  children,
  icon: Icon = FileQuestion,
}: {
  children: ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <div className="flex items-start gap-2.5 rounded-2xl border border-neutral-200/70 bg-neutral-50 p-3 text-xs text-neutral-700 sm:p-3.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
      <div className="leading-relaxed">{children}</div>
    </div>
  );
}

/** Оранжевая кнопка-действие внизу карточки. */
export function StateActionButton({
  children,
  icon: Icon,
  iconRight: IconRight,
}: {
  children: ReactNode;
  icon?: LucideIcon;
  iconRight?: LucideIcon;
}) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-2 rounded-full bg-[#E55B3C] px-5 py-2.5 text-xs font-semibold text-white shadow-2xs transition hover:bg-[#D94E2F]"
    >
      {Icon && <Icon className="h-3.5 w-3.5" aria-hidden />}
      <span>{children}</span>
      {IconRight && <IconRight className="h-3.5 w-3.5" aria-hidden />}
    </button>
  );
}

/** Контурная (outline) белая кнопка-действие. */
export function StateOutlineButton({
  children,
  icon: Icon,
}: {
  children: ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-5 py-2.5 text-xs font-semibold text-neutral-700 shadow-2xs transition hover:bg-neutral-50"
    >
      {Icon && <Icon className="h-3.5 w-3.5" aria-hidden />}
      <span>{children}</span>
    </button>
  );
}

/** Заблокированная неактивная кнопка (для 429). */
export function StateDisabledButton({ children }: { children: ReactNode }) {
  return (
    <button
      type="button"
      disabled
      className="inline-flex cursor-not-allowed items-center gap-2 rounded-full border border-neutral-200 bg-neutral-100 px-5 py-2.5 text-xs font-semibold text-neutral-400"
    >
      {children}
    </button>
  );
}
