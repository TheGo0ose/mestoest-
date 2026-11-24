type Props = {
  id: string;
  name: string;
  label: string;
  type?: string;
  autoComplete?: string;
  defaultValue?: string;
  placeholder?: string;
  error?: string;
  hint?: string;
  required?: boolean;
};

export function AuthField({
  id,
  name,
  label,
  type = 'text',
  autoComplete,
  defaultValue,
  placeholder,
  error,
  hint,
  required,
}: Props) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy =
    [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined;

  return (
    <div>
      <label htmlFor={id} className="text-sm text-neutral-500">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`mt-2 block w-full border-b bg-transparent py-3 text-base outline-none ${
          error ? 'border-orange-500' : 'border-neutral-300 focus:border-neutral-800'
        }`}
      />
      {hint && (
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
