import { cn } from '@/lib/utils'

/** Neutral placeholder block shown while a Convex query loads. */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden='true' className={cn('animate-pulse rounded-md bg-muted motion-reduce:animate-none', className)} />
}

/** Screen-reader announcement + skeleton rows for a loading section. */
export function LoadingRows({ rows = 3, label = 'Loading', className }: { rows?: number; label?: string; className?: string }) {
  return (
    <div role='status' className={cn('flex flex-col gap-3', className)}>
      <span className='sr-only'>{label}…</span>
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className='h-10 w-full' />
      ))}
    </div>
  )
}
