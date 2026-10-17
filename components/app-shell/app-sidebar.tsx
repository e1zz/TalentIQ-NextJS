'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/lib/utils'
import { CountBadge } from '@/components/hr/status-pill'
import { InitialsAvatar } from '@/components/hr/initials-avatar'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import {
  NAV_GROUPS,
  isNavItemActive,
  type NavBadges,
  type NavItem
} from '@/components/app-shell/nav-items'

export type AppShellUser = {
  name: string
  /** Job title under the name, e.g. "HR Specialist". */
  title: string
  /** Override the derived initials. */
  initials?: string
}

export type AppSidebarProps = {
  user: AppShellUser
  badges?: NavBadges
  /**
   * rail (default): fixed left column. Hidden below md, icons only from md
   * to lg (72px), full width with labels from lg (248px).
   * drawer: always expanded, for the mobile off-canvas panel.
   */
  variant?: 'rail' | 'drawer'
  /** Called after a nav link is activated (closes the mobile drawer). */
  onNavigate?: () => void
  className?: string
}

/** Figma "Sidebar" (Components · HR, 4053:399). */
export function AppSidebar({
  user,
  badges,
  variant = 'rail',
  onNavigate,
  className
}: AppSidebarProps) {
  const pathname = usePathname()
  const rail = variant === 'rail'

  const body = (
    <div
      className={cn(
        'flex h-full min-h-0 w-full flex-col gap-5 px-4 pt-6 pb-5',
        rail && 'md:max-lg:px-3.5'
      )}
    >
      <Link
        href='/dashboard'
        onClick={onNavigate}
        className={cn(
          'hit-target flex h-8 shrink-0 items-center gap-2.5 self-start rounded-sm pl-2',
          rail && 'md:max-lg:pl-1.5'
        )}
      >
        <span
          aria-hidden='true'
          className='flex size-8 items-center justify-center rounded-sm bg-primary text-card-title font-bold text-primary-foreground'
        >
          T
        </span>
        <span
          className={cn(
            'text-lg leading-6 font-bold text-foreground',
            rail && 'md:max-lg:sr-only'
          )}
        >
          TalentIQ
        </span>
      </Link>

      <nav
        aria-label='Main'
        className='-mx-1 -my-1 flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-1 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
      >
        {NAV_GROUPS.map((group) => {
          const headingId = `nav-group-${variant}-${group.id}`
          return (
            <div
              key={group.id}
              role={group.label ? 'group' : undefined}
              aria-labelledby={group.label ? headingId : undefined}
            >
              {group.label ? (
                <>
                  <p
                    id={headingId}
                    className={cn(
                      'px-3 pb-2 text-meta font-semibold tracking-overline text-muted-foreground uppercase',
                      rail && 'md:max-lg:sr-only'
                    )}
                  >
                    {group.label}
                  </p>
                  {rail ? (
                    <div
                      aria-hidden='true'
                      className='mx-2 mb-2 hidden h-px bg-sidebar-border md:max-lg:block'
                    />
                  ) : null}
                </>
              ) : null}
              <ul className='flex flex-col gap-0.5'>
                {group.items.map((item) => (
                  <li key={item.id}>
                    <SidebarLink
                      item={item}
                      active={isNavItemActive(pathname, item.href)}
                      count={badges?.[item.id]}
                      rail={rail}
                      onNavigate={onNavigate}
                    />
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </nav>

      <div
        className={cn(
          'flex shrink-0 items-center gap-2.5 border-t border-border-subtle py-3 pl-2',
          rail && 'md:max-lg:justify-center md:max-lg:pl-0'
        )}
      >
        <InitialsAvatar name={user.name} initials={user.initials} size={36} decorative />
        <div className={cn('min-w-0', rail && 'md:max-lg:sr-only')}>
          <p className='truncate text-body font-semibold text-foreground'>{user.name}</p>
          <p className='truncate text-meta text-muted-foreground'>{user.title}</p>
        </div>
      </div>
    </div>
  )

  if (!rail) return <div className={cn('h-full', className)}>{body}</div>

  return (
    <TooltipProvider delayDuration={150}>
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 hidden w-[248px] border-r border-sidebar-border bg-sidebar md:flex md:max-lg:w-[72px]',
          className
        )}
      >
        {body}
      </aside>
    </TooltipProvider>
  )
}

function SidebarLink({
  item,
  active,
  count,
  rail,
  onNavigate
}: {
  item: NavItem
  active: boolean
  count?: number
  rail: boolean
  onNavigate?: () => void
}) {
  const Icon = item.icon
  const hasCount = typeof count === 'number' && count > 0

  const link = (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
      onClick={onNavigate}
      className={cn(
        'group/nav relative flex h-11 items-center gap-3 rounded-sm px-3 text-body font-semibold transition-colors',
        active
          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
          : 'text-sidebar-foreground hover:bg-muted hover:text-foreground'
      )}
    >
      <Icon
        aria-hidden='true'
        strokeWidth={1.75}
        className={cn(
          'size-5 shrink-0',
          active ? 'text-sidebar-accent-foreground' : 'text-icon group-hover/nav:text-icon-strong'
        )}
      />
      <span className={cn('min-w-0 flex-1 truncate', rail && 'md:max-lg:sr-only')}>
        {item.label}
      </span>
      {hasCount ? (
        <>
          <span className='sr-only'>{`, ${count} ${item.badgeNoun}`}</span>
          <CountBadge
            aria-hidden='true'
            tone={active ? 'brand-strong' : 'neutral'}
            className={cn(rail && 'md:max-lg:hidden')}
          >
            {count}
          </CountBadge>
          {rail ? (
            <span
              aria-hidden='true'
              className='absolute top-1 left-[22px] hidden h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] leading-none font-bold text-primary-foreground ring-2 ring-sidebar md:max-lg:flex'
            >
              {count > 99 ? '99+' : count}
            </span>
          ) : null}
        </>
      ) : null}
    </Link>
  )

  if (!rail) return link

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent
        side='right'
        sideOffset={8}
        className='hidden bg-foreground font-semibold text-background md:max-lg:block'
      >
        {item.label}
        {hasCount ? ` (${count})` : null}
      </TooltipContent>
    </Tooltip>
  )
}
