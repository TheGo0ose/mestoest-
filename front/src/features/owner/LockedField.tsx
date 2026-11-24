import { Lock } from 'lucide-react';

// Только для чтения: значение задаёт сервис и менять его в кабинете нельзя
export function LockedField({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div>
      <dt className="text-sm text-neutral-500">{label}</dt>
      <dd className="mt-2 flex items-center justify-between rounded-2xl bg-neutral-100 px-4 py-3">
        <span>{value}</span>
        <Lock className="h-4 w-4 text-neutral-500" aria-hidden />
      </dd>
      <p className="mt-2 text-xs text-neutral-500">{hint}</p>
    </div>
  );
}
