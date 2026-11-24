import type { ReactNode } from 'react';
import { CircleAlert } from 'lucide-react';
import type { ApiProblem } from '@/api/problem';

export function ApiMessage({ problem, children }: { problem: ApiProblem; children?: ReactNode }) {
  return (
    <div
      role="alert"
      className="flex gap-3 rounded-2xl border border-[#FDE7E0] bg-[#FFF7F4] p-4 text-sm text-[#9A4A33]"
    >
      <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <div>
        <p className="font-semibold">{problem.title}</p>
        {problem.detail && <p className="mt-1">{problem.detail}</p>}
        {children}
      </div>
    </div>
  );
}
