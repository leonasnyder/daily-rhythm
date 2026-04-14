'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarDays, Flame, BellRing, BookOpen, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/scheduler',  label: 'Schedule',  icon: CalendarDays },
  { href: '/tracker',    label: 'Habits',    icon: Flame        },
  { href: '/journal',    label: 'Journal',   icon: BookOpen     },
  { href: '/tasks',      label: 'Reminders', icon: BellRing     },
  { href: '/settings',   label: 'Settings',  icon: Settings     },
];

export default function BottomNav() {
  const pathname = usePathname();

  // Hide on auth/landing pages
  if (!pathname || ['/', '/login', '/signup', '/forgot-password', '/reset-password'].includes(pathname)) {
    return null;
  }

  return (
    <nav
      id="bottom-nav"
      className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex md:hidden safe-area-bottom"
    >
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors min-h-[56px]',
              active
                ? 'text-teal-600 dark:text-teal-400'
                : 'text-gray-400 dark:text-gray-500 hover:text-gray-600'
            )}
          >
            <Icon className={cn('h-5 w-5', active && 'stroke-[2.5px]')} />
            <span className={cn('text-[10px] font-medium', active && 'font-semibold')}>
              {label}
            </span>
            {active && (
              <span className="absolute bottom-0 h-0.5 w-8 rounded-full bg-teal-500" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
