import * as React from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { cn } from '@/lib/utils'

export type SectionCardAction = { label: string; href: string }

export type SectionCardProps = {
  title: React.ReactNode
  /** Muted text on the right ("21 tasks", "median days"). */
  meta?: React.ReactNode
  /** "View all ->" style link on the right. */
  action?: SectionCardAction
  /** Extra header controls (buttons, a SegmentedControl) after meta / action. */
  headerActions?: React.ReactNode
  /** Heading level for the title. Defaults to h2. */
  titleAs?: 'h2' | 'h3'
  /** Body padding. "default" = 24px sides, 16px top, 24px bottom.
   * "flush" = no padding (tables, lists that run edge to edge). */
  padding?: 'default' | 'flush'
  className?: string
  bodyClassName?: string
  children?: React.ReactNode
}

/** White card with the Figma "CardHeader" (4081:1294): Title/Card 16/24 on
 * the left, optional meta + link on the right. */
export function SectionCard({
  title,
  meta,
  action,
  headerActions,
  titleAs: Title = 'h2',
  padding = 'default',
  className,
  bodyClassName,
  children
}: SectionCardProps) {
  const titleId = React.useId()

  return (
    <section
      aria-labelledby={titleId}
      className={cn(
        'flex min-w-0 flex-col rounded-lg border border-border bg-card text-card-foreground',
        className
      )}
    >
      <div className='flex flex-wrap items-center gap-x-3 gap-y-1 px-6 pt-5 pb-1'>
        <Title id={titleId} className='mr-auto text-card-title font-bold text-foreground'>
          {title}
        </Title>
        {meta ? <p className='text-body text-muted-foreground'>{meta}</p> : null}
        {action ? (
          <Link
            href={action.href}
            className='group hit-target inline-flex items-center gap-1 text-body font-semibold text-brand-fg hover:underline'
          >
            {action.label}
            <ArrowRight
              aria-hidden='true'
              className='size-4 transition-transform group-hover:translate-x-0.5'
              strokeWidth={1.75}
            />
          </Link>
        ) : null}
        {headerActions}
      </div>
      <div
        className={cn(
          'min-w-0 flex-1',
          padding === 'default' && 'px-6 pt-4 pb-6',
          padding === 'flush' && 'pt-4',
          bodyClassName
        )}
      >
        {children}
      </div>
    </section>
  )
}
