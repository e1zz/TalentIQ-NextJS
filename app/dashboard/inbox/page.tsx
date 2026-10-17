'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMutation, useQuery } from 'convex/react'
import { AlertTriangle, Briefcase, Check, CheckCheck, ChevronRight, FileText, Inbox as InboxIcon, User } from 'lucide-react'
import { toast } from 'sonner'

import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import type { InboxCategory, InboxFilter } from '@/convex/lib/validators'
import { EmptyState, FilterChip, HrButton, InitialsAvatar, PageHeader, StatusPill, type StatusTone } from '@/components/hr'
import { errorText, Field, FormDialog } from '@/components/screens/form-dialog'
import { LoadingRows } from '@/components/screens/skeleton'
import { cn } from '@/lib/utils'
import { formatDateRange, formatLongDate, formatMoney, formatRelative, formatTime, formatWeekday, pluralize } from '@/lib/format'

const CATEGORY_TONE: Record<InboxCategory, StatusTone> = { Approvals: 'warning', Candidates: 'info', Mentions: 'neutral', System: 'danger' }
const APPROVABLE = new Set(['Offer approval', 'Time off'])
const DAY = 86_400_000

type Item = NonNullable<ReturnType<typeof useInboxList>>['items'][number]
function useInboxList(filter: InboxFilter) {
  return useQuery(api.inbox.list, { filter })
}

function groupLabel(t: number) {
  const startToday = new Date().setHours(0, 0, 0, 0)
  if (t >= startToday) return 'Today'
  if (t >= startToday - DAY) return 'Yesterday'
  return 'Earlier'
}

function Decision({ item, onDecline, size = 'sm' }: { item: Item; onDecline: () => void; size?: 'sm' | 'md' }) {
  const approve = useMutation(api.inbox.approve)
  if (!APPROVABLE.has(item.kind)) return null
  if (item.resolution) return <StatusPill tone={item.resolution === 'Approved' ? 'success' : 'danger'}>{item.resolution}</StatusPill>
  return (
    <div className='flex gap-2'>
      <HrButton variant='secondary' size={size} onClick={onDecline}>
        Decline
      </HrButton>
      <HrButton
        variant='primary'
        size={size}
        onClick={async () => {
          try {
            await approve({ itemId: item._id })
            toast.success('Approved')
          } catch (err) {
            toast.error(errorText(err))
          }
        }}
      >
        <Check aria-hidden='true' />
        Approve
      </HrButton>
    </div>
  )
}

function Detail({ itemId, onDecline }: { itemId: Id<'inboxItems'>; onDecline: (item: Item) => void }) {
  const data = useQuery(api.inbox.get, { itemId })
  const comment = useMutation(api.inbox.comment)
  const [body, setBody] = React.useState('')

  if (data === undefined) return <LoadingRows rows={8} label='Loading message' />
  if (data === null) return <EmptyState variant='plain' title='Message not found' />
  const { item, offer, timeOff, comments } = data

  const linked = [
    item.links.candidateId ? { href: `/dashboard/candidates/${item.links.candidateId}`, icon: User, label: 'Candidate profile' } : null,
    item.links.employeeId ? { href: `/dashboard/employees?id=${item.links.employeeId}`, icon: User, label: 'Employee profile' } : null,
    item.links.jobId ? { href: `/dashboard/jobs/${item.links.jobId}`, icon: Briefcase, label: 'Job pipeline' } : null,
    item.links.documentId ? { href: `/dashboard/documents?id=${item.links.documentId}`, icon: FileText, label: 'Document' } : null
  ].filter(Boolean) as { href: string; icon: typeof User; label: string }[]

  return (
    <div className='flex flex-col gap-5'>
      <div className='flex items-center justify-between gap-3'>
        <StatusPill tone={CATEGORY_TONE[item.category]}>
          {item.category} · {item.kind}
        </StatusPill>
        <span className='text-meta text-muted-foreground'>
          {formatWeekday(item.createdAt)}, {formatTime(item.createdAt)}
        </span>
      </div>
      <div>
        <h2 className='text-card-title font-bold text-foreground'>{item.title}</h2>
        <p className='mt-1 text-body text-fg-secondary'>{item.preview}</p>
      </div>

      {offer ? (
        <dl className='grid grid-cols-[8rem_minmax(0,1fr)] gap-x-4 gap-y-2 rounded-md bg-subtle p-4 text-body'>
          <dt className='text-muted-foreground'>Candidate</dt>
          <dd className='font-semibold text-foreground'>{offer.candidate.name}</dd>
          <dt className='text-muted-foreground'>Role</dt>
          <dd className='font-semibold text-foreground'>
            {offer.job.title} · {offer.job.department}
          </dd>
          <dt className='text-muted-foreground'>Base salary</dt>
          <dd className='font-semibold text-foreground'>
            {formatMoney(offer.salary, offer.currency)} (band {formatMoney(offer.bandMin, offer.currency)} – {formatMoney(offer.bandMax, offer.currency)})
          </dd>
          <dt className='text-muted-foreground'>Start date</dt>
          <dd className='font-semibold text-foreground'>{formatLongDate(offer.startDate)}</dd>
          <dt className='text-muted-foreground'>Hiring manager</dt>
          <dd className='font-semibold text-foreground'>{offer.hiringManager?.name ?? '—'}</dd>
        </dl>
      ) : null}
      {timeOff ? (
        <dl className='grid grid-cols-[8rem_minmax(0,1fr)] gap-x-4 gap-y-2 rounded-md bg-subtle p-4 text-body'>
          <dt className='text-muted-foreground'>Employee</dt>
          <dd className='font-semibold text-foreground'>{timeOff.employee.name}</dd>
          <dt className='text-muted-foreground'>Dates</dt>
          <dd className='font-semibold text-foreground'>
            {formatDateRange(timeOff.startDate, timeOff.endDate)} · {pluralize(timeOff.days, 'day')}
          </dd>
          <dt className='text-muted-foreground'>Type</dt>
          <dd className='font-semibold text-foreground'>{timeOff.type}</dd>
          {timeOff.note ? (
            <>
              <dt className='text-muted-foreground'>Note</dt>
              <dd className='text-foreground'>{timeOff.note}</dd>
            </>
          ) : null}
        </dl>
      ) : null}

      {linked.length ? (
        <section>
          <h3 className='text-meta font-semibold tracking-overline text-muted-foreground uppercase'>Linked</h3>
          <ul className='mt-2 flex flex-col gap-2'>
            {linked.map(l => (
              <li key={l.href}>
                <Link href={l.href} className='flex items-center gap-3 rounded-md border border-border p-3 hover:bg-subtle'>
                  <span className='inline-flex size-8 items-center justify-center rounded-sm bg-muted text-icon'>
                    <l.icon aria-hidden='true' className='size-4' strokeWidth={1.75} />
                  </span>
                  <span className='flex-1 text-body font-semibold text-foreground'>{l.label}</span>
                  <ChevronRight aria-hidden='true' className='size-4 text-icon' strokeWidth={1.75} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section>
        <h3 className='text-meta font-semibold tracking-overline text-muted-foreground uppercase'>Comments · {comments.length}</h3>
        <ul className='mt-3 flex flex-col gap-3'>
          {comments.map(c => (
            <li key={c._id} className='flex gap-2.5'>
              <InitialsAvatar name={c.author?.name ?? 'User'} size={28} />
              <div>
                <p className='text-body font-semibold text-foreground'>
                  {c.author?.name ?? 'Someone'} <span className='text-meta font-normal text-muted-foreground'>{formatRelative(c.createdAt)}</span>
                </p>
                <p className='text-body text-fg-body'>{c.body}</p>
              </div>
            </li>
          ))}
        </ul>
        <form
          className='mt-3 flex gap-2'
          onSubmit={async e => {
            e.preventDefault()
            if (!body.trim()) return
            try {
              await comment({ itemId, body })
              setBody('')
            } catch (err) {
              toast.error(errorText(err))
            }
          }}
        >
          <label htmlFor='reply' className='sr-only'>
            Write a reply
          </label>
          <input
            id='reply'
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder='Write a reply…'
            className='h-10 min-w-0 flex-1 rounded-sm border border-input bg-card px-3 text-body placeholder:text-muted-foreground'
          />
          <HrButton type='submit' variant='secondary' disabled={!body.trim()}>
            Send
          </HrButton>
        </form>
      </section>

      <div className='flex justify-end border-t border-border-subtle pt-4'>
        <Decision item={item} onDecline={() => onDecline(item)} size='md' />
      </div>
    </div>
  )
}

function InboxScreen() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [filter, setFilter] = React.useState<InboxFilter>((searchParams.get('filter') as InboxFilter) ?? 'All')
  const [declining, setDeclining] = React.useState<Item | null>(null)
  const data = useInboxList(filter)
  const markRead = useMutation(api.inbox.markAsRead)
  const markAllRead = useMutation(api.inbox.markAllRead)
  const decline = useMutation(api.inbox.decline)

  const selected = (searchParams.get('id') ?? data?.items[0]?._id) as Id<'inboxItems'> | undefined
  const approvals = data?.filters.find(f => f.filter === 'Approvals')?.unread ?? 0

  function open(item: Item) {
    router.replace(`/dashboard/inbox?filter=${filter}&id=${item._id}`, { scroll: false })
    if (item.unread) markRead({ itemId: item._id }).catch(() => {})
  }

  const groups = new Map<string, Item[]>()
  data?.items.forEach(i => {
    const label = groupLabel(i.createdAt)
    groups.set(label, [...(groups.get(label) ?? []), i])
  })

  return (
    <div className='flex flex-col gap-6'>
      <PageHeader
        title='Inbox'
        subtitle={data ? `${pluralize(data.unread, 'item')} need you · ${pluralize(approvals, 'approval')} waiting` : undefined}
        actions={
          <HrButton
            variant='secondary'
            disabled={!data?.unread}
            onClick={async () => {
              const { marked } = await markAllRead({})
              toast.success(`Marked ${pluralize(marked, 'item')} as read`)
            }}
          >
            <CheckCheck aria-hidden='true' />
            Mark all read
          </HrButton>
        }
      />

      <div className='grid gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]'>
        <div className='self-start overflow-hidden rounded-lg border border-border bg-card'>
          <div role='group' aria-label='Filter inbox' className='flex flex-wrap gap-2 border-b border-border p-4'>
            {(data?.filters ?? []).map(f => (
              <FilterChip
                key={f.filter}
                label={f.filter}
                count={f.count}
                active={filter === f.filter}
                onClick={() => {
                  setFilter(f.filter)
                  router.replace(`/dashboard/inbox?filter=${f.filter}`, { scroll: false })
                }}
              />
            ))}
          </div>
          {data === undefined ? (
            <LoadingRows rows={6} className='p-4' label='Loading inbox' />
          ) : data.items.length === 0 ? (
            <EmptyState variant='plain' icon={<InboxIcon />} title='All caught up' description='Nothing here right now.' />
          ) : (
            [...groups].map(([label, items]) => (
              <section key={label} aria-label={label}>
                <h2 className='bg-subtle px-4 py-1.5 text-meta font-semibold tracking-overline text-muted-foreground uppercase'>{label}</h2>
                <ul className='divide-y divide-border-subtle'>
                  {items.map(item => (
                    <li key={item._id} className={cn('relative px-4 py-3.5', item._id === selected && 'bg-info-soft/60')}>
                      <div className='flex gap-3'>
                        {item.category === 'System' ? (
                          <span className='inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-danger-soft text-danger-foreground'>
                            <AlertTriangle aria-hidden='true' className='size-4' strokeWidth={1.75} />
                          </span>
                        ) : (
                          <InitialsAvatar name={item.actorName ?? item.title} size={32} />
                        )}
                        <div className='min-w-0 flex-1'>
                          <div className='flex items-start justify-between gap-2'>
                            <button type='button' onClick={() => open(item)} className='text-left text-body font-semibold text-foreground after:absolute after:inset-0 hover:underline'>
                              {item.title}
                            </button>
                            <span className='flex shrink-0 items-center gap-1.5 text-meta text-muted-foreground'>
                              {formatTime(item.createdAt)}
                              {item.unread ? (
                                <span className='size-2 rounded-full bg-primary'>
                                  <span className='sr-only'>Unread</span>
                                </span>
                              ) : null}
                            </span>
                          </div>
                          <p className='line-clamp-2 text-meta text-fg-secondary'>{item.preview}</p>
                          <div className='relative z-10 mt-2 flex flex-wrap items-center justify-between gap-2'>
                            <StatusPill tone={CATEGORY_TONE[item.category]}>{item.tag ?? item.kind}</StatusPill>
                            <Decision item={item} onDecline={() => setDeclining(item)} />
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ))
          )}
        </div>

        <section aria-label='Message' className='self-start rounded-lg border border-border bg-card p-6'>
          {selected ? <Detail key={selected} itemId={selected} onDecline={setDeclining} /> : <EmptyState variant='plain' title='Select a message' />}
        </section>
      </div>

      <FormDialog
        open={declining !== null}
        onOpenChange={o => !o && setDeclining(null)}
        title='Decline request'
        description={declining?.title}
        submitLabel='Decline'
        submitVariant='danger'
        onSubmit={async form => {
          if (!declining) return
          const reason = String(form.get('reason') ?? '').trim()
          await decline({ itemId: declining._id, reason: reason || undefined })
          toast.success('Declined')
        }}
      >
        <Field label='Reason' name='reason' multiline placeholder='Shared with the requester' />
      </FormDialog>
    </div>
  )
}

export default function InboxPage() {
  return (
    <React.Suspense>
      <InboxScreen />
    </React.Suspense>
  )
}
