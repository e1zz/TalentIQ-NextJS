'use client'

import * as React from 'react'
import Link from 'next/link'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { Search } from 'lucide-react'

import { cn } from '@/lib/utils'
import { openSans } from '@/lib/fonts'
import { SEARCH_PLACEHOLDER } from '@/components/app-shell/top-bar'

export type CommandDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Controlled query. Omit both to let the dialog keep its own. */
  query?: string
  onQueryChange?: (query: string) => void
  placeholder?: string
  /** Results: <CommandGroup> / <CommandItem> elements. When empty, a hint
   * is shown. Data comes from the caller (Convex search later). */
  children?: React.ReactNode
  /** Optional footer (keyboard hints, "Search all results"). */
  footer?: React.ReactNode
}

/** Global search shell opened by the top bar or Cmd/Ctrl+K. Arrow keys move
 * between [data-command-item] results; Enter activates the focused one. */
export function CommandDialog({
  open,
  onOpenChange,
  query,
  onQueryChange,
  placeholder = SEARCH_PLACEHOLDER,
  children,
  footer
}: CommandDialogProps) {
  const [internalQuery, setInternalQuery] = React.useState('')
  const value = query ?? internalQuery
  const listRef = React.useRef<HTMLDivElement>(null)
  const hasResults = React.Children.toArray(children).length > 0

  const setValue = (next: string) => {
    if (query === undefined) setInternalQuery(next)
    onQueryChange?.(next)
  }

  const focusItem = (direction: 1 | -1) => {
    const items = Array.from(
      listRef.current?.querySelectorAll<HTMLElement>('[data-command-item]') ?? []
    )
    if (items.length === 0) return
    const current = items.indexOf(document.activeElement as HTMLElement)
    const next =
      current === -1
        ? direction === 1
          ? 0
          : items.length - 1
        : (current + direction + items.length) % items.length
    items[next]?.focus()
  }

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      focusItem(1)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      focusItem(-1)
    }
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className='fixed inset-0 z-50 bg-foreground/30 backdrop-blur-[2px] data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0 dark:bg-black/60' />
        <DialogPrimitive.Content
          onKeyDown={onKeyDown}
          className={cn(
            openSans.variable,
            'fixed top-[12vh] left-1/2 z-50 flex max-h-[76vh] w-[calc(100vw-2rem)] max-w-[640px] -translate-x-1/2 flex-col overflow-hidden rounded-lg border border-border bg-popover font-sans text-popover-foreground shadow-overlay',
            'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95'
          )}
        >
          <DialogPrimitive.Title className='sr-only'>Search</DialogPrimitive.Title>
          <DialogPrimitive.Description className='sr-only'>
            Search people, jobs and documents. Use the arrow keys to move through results.
          </DialogPrimitive.Description>
          <div className='flex items-center gap-3 border-b border-border px-4'>
            <Search aria-hidden='true' className='size-5 shrink-0 text-icon' strokeWidth={1.75} />
            <input
              type='search'
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder={placeholder}
              aria-label='Search'
              className='h-14 min-w-0 flex-1 bg-transparent text-card-title text-foreground outline-none placeholder:text-muted-foreground focus-visible:outline-none'
            />
            <DialogPrimitive.Close className='hit-target inline-flex h-6 shrink-0 items-center rounded-[4px] border border-border px-1.5 text-meta text-muted-foreground hover:bg-subtle'>
              Esc
              <span className='sr-only'> to close search</span>
            </DialogPrimitive.Close>
          </div>
          <div ref={listRef} className='min-h-0 flex-1 overflow-y-auto p-2'>
            {hasResults ? (
              children
            ) : (
              <p className='px-3 py-8 text-center text-body text-muted-foreground'>
                {value
                  ? `No results for “${value}”.`
                  : 'Start typing to search people, jobs and documents.'}
              </p>
            )}
          </div>
          {footer ? (
            <div className='border-t border-border px-4 py-2.5 text-meta text-muted-foreground'>
              {footer}
            </div>
          ) : null}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

export function CommandGroup({
  heading,
  children,
  className
}: {
  heading: string
  children: React.ReactNode
  className?: string
}) {
  const id = React.useId()
  return (
    <div role='group' aria-labelledby={id} className={cn('py-1', className)}>
      <p
        id={id}
        className='px-3 pt-2 pb-1 text-meta font-semibold tracking-overline text-muted-foreground uppercase'
      >
        {heading}
      </p>
      <ul className='flex flex-col'>{children}</ul>
    </div>
  )
}

export type CommandItemProps = {
  /** Navigates on activate. Use onSelect for actions instead. */
  href?: string
  onSelect?: () => void
  icon?: React.ReactNode
  label: React.ReactNode
  /** Muted secondary text on the right ("Candidate", "Engineering"). */
  meta?: React.ReactNode
  className?: string
}

export function CommandItem({ href, onSelect, icon, label, meta, className }: CommandItemProps) {
  const classes = cn(
    'flex min-h-11 w-full items-center gap-3 rounded-sm px-3 text-left text-body text-fg-body outline-none',
    'hover:bg-muted focus-visible:bg-brand-soft focus-visible:text-brand-fg focus-visible:outline-none',
    '[&_svg]:size-[18px] [&_svg]:shrink-0 [&_svg]:stroke-[1.75] [&_svg]:text-icon',
    className
  )
  const content = (
    <>
      {icon ? <span aria-hidden='true'>{icon}</span> : null}
      <span className='min-w-0 flex-1 truncate font-semibold'>{label}</span>
      {meta ? <span className='shrink-0 text-meta text-muted-foreground'>{meta}</span> : null}
    </>
  )

  return (
    <li>
      {href ? (
        <Link href={href} data-command-item='' onClick={onSelect} className={classes}>
          {content}
        </Link>
      ) : (
        <button type='button' data-command-item='' onClick={onSelect} className={classes}>
          {content}
        </button>
      )}
    </li>
  )
}
