type Props = {
  id: string;
  name: string;
  label: string;
  type?: string;
  multiline?: boolean;
  rows?: number;
  autoComplete?: string;
  defaultValue?: string;
  placeholder?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  // filled: серое поле (формы гостя), outlined: светлое поле с рамкой (кабинет)
  variant?: 'filled' | 'outlined';
};

export function FormField({
  id,
  name,
  label,
  type = 'text',
  multiline,
  rows = 4,
  autoComplete,
  defaultValue,
  placeholder,
  error,
  hint,
  required,
  variant = 'filled',
}: Props) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const showHint = Boolean(hint) && !error;

  const look =
    variant === 'outlined'
      ? `bg-neutral-50 ${error ? 'border-[#B8432B]' : 'border-neutral-200'}`
      : `bg-neutral-100 ${error ? 'border-orange-500' : 'border-transparent'}`;

  const common = {
    id,
    name,
    defaultValue,
    placeholder,
    required,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? errorId : showHint ? hintId : undefined,
    className: `mt-2 block w-full rounded-2xl border px-4 py-3 outline-none focus:ring-2 focus:ring-orange-400 ${look}`,
  };

  return (
    <div>
      <label htmlFor={id} className="text-sm text-neutral-500">
        {label}
      </label>
      {multiline ? (
        <textarea {...common} rows={rows} />
      ) : (
        <input {...common} type={type} autoComplete={autoComplete} />
      )}
      {showHint && (
        <p id={hintId} className="mt-2 text-xs text-neutral-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="mt-2 text-sm text-[#9A4A33]">
          {error}
        </p>
      )}
    </div>
  );
}
