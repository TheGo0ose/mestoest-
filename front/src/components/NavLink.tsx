'use client';

import type { ReactNode } from 'react';
import { Link, usePathname } from '@/i18n/navigation';

export function NavLink({
  href,
  match,
  children,
}: {
  href: string;
  match: string[]; // префиксы адресов, на которых пункт считается активным
  children: ReactNode;
}) {
  const pathname = usePathname();
  const active = match.some((m) =>
    m === '/' ? pathname === '/' : pathname === m || pathname.startsWith(`${m}/`),
  );

  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={
        active
          ? 'rounded-full bg-[#FDE7E0] px-4 py-2 font-semibold text-orange-600'
          : 'rounded-full px-4 py-2 text-neutral-600 hover:bg-neutral-50'
      }
    >
      {children}
    </Link>
  );
}
