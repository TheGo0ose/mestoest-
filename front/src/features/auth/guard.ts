import { notFound } from 'next/navigation';
import { redirect } from '@/i18n/navigation';
import { getCurrentUser, type CurrentUser } from './session';

// Если не вошли, отправляем на вход и вернём обратно после входа
export async function requireUser(locale: string, next: string) {
  const user = await getCurrentUser();
  if (!user) return redirect({ href: { pathname: '/login', query: { next } }, locale });
  return user;
}

// Страницы кабинета: владелец или модератор.
// Пока не сменён временный пароль, пускаем только на экран смены (A1).
export async function requireStaff(
  locale: string,
  next: string,
  options: { allowPasswordChange?: boolean } = {},
) {
  const user = await requireUser(locale, next);
  if (user.role === 'CUSTOMER') notFound();
  if (user.mustChangePassword && !options.allowPasswordChange) {
    redirect({ href: '/admin/password', locale });
  }
  return user;
}

// Куда вести после входа: персонал в кабинет, клиентов туда, откуда они пришли
export function landingPath(user: Pick<CurrentUser, 'role' | 'mustChangePassword'>, next: string) {
  if (user.role === 'CUSTOMER') return next || '/';
  if (user.role === 'MODERATOR') return next || '/admin/users';
  return user.mustChangePassword ? '/admin/password' : '/admin';
}
