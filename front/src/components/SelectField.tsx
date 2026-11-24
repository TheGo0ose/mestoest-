import type { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

// Выпадающий список в стиле кабинета: подпись сверху, стрелка справа
export function SelectField({
  id,
  label,
  value,
  onChange,
  children,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      <div className="relative mt-3">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3.5 pr-11 text-sm outline-none focus:ring-2 focus:ring-orange-400"
        >
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute top-1/2 right-4 h-4 w-4 -translate-y-1/2 text-neutral-500"
          aria-hidden
        />
      </div>
    </div>
  );
}
