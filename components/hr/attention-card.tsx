import * as React from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { cn } from '@/lib/utils'
import {
  toneIconClass,
  type AccentTone
} from '@/components/hr/tones'

export type AttentionAction = { label: string; href: string }

export type AttentionCardProps = {
  /** Lucide icon element, e.g. <Users />. Sized and colored by the card. */
  icon: React.ReactNode
  /** Tile tint. Figma uses info (applications), warning (feedback),
   * violet (offers), teal (time off), danger, neutral. */
  tone?: AccentTone
  value: React.ReactNode
  label: React.ReactNode
  sub?: React.ReactNode
  action?: AttentionAction
  /** default = Home "AttentionCard" (4069:1341);
   * compact = Employees "AttentionTile" (4083:1338), 64px tall, no action. */
  variant?: 'default' | 'compact'
  className?: string
}

const chipClass: Record<AccentTone, string> = {
  success: 'bg-success-soft',
  warning: 'bg-warning-soft',
  danger: 'bg-danger-soft',
  info: 'bg-info-soft',
  neutral: 'bg-muted',
  brand: 'bg-brand-soft',
  violet: 'bg-violet-soft',
  teal: 'bg-teal-soft'
}

function IconChip({ icon, tone, size }: { icon: React.ReactNode; tone: AccentTone; size: 'md' | 'lg' }) {
  return (
    <span
      aria-hidden='true'
      className={cn(
        'flex size-10 shrink-0 items-center justify-center rounded-md [&_svg]:shrink-0 [&_svg]:stroke-[1.75]',
        size === 'lg' ? '[&_svg]:size-6' : '[&_svg]:size-5',
        chipClass[tone],
        toneIconClass[tone]
      )}
    >
      {icon}
    </span>
  )
}

/** Count + label tile that points at work waiting on the user. */
export function AttentionCard({
  icon,
  tone = 'info',
  value,
  label,
  sub,
  action,
  variant = 'default',
  className
}: AttentionCardProps) {
  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'flex min-h-16 min-w-0 items-center gap-3 rounded-md border border-border-subtle bg-card p-3',
          className
        )}
      >
        <IconChip icon={icon} tone={tone} size='lg' />
        <div className='flex min-w-0 flex-col'>
          <p className='text-count font-bold text-foreground tabular-nums'>{value}</p>
          <p className='truncate text-meta text-fg-secondary'>{label}</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex min-w-0 flex-col rounded-md border border-border-subtle bg-card p-4',
        className
      )}
    >
      <div className='flex items-center gap-3'>
        <IconChip icon={icon} tone={tone} size='md' />
        <p className='text-count font-bold text-foreground tabular-nums'>{value}</p>
      </div>
      <p className='mt-3 text-body font-semibold text-fg-body'>{label}</p>
      {sub ? <p className='text-meta text-muted-foreground'>{sub}</p> : null}
      {action ? (
        <div className='mt-auto pt-3'>
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
        </div>
      ) : null}
    </div>
  )
}
