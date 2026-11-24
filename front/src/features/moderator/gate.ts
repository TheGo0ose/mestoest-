import type { ApiProblem } from '@/api/problem';
import { getCurrentUser } from '@/features/auth/session';

const gateText = {
  ru: {
    unauthenticated: 'Войдите, чтобы продолжить.',
    forbidden: 'Только модераторы могут выполнить это действие.',
  },
  en: {
    unauthenticated: 'Please sign in to continue.',
    forbidden: 'Only moderators can perform this action.',
  },
};

export async function moderatorGate(locale: string): Promise<ApiProblem | null> {
  const tx = gateText[locale === 'en' ? 'en' : 'ru'];
  const user = await getCurrentUser();
  if (!user) return { code: 'UNAUTHENTICATED', title: tx.unauthenticated };
  if (user.role !== 'MODERATOR') return { code: 'FORBIDDEN', title: tx.forbidden };
  return null;
}
