import * as React from 'react'

import { cn } from '@/lib/utils'
import {
  toneDotClass,
  toneSurfaceClass,
  type AccentTone,
  type StatusTone
} from '@/components/hr/tones'

export type StatusPillProps = React.HTMLAttributes<HTMLSpanElement> & {
  /** success = on track / approved, warning = slow / pending,
   * danger = overdue / rejected, info = new, neutral = done / inactive. */
  tone?: StatusTone
  /** Leading 6px dot. Defaults to true, as in Figma. */
  dot?: boolean
  children: React.ReactNode
}

/** Figma "StatusPill" (Components · HR, 4080:1341). 22px tall, 12/16 semibold. */
export function StatusPill({
  tone = 'neutral',
  dot = true,
  className,
  children,
  ...props
}: StatusPillProps) {
  return (
    <span
      className={cn(
        'inline-flex h-[22px] shrink-0 items-center gap-1.5 rounded-full px-2.5 text-meta font-semibold whitespace-nowrap',
        toneSurfaceClass[tone],
        className
      )}
      {...props}
    >
      {dot ? (
        <span
          aria-hidden='true'
          className={cn('size-1.5 shrink-0 rounded-full', toneDotClass[tone])}
        />
      ) : null}
      {children}
    </span>
  )
}

export type TagProps = React.HTMLAttributes<HTMLSpanElement> & {
  /** Categorical color. Use the decorative tints (violet, teal) for
   * sources and categories, the status tones only when meaning matches. */
  tone?: AccentTone
  /** Leading dot (the Figma "Referral" tag uses one). Defaults to false. */
  dot?: boolean
  /** Optional leading icon, rendered at 12px. */
  icon?: React.ReactNode
  children: React.ReactNode
}

/** Category label (source, skill, event type). Same geometry as StatusPill,
 * but tone is a category, not a state. */
export function Tag({
  tone = 'neutral',
  dot = false,
  icon,
  className,
  children,
  ...props
}: TagProps) {
  return (
    <span
      className={cn(
        'inline-flex h-[22px] shrink-0 items-center gap-1.5 rounded-full px-2.5 text-meta font-semibold whitespace-nowrap [&_svg]:size-3 [&_svg]:shrink-0',
        toneSurfaceClass[tone],
        className
      )}
      {...props}
    >
      {dot ? (
        <span
          aria-hidden='true'
          className={cn('size-1.5 shrink-0 rounded-full', toneDotClass[tone])}
        />
      ) : null}
      {icon ? <span aria-hidden='true'>{icon}</span> : null}
      {children}
    </span>
  )
}

export type CountBadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  /** brand = the count sits on an active / selected item. */
  tone?: 'neutral' | 'brand' | 'brand-strong'
  children: React.ReactNode
}

/** Figma "CountBadge" (4080:1346). Small count next to nav items, tabs and chips. */
export function CountBadge({
  tone = 'neutral',
  className,
  children,
  ...props
}: CountBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-[10px] px-2 text-meta font-semibold tabular-nums',
        tone === 'neutral' && 'bg-muted text-fg-body',
        tone === 'brand' && 'bg-brand-soft text-brand-fg',
        tone === 'brand-strong' && 'bg-brand-soft-strong text-brand-fg',
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
