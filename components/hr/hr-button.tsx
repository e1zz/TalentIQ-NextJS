import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

/** Figma "Button" (4080:1325). Primary = the one main action per view,
 * secondary = outline for the others, ghost = inline / tertiary.
 * md = 40px (18px icon), sm = 32px (16px icon). Both get a 44px hit area. */
export const hrButtonVariants = cva(
  'hit-target inline-flex shrink-0 items-center justify-center gap-2 rounded-sm text-body font-semibold whitespace-nowrap transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0 [&_svg]:stroke-[1.75]',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:bg-brand-hover',
        secondary: 'border border-input bg-card text-fg-body hover:bg-subtle hover:text-foreground',
        ghost: 'text-brand-fg hover:bg-brand-soft',
        danger: 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
      },
      size: {
        md: 'h-10 px-4 [&_svg]:size-[18px]',
        sm: 'h-8 px-3 [&_svg]:size-4',
        icon: 'size-10 [&_svg]:size-5',
        'icon-sm': 'size-8 [&_svg]:size-4'
      }
    },
    defaultVariants: { variant: 'secondary', size: 'md' }
  }
)

export type HrButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof hrButtonVariants> & {
    /** Render the child (e.g. next/link <Link>) with button styles. */
    asChild?: boolean
  }

export const HrButton = React.forwardRef<HTMLButtonElement, HrButtonProps>(
  ({ className, variant, size, asChild = false, type, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        ref={ref}
        type={asChild ? undefined : (type ?? 'button')}
        className={cn(hrButtonVariants({ variant, size }), className)}
        {...props}
      />
    )
  }
)
HrButton.displayName = 'HrButton'
