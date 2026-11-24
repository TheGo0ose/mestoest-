import { Armchair, Clock, FileText, UtensilsCrossed, type LucideIcon } from 'lucide-react';
import type { SectionKey } from './types';

// nav и action: ключи текстов в блоке «panel» файлов messages
export const SECTION_META: Record<
  SectionKey,
  { href: string; icon: LucideIcon; nav: string; action: string }
> = {
  details: { href: '/admin/details', icon: FileText, nav: 'navDetails', action: 'actionDetails' },
  hours: { href: '/admin/hours', icon: Clock, nav: 'navHours', action: 'actionHours' },
  tables: { href: '/admin/tables', icon: Armchair, nav: 'navTables', action: 'actionTables' },
  menu: { href: '/admin/menu', icon: UtensilsCrossed, nav: 'navMenu', action: 'actionMenu' },
};
