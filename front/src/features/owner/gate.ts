import type { ApiProblem } from '@/api/problem';
import { getCurrentUser } from '@/features/auth/session';

// ВРЕМЕННО. Проверка прав для заглушек кабинета (в API это x-access и 401/403).
// Действия доступны только владельцу, который уже сменил временный пароль.
const gateText = {
  ru: {
    unauthenticated: 'Войдите, чтобы продолжить.',
    forbidden: 'У вас нет доступа к этому действию.',
    passwordChange: 'Задайте новый пароль, чтобы продолжить.',
  },
  en: {
    unauthenticated: 'Please sign in to continue.',
    forbidden: "You don't have access to this action.",
    passwordChange: 'Set a new password to continue.',
  },
};

export async function ownerGate(locale: string): Promise<ApiProblem | null> {
  const tx = gateText[locale === 'en' ? 'en' : 'ru'];
  const user = await getCurrentUser();
  if (!user) return { code: 'UNAUTHENTICATED', title: tx.unauthenticated };
  if (user.role !== 'OWNER') return { code: 'FORBIDDEN', title: tx.forbidden };
  if (user.mustChangePassword) {
    return { code: 'PASSWORD_CHANGE_REQUIRED', title: tx.passwordChange };
  }
  return null;
}
