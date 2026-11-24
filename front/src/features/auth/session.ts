import { cookies } from 'next/headers';

export const MOCK_SESSION_COOKIE = 'tm_mock_session';

export type Role = 'CUSTOMER' | 'OWNER' | 'MODERATOR';

export type CurrentUser = {
  id: string;
  email: string;
  displayName: string;
  role: Role;
  mustChangePassword: boolean;
};

// То, что лежит в cookie заглушки. Настоящая сессия будет в cookie HttpOnly,
// которую ставит сервер, а данные пользователя придут из getCurrentUser.
export type StoredSession = { email: string; name: string; role: Role; mustChange: boolean };

export function encodeSession(s: StoredSession) {
  return encodeURIComponent(JSON.stringify(s));
}

const ROLES: Role[] = ['CUSTOMER', 'OWNER', 'MODERATOR'];

// ВРЕМЕННО. Заменится запросом getCurrentUser к API.
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const value = (await cookies()).get(MOCK_SESSION_COOKIE)?.value;
  if (!value) return null;
  try {
    const s = JSON.parse(decodeURIComponent(value)) as Partial<StoredSession>;
    if (typeof s.name !== 'string' || typeof s.email !== 'string') return null;
    if (!s.role || !ROLES.includes(s.role)) return null;
    return {
      id: `demo-${s.email}`,
      email: s.email,
      displayName: s.name,
      role: s.role,
      mustChangePassword: Boolean(s.mustChange),
    };
  } catch {
    return null; // старый формат cookie: нужно войти заново
  }
}
