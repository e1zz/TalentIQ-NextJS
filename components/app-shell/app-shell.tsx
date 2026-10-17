'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'

import { cn } from '@/lib/utils'
import { openSans } from '@/lib/fonts'
import { useIsMobile } from '@/hooks/use-mobile'
import { AppSidebar, type AppShellUser } from '@/components/app-shell/app-sidebar'
import { CommandDialog } from '@/components/app-shell/command-dialog'
import { TopBar } from '@/components/app-shell/top-bar'
import type { NavBadges } from '@/components/app-shell/nav-items'

export type AppShellProps = {
  children: React.ReactNode
  user: AppShellUser
  /** Sidebar count badges: { inbox: 10, jobs: 8, onboarding: 3, 'time-off': 3 }. */
  badges?: NavBadges
  /** Red dot on the bell. */
  hasUnreadNotifications?: boolean
  /** Right-most top bar slot (Clerk <UserButton /> later). */
  userMenu?: React.ReactNode
  /** Command dialog results (<CommandGroup>/<CommandItem>). */
  searchResults?: React.ReactNode
  /** Called as the user types in the command dialog. Client callers only. */
  onSearchQueryChange?: (query: string) => void
  /** Optional command dialog footer. */
  searchFooter?: React.ReactNode
  className?: string
}

/**
 * Authenticated app frame: skip link, sidebar (rail on md+, drawer below),
 * sticky top bar, command dialog and the <main id="main-content"> landmark.
 * Applies Open Sans locally, so it works before app/layout.tsx adopts it.
 */
export function AppShell({
  children,
  user,
  badges,
  hasUnreadNotifications = false,
  userMenu,
  searchResults,
  onSearchQueryChange,
  searchFooter,
  className
}: AppShellProps) {
  const [searchOpen, setSearchOpen] = React.useState(false)
  const [navOpen, setNavOpen] = React.useState(false)
  const isMobile = useIsMobile()
  const menuButtonRef = React.useRef<HTMLButtonElement>(null)

  // Cmd+K / Ctrl+K toggles search from anywhere in the app
  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen((open) => !open)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <div
      lang='en'
      className={cn(
        openSans.variable,
        'flex min-h-dvh w-full flex-1 bg-background font-sans text-foreground antialiased',
        className
      )}
    >
      <a
        href='#main-content'
        className='sr-only rounded-sm bg-primary px-4 py-2.5 text-body font-semibold text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60]'
      >
        Skip to main content
      </a>

      <AppSidebar user={user} badges={badges} variant='rail' />

      {/* Mobile off-canvas navigation. Closed automatically from md up. */}
      <DialogPrimitive.Root open={navOpen && isMobile} onOpenChange={setNavOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className='fixed inset-0 z-50 bg-foreground/30 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0 md:hidden dark:bg-black/60' />
          <DialogPrimitive.Content
            onCloseAutoFocus={(event) => {
              event.preventDefault()
              menuButtonRef.current?.focus()
            }}
            className={cn(
              openSans.variable,
              'fixed inset-y-0 left-0 z-50 flex w-[280px] max-w-[85vw] flex-col border-r border-sidebar-border bg-sidebar font-sans text-foreground shadow-overlay md:hidden',
              'data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left data-[state=open]:animate-in data-[state=open]:slide-in-from-left'
            )}
          >
            <DialogPrimitive.Title className='sr-only'>Navigation</DialogPrimitive.Title>
            <DialogPrimitive.Description className='sr-only'>
              Main navigation for TalentIQ
            </DialogPrimitive.Description>
            <DialogPrimitive.Close
              aria-label='Close navigation'
              className='absolute top-4 right-3 z-10 inline-flex size-11 items-center justify-center rounded-sm text-icon-strong hover:bg-muted'
            >
              <X aria-hidden='true' className='size-5' strokeWidth={1.75} />
            </DialogPrimitive.Close>
            <AppSidebar
              user={user}
              badges={badges}
              variant='drawer'
              onNavigate={() => setNavOpen(false)}
            />
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>

      <div className='flex min-w-0 flex-1 flex-col md:pl-[72px] lg:pl-[248px]'>
        <TopBar
          onOpenSearch={() => setSearchOpen(true)}
          onOpenNavigation={() => setNavOpen(true)}
          navigationButtonRef={menuButtonRef}
          hasUnreadNotifications={hasUnreadNotifications}
          userMenu={userMenu}
        />
        <main
          id='main-content'
          tabIndex={-1}
          className='flex min-w-0 flex-1 flex-col px-4 py-6 focus:outline-none md:px-8 md:py-8'
        >
          {children}
        </main>
      </div>

      <CommandDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        onQueryChange={onSearchQueryChange}
        footer={searchFooter}
      >
        {searchResults}
      </CommandDialog>
    </div>
  )
}
