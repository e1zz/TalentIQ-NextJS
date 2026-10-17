'use client'

import * as React from 'react'
import { useMutation, useQuery } from 'convex/react'
import { AlertTriangle, Check, ChevronLeft, ChevronRight, Plus, Sun } from 'lucide-react'
import { toast } from 'sonner'

import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import type { Department, TimeOffType } from '@/convex/lib/validators'
import {
  EmptyState,
  FilterSelect,
  HrButton,
  InitialsAvatar,
  PageHeader,
  ProgressBar,
  SectionCard,
  StatCard,
  StatusPill,
  type DataTone,
  type StatusTone
} from '@/components/hr'
import { errorText, Field, FormDialog } from '@/components/screens/form-dialog'
import { TIME_OFF_STATUS_TONE } from '@/components/screens/people-bits'
import { LoadingRows, Skeleton } from '@/components/screens/skeleton'
import { cn } from '@/lib/utils'
import { useNow } from '@/lib/use-now'
import { formatDateRange, formatRelative, formatShortDate, formatWeekday, orgDateFromInput, pluralize, toDateInput } from '@/lib/format'

const DAY = 86_400_000
const DEPARTMENTS: Department[] = ['Engineering', 'Product', 'Design', 'Data', 'Marketing', 'Sales', 'Finance', 'People']
const TYPE_TONE: Record<TimeOffType, StatusTone> = { Vacation: 'info', 'Sick leave': 'danger', Personal: 'neutral' }
const TYPE_BAR: Record<TimeOffType, DataTone> = { Vacation: 'brand', 'Sick leave': 'danger', Personal: 'neutral' }
const TYPE_BLOCK: Record<TimeOffType, string> = {
  Vacation: 'bg-brand-soft text-brand-fg',
  'Sick leave': 'bg-danger-soft text-danger-foreground',
  Personal: 'bg-violet-soft text-violet-foreground'
}

function orgStartOfDay(t: number) {
  const local = t - 6 * 60 * 60 * 1000
  return local - (((local % DAY) + DAY) % DAY) + 6 * 60 * 60 * 1000
}

function EmployeeBalances({ employeeId }: { employeeId: Id<'employees'> }) {
  const balances = useQuery(api.timeOff.balances, { employeeId })
  const history = useQuery(api.timeOff.history, { employeeId })
  return (
    <div className='flex flex-col gap-5'>
      <section>
        <h3 className='text-meta font-semibold tracking-overline text-muted-foreground uppercase'>Balances · {new Date().getFullYear()}</h3>
        {balances === undefined ? (
          <LoadingRows rows={3} label='Loading balances' className='mt-3' />
        ) : (
          <ul className='mt-3 flex flex-col gap-4'>
            {balances.map(b => (
              <li key={b.type}>
                <div className='mb-1.5 flex items-baseline justify-between text-body'>
                  <span className='text-fg-body'>{b.type}</span>
                  <span>
                    <strong className='font-semibold text-foreground'>{b.remaining} left</strong>{' '}
                    <span className='text-meta text-muted-foreground'>of {b.allowance}</span>
                  </span>
                </div>
                <ProgressBar value={b.remaining} max={b.allowance} tone={TYPE_BAR[b.type]} size='sm' label={`${b.type} remaining`} />
              </li>
            ))}
          </ul>
        )}
      </section>
      <section>
        <h3 className='text-meta font-semibold tracking-overline text-muted-foreground uppercase'>Requests</h3>
        {history === undefined ? (
          <LoadingRows rows={3} label='Loading history' className='mt-3' />
        ) : (
          <ul className='mt-3 flex flex-col gap-2.5'>
            {history.slice(0, 6).map(h => (
              <li key={h._id} className='flex items-start gap-2.5 text-body text-fg-body'>
                <Sun aria-hidden='true' className='mt-0.5 size-4 shrink-0 text-icon' strokeWidth={1.75} />
                <span className='flex-1'>
                  {formatDateRange(h.startDate, h.endDate)} · {h.type}, {pluralize(h.days, 'day')}
                </span>
                <StatusPill tone={TIME_OFF_STATUS_TONE[h.status]}>{h.status}</StatusPill>
              </li>
            ))}
            {history.length === 0 ? <li className='text-body text-muted-foreground'>No requests yet.</li> : null}
          </ul>
        )}
      </section>
    </div>
  )
}

export default function TimeOffPage() {
  const [rangeStart, setRangeStart] = React.useState(() => orgStartOfDay(Date.now()))
  const [department, setDepartment] = React.useState('')
  const [selected, setSelected] = React.useState<{ id: Id<'employees'>; name: string; title: string; department: string } | null>(null)
  const [declining, setDeclining] = React.useState<{ id: Id<'timeOffRequests'>; name: string } | null>(null)
  const [adding, setAdding] = React.useState(false)

  const kpis = useQuery(api.timeOff.kpis, {})
  const pending = useQuery(api.timeOff.pending, {})
  const availability = useQuery(api.timeOff.availability, {
    start: rangeStart,
    days: 14,
    department: (department || undefined) as Department | undefined
  })
  const approve = useMutation(api.timeOff.approve)
  const decline = useMutation(api.timeOff.decline)
  const request = useMutation(api.timeOff.request)

  const active = selected ?? (pending?.[0] ? { id: pending[0].employee._id, name: pending[0].employee.name, title: pending[0].employee.title, department: pending[0].employee.department } : null)
  const now = useNow()
  const today = orgStartOfDay(now)

  async function approveRequest(id: Id<'timeOffRequests'>, name: string) {
    try {
      await approve({ requestId: id })
      toast.success(`Approved time off for ${name}`)
    } catch (err) {
      toast.error(errorText(err))
    }
  }

  return (
    <div className='flex flex-col gap-6'>
      <PageHeader
        title='Time off'
        subtitle={kpis ? `${pluralize(kpis.pendingApprovals, 'request')} waiting for you · ${pluralize(kpis.outToday, 'person', 'people')} out today` : undefined}
        actions={
          <HrButton variant='primary' onClick={() => setAdding(true)} disabled={!availability}>
            <Plus aria-hidden='true' />
            Add time off
          </HrButton>
        }
      />

      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        {kpis ? (
          <>
            <StatCard label='Pending approval' value={kpis.pendingApprovals} sublabel={pending?.length ? `Oldest: ${formatRelative(Math.min(...pending.map(p => p.requestedAt)))}` : 'All caught up'} />
            <StatCard label='Out today' value={kpis.outToday} sublabel='Approved absences' />
            <StatCard label='Out this week' value={kpis.outThisWeek} sublabel='Monday to Sunday' />
            <StatCard label='Upcoming' value={kpis.upcoming30d} sublabel='Next 30 days' />
          </>
        ) : (
          Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className='h-24' />)
        )}
      </div>

      <div className='grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]'>
        <div className='flex min-w-0 flex-col gap-6'>
          <SectionCard
            title='Waiting for approval'
            meta={pending ? `${pending.length} pending` : undefined}
            headerActions={
              pending && pending.length > 1 ? (
                <HrButton
                  variant='ghost'
                  size='sm'
                  onClick={async () => {
                    for (const p of pending) await approveRequest(p._id, p.employee.name)
                  }}
                >
                  Approve all
                </HrButton>
              ) : undefined
            }
            padding='flush'
          >
            {pending === undefined ? (
              <LoadingRows rows={3} className='p-5' label='Loading requests' />
            ) : pending.length === 0 ? (
              <EmptyState variant='plain' size='compact' icon={<Check />} title='No requests waiting' />
            ) : (
              <ul className='divide-y divide-border-subtle'>
                {pending.map(p => (
                  <li key={p._id} className={cn('flex flex-wrap items-center gap-4 px-5 py-4', active?.id === p.employee._id && 'bg-info-soft/50')}>
                    <button
                      type='button'
                      onClick={() => setSelected({ id: p.employee._id, name: p.employee.name, title: p.employee.title, department: p.employee.department })}
                      className='flex min-w-44 items-center gap-2.5 text-left'
                    >
                      <InitialsAvatar name={p.employee.name} size={32} />
                      <span>
                        <span className='block text-body font-semibold text-foreground hover:underline'>{p.employee.name}</span>
                        <span className='block text-meta text-muted-foreground'>{p.employee.title}</span>
                      </span>
                    </button>
                    <div className='min-w-40 flex-1'>
                      <p className='text-body font-semibold text-foreground'>
                        {formatDateRange(p.startDate, p.endDate)} · {pluralize(p.days, 'day')}
                      </p>
                      <div className='mt-1 flex flex-wrap items-center gap-2'>
                        <StatusPill tone={TYPE_TONE[p.type]}>{p.type}</StatusPill>
                        {p.overlap.count > 0 ? (
                          <span className='inline-flex items-center gap-1 text-meta text-warning-foreground' title={p.overlap.names.join(', ')}>
                            <AlertTriangle aria-hidden='true' className='size-3.5' strokeWidth={1.75} />
                            Overlaps {pluralize(p.overlap.count, 'teammate')}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className='text-meta text-muted-foreground'>
                      Balance after
                      <p className='text-body font-bold text-foreground tabular-nums'>
                        {p.balanceBefore} → {p.balanceAfter} days
                      </p>
                    </div>
                    <div className='flex gap-2'>
                      <HrButton variant='secondary' size='sm' onClick={() => setDeclining({ id: p._id, name: p.employee.name })}>
                        Decline
                      </HrButton>
                      <HrButton variant='primary' size='sm' onClick={() => approveRequest(p._id, p.employee.name)}>
                        <Check aria-hidden='true' />
                        Approve
                      </HrButton>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard
            title='Team availability'
            headerActions={
              <div className='flex flex-wrap items-center gap-2'>
                <FilterSelect label='All teams' value={department} onChange={e => setDepartment(e.target.value)} options={DEPARTMENTS.map(d => ({ value: d, label: d }))} />
                <HrButton variant='secondary' size='icon-sm' aria-label='Previous two weeks' onClick={() => setRangeStart(s => s - 14 * DAY)}>
                  <ChevronLeft aria-hidden='true' />
                </HrButton>
                <HrButton variant='secondary' size='sm' onClick={() => setRangeStart(today)}>
                  Today
                </HrButton>
                <HrButton variant='secondary' size='icon-sm' aria-label='Next two weeks' onClick={() => setRangeStart(s => s + 14 * DAY)}>
                  <ChevronRight aria-hidden='true' />
                </HrButton>
              </div>
            }
          >
            {availability === undefined ? (
              <LoadingRows rows={6} label='Loading availability' />
            ) : (
              <div className='overflow-x-auto'>
                <table className='w-full min-w-[720px] table-fixed border-collapse text-meta'>
                  <caption className='sr-only'>Team availability from {formatShortDate(availability.rangeStart)}</caption>
                  <thead>
                    <tr>
                      <th scope='col' className='w-40 pb-2 text-left font-normal text-muted-foreground'>
                        Team member
                      </th>
                      {availability.days.map(d => (
                        <th key={d} scope='col' className={cn('pb-2 text-center font-normal', d === today ? 'font-semibold text-brand-fg' : 'text-muted-foreground')}>
                          {formatWeekday(d)}
                          <br />
                          {formatShortDate(d).split(' ')[1]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {availability.rows.map(row => (
                      <tr key={row.employee._id} className='border-t border-border-subtle'>
                        <th scope='row' className='py-2 pr-2 text-left font-normal'>
                          <button
                            type='button'
                            onClick={() => setSelected({ id: row.employee._id, name: row.employee.name, title: row.employee.title, department: row.employee.department })}
                            className='flex items-center gap-2 text-left text-body text-fg-body hover:underline'
                          >
                            <InitialsAvatar name={row.employee.name} size={24} decorative />
                            <span className='truncate'>{row.employee.name}</span>
                          </button>
                        </th>
                        {availability.days.map(d => {
                          const absence = row.absences.find(a => a.startDate <= d && a.endDate >= d)
                          const weekend = [0, 6].includes(new Date(d - 6 * 60 * 60 * 1000).getUTCDay())
                          return (
                            <td key={d} className={cn('h-9 p-0.5', d === today && 'bg-brand-soft/40', weekend && 'bg-subtle')}>
                              {absence ? (
                                <span
                                  title={`${absence.type} · ${absence.status}`}
                                  className={cn(
                                    'flex h-7 items-center justify-center rounded-sm',
                                    TYPE_BLOCK[absence.type],
                                    absence.status === 'Pending' && 'border border-dashed border-warning bg-warning-soft text-warning-foreground'
                                  )}
                                >
                                  <span className='sr-only'>
                                    {absence.type}, {absence.status}
                                  </span>
                                </span>
                              ) : null}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <ul className='mt-4 flex flex-wrap gap-4 text-meta text-muted-foreground'>
                  {(Object.keys(TYPE_BLOCK) as TimeOffType[]).map(t => (
                    <li key={t} className='flex items-center gap-1.5'>
                      <span aria-hidden='true' className={cn('size-3 rounded-[3px]', TYPE_BLOCK[t])} />
                      {t}
                    </li>
                  ))}
                  <li className='flex items-center gap-1.5'>
                    <span aria-hidden='true' className='size-3 rounded-[3px] border border-dashed border-warning bg-warning-soft' />
                    Pending
                  </li>
                </ul>
              </div>
            )}
          </SectionCard>
        </div>

        <aside aria-label='Employee balances' className='self-start rounded-lg border border-border bg-card p-5'>
          {active ? (
            <div className='flex flex-col gap-5'>
              <div className='flex items-center gap-3'>
                <InitialsAvatar name={active.name} size={40} />
                <div>
                  <h2 className='text-card-title font-bold text-foreground'>{active.name}</h2>
                  <p className='text-meta text-muted-foreground'>
                    {active.title} · {active.department}
                  </p>
                </div>
              </div>
              <EmployeeBalances key={active.id} employeeId={active.id} />
            </div>
          ) : (
            <EmptyState variant='plain' size='compact' title='Select someone' description='Their balances and requests show here.' />
          )}
        </aside>
      </div>

      <FormDialog
        open={declining !== null}
        onOpenChange={o => !o && setDeclining(null)}
        title={`Decline ${declining?.name ?? ''}'s request`}
        description='They will see your reason.'
        submitLabel='Decline request'
        submitVariant='danger'
        onSubmit={async form => {
          if (!declining) return
          const reason = String(form.get('reason') ?? '').trim()
          await decline({ requestId: declining.id, reason: reason || undefined })
          toast.success('Request declined')
        }}
      >
        <Field label='Reason' name='reason' multiline placeholder='e.g. Quarter-end close, please pick another week.' />
      </FormDialog>

      {availability ? (
        <FormDialog
          open={adding}
          onOpenChange={setAdding}
          title='Add time off'
          submitLabel='Add time off'
          onSubmit={async form => {
            await request({
              employeeId: form.get('employeeId') as Id<'employees'>,
              type: form.get('type') as TimeOffType,
              startDate: orgDateFromInput(String(form.get('startDate'))),
              endDate: orgDateFromInput(String(form.get('endDate'))),
              note: String(form.get('note') ?? '').trim() || undefined
            })
            toast.success('Time off added')
          }}
        >
          <Field label='Employee' name='employeeId' required options={availability.rows.map(r => ({ value: r.employee._id, label: r.employee.name }))} />
          <Field label='Type' name='type' options={(['Vacation', 'Sick leave', 'Personal'] as const).map(t => ({ value: t, label: t }))} />
          <div className='grid gap-4 sm:grid-cols-2'>
            <Field label='First day' name='startDate' type='date' required defaultValue={toDateInput(now)} />
            <Field label='Last day' name='endDate' type='date' required defaultValue={toDateInput(now)} />
          </div>
          <Field label='Note' name='note' multiline />
        </FormDialog>
      ) : null}
    </div>
  )
}
