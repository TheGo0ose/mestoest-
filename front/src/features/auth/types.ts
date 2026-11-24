import type { ApiProblem } from '@/api/problem';

export type AuthState = {
  problem: ApiProblem | null;
  // значения, которые вернуть в поля после ошибки (пароль не возвращаем никогда)
  values: { email?: string; displayName?: string; phone?: string };
};
