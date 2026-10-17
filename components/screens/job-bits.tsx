import { StatusPill, type StatusTone } from '@/components/hr'
import type { JobCard } from '@/convex/lib/jobCards'

export const HEALTH_TONE: Record<NonNullable<JobCard['health']>, StatusTone> = {
  'On track': 'success',
  Slow: 'warning',
  Overdue: 'danger',
  New: 'info'
}

export function JobHealthPill({ job }: { job: Pick<JobCard, 'health' | 'status'> }) {
  if (job.health) return <StatusPill tone={HEALTH_TONE[job.health]}>{job.health}</StatusPill>
  return <StatusPill tone='neutral'>{job.status}</StatusPill>
}

/** Four-segment funnel bar: screening, interview, offer, hired as a share of applicants. */
export function StageBar({ counts, className }: { counts: JobCard['stageCounts']; className?: string }) {
  const total = Math.max(counts.applied, 1)
  const segments = [
    { key: 'Screening', value: counts.screening, cls: 'bg-brand-300' },
    { key: 'Interview', value: counts.interview, cls: 'bg-brand-400' },
    { key: 'Offer', value: counts.offer, cls: 'bg-brand-500' },
    { key: 'Hired', value: counts.hired, cls: 'bg-brand-600' }
  ]
  const label = `${counts.applied} applied, ${segments.map(s => `${s.value} ${s.key.toLowerCase()}`).join(', ')}`
  return (
    <div role='img' aria-label={label} className={className}>
      <div className='flex h-1.5 w-20 overflow-hidden rounded-full bg-brand-soft'>
        {segments.map(s => (
          <span key={s.key} className={s.cls} style={{ width: `${(s.value / total) * 100}%` }} />
        ))}
      </div>
    </div>
  )
}
