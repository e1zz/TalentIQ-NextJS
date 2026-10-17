'use client'

import * as React from 'react'
import Link from 'next/link'
import { useMutation, useQuery } from 'convex/react'
import { Clock, Share2, Star, UserPlus } from 'lucide-react'
import { toast } from 'sonner'

import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import type { CandidateSource, CandidateTag, Stage } from '@/convex/lib/validators'
import {
  CountBadge,
  EmptyState,
  FilterChip,
  FilterSelect,
  HrButton,
  InitialsAvatar,
  PageHeader,
  SegmentedControl,
  StatusPill,
  Table,
  TableBody,
  TableCell,
  TableCellStack,
  TableHead,
  TableHeader,
  TableRow,
  type StatusTone
} from '@/components/hr'
import { errorText, SearchField } from '@/components/screens/form-dialog'
import { JobHealthPill } from '@/components/screens/job-bits'
import { Skeleton } from '@/components/screens/skeleton'
import { formatShortDate, formatTime } from '@/lib/format'

const STAGES: Stage[] = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired']
const SOURCES: CandidateSource[] = ['LinkedIn', 'Referral', 'Career site', 'Indeed', 'Agency']
const TAG_TONE: Record<CandidateTag, StatusTone> = {
  Referral: 'info',
  'Final round': 'info',
  Stale: 'warning',
  'Awaiting approval': 'warning'
}
const COLUMN_LIMIT = 6

type Card = NonNullable<ReturnType<typeof usePipeline>>['columns'][number]['cards'][number]

function usePipeline(jobId: Id<'jobs'>, filters: { source?: CandidateSource; minRating?: number; needsAction?: boolean }) {
  return useQuery(api.candidates.pipeline, { jobId, ...filters })
}

function nextActionText(card: Card): string | null {
  if (!card.nextAction) return null
  if (card.nextActionDueAt === null) return card.nextAction
  const today = new Date().toDateString() === new Date(card.nextActionDueAt).toDateString()
  return `${card.nextAction} ${today ? `today ${formatTime(card.nextActionDueAt)}` : formatShortDate(card.nextActionDueAt)}`
}

function MoveSelect({ card }: { card: Card }) {
  const move = useMutation(api.candidates.moveStage)
  return (
    <select
      aria-label={`Move ${card.name} to stage`}
      value={card.stage}
      onChange={async e => {
        const stage = e.target.value as Stage
        try {
          await move({ applicationId: card.applicationId, stage })
          toast.success(`${card.name} moved to ${stage}`)
        } catch (err) {
          toast.error(errorText(err))
        }
      }}
      className='h-8 rounded-sm border border-input bg-card px-2 text-meta text-fg-body'
    >
      {STAGES.map(s => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  )
}

function CandidateCard({ card }: { card: Card }) {
  const action = nextActionText(card)
  return (
    <li className='rounded-md border border-border bg-card p-3.5 shadow-xs'>
      <div className='flex items-start gap-2.5'>
        <InitialsAvatar name={card.name} size={32} />
        <div className='min-w-0'>
          <Link
            href={`/dashboard/candidates/${card.candidateId}?application=${card.applicationId}`}
            className='block truncate text-body font-semibold text-foreground hover:underline'
          >
            {card.name}
          </Link>
          <p className='truncate text-meta text-muted-foreground'>{card.sourceLabel}</p>
        </div>
      </div>
      {card.tags.length > 0 ? (
        <div className='mt-2.5 flex flex-wrap gap-1.5'>
          {card.tags.map(tag => (
            <StatusPill key={tag} tone={TAG_TONE[tag]}>
              {tag}
            </StatusPill>
          ))}
        </div>
      ) : null}
      {action ? (
        <p className='mt-2.5 flex items-center gap-1.5 rounded-sm bg-subtle px-2.5 py-1.5 text-meta text-fg-body'>
          <Clock aria-hidden='true' className='size-3.5 shrink-0 text-icon' strokeWidth={1.75} />
          <span className='truncate'>{action}</span>
        </p>
      ) : null}
      <div className='mt-2.5 flex items-center justify-between gap-2 text-meta'>
        <span className='inline-flex items-center gap-1 font-semibold text-foreground'>
          <Star aria-hidden='true' className='size-3.5 fill-warning text-warning' strokeWidth={1.75} />
          {card.ratingAvg !== null ? card.ratingAvg.toFixed(1) : <span className='font-normal text-muted-foreground'>No rating</span>}
        </span>
        <span className={card.tags.includes('Stale') ? 'text-warning-foreground' : 'text-muted-foreground'}>
          In stage {card.daysInStage}d
        </span>
      </div>
      <div className='mt-2.5 border-t border-border-subtle pt-2.5'>
        <MoveSelect card={card} />
      </div>
    </li>
  )
}

function Column({ stage, count, cards }: { stage: Stage; count: number; cards: Card[] }) {
  const [expanded, setExpanded] = React.useState(false)
  const shown = expanded ? cards : cards.slice(0, COLUMN_LIMIT)
  const headingId = React.useId()
  return (
    <section aria-labelledby={headingId} className='flex w-72 shrink-0 flex-col rounded-lg bg-muted/70 p-3'>
      <h2 id={headingId} className='mb-3 flex items-center gap-2 px-1 text-body font-bold text-foreground'>
        {stage}
        <CountBadge>{count}</CountBadge>
      </h2>
      {cards.length === 0 ? (
        <p className='rounded-md border border-dashed border-border px-3 py-6 text-center text-meta text-muted-foreground'>
          No candidates in {stage.toLowerCase()}
        </p>
      ) : (
        <ul className='flex flex-col gap-2.5'>
          {shown.map(card => (
            <CandidateCard key={card.applicationId} card={card} />
          ))}
        </ul>
      )}
      {cards.length > COLUMN_LIMIT ? (
        <button
          type='button'
          onClick={() => setExpanded(e => !e)}
          className='hit-target mt-2 self-start rounded-sm px-1 text-body font-semibold text-brand-fg hover:underline'
        >
          {expanded ? 'Show less' : `Show ${cards.length - COLUMN_LIMIT} more`}
        </button>
      ) : null}
    </section>
  )
}

/** Kanban (or table) pipeline for one job, with the job header. */
export function PipelineBoard({
  jobId,
  jobPicker,
  breadcrumb = true
}: {
  jobId: Id<'jobs'>
  /** Optional job switcher rendered next to the filters. */
  jobPicker?: React.ReactNode
  breadcrumb?: boolean
}) {
  const [source, setSource] = React.useState('')
  const [minRating, setMinRating] = React.useState('')
  const [needsAction, setNeedsAction] = React.useState(false)
  const [view, setView] = React.useState<'board' | 'table'>('board')
  const [query, setQuery] = React.useState('')

  const data = usePipeline(jobId, {
    source: (source || undefined) as CandidateSource | undefined,
    minRating: minRating ? Number(minRating) : undefined,
    needsAction: needsAction || undefined
  })

  if (data === null) {
    return <EmptyState title='Job not found' description='It may have been deleted.' action={<Link href='/dashboard/jobs'>Back to jobs</Link>} />
  }

  const q = query.trim().toLowerCase()
  const columns = data?.columns.map(c => ({ ...c, cards: q ? c.cards.filter(card => card.name.toLowerCase().includes(q)) : c.cards }))
  const job = data?.job

  return (
    <div className='flex flex-col gap-6'>
      <PageHeader
        breadcrumb={breadcrumb && job ? [{ label: 'Jobs', href: '/dashboard/jobs' }, { label: job.title }] : undefined}
        title={job?.title ?? <Skeleton className='h-9 w-64' />}
        titleAdornment={job ? <JobHealthPill job={job} /> : undefined}
        subtitle={
          job
            ? [job.department, job.location, job.hiringManager ? `Hiring manager ${job.hiringManager.name}` : null, job.postedAt ? `Open for ${job.daysOpen} days` : 'Not posted']
                .filter(Boolean)
                .join(' · ')
            : undefined
        }
        actions={
          <>
            <HrButton
              variant='secondary'
              onClick={async () => {
                await navigator.clipboard.writeText(`${window.location.origin}/dashboard/jobs/${jobId}`)
                toast.success('Link copied')
              }}
            >
              <Share2 aria-hidden='true' />
              Share job
            </HrButton>
            <HrButton variant='primary' disabled title='Coming soon'>
              <UserPlus aria-hidden='true' />
              Add candidate
            </HrButton>
          </>
        }
      />

      <div className='flex flex-wrap items-center gap-2.5'>
        {jobPicker}
        <SearchField label='Search candidates' value={query} onChange={setQuery} className='w-full sm:w-64' />
        <FilterSelect label='Source' value={source} onChange={e => setSource(e.target.value)} options={SOURCES.map(s => ({ value: s, label: s }))} />
        <FilterSelect
          label='Rating'
          value={minRating}
          onChange={e => setMinRating(e.target.value)}
          options={[4.5, 4, 3.5, 3].map(r => ({ value: String(r), label: `${r}+ stars` }))}
        />
        <FilterChip label='Needs action' active={needsAction} onClick={() => setNeedsAction(a => !a)} />
        <SegmentedControl
          className='ml-auto'
          label='Layout'
          value={view}
          onValueChange={setView}
          options={[
            { value: 'board', label: 'Board' },
            { value: 'table', label: 'Table' }
          ]}
        />
      </div>

      {columns === undefined ? (
        <div className='flex gap-4 overflow-hidden'>
          {STAGES.map(s => (
            <Skeleton key={s} className='h-96 w-72 shrink-0' />
          ))}
        </div>
      ) : view === 'board' ? (
        <div className='-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 md:-mx-8 md:px-8'>
          {columns.map(c => (
            <Column key={c.stage} stage={c.stage} count={c.count} cards={c.cards} />
          ))}
        </div>
      ) : (
        <div className='rounded-lg border border-border bg-card'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidate</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Next action</TableHead>
                <TableHead align='right'>Rating</TableHead>
                <TableHead align='right'>In stage</TableHead>
                <TableHead>Move to</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {columns.flatMap(c => c.cards).map(card => (
                <TableRow key={card.applicationId}>
                  <TableCell>
                    <TableCellStack
                      primary={<Link href={`/dashboard/candidates/${card.candidateId}?application=${card.applicationId}`} className='hover:underline'>{card.name}</Link>}
                      secondary={card.sourceLabel}
                    />
                  </TableCell>
                  <TableCell>{card.stage}</TableCell>
                  <TableCell>{nextActionText(card) ?? '—'}</TableCell>
                  <TableCell align='right' className='tabular-nums'>{card.ratingAvg?.toFixed(1) ?? '—'}</TableCell>
                  <TableCell align='right' className='tabular-nums'>{card.daysInStage}d</TableCell>
                  <TableCell>
                    <MoveSelect card={card} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

/** Job switcher for the Candidates screen. */
export function useOpenJobs() {
  return useQuery(api.jobs.list, { status: 'Open', sort: 'urgent' })
}

