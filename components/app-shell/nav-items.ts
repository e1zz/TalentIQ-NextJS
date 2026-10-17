import {
  Briefcase,
  Calendar,
  ChartColumnIncreasing,
  FileText,
  Globe,
  House,
  Inbox,
  Share2,
  Sparkles,
  Sun,
  User,
  UserPlus,
  Users,
  type LucideIcon
} from 'lucide-react'

export type NavItemId =
  | 'home'
  | 'inbox'
  | 'calendar'
  | 'jobs'
  | 'candidates'
  | 'referrals'
  | 'career-site'
  | 'employees'
  | 'onboarding'
  | 'time-off'
  | 'documents'
  | 'reports'
  | 'assistant'

/** Count badges keyed by nav item. Only items with a number > 0 show a badge. */
export type NavBadges = Partial<Record<NavItemId, number>>

export type NavItem = {
  id: NavItemId
  label: string
  href: string
  icon: LucideIcon
  /** Wording for the screen-reader badge text: "10 unread", "3 pending". */
  badgeNoun: string
}

export type NavGroup = {
  id: 'main' | 'hiring' | 'people' | 'insights'
  /** Visible group heading. The first group has none. */
  label?: string
  items: NavItem[]
}

export const NAV_GROUPS: readonly NavGroup[] = [
  {
    id: 'main',
    items: [
      { id: 'home', label: 'Home', href: '/dashboard', icon: House, badgeNoun: 'new' },
      { id: 'inbox', label: 'Inbox', href: '/dashboard/inbox', icon: Inbox, badgeNoun: 'unread' },
      { id: 'calendar', label: 'Calendar', href: '/dashboard/calendar', icon: Calendar, badgeNoun: 'today' }
    ]
  },
  {
    id: 'hiring',
    label: 'Hiring',
    items: [
      { id: 'jobs', label: 'Jobs', href: '/dashboard/jobs', icon: Briefcase, badgeNoun: 'open' },
      { id: 'candidates', label: 'Candidates', href: '/dashboard/candidates', icon: Users, badgeNoun: 'new' },
      { id: 'referrals', label: 'Referrals', href: '/dashboard/referrals', icon: Share2, badgeNoun: 'new' },
      { id: 'career-site', label: 'Career site', href: '/dashboard/career-site', icon: Globe, badgeNoun: 'new' }
    ]
  },
  {
    id: 'people',
    label: 'People',
    items: [
      { id: 'employees', label: 'Employees', href: '/dashboard/employees', icon: User, badgeNoun: 'new' },
      { id: 'onboarding', label: 'Onboarding', href: '/dashboard/onboarding', icon: UserPlus, badgeNoun: 'in progress' },
      { id: 'time-off', label: 'Time off', href: '/dashboard/time-off', icon: Sun, badgeNoun: 'pending' },
      { id: 'documents', label: 'Documents', href: '/dashboard/documents', icon: FileText, badgeNoun: 'pending' }
    ]
  },
  {
    id: 'insights',
    label: 'Insights',
    items: [
      { id: 'reports', label: 'Reports', href: '/dashboard/reports', icon: ChartColumnIncreasing, badgeNoun: 'new' },
      { id: 'assistant', label: 'AI assistant', href: '/dashboard/assistant', icon: Sparkles, badgeNoun: 'new' }
    ]
  }
]

/** Home matches only /dashboard; every other item also matches its subpaths
 * (/dashboard/jobs/123 keeps Jobs active). Case-insensitive so the legacy
 * /dashboard/Assistant route still highlights AI assistant. */
export function isNavItemActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false
  const path = pathname.toLowerCase().replace(/\/+$/, '') || '/'
  const target = href.toLowerCase()
  if (target === '/dashboard') return path === '/dashboard'
  return path === target || path.startsWith(`${target}/`)
}
