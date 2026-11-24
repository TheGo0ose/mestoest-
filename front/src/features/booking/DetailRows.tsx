export function DetailRows({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="divide-y divide-neutral-100">
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-center justify-between gap-4 py-4">
          <dt className="text-neutral-500">{label}</dt>
          <dd className="text-right font-semibold">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
