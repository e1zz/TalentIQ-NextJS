'use client'

import * as React from 'react'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import { Bell, Menu, Moon, Search, Sparkles, Sun } from 'lucide-react'

import { cn } from '@/lib/utils'

export const SEARCH_PLACEHOLDER = 'Search people, jobs, documents…'

export type TopBarProps = {
  /** Opens the command dialog. */
  onOpenSearch: () => void
  /** Opens the mobile navigation drawer. The menu button only renders
   * below md, and only when this is set. */
  onOpenNavigation?: () => void
  /** Ref for the menu button so the drawer can return focus to it. */
  navigationButtonRef?: React.Ref<HTMLButtonElement>
  /** Shows the red unread dot on the bell. */
  hasUnreadNotifications?: boolean
  /** Where the bell goes. Defaults to the inbox. */
  notificationsHref?: string
  /** Where "Ask AI" goes. Defaults to /dashboard/assistant. */
  assistantHref?: string
  /** Right-most slot, e.g. Clerk's <UserButton />. */
  userMenu?: React.ReactNode
  className?: string
}

const iconButton =
  'hit-target inline-flex size-10 shrink-0 items-center justify-center rounded-sm border border-border bg-card text-icon-strong transition-colors hover:bg-subtle hover:text-foreground'

/** Figma "TopBar" (Components · HR, 4053:420). */
export function TopBar({
  onOpenSearch,
  onOpenNavigation,
  navigationButtonRef,
  hasUnreadNotifications = false,
  notificationsHref = '/dashboard/inbox',
  assistantHref = '/dashboard/assistant',
  userMenu,
  className
}: TopBarProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-20 flex h-16 shrink-0 items-center gap-2.5 border-b border-border bg-card px-4 md:px-8',
        className
      )}
    >
      {onOpenNavigation ? (
        <button
          ref={navigationButtonRef}
          type='button'
          onClick={onOpenNavigation}
          aria-label='Open navigation'
          className={cn(iconButton, 'md:hidden')}
        >
          <Menu aria-hidden='true' className='size-5' strokeWidth={1.75} />
        </button>
      ) : null}

      <button
        type='button'
        onClick={onOpenSearch}
        aria-haspopup='dialog'
        aria-keyshortcuts='Meta+K Control+K'
        className='hit-target flex h-10 min-w-0 flex-1 items-center gap-2 rounded-sm border border-input bg-card px-[13px] text-left text-body text-muted-foreground transition-colors hover:bg-subtle sm:max-w-[420px]'
      >
        <Search aria-hidden='true' className='size-[18px] shrink-0 text-icon' strokeWidth={1.75} />
        <span className='min-w-0 flex-1 truncate'>{SEARCH_PLACEHOLDER}</span>
        <kbd
          aria-hidden='true'
          className='hidden h-5 shrink-0 items-center rounded-[4px] border border-border px-1.5 font-sans text-meta text-muted-foreground sm:inline-flex'
        >
          ⌘K
        </kbd>
      </button>

      <div className='hidden flex-1 sm:block' />

      <Link
        href={assistantHref}
        className='hit-target inline-flex h-10 shrink-0 items-center gap-2 rounded-sm border border-input bg-card px-2.5 text-body font-semibold text-fg-body transition-colors hover:bg-subtle hover:text-foreground sm:pr-4 sm:pl-[17px]'
      >
        <Sparkles aria-hidden='true' className='size-[18px] shrink-0' strokeWidth={1.75} />
        <span className='sr-only sm:not-sr-only'>Ask AI</span>
      </Link>

      <Link
        href={notificationsHref}
        aria-label={hasUnreadNotifications ? 'Notifications, unread' : 'Notifications'}
        className={cn(iconButton, 'relative')}
      >
        <Bell aria-hidden='true' className='size-5' strokeWidth={1.75} />
        {hasUnreadNotifications ? (
          <span
            aria-hidden='true'
            className='absolute top-[9px] left-5 size-2 rounded-full border-2 border-card bg-notification'
          />
        ) : null}
      </Link>

      <ThemeToggleButton className={iconButton} />

      {userMenu ? <div className='flex shrink-0 items-center'>{userMenu}</div> : null}
    </header>
  )
}

/** Light / dark switch. Both icons render and CSS picks one, so the markup
 * is identical on server and client (no hydration flash). */
export function ThemeToggleButton({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <button
      type='button'
      aria-label='Toggle dark mode'
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      className={className}
    >
      <Moon aria-hidden='true' className='size-5 dark:hidden' strokeWidth={1.75} />
      <Sun aria-hidden='true' className='hidden size-5 dark:block' strokeWidth={1.75} />
    </button>
  )
}
