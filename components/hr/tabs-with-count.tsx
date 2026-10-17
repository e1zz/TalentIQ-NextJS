'use client'

import * as React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'

import { cn } from '@/lib/utils'
import { CountBadge } from '@/components/hr/status-pill'

export type TabWithCountItem = {
  value: string
  label: string
  count?: number
  disabled?: boolean
}

export type TabsWithCountProps = {
  items: TabWithCountItem[]
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  /** Accessible name of the tab list, e.g. "Employee status". */
  label: string
  className?: string
  listClassName?: string
  /** Optional <TabsWithCountContent> panels. Leave empty when the tabs only
   * filter a list rendered elsewhere. */
  children?: React.ReactNode
}

/** Figma "Tab" (4081:1310): underline tabs with a count badge, above a 1px
 * divider. Built on Radix Tabs (roving focus, arrow keys, aria-selected). */
export function TabsWithCount({
  items,
  value,
  defaultValue,
  onValueChange,
  label,
  className,
  listClassName,
  children
}: TabsWithCountProps) {
  return (
    <TabsPrimitive.Root
      value={value}
      defaultValue={defaultValue ?? items[0]?.value}
      onValueChange={onValueChange}
      className={className}
    >
      <TabsPrimitive.List
        aria-label={label}
        className={cn(
          'flex items-end gap-6 overflow-x-auto border-b border-border scrollbar-none',
          listClassName
        )}
      >
        {items.map((item) => (
          <TabsPrimitive.Trigger
            key={item.value}
            value={item.value}
            disabled={item.disabled}
            className={cn(
              'group/tab hit-target -mb-px inline-flex shrink-0 items-center gap-2 border-b-2 border-transparent px-1 pt-1.5 pb-2.5 text-body font-semibold whitespace-nowrap text-fg-secondary transition-colors',
              'hover:text-foreground disabled:pointer-events-none disabled:opacity-50',
              'data-[state=active]:border-primary data-[state=active]:text-brand-fg'
            )}
          >
            {item.label}
            {typeof item.count === 'number' ? (
              <CountBadge className='group-data-[state=active]/tab:bg-brand-soft group-data-[state=active]/tab:text-brand-fg'>
                {item.count}
              </CountBadge>
            ) : null}
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>
      {children}
    </TabsPrimitive.Root>
  )
}

export const TabsWithCountContent = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn('pt-4 focus-visible:outline-offset-4', className)}
    {...props}
  />
))
TabsWithCountContent.displayName = 'TabsWithCountContent'
