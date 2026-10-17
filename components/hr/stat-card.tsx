import * as React from 'react'
import { TrendingDown, TrendingUp } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Sparkline } from '@/components/hr/sparkline'
import type { DataTone } from '@/components/hr/tones'

export type StatDelta = {
  /** Text after the arrow, e.g. "+2 vs last month", "3 days faster". */
  label: React.ReactNode
  /** Arrow direction. */
  direction: 'up' | 'down'
  /** Whether the change is good. Defaults to positive. A drop in time to
   * hire is "down" + "positive". */
  sentiment?: 'positive' | 'negative' | 'neutral'
}

export type StatSparkline = {
  data: number[]
  /** Defaults to brand. Use success / danger when the trend has meaning. */
  tone?: DataTone
  /** Accessible description, e.g. "Open roles, last 7 weeks". */
  label?: string
}

export type StatCardProps = {
  label: React.ReactNode
  value: React.ReactNode
  /** Smaller suffix next to the value ("days"). */
  unit?: React.ReactNode
  /** Muted helper line ("+4 this month", "Below 8% target"). */
  sublabel?: React.ReactNode
  delta?: StatDelta
  sparkline?: StatSparkline
  className?: string
}

const sentimentClass = {
  positive: 'text-success-foreground',
  negative: 'text-danger-foreground',
  neutral: 'text-muted-foreground'
} as const

/** Figma "KpiCard" (4069:1441) with sparkline + delta, and "StatTile"
 * (4083:1302) when only label / value / sublabel are set. */
export function StatCard({
  label,
  value,
  unit,
  sublabel,
  delta,
  sparkline,
  className
}: StatCardProps) {
  const DeltaIcon = delta?.direction === 'down' ? TrendingDown : TrendingUp

  return (
    <div
      className={cn(
        'flex min-w-0 flex-col rounded-lg border border-border bg-card text-card-foreground',
        sparkline ? 'gap-2 p-5' : 'gap-1 px-5 py-4',
        className
      )}
    >
      <p className='text-body font-semibold text-fg-secondary'>{label}</p>
      <div className='flex min-h-10 items-center justify-between gap-3'>
        <p className='flex min-w-0 items-baseline gap-1.5'>
          <span className='text-metric font-bold text-foreground tabular-nums'>
            {value}
          </span>
          {unit ? (
            <span className='text-card-title font-semibold text-fg-secondary'>
              {unit}
            </span>
          ) : null}
        </p>
        {sparkline ? (
          <Sparkline
            data={sparkline.data}
            tone={sparkline.tone ?? 'brand'}
            label={sparkline.label}
          />
        ) : null}
      </div>
      {delta || sublabel ? (
        <p className='flex min-w-0 flex-wrap items-center gap-x-1 text-meta'>
          {delta ? (
            <span
              className={cn(
                'inline-flex items-center gap-1 font-semibold',
                sentimentClass[delta.sentiment ?? 'positive']
              )}
            >
              <DeltaIcon aria-hidden='true' className='size-3.5' strokeWidth={1.75} />
              {delta.label}
            </span>
          ) : null}
          {sublabel ? (
            <span className='text-muted-foreground'>{sublabel}</span>
          ) : null}
        </p>
      ) : null}
    </div>
  )
}
