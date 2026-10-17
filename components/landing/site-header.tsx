'use client'

import * as React from 'react'
import Link from 'next/link'
import { Show } from '@clerk/nextjs'
import { Menu, X } from 'lucide-react'

import { cn } from '@/lib/utils'
import { HrButton } from '@/components/hr'
import { ThemeToggleButton } from '@/components/app-shell/top-bar'
import { BrandMark } from '@/components/landing/brand-mark'

const LINKS = [
  { href: '/#product', label: 'Product' },
  { href: '/#assistant', label: 'AI assistant' },
  { href: '/#how-it-works', label: 'How it works' }
]

const iconButton =
  'hit-target inline-flex size-10 shrink-0 items-center justify-center rounded-sm border border-border bg-card text-icon-strong transition-colors hover:bg-subtle hover:text-foreground'

export function SiteHeader() {
  const [open, setOpen] = React.useState(false)

  return (
    <header className='sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur supports-[backdrop-filter]:bg-card/80'>
      <div className='mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 md:px-8'>
        <BrandMark />

        <nav aria-label='Main' className='hidden md:block'>
          <ul className='flex items-center gap-1'>
            {LINKS.map(link => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className='hit-target inline-flex h-10 items-center rounded-sm px-3 text-body font-semibold text-fg-secondary transition-colors hover:bg-muted hover:text-foreground'
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className='ml-auto flex items-center gap-2.5'>
          <ThemeToggleButton className={iconButton} />
          <Show when='signed-in'>
            <HrButton asChild variant='primary'>
              <Link href='/dashboard'>Open dashboard</Link>
            </HrButton>
          </Show>
          <Show when='signed-out'>
            <HrButton asChild variant='secondary' className='hidden sm:inline-flex'>
              <Link href='/sign-in'>Sign in</Link>
            </HrButton>
            <HrButton asChild variant='primary' className='hidden sm:inline-flex'>
              <Link href='/sign-up'>Get started</Link>
            </HrButton>
          </Show>
          <button
            type='button'
            aria-expanded={open}
            aria-controls='site-menu'
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen(o => !o)}
            className={cn(iconButton, 'md:hidden')}
          >
            {open ? (
              <X aria-hidden='true' className='size-5' strokeWidth={1.75} />
            ) : (
              <Menu aria-hidden='true' className='size-5' strokeWidth={1.75} />
            )}
          </button>
        </div>
      </div>

      <nav
        id='site-menu'
        aria-label='Main'
        hidden={!open}
        className='border-t border-border px-4 pb-4 md:hidden'
      >
        <ul className='flex flex-col py-2'>
          {LINKS.map(link => (
            <li key={link.href}>
              <Link
                href={link.href}
                onClick={() => setOpen(false)}
                className='flex min-h-11 items-center rounded-sm px-2 text-body font-semibold text-fg-body hover:bg-muted'
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
        <Show when='signed-out'>
          <div className='grid grid-cols-2 gap-2.5'>
            <HrButton asChild variant='secondary'>
              <Link href='/sign-in'>Sign in</Link>
            </HrButton>
            <HrButton asChild variant='primary'>
              <Link href='/sign-up'>Get started</Link>
            </HrButton>
          </div>
        </Show>
      </nav>
    </header>
  )
}
