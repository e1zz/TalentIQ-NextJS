import {
  Briefcase,
  Calendar,
  ChartColumnIncreasing,
  CircleCheck,
  FileText,
  House,
  Inbox,
  Search,
  Sparkles,
  Sun,
  UserPlus,
  Users
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { AttentionCard, InitialsAvatar, MeterRow, StatCard, StatusPill } from '@/components/hr'

const NAV = [House, Inbox, Calendar, Briefcase, Users, UserPlus, Sun, FileText, ChartColumnIncreasing, Sparkles]

const FUNNEL = [
  { label: 'Applied', value: 248 },
  { label: 'Screening', value: 62 },
  { label: 'Interview', value: 19 },
  { label: 'Offer', value: 6 },
  { label: 'Hired', value: 4 }
]

const INTERVIEWS = [
  { time: '9:30', name: 'Malaika Brown', role: 'Senior Frontend Engineer', tone: 'success' as const, badge: 'Done' },
  { time: '11:00', name: 'Tomás Álvarez', role: 'Product Designer', tone: 'info' as const, badge: 'Panel' },
  { time: '14:30', name: 'Mei Tanaka', role: 'Data Scientist', tone: 'info' as const, badge: 'Interview' }
]

/**
 * The Home dashboard in miniature, built from the real HR primitives so it
 * follows the theme. Purely illustrative: hidden from assistive tech and
 * not focusable. Rendered at a fixed desktop width and cropped by its parent,
 * like the screens bleeding off the Figma Cover.
 */
export function ProductPreview({ className }: { className?: string }) {
  return (
    <div
      aria-hidden='true'
      inert
      className={cn(
        'w-[880px] select-none overflow-hidden rounded-xl border border-white/20 bg-background shadow-[0_32px_64px_-16px_rgb(2_6_23/0.45)]',
        className
      )}
    >
      {/* Window chrome */}
      <div className='flex h-10 items-center gap-1.5 border-b border-border bg-card px-4'>
        <span className='size-2.5 rounded-full bg-danger/70' />
        <span className='size-2.5 rounded-full bg-warning/70' />
        <span className='size-2.5 rounded-full bg-success/70' />
        <div className='mx-auto flex h-6 w-72 items-center gap-2 rounded-sm border border-border px-2.5 text-meta text-muted-foreground'>
          <Search className='size-3.5' strokeWidth={1.75} />
          Search people, jobs, documents…
        </div>
      </div>

      <div className='flex'>
        {/* Icon rail */}
        <div className='flex w-14 shrink-0 flex-col items-center gap-1.5 border-r border-sidebar-border bg-sidebar py-4'>
          <span className='mb-2 inline-flex size-8 items-center justify-center rounded-sm bg-brand-600 text-base font-bold text-white'>
            T
          </span>
          {NAV.map((Icon, i) => (
            <span
              key={i}
              className={cn(
                'inline-flex size-9 items-center justify-center rounded-sm text-icon',
                i === 0 && 'bg-sidebar-accent text-sidebar-accent-foreground'
              )}
            >
              <Icon className='size-[18px]' strokeWidth={1.75} />
            </span>
          ))}
        </div>

        {/* Home */}
        <div className='flex min-w-0 flex-1 flex-col gap-5 p-6'>
          <div>
            <p className='text-page-title font-bold text-foreground'>Good morning, Sara</p>
            <p className='text-body text-fg-secondary'>Friday, October 16 · 4 interviews and 21 open tasks today</p>
          </div>

          <div className='grid grid-cols-4 gap-3'>
            <AttentionCard variant='compact' tone='info' icon={<Users />} value={12} label='New applications' />
            <AttentionCard variant='compact' tone='warning' icon={<CircleCheck />} value={3} label='Feedback overdue' />
            <AttentionCard variant='compact' tone='violet' icon={<FileText />} value={2} label='Offers to approve' />
            <AttentionCard variant='compact' tone='teal' icon={<Sun />} value={4} label='Time-off requests' />
          </div>

          <div className='grid grid-cols-3 gap-3'>
            <StatCard
              label='Open roles'
              value={8}
              delta={{ label: '+2 vs last month', direction: 'up' }}
              sparkline={{ data: [4, 5, 5, 6, 7, 6, 8] }}
            />
            <StatCard
              label='Active candidates'
              value={312}
              delta={{ label: '+18%', direction: 'up' }}
              sparkline={{ data: [210, 236, 251, 248, 270, 291, 312] }}
            />
            <StatCard
              label='Avg. time to hire'
              value={34}
              unit='days'
              delta={{ label: '−4 days', direction: 'down', sentiment: 'positive' }}
              sparkline={{ data: [42, 41, 39, 40, 37, 36, 34], tone: 'success' }}
            />
          </div>

          <div className='grid grid-cols-[1.35fr_1fr] gap-3'>
            <div className='rounded-lg border border-border bg-card p-5'>
              <p className='mb-4 text-card-title font-bold text-foreground'>Hiring pipeline</p>
              <div className='flex flex-col gap-2.5'>
                {FUNNEL.map(step => (
                  <MeterRow key={step.label} label={step.label} value={step.value} max={FUNNEL[0].value} size='lg' />
                ))}
              </div>
            </div>

            <div className='rounded-lg border border-border bg-card p-5'>
              <p className='mb-4 text-card-title font-bold text-foreground'>Today&apos;s interviews</p>
              <ul className='flex flex-col gap-3'>
                {INTERVIEWS.map(slot => (
                  <li key={slot.name} className='flex items-center gap-3'>
                    <span className='w-10 shrink-0 text-meta font-semibold text-muted-foreground tabular-nums'>
                      {slot.time}
                    </span>
                    <InitialsAvatar name={slot.name} size={32} decorative />
                    <span className='min-w-0 flex-1'>
                      <span className='block truncate text-body font-semibold text-foreground'>{slot.name}</span>
                      <span className='block truncate text-meta text-muted-foreground'>{slot.role}</span>
                    </span>
                    <StatusPill tone={slot.tone}>{slot.badge}</StatusPill>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
