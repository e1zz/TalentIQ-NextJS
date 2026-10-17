'use client'

import * as React from 'react'
import Link from 'next/link'
import { useQuery } from 'convex/react'
import { ChevronLeft, ChevronRight, Clock, MapPin, Phone, Plus, Video } from 'lucide-react'

import { api } from '@/convex/_generated/api'
import type { CalendarEvent } from '@/convex/lib/events'
import type { InterviewType } from '@/convex/lib/validators'
import { AvatarStack, FilterSelect, HrButton, InitialsAvatar, PageHeader, SectionCard, SegmentedControl, StatusPill } from '@/components/hr'
import { LoadingRows } from '@/components/screens/skeleton'
import { cn } from '@/lib/utils'
import { formatShortDate, formatTime, formatWeekday, pluralize } from '@/lib/format'

const DAY = 24 * 60 * 60 * 1000
const START_HOUR = 8
const END_HOUR = 19
const HOUR_PX = 56

const TYPE_STYLE: Record<InterviewType, { label: string; block: string; check: string }> = {
  'Phone screen': { label: 'Phone screens', block: 'border-l-brand bg-brand-soft text-brand-fg', check: 'accent-[var(--brand)]' },
  Interview: { label: 'Interviews', block: 'border-l-violet bg-violet-soft text-violet-foreground', check: 'accent-[var(--violet)]' },
  Panel: { label: 'Panels & assessments', block: 'border-l-warning bg-warning-soft text-warning-foreground', check: 'accent-[var(--warning)]' },
  'Offer call': { label: 'Offer calls', block: 'border-l-success bg-success-soft text-success-foreground', check: 'accent-[var(--success)]' },
  Onboarding: { label: 'Onboarding', block: 'border-l-teal-foreground bg-teal-soft text-teal-foreground', check: 'accent-[var(--teal-foreground)]' }
}
const LOCATION_ICON = { Video, Phone, Onsite: MapPin }

/** Midnight in the org timezone (UTC-6, no DST) for the day containing `t`. */
function orgStartOfDay(t: number) {
  const offset = -6 * 60 * 60 * 1000
  const local = t + offset
  return local - (((local % DAY) + DAY) % DAY) - offset
}
function orgStartOfWeek(t: number) {
  const day = orgStartOfDay(t)
  const dow = new Date(day - 6 * 60 * 60 * 1000).getUTCDay()
  return day - ((dow + 6) % 7) * DAY
}

function EventBlock({ event, dayStart }: { event: CalendarEvent; dayStart: number }) {
  const startMin = (event.start - dayStart) / 60000 - START_HOUR * 60
  const duration = Math.max((event.end - event.start) / 60000, 20)
  const short = duration < 45
  const who = event.candidate?.name ?? event.employee?.name ?? event.title
  const href = event.candidate ? `/dashboard/candidates/${event.candidate._id}` : undefined
  const Comp = href ? Link : 'div'
  return (
    <Comp
      href={href as string}
      className={cn(
        'absolute inset-x-1 overflow-hidden rounded-sm border-l-[3px] px-2 py-1 text-meta hover:brightness-95',
        TYPE_STYLE[event.type].block,
        event.status === 'Cancelled' && 'line-through opacity-60'
      )}
      style={{ top: (startMin / 60) * HOUR_PX, height: (duration / 60) * HOUR_PX - 2 }}
    >
      {short ? (
        <p className='truncate'>
          <span className='font-bold'>{formatTime(event.start)}</span> {who}
        </p>
      ) : (
        <>
          <p className='truncate font-bold'>{who}</p>
          <p className='truncate'>{event.job?.title ? `${event.type} · ${event.job.title}` : event.title}</p>
          <p className='truncate tabular-nums'>
            {formatTime(event.start)} – {formatTime(event.end)}
          </p>
        </>
      )}
    </Comp>
  )
}

export default function CalendarPage() {
  const [anchor, setAnchor] = React.useState(() => Date.now())
  const [view, setView] = React.useState<'day' | 'week'>('week')
  const [interviewer, setInterviewer] = React.useState('')
  const [hidden, setHidden] = React.useState<Set<InterviewType>>(new Set())
  const [now, setNow] = React.useState(() => Date.now())

  React.useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(id)
  }, [])

  const rangeStart = view === 'week' ? orgStartOfWeek(anchor) : orgStartOfDay(anchor)
  const days = view === 'week' ? 7 : 1
  const data = useQuery(api.interviews.week, { start: rangeStart, end: rangeStart + days * DAY })
  const upNext = useQuery(api.interviews.upNext, { limit: 3 })

  const interviewers = React.useMemo(() => {
    const map = new Map<string, string>()
    data?.events.forEach(e => e.interviewers.forEach(i => map.set(i._id, i.name)))
    return [...map].map(([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label))
  }, [data])

  const events = (data?.events ?? []).filter(
    e => !hidden.has(e.type) && (!interviewer || e.interviewers.some(i => i._id === interviewer))
  )
  const todayStart = orgStartOfDay(now)
  const todayCount = data?.events.filter(e => orgStartOfDay(e.start) === todayStart).length ?? 0
  const next = upNext?.[0]
  const rangeLabel =
    view === 'week'
      ? `${formatShortDate(rangeStart)} – ${formatShortDate(rangeStart + 6 * DAY)}, ${new Date(rangeStart).getUTCFullYear()}`
      : `${formatWeekday(rangeStart)}, ${formatShortDate(rangeStart)}`

  return (
    <div className='flex flex-col gap-6'>
      <PageHeader
        title='Interview calendar'
        subtitle={data ? `${pluralize(data.events.length, 'event')} this ${view} · ${todayCount} today` : undefined}
        actions={
          <HrButton variant='primary' disabled title='Coming soon'>
            <Plus aria-hidden='true' />
            Schedule interview
          </HrButton>
        }
      />

      <div className='flex flex-wrap items-center gap-2.5'>
        <HrButton variant='secondary' onClick={() => setAnchor(Date.now())}>
          Today
        </HrButton>
        <HrButton variant='secondary' size='icon' aria-label={`Previous ${view}`} onClick={() => setAnchor(a => a - days * DAY)}>
          <ChevronLeft aria-hidden='true' />
        </HrButton>
        <HrButton variant='secondary' size='icon' aria-label={`Next ${view}`} onClick={() => setAnchor(a => a + days * DAY)}>
          <ChevronRight aria-hidden='true' />
        </HrButton>
        <h2 aria-live='polite' className='text-card-title font-bold text-foreground'>
          {rangeLabel}
        </h2>
        <div className='ml-auto flex items-center gap-2.5'>
          <FilterSelect label='All interviewers' value={interviewer} onChange={e => setInterviewer(e.target.value)} options={interviewers} />
          <SegmentedControl
            label='Calendar view'
            value={view}
            onValueChange={setView}
            options={[
              { value: 'day', label: 'Day' },
              { value: 'week', label: 'Week' }
            ]}
          />
        </div>
      </div>

      <div className='grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]'>
        <div className='overflow-x-auto rounded-lg border border-border bg-card'>
          <div className={cn('grid', view === 'week' ? 'min-w-[760px] grid-cols-[56px_repeat(7,minmax(0,1fr))]' : 'grid-cols-[56px_minmax(0,1fr)]')}>
            <div className='border-b border-border' />
            {Array.from({ length: days }, (_, i) => {
              const day = rangeStart + i * DAY
              const isToday = day === todayStart
              return (
                <div key={i} className='flex flex-col items-center gap-1 border-b border-l border-border py-2.5'>
                  <span className={cn('text-meta font-semibold uppercase', isToday ? 'text-brand-fg' : 'text-muted-foreground')}>{formatWeekday(day)}</span>
                  <span
                    className={cn(
                      'inline-flex size-8 items-center justify-center rounded-full text-card-title font-bold tabular-nums',
                      isToday ? 'bg-primary text-primary-foreground' : 'text-foreground'
                    )}
                  >
                    {formatShortDate(day).split(' ')[1]}
                  </span>
                </div>
              )
            })}

            <div className='relative' style={{ height: (END_HOUR - START_HOUR) * HOUR_PX }}>
              {Array.from({ length: END_HOUR - START_HOUR }, (_, h) => (
                <span key={h} className='absolute right-2 -translate-y-1/2 text-meta text-muted-foreground tabular-nums' style={{ top: h * HOUR_PX + (h === 0 ? 8 : 0) }}>
                  {String(START_HOUR + h).padStart(2, '0')}:00
                </span>
              ))}
            </div>
            {Array.from({ length: days }, (_, i) => {
              const dayStart = rangeStart + i * DAY
              const isToday = dayStart === todayStart
              const weekend = view === 'week' && i >= 5
              const nowOffset = ((now - dayStart) / 60000 - START_HOUR * 60) / 60
              return (
                <div
                  key={i}
                  className={cn('relative border-l border-border', isToday && 'bg-brand-soft/40', weekend && 'bg-subtle')}
                  style={{
                    height: (END_HOUR - START_HOUR) * HOUR_PX,
                    backgroundImage: `repeating-linear-gradient(to bottom, var(--border-subtle) 0 1px, transparent 1px ${HOUR_PX}px)`
                  }}
                >
                  {events
                    .filter(e => e.start >= dayStart && e.start < dayStart + DAY)
                    .map(e => (
                      <EventBlock key={e._id} event={e} dayStart={dayStart} />
                    ))}
                  {isToday && nowOffset > 0 && nowOffset < END_HOUR - START_HOUR ? (
                    <div aria-hidden='true' className='absolute inset-x-0 z-10 flex items-center' style={{ top: nowOffset * HOUR_PX }}>
                      <span className='-ml-1 size-2 rounded-full bg-danger' />
                      <span className='h-0.5 flex-1 bg-danger' />
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
          {data === undefined ? <LoadingRows rows={2} label='Loading events' className='p-4' /> : null}
        </div>

        <div className='flex flex-col gap-6'>
          <SectionCard
            title='Up next'
            headerActions={
              next ? (
                <StatusPill tone={next.start - now < 60 * 60 * 1000 ? 'danger' : 'info'}>
                  {next.start <= now ? 'Now' : `in ${Math.max(1, Math.round((next.start - now) / 60000))} min`}
                </StatusPill>
              ) : undefined
            }
          >
            {upNext === undefined ? (
              <LoadingRows rows={2} label='Loading next event' />
            ) : !next ? (
              <p className='text-body text-muted-foreground'>Nothing else scheduled.</p>
            ) : (
              <div className='rounded-md border border-border p-4'>
                <div className='flex items-center gap-3'>
                  <InitialsAvatar name={next.candidate?.name ?? next.employee?.name ?? next.title} size={36} />
                  <div className='min-w-0'>
                    <p className='truncate text-body font-semibold text-foreground'>{next.candidate?.name ?? next.employee?.name ?? next.title}</p>
                    <p className='text-meta text-muted-foreground'>{[next.job?.title, next.type].filter(Boolean).join(' · ')}</p>
                  </div>
                </div>
                <ul className='mt-3 flex flex-col gap-1.5 text-meta text-fg-body'>
                  <li className='flex items-center gap-2'>
                    <Clock aria-hidden='true' className='size-3.5 text-icon' strokeWidth={1.75} />
                    {formatWeekday(next.start)} {formatTime(next.start)} – {formatTime(next.end)}
                  </li>
                  <li className='flex items-center gap-2'>
                    {React.createElement(LOCATION_ICON[next.locationType], { 'aria-hidden': true, className: 'size-3.5 text-icon', strokeWidth: 1.75 })}
                    {next.location}
                  </li>
                </ul>
                {next.interviewers.length ? <AvatarStack className='mt-3' people={next.interviewers.map(i => ({ name: i.name }))} size={24} label='Interviewers' /> : null}
                {next.candidate ? (
                  <HrButton asChild variant='primary' size='sm' className='mt-4 w-full'>
                    <Link href={`/dashboard/candidates/${next.candidate._id}`}>Open candidate</Link>
                  </HrButton>
                ) : null}
              </div>
            )}
          </SectionCard>

          <SectionCard title='Event types'>
            <fieldset>
              <legend className='sr-only'>Show event types</legend>
              <ul className='flex flex-col gap-2.5'>
                {(Object.keys(TYPE_STYLE) as InterviewType[]).map(type => (
                  <li key={type}>
                    <label className='flex cursor-pointer items-center gap-2.5 text-body text-fg-body'>
                      <input
                        type='checkbox'
                        checked={!hidden.has(type)}
                        onChange={() =>
                          setHidden(prev => {
                            const nextSet = new Set(prev)
                            if (nextSet.has(type)) nextSet.delete(type)
                            else nextSet.add(type)
                            return nextSet
                          })
                        }
                        className={cn('size-4 rounded-[4px]', TYPE_STYLE[type].check)}
                      />
                      <span className='flex-1'>{TYPE_STYLE[type].label}</span>
                      <span className='text-meta text-muted-foreground tabular-nums'>{data?.typeCounts.find(t => t.type === type)?.count ?? 0}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </fieldset>
          </SectionCard>
        </div>
      </div>
    </div>
  )
}
