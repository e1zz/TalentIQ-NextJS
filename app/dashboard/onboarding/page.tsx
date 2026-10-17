'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMutation, useQuery } from 'convex/react'
import { Calendar, Clock, FileText, Laptop, Plus, User, UserPlus, Users } from 'lucide-react'
import { toast } from 'sonner'

import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import type { HireCard } from '@/convex/lib/onboarding'
import type { OnboardingPhase, OnboardingTab, OwnerTeam } from '@/convex/lib/validators'
import {
  AttentionCard,
  EmptyState,
  HrButton,
  InitialsAvatar,
  PageHeader,
  ProgressBar,
  SectionCard,
  StatCard,
  StatusPill,
  TabsWithCount,
  type AccentTone,
  type StatusTone
} from '@/components/hr'
import { errorText, Field, FormDialog } from '@/components/screens/form-dialog'
import { LoadingRows, Skeleton } from '@/components/screens/skeleton'
import { cn } from '@/lib/utils'
import { useNow } from '@/lib/use-now'
import { formatShortDate, formatWeekday, orgDateFromInput, pluralize, toDateInput } from '@/lib/format'

const HEALTH_TONE: Record<HireCard['status'], StatusTone> = { 'At risk': 'warning', 'On track': 'success', 'Not started': 'neutral' }
const ATTENTION_STYLE = {
  overdueTasks: { icon: <Clock />, tone: 'danger' },
  docsNotSigned: { icon: <FileText />, tone: 'warning' },
  laptopNotShipped: { icon: <Laptop />, tone: 'info' },
  day1PlanNotSent: { icon: <Calendar />, tone: 'neutral' }
} satisfies Record<string, { icon: React.ReactNode; tone: AccentTone }>
const PHASES: OnboardingPhase[] = ['Before day 1', 'Week 1', 'Month 1']
const TEAMS: OwnerTeam[] = ['People', 'IT', 'Manager', 'Finance', 'Buddy', 'New hire']

function HireCardView({ hire, selected, onSelect }: { hire: HireCard; selected: boolean; onSelect: () => void }) {
  const now = useNow()
  const started = hire.startDate <= now
  return (
    <li>
      <button
        type='button'
        onClick={onSelect}
        aria-pressed={selected}
        className={cn(
          'w-full rounded-lg border bg-card p-5 text-left transition-colors hover:bg-subtle',
          selected ? 'border-primary ring-1 ring-primary' : 'border-border'
        )}
      >
        <div className='flex items-start gap-3'>
          <InitialsAvatar name={hire.name} size={36} />
          <div className='min-w-0 flex-1'>
            <p className='text-body font-bold text-foreground'>{hire.name}</p>
            <p className='text-meta text-muted-foreground'>
              {hire.title} · {hire.department}
            </p>
          </div>
          <StatusPill tone={HEALTH_TONE[hire.status]}>{hire.status}</StatusPill>
        </div>
        <p className='mt-3 flex flex-wrap gap-x-4 gap-y-1 text-meta text-fg-secondary'>
          <span className='inline-flex items-center gap-1'>
            <Calendar aria-hidden='true' className='size-3.5' strokeWidth={1.75} />
            {started ? 'Started' : 'Starts'} {formatWeekday(hire.startDate)}, {formatShortDate(hire.startDate)}
          </span>
          {hire.manager ? (
            <span className='inline-flex items-center gap-1'>
              <User aria-hidden='true' className='size-3.5' strokeWidth={1.75} />
              Manager: {hire.manager.name}
            </span>
          ) : null}
          {hire.buddy ? (
            <span className='inline-flex items-center gap-1'>
              <Users aria-hidden='true' className='size-3.5' strokeWidth={1.75} />
              Buddy: {hire.buddy.name}
            </span>
          ) : null}
        </p>
        <div className='mt-3 flex items-center gap-3'>
          <ProgressBar
            className='flex-1'
            value={hire.progressPct}
            size='sm'
            tone={hire.status === 'At risk' ? 'warning' : hire.status === 'On track' ? 'success' : 'neutral'}
            label={`${hire.name} onboarding progress`}
          />
          <span className='text-meta text-muted-foreground tabular-nums'>
            {hire.tasksDone}/{hire.tasksTotal} tasks
          </span>
        </div>
      </button>
    </li>
  )
}

function Checklist({ onboardingId }: { onboardingId: Id<'onboardings'> }) {
  const data = useQuery(api.onboarding.checklist, { onboardingId })
  const toggle = useMutation(api.onboarding.toggleTask)
  const addTask = useMutation(api.onboarding.addTask)
  const [adding, setAdding] = React.useState(false)
  const now = useNow()

  if (data === undefined) return <LoadingRows rows={8} label='Loading checklist' />
  if (data === null) return <p className='text-body text-muted-foreground'>Onboarding not found.</p>
  const { hire, groups } = data

  return (
    <div className='flex flex-col gap-5'>
      <div className='flex items-center gap-3'>
        <InitialsAvatar name={hire.name} size={40} />
        <div>
          <h2 className='text-card-title font-bold text-foreground'>{hire.name}</h2>
          <p className='text-meta text-muted-foreground'>
            {hire.startDate <= now ? 'Started' : 'Starts'} {formatWeekday(hire.startDate)}, {formatShortDate(hire.startDate)} · {hire.tasksDone}/{hire.tasksTotal} tasks
          </p>
        </div>
      </div>
      <ProgressBar value={hire.progressPct} size='sm' tone={hire.status === 'At risk' ? 'warning' : 'success'} label='Checklist progress' />

      {groups.map(group => (
        <section key={group.phase}>
          <h3 className='border-b border-border-subtle pb-2 text-meta font-semibold tracking-overline text-muted-foreground uppercase'>
            {group.phase} <span className='font-normal'>{group.done}/{group.total}</span>
          </h3>
          <ul className='divide-y divide-border-subtle'>
            {group.tasks.map(task => (
              <li key={task._id}>
                <label className='flex cursor-pointer items-start gap-3 py-2.5'>
                  <input
                    type='checkbox'
                    checked={task.done}
                    onChange={() => toggle({ taskId: task._id }).catch(err => toast.error(errorText(err)))}
                    className='mt-0.5 size-4 rounded-[4px] accent-[var(--brand)]'
                  />
                  <span className='min-w-0 flex-1'>
                    <span className={cn('block text-body font-semibold', task.done ? 'text-muted-foreground line-through' : 'text-foreground')}>{task.title}</span>
                    <span className='block text-meta text-muted-foreground'>
                      {task.ownerTeam}
                      {task.owner ? ` · ${task.owner.name}` : ''}
                    </span>
                  </span>
                  {task.overdue ? <StatusPill tone='danger'>Overdue</StatusPill> : <span className='text-meta text-muted-foreground'>{formatShortDate(task.dueDate)}</span>}
                </label>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <HrButton variant='primary' onClick={() => setAdding(true)}>
        <Plus aria-hidden='true' />
        Add task
      </HrButton>

      <FormDialog
        open={adding}
        onOpenChange={setAdding}
        title={`Add task for ${hire.name}`}
        submitLabel='Add task'
        onSubmit={async form => {
          await addTask({
            onboardingId,
            title: String(form.get('title')),
            phase: form.get('phase') as OnboardingPhase,
            ownerTeam: form.get('ownerTeam') as OwnerTeam,
            dueDate: orgDateFromInput(String(form.get('dueDate')))
          })
          toast.success('Task added')
        }}
      >
        <Field label='Task' name='title' required placeholder='e.g. Order a monitor' />
        <div className='grid gap-4 sm:grid-cols-2'>
          <Field label='Phase' name='phase' options={PHASES.map(p => ({ value: p, label: p }))} />
          <Field label='Owner' name='ownerTeam' options={TEAMS.map(t => ({ value: t, label: t }))} />
        </div>
        <Field label='Due date' name='dueDate' type='date' required defaultValue={toDateInput(Math.max(hire.startDate, now))} />
      </FormDialog>
    </div>
  )
}

function OnboardingScreen() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [tab, setTab] = React.useState<OnboardingTab>('In progress')
  const kpis = useQuery(api.onboarding.kpis, {})
  const attention = useQuery(api.onboarding.attention, {})
  const list = useQuery(api.onboarding.list, { tab })
  const notStarted = useQuery(api.onboarding.offerAcceptedNotStarted, {})
  const start = useMutation(api.onboarding.start)

  const selected = (searchParams.get('id') ?? list?.hires[0]?._id) as Id<'onboardings'> | undefined
  const select = (id: string) => router.replace(`/dashboard/onboarding?id=${id}`, { scroll: false })

  return (
    <div className='flex flex-col gap-6'>
      <PageHeader
        title='Onboarding'
        subtitle={kpis ? `${pluralize(kpis.inProgress, 'new hire')} in progress · ${kpis.startingNext30d} starting in the next 30 days` : undefined}
      />

      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        {kpis ? (
          <>
            <StatCard label='In progress' value={kpis.inProgress} sublabel='New hires onboarding now' />
            <StatCard label='Starting soon' value={kpis.startingNext30d} sublabel='Next 30 days' />
            <StatCard label='Tasks overdue' value={kpis.overdueTasks} sublabel='Across all hires' />
            <StatCard label='Avg. completion' value={kpis.avgProgressPct} unit='%' sublabel={`${kpis.completedLast90d} completed in 90 days`} />
          </>
        ) : (
          Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className='h-24' />)
        )}
      </div>

      <SectionCard title='Needs attention'>
        {attention ? (
          <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
            {attention.map(a => (
              <AttentionCard key={a.key} variant='compact' icon={ATTENTION_STYLE[a.key].icon} tone={ATTENTION_STYLE[a.key].tone} value={a.count} label={a.label} />
            ))}
          </div>
        ) : (
          <LoadingRows rows={1} label='Loading' />
        )}
      </SectionCard>

      <TabsWithCount
        label='Onboarding status'
        value={tab}
        onValueChange={v => setTab(v as OnboardingTab)}
        items={(list?.tabs ?? [{ tab: 'In progress' as const, count: 0 }]).map(t => ({ value: t.tab, label: t.tab, count: t.count }))}
      />

      <div className='grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]'>
        <div className='flex flex-col gap-4'>
          {list === undefined ? (
            <LoadingRows rows={3} label='Loading new hires' />
          ) : list.hires.length === 0 ? (
            <EmptyState icon={<UserPlus />} title={`No ${tab.toLowerCase()} onboardings`} />
          ) : (
            <ul className='flex flex-col gap-3'>
              {list.hires.map(h => (
                <HireCardView key={h._id} hire={h} selected={h._id === selected} onSelect={() => select(h._id)} />
              ))}
            </ul>
          )}

          <SectionCard title='Offer accepted · not started' meta={notStarted ? pluralize(notStarted.length, 'person', 'people') : undefined}>
            {notStarted === undefined ? (
              <LoadingRows rows={2} label='Loading' />
            ) : notStarted.length === 0 ? (
              <p className='text-body text-muted-foreground'>Everyone with an accepted offer has an onboarding plan.</p>
            ) : (
              <ul className='flex flex-col gap-3'>
                {notStarted.map(p => (
                  <li key={p.offerId} className='flex items-center gap-3'>
                    <InitialsAvatar name={p.name} size={32} />
                    <div className='min-w-0 flex-1'>
                      <Link href={`/dashboard/candidates/${p.candidateId}`} className='text-body font-semibold text-foreground hover:underline'>
                        {p.name}
                      </Link>
                      <p className='text-meta text-muted-foreground'>
                        {p.jobTitle} · {p.department}
                      </p>
                    </div>
                    <span className='hidden text-meta text-muted-foreground sm:inline'>Starts {formatShortDate(p.startDate)}</span>
                    <HrButton
                      size='sm'
                      variant='secondary'
                      onClick={async () => {
                        try {
                          const id = await start({ applicationId: p.applicationId })
                          toast.success(`Onboarding started for ${p.name}`)
                          select(id)
                        } catch (err) {
                          toast.error(errorText(err))
                        }
                      }}
                    >
                      Start onboarding
                    </HrButton>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>

        <aside aria-label='Checklist' className='self-start rounded-lg border border-border bg-card p-5'>
          {selected ? <Checklist key={selected} onboardingId={selected} /> : <EmptyState variant='plain' size='compact' title='Select a new hire' />}
        </aside>
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <React.Suspense>
      <OnboardingScreen />
    </React.Suspense>
  )
}
