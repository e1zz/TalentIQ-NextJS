import * as React from 'react'
import Link from 'next/link'

import { cn } from '@/lib/utils'

export type BreadcrumbItem = {
  label: string
  /** Omit on the last item (the current page). */
  href?: string
}

export type BreadcrumbProps = {
  items: BreadcrumbItem[]
  className?: string
}

/** Figma breadcrumb (Candidate profile): 12/16, muted crumbs, "/" separators,
 * current page in text/primary. */
export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav aria-label='Breadcrumb' className={className}>
      <ol className='flex flex-wrap items-center gap-2 text-meta text-muted-foreground'>
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          return (
            <li key={`${item.label}-${index}`} className='flex items-center gap-2'>
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className='rounded-sm hover:text-foreground hover:underline'
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={isLast ? 'page' : undefined}
                  className={cn(isLast && 'text-foreground')}
                >
                  {item.label}
                </span>
              )}
              {isLast ? null : <span aria-hidden='true'>/</span>}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export type PageHeaderProps = {
  title: React.ReactNode
  subtitle?: React.ReactNode
  breadcrumb?: BreadcrumbItem[]
  /** Rendered inline after the title, e.g. a StatusPill ("On track"). */
  titleAdornment?: React.ReactNode
  /** Right-aligned actions: FilterSelect, secondary + primary buttons. */
  actions?: React.ReactNode
  className?: string
}

/** Page title block. Figma: Title/Page 28/36 bold, subtitle Body 14/20 in
 * text/secondary, actions bottom-aligned on the right. */
export function PageHeader({
  title,
  subtitle,
  breadcrumb,
  titleAdornment,
  actions,
  className
}: PageHeaderProps) {
  return (
    <header className={cn('flex flex-col gap-3', className)}>
      {breadcrumb && breadcrumb.length > 0 ? (
        <Breadcrumb items={breadcrumb} />
      ) : null}
      <div className='flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
        <div className='flex min-w-0 flex-col gap-1'>
          <div className='flex flex-wrap items-center gap-x-3 gap-y-1'>
            <h1 className='text-page-title font-bold text-foreground'>{title}</h1>
            {titleAdornment}
          </div>
          {subtitle ? (
            <p className='text-body text-fg-secondary'>{subtitle}</p>
          ) : null}
        </div>
        {actions ? (
          <div className='flex flex-wrap items-center gap-3 sm:shrink-0 sm:justify-end'>
            {actions}
          </div>
        ) : null}
      </div>
    </header>
  )
}
