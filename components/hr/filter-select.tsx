import * as React from 'react'
import { ChevronDown } from 'lucide-react'

import { cn } from '@/lib/utils'
import { CountBadge } from '@/components/hr/status-pill'

export type FilterSelectOption = { value: string; label: string }

export type FilterSelectProps = Omit<
  React.SelectHTMLAttributes<HTMLSelectElement>,
  'children' | 'multiple'
> & {
  /** Field name: the accessible label and the text shown for the empty
   * ("all") option, e.g. "Department". */
  label: string
  options: FilterSelectOption[]
  /** Text of the empty option. Defaults to `label`. Pass null to drop the
   * empty option (a value is then always selected, e.g. "This month"). */
  allLabel?: string | null
  /** Optional leading icon element (16px), e.g. <Calendar />. */
  icon?: React.ReactNode
  className?: string
}

/** Figma "FilterSelect" (4081:1316): 40px trigger, input border, 8px radius,
 * Body/Strong label and a chevron. A styled native <select>, so keyboard,
 * screen readers and mobile pickers work without extra code. */
export const FilterSelect = React.forwardRef<HTMLSelectElement, FilterSelectProps>(
  ({ label, options, allLabel, icon, className, ...props }, ref) => {
    const emptyLabel = allLabel === undefined ? label : allLabel
    return (
      <div className={cn('relative inline-flex h-10 shrink-0', className)}>
        {icon ? (
          <span
            aria-hidden='true'
            className='pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-icon-strong [&_svg]:size-4 [&_svg]:stroke-[1.75]'
          >
            {icon}
          </span>
        ) : null}
        <select
          ref={ref}
          aria-label={label}
          className={cn(
            'h-full w-full min-w-0 cursor-pointer appearance-none rounded-sm border border-input bg-card pr-9 text-body font-semibold text-fg-body transition-colors',
            'hover:bg-subtle disabled:cursor-not-allowed disabled:opacity-50',
            icon ? 'pl-9' : 'pl-3'
          )}
          {...props}
        >
          {emptyLabel !== null ? <option value=''>{emptyLabel}</option> : null}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden='true'
          strokeWidth={1.75}
          className='pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-icon-strong'
        />
      </div>
    )
  }
)
FilterSelect.displayName = 'FilterSelect'

export type FilterChipProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'children'
> & {
  label: string
  count?: number
  /** Selected state, exposed as aria-pressed. */
  active?: boolean
}

/** Figma "FilterChip" (Inbox, 4090:2562): rounded toggle with a count. */
export const FilterChip = React.forwardRef<HTMLButtonElement, FilterChipProps>(
  ({ label, count, active = false, className, type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      aria-pressed={active}
      className={cn(
        'hit-target inline-flex h-[34px] shrink-0 items-center gap-1.5 rounded-full border pr-2 pl-3 text-meta font-semibold transition-colors',
        typeof count !== 'number' && 'pr-3',
        active
          ? 'border-primary bg-brand-soft text-brand-fg'
          : 'border-input bg-card text-fg-body hover:bg-subtle',
        className
      )}
      {...props}
    >
      {label}
      {typeof count === 'number' ? (
        <CountBadge tone={active ? 'brand' : 'neutral'}>{count}</CountBadge>
      ) : null}
    </button>
  )
)
FilterChip.displayName = 'FilterChip'
