import type { ApiProblem } from '@/api/problem';

export type ContactState = {
  problem: ApiProblem | null;
  // значения, которые вернуть в поля после ошибки
  values: { name?: string; phone?: string; email?: string; message?: string };
  sent: boolean;
};
