'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'

export type SegmentedOption<T extends string = string> = {
  value: T
  label: string
  /** Optional leading icon element (16px). */
  icon?: React.ReactNode
}

export type SegmentedControlProps<T extends string = string> = {
  options: SegmentedOption<T>[]
  value?: T
  defaultValue?: T
  onValueChange?: (value: T) => void
  /** Accessible name, e.g. "Pipeline view". */
  label: string
  /** md = 40px (Figma), sm = 32px. */
  size?: 'sm' | 'md'
  className?: string
}

/** Figma "seg" control (Board / Table, Day / Week / Month). A single-select
 * radio group: Tab focuses the selected segment, arrow keys move and select. */
export function SegmentedControl<T extends string = string>({
  options,
  value,
  defaultValue,
  onValueChange,
  label,
  size = 'md',
  className
}: SegmentedControlProps<T>) {
  const [internal, setInternal] = React.useState<T | undefined>(
    defaultValue ?? options[0]?.value
  )
  const selected = value ?? internal
  const refs = React.useRef<Array<HTMLButtonElement | null>>([])

  const select = (next: T) => {
    if (value === undefined) setInternal(next)
    onValueChange?.(next)
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = options.length - 1
    let nextIndex: number | null = null
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextIndex = index === last ? 0 : index + 1
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      nextIndex = index === 0 ? last : index - 1
    } else if (event.key === 'Home') {
      nextIndex = 0
    } else if (event.key === 'End') {
      nextIndex = last
    }
    if (nextIndex === null) return
    event.preventDefault()
    select(options[nextIndex].value)
    refs.current[nextIndex]?.focus()
  }

  return (
    <div
      role='radiogroup'
      aria-label={label}
      className={cn(
        'inline-flex shrink-0 overflow-hidden rounded-sm border border-input bg-card',
        size === 'md' ? 'h-10' : 'h-8',
        className
      )}
    >
      {options.map((option, index) => {
        const isSelected = option.value === selected
        return (
          <button
            key={option.value}
            ref={(node) => {
              refs.current[index] = node
            }}
            type='button'
            role='radio'
            aria-checked={isSelected}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => select(option.value)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={cn(
              'inline-flex items-center gap-2 text-body font-semibold whitespace-nowrap transition-colors [&_svg]:size-4 [&_svg]:shrink-0',
              'focus-visible:-outline-offset-2',
              size === 'md' ? 'px-3.5' : 'px-3',
              index > 0 && 'border-l border-input',
              isSelected
                ? 'bg-muted text-foreground'
                : 'text-fg-body hover:bg-subtle hover:text-foreground'
            )}
          >
            {option.icon ? <span aria-hidden='true'>{option.icon}</span> : null}
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
