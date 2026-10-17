import * as React from 'react'

import { cn } from '@/lib/utils'
import { dataFillClass, type DataTone } from '@/components/hr/tones'

export type ProgressBarSize = 'sm' | 'md' | 'lg'

export type ProgressBarProps = {
  value: number
  max?: number
  /** brand (sources), brand-light (headcount), success (pipeline). */
  tone?: DataTone
  /** sm = 8px (stage bars), md = 10px (meters), lg = 32px (funnel). */
  size?: ProgressBarSize
  /** Accessible name. Omit when the bar sits inside a MeterRow that already
   * labels it, or pass `decorative`. */
  label?: string
  /** id of an element that labels the bar (used by MeterRow). */
  labelledBy?: string
  /** Text alternative for the value, e.g. "38%" or "48 people". */
  valueText?: string
  decorative?: boolean
  className?: string
}

const sizeClass: Record<ProgressBarSize, string> = {
  sm: 'h-2 rounded-full',
  md: 'h-2.5 rounded-full',
  lg: 'h-8 rounded-bar'
}

/** Track (bg/muted) + fill. Exposed as role="meter" since these show
 * quantities, not task progress. */
export function ProgressBar({
  value,
  max = 100,
  tone = 'brand',
  size = 'md',
  label,
  labelledBy,
  valueText,
  decorative = false,
  className
}: ProgressBarProps) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0
  const a11y = decorative
    ? ({ 'aria-hidden': true } as const)
    : ({
        role: 'meter',
        'aria-label': label,
        'aria-labelledby': labelledBy,
        'aria-valuemin': 0,
        'aria-valuemax': max,
        'aria-valuenow': value,
        'aria-valuetext': valueText
      } as const)

  return (
    <div
      {...a11y}
      className={cn('w-full min-w-0 overflow-hidden bg-muted', sizeClass[size], className)}
    >
      <div
        className={cn('h-full', size === 'lg' ? 'rounded-bar' : 'rounded-full', dataFillClass[tone])}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export type MeterRowProps = {
  label: React.ReactNode
  value: number
  max?: number
  /** Value shown on the right. Defaults to `value`. */
  displayValue?: React.ReactNode
  /** Muted note at the far right ("12 hires", "+6 YTD"). */
  note?: React.ReactNode
  tone?: DataTone
  /** md = Reports meters (10px bar), lg = Home funnel step (32px bar). */
  size?: 'md' | 'lg'
  className?: string
}

/** Figma "SourceRow" / "HeadcountRow" / "FunnelStep": label, bar, value,
 * optional note, laid out on a fixed grid so rows align in a list. */
export function MeterRow({
  label,
  value,
  max = 100,
  displayValue,
  note,
  tone = 'brand',
  size = 'md',
  className
}: MeterRowProps) {
  const labelId = React.useId()
  const shown = displayValue ?? value

  return (
    <div
      className={cn(
        'grid items-center gap-3',
        note !== undefined
          ? 'grid-cols-[minmax(0,5.5rem)_minmax(0,1fr)_2.75rem_3.75rem] sm:grid-cols-[minmax(0,7.5rem)_minmax(0,1fr)_3rem_5rem]'
          : 'grid-cols-[minmax(0,5.5rem)_minmax(0,1fr)_2.75rem] sm:grid-cols-[minmax(0,7.5rem)_minmax(0,1fr)_3rem]',
        size === 'lg' && 'min-h-8',
        className
      )}
    >
      <span
        id={labelId}
        className={cn(
          'truncate text-body',
          size === 'lg' ? 'font-semibold text-fg-body' : 'text-fg-body'
        )}
      >
        {label}
      </span>
      <ProgressBar
        labelledBy={labelId}
        value={value}
        max={max}
        tone={tone}
        size={size}
        valueText={
          typeof shown === 'string' || typeof shown === 'number' ? String(shown) : undefined
        }
      />
      <span
        className={cn(
          'text-right text-body text-foreground tabular-nums',
          size === 'lg' ? 'font-bold' : 'font-semibold'
        )}
      >
        {shown}
      </span>
      {note !== undefined ? (
        <span className='text-right text-meta text-muted-foreground'>{note}</span>
      ) : null}
    </div>
  )
}
