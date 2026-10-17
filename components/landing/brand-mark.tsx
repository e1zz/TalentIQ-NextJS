import Link from 'next/link'

import { cn } from '@/lib/utils'

/** Figma Cover "brand": blue rounded tile with a bold T, then the wordmark. */
export function BrandMark({
  size = 'md',
  inverse = false,
  className
}: {
  size?: 'md' | 'lg'
  /** White wordmark for use on the blue hero. */
  inverse?: boolean
  className?: string
}) {
  return (
    <Link
      href='/'
      aria-label='TalentIQ home'
      className={cn('inline-flex items-center gap-2.5 rounded-sm', className)}
    >
      <span
        aria-hidden='true'
        className={cn(
          'inline-flex shrink-0 items-center justify-center bg-brand-600 font-bold text-white',
          size === 'lg' ? 'size-14 rounded-[14px] text-[28px]' : 'size-8 rounded-sm text-base'
        )}
      >
        T
      </span>
      <span
        className={cn(
          'font-bold tracking-tight',
          size === 'lg' ? 'text-[32px]' : 'text-lg',
          inverse ? 'text-white' : 'text-foreground'
        )}
      >
        TalentIQ
      </span>
    </Link>
  )
}
