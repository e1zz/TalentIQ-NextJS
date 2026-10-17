'use client'

import Link from 'next/link'
import { useQuery } from 'convex/react'
import { Calendar, DollarSign, MapPin, MessageSquare, Phone, Plus, Sun, Users, Video } from 'lucide-react'

import { api } from '@/convex/_generated/api'
import type { CalendarEvent } from '@/convex/lib/events'
import {
  AttentionCard,
  FilterSelect,
  HrButton,
  InitialsAvatar,
  MeterRow,
  PageHeader,
  ProgressBar,
  SectionCard,
  StatusPill,
  Table,
  TableBody,
  TableCell,
  TableCellStack,
  TableHead,
  TableHeader,
  TableRow,
  type AccentTone,
  type StatusTone
} from '@/components/hr'
import { KpiCard } from '@/components/screens/kpi'
import { JobHealthPill, StageBar } from '@/components/screens/job-bits'
import { LoadingRows, Skeleton } from '@/components/screens/skeleton'
import { useNow } from '@/lib/use-now'
import { formatLongDate, formatNumber, formatTime, formatWeekday, greetingFor, pluralize } from '@/lib/format'

const ATTENTION = {
  newApplications: { icon: <Users />, tone: 'info', action: 'Review now', href: '/dashboard/jobs' },
  feedbackOverdue: { icon: <MessageSquare />, tone: 'warning', action: 'Remind panel', href: '/dashboard/calendar' },
  offersAwaitingApproval: { icon: <DollarSign />, tone: 'violet', action: 'Open offers', href: '/dashboard/inbox?filter=Approvals' },
  timeOffRequests: { icon: <Sun />, tone: 'teal', action: 'Approve', href: '/dashboard/time-off' }
} satisfies Record<string, { icon: React.ReactNode; tone: AccentTone; action: string; href: string }>

const BADGE_TONE: Record<CalendarEvent['badge'], StatusTone> = {
  Done: 'neutral',
  Screen: 'info',
  Interview: 'info',
  Panel: 'warning',
  Offer: 'success',
  Onboarding: 'info'
}

const LOCATION_ICON = { Video: Video, Phone: Phone, Onsite: MapPin }

export default function HomePage() {
  const now = useNow()
  const greeting = useQuery(api.dashboard.greeting, {})
  const attention = useQuery(api.dashboard.attention, {})
  const kpis = useQuery(api.dashboard.kpis, {})
  const funnel = useQuery(api.dashboard.funnel, {})
  const interviews = useQuery(api.dashboard.todaysInterviews, {})
  const roles = useQuery(api.dashboard.openRoles, { limit: 5 })
  const onboarding = useQuery(api.dashboard.onboardingThisWeek, {})
  const headcount = useQuery(api.dashboard.headcountByDepartment, {})

  const openTasks = attention?.reduce((sum, a) => sum + a.count, 0)

  return (
    <div className='flex flex-col gap-6'>
      <PageHeader
        title={greeting ? `${greetingFor(now)}${greeting.firstName ? `, ${greeting.firstName}` : ''}` : <Skeleton className='h-9 w-72' />}
        subtitle={
          greeting
            ? `${formatLongDate(greeting.today)} · ${pluralize(greeting.counts.interviewsToday, 'interview')} and ${pluralize(openTasks ?? 0, 'open task')} today`
            : undefined
        }
        actions={
          <>
            <FilterSelect label='Period' allLabel={null} icon={<Calendar />} options={[{ value: 'month', label: 'This month' }]} />
            <HrButton asChild variant='primary'>
              <Link href='/dashboard/jobs?new=1'>
                <Plus aria-hidden='true' />
                Post a job
              </Link>
            </HrButton>
          </>
        }
      />

      <SectionCard title='Needs your attention' meta={openTasks !== undefined ? pluralize(openTasks, 'task') : undefined}>
        {attention ? (
          <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
            {attention.map(item => {
              const config = ATTENTION[item.key]
              return (
                <AttentionCard
                  key={item.key}
                  icon={config.icon}
                  tone={config.tone}
                  value={item.count}
                  label={item.label}
                  sub={item.detail}
                  action={{ label: config.action, href: config.href }}
                />
              )
            })}
          </div>
        ) : (
          <LoadingRows rows={2} label='Loading tasks' />
        )}
      </SectionCard>

      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        {kpis ? kpis.map(kpi => <KpiCard key={kpi.key} kpi={kpi} />) : Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className='h-32' />)}
      </div>

      <div className='grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]'>
        <SectionCard
          title='Hiring pipeline'
          meta='All open roles'
          action={{ label: 'View candidates', href: '/dashboard/candidates' }}
        >
          {funnel ? (
            <ol className='flex flex-col'>
              {funnel.stages.map((stage, i) => {
                const next = funnel.stages[i + 1]
                return (
                  <li key={stage.stage}>
                    <MeterRow
                      label={stage.stage}
                      value={stage.count}
                      max={Math.max(funnel.stages[0].count, 1)}
                      displayValue={formatNumber(stage.count)}
                      size='lg'
                      tone={i === 0 ? 'brand' : 'brand-light'}
                    />
                    {next && next.conversionFromPreviousPct !== null ? (
                      <p className='py-1.5 pl-[calc(5.5rem+0.75rem)] text-meta text-muted-foreground sm:pl-[calc(7.5rem+0.75rem)]'>
                        ↓ {next.conversionFromPreviousPct}% moved to {next.stage.toLowerCase()}
                      </p>
                    ) : null}
                  </li>
                )
              })}
            </ol>
          ) : (
            <LoadingRows rows={5} label='Loading pipeline' />
          )}
        </SectionCard>

        <SectionCard title="Today's interviews" action={{ label: 'Calendar', href: '/dashboard/calendar' }} padding='flush'>
          {interviews === undefined ? (
            <LoadingRows rows={4} label='Loading interviews' className='p-5' />
          ) : interviews.length === 0 ? (
            <p className='px-5 py-8 text-center text-body text-muted-foreground'>No interviews today.</p>
          ) : (
            <ul className='divide-y divide-border-subtle'>
              {interviews.map(event => {
                const person = event.candidate?.name ?? event.employee?.name ?? event.title
                const LocationIcon = LOCATION_ICON[event.locationType]
                return (
                  <li key={event._id} className='flex gap-3 px-5 py-4'>
                    <span className='w-11 shrink-0 pt-1 text-body font-semibold text-foreground tabular-nums'>{formatTime(event.start)}</span>
                    <InitialsAvatar name={person} size={32} />
                    <div className='min-w-0 flex-1'>
                      <div className='flex items-start justify-between gap-2'>
                        <p className='truncate text-body font-semibold text-foreground'>
                          {event.candidate ? <Link href={`/dashboard/candidates/${event.candidate._id}`} className='hover:underline'>{person}</Link> : person}
                        </p>
                        <StatusPill tone={BADGE_TONE[event.badge]}>{event.badge}</StatusPill>
                      </div>
                      <p className='text-meta text-muted-foreground'>
                        {[event.job?.title, event.type].filter(Boolean).join(' · ')}
                      </p>
                      <p className='mt-0.5 flex items-center gap-1 text-meta text-muted-foreground'>
                        <LocationIcon aria-hidden='true' className='size-3.5' strokeWidth={1.75} />
                        {event.location}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </SectionCard>
      </div>

      <div className='grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]'>
        <SectionCard title='Open roles' action={{ label: 'All jobs', href: '/dashboard/jobs' }} padding='flush'>
          {roles === undefined ? (
            <LoadingRows rows={5} label='Loading roles' className='p-5' />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role</TableHead>
                  <TableHead>Hiring manager</TableHead>
                  <TableHead>Applicants</TableHead>
                  <TableHead>Pipeline</TableHead>
                  <TableHead>Open for</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map(job => (
                  <TableRow key={job._id}>
                    <TableCell>
                      <TableCellStack
                        primary={<Link href={`/dashboard/jobs/${job._id}`} className='hover:underline'>{job.title}</Link>}
                        secondary={`${job.department} · ${job.workMode}`}
                      />
                    </TableCell>
                    <TableCell>
                      {job.hiringManager ? (
                        <span className='flex items-center gap-2'>
                          <InitialsAvatar name={job.hiringManager.name} size={24} decorative />
                          <span className='whitespace-nowrap'>{job.hiringManager.name}</span>
                        </span>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell>
                      <span className='font-semibold text-foreground tabular-nums'>{job.applicants}</span>{' '}
                      <span className='text-meta font-semibold text-success-foreground'>+{job.applicantsThisWeek} new</span>
                    </TableCell>
                    <TableCell>
                      <StageBar counts={job.stageCounts} />
                    </TableCell>
                    <TableCell className='tabular-nums'>{job.daysOpen}d</TableCell>
                    <TableCell>
                      <JobHealthPill job={job} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </SectionCard>

        <div className='flex flex-col gap-6'>
          <SectionCard title='Onboarding this week' meta={onboarding ? pluralize(onboarding.length, 'new hire') : undefined}>
            {onboarding === undefined ? (
              <LoadingRows rows={3} label='Loading onboarding' />
            ) : onboarding.length === 0 ? (
              <p className='text-body text-muted-foreground'>No one starts this week.</p>
            ) : (
              <ul className='flex flex-col gap-4'>
                {onboarding.map(hire => (
                  <li key={hire._id} className='flex gap-3'>
                    <InitialsAvatar name={hire.name} size={36} />
                    <div className='min-w-0 flex-1'>
                      <div className='flex items-baseline justify-between gap-2'>
                        <Link href={`/dashboard/onboarding?id=${hire._id}`} className='truncate text-body font-semibold text-foreground hover:underline'>
                          {hire.name}
                        </Link>
                        <span className='text-meta text-muted-foreground tabular-nums'>{hire.progressPct}%</span>
                      </div>
                      <p className='truncate text-meta text-muted-foreground'>
                        {hire.title} · {hire.startDate > now ? `Starts ${formatWeekday(hire.startDate)}` : `Started ${formatWeekday(hire.startDate)}`}
                      </p>
                      <ProgressBar
                        className='mt-2'
                        value={hire.progressPct}
                        size='sm'
                        tone={hire.status === 'At risk' ? 'warning' : 'success'}
                        label={`${hire.name} onboarding progress`}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard title='Headcount' meta={headcount ? pluralize(headcount.total, 'employee') : undefined}>
            {headcount ? (
              <div className='flex flex-col gap-3'>
                {headcount.departments.map(d => (
                  <MeterRow key={d.department} label={d.department} value={d.headcount} max={Math.max(...headcount.departments.map(x => x.headcount), 1)} tone='brand-light' />
                ))}
              </div>
            ) : (
              <LoadingRows rows={6} label='Loading headcount' />
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  )
}
