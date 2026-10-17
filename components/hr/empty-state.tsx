import * as React from 'react'

import { cn } from '@/lib/utils'

export type EmptyStateProps = {
  title: React.ReactNode
  description?: React.ReactNode
  /** Lucide icon element, shown in a 40px muted chip. */
  icon?: React.ReactNode
  /** Button(s) or link to recover, e.g. "Post a job". */
  action?: React.ReactNode
  /** card = bordered surface; dashed = Figma empty kanban column
   * ("No hires yet - drag a candidate here"); plain = no frame. */
  variant?: 'card' | 'dashed' | 'plain'
  /** compact drops the icon chip and centers less vertically. */
  size?: 'default' | 'compact'
  className?: string
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  variant = 'card',
  size = 'default',
  className
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        size === 'default' ? 'gap-3 px-6 py-10' : 'gap-1 p-4',
        variant === 'card' && 'rounded-lg border border-border bg-card',
        variant === 'dashed' && 'rounded-md border border-dashed border-border bg-card',
        className
      )}
    >
      {icon && size === 'default' ? (
        <span
          aria-hidden='true'
          className='flex size-10 items-center justify-center rounded-md bg-muted text-icon [&_svg]:size-5 [&_svg]:stroke-[1.75]'
        >
          {icon}
        </span>
      ) : null}
      <div className='flex max-w-sm flex-col gap-1'>
        <p
          className={cn(
            size === 'default'
              ? 'text-card-title font-semibold text-foreground'
              : 'text-[13px] leading-5 text-muted-foreground'
          )}
        >
          {title}
        </p>
        {description ? (
          <p className='text-body text-muted-foreground'>{description}</p>
        ) : null}
      </div>
      {action ? <div className='mt-1 flex flex-wrap justify-center gap-3'>{action}</div> : null}
    </div>
  )
}
