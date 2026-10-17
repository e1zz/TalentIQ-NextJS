'use client'

import * as React from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useMutation, useQuery } from 'convex/react'
import {
  ArrowRight,
  Calendar,
  Check,
  Clock,
  FileText,
  Globe,
  Mail,
  MapPin,
  MessageSquare,
  MoveRight,
  Phone,
  Star,
  Video
} from 'lucide-react'
import { toast } from 'sonner'

import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import type { ActivityType, Recommendation } from '@/convex/lib/validators'
import {
  Breadcrumb,
  EmptyState,
  HrButton,
  InitialsAvatar,
  SectionCard,
  StatusPill,
  Tag,
  TabsWithCount,
  TabsWithCountContent,
  type StatusTone
} from '@/components/hr'
import { PERSON_DOC_TONE, useOpenDocument } from '@/components/screens/doc-bits'
import { errorText } from '@/components/screens/form-dialog'
import { LoadingRows, Skeleton } from '@/components/screens/skeleton'
import { cn } from '@/lib/utils'
import { formatDate, formatRelative, formatShortDate, formatTime } from '@/lib/format'

const RECOMMENDATION_TONE: Record<Recommendation, StatusTone> = { 'Strong hire': 'success', Hire: 'success', 'No hire': 'danger' }
const ACTIVITY_ICON: Record<ActivityType, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  applied: ArrowRight,
  stage_changed: MoveRight,
  note: MessageSquare,
  email: Mail,
  interview_scheduled: Video,
  scorecard: Star,
  offer: FileText,
  document: FileText,
  referral: ArrowRight
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className='grid grid-cols-[7.5rem_minmax(0,1fr)] gap-3 py-1'>
      <dt className='text-meta text-muted-foreground'>{label}</dt>
      <dd className='text-body font-semibold text-foreground'>{children ?? '—'}</dd>
    </div>
  )
}

function NoteForm({ candidateId, applicationId }: { candidateId: Id<'candidates'>; applicationId?: Id<'applications'> }) {
  const addNote = useMutation(api.candidates.addNote)
  const [text, setText] = React.useState('')
  return (
    <form
      className='flex gap-2.5'
      onSubmit={async e => {
        e.preventDefault()
        if (!text.trim()) return
        try {
          await addNote({ candidateId, applicationId, text: text.trim() })
          setText('')
        } catch (err) {
          toast.error(errorText(err))
        }
      }}
    >
      <label className='sr-only' htmlFor='note'>
        Add a note
      </label>
      <input
        id='note'
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder='Add a note for the hiring team…'
        className='h-10 min-w-0 flex-1 rounded-sm border border-input bg-card px-3 text-body placeholder:text-muted-foreground'
      />
      <HrButton type='submit' variant='secondary' disabled={!text.trim()}>
        Add note
      </HrButton>
    </form>
  )
}

function CandidateProfile({ id }: { id: Id<'candidates'> }) {
  const searchParams = useSearchParams()
  const applicationId = (searchParams.get('application') ?? undefined) as Id<'applications'> | undefined
  const data = useQuery(api.candidates.profile, { candidateId: id, applicationId })
  const openDocument = useOpenDocument()
  const [tab, setTab] = React.useState('overview')

  if (data === undefined) {
    return (
      <div className='flex flex-col gap-6'>
        <Skeleton className='h-36' />
        <Skeleton className='h-20' />
        <LoadingRows rows={6} label='Loading candidate' />
      </div>
    )
  }
  if (data === null) {
    return <EmptyState title='Candidate not found' action={<Link href='/dashboard/candidates'>Back to candidates</Link>} />
  }

  const { candidate, application, stageProgress, nextStep, scorecards, activity, documents } = data

  const scorecardList = (
    <ul className='divide-y divide-border-subtle'>
      {scorecards.map(s => (
        <li key={s._id} className='flex items-center gap-3 py-3'>
          <InitialsAvatar name={s.interviewer?.name ?? 'Interviewer'} size={32} />
          <div className='min-w-0 flex-1'>
            <p className='text-body font-semibold text-foreground'>{s.interviewer?.name ?? 'Interviewer'}</p>
            <p className='text-meta text-muted-foreground'>
              {s.round} · {s.interviewer?.title ?? ''} · {formatShortDate(s.submittedAt)}
            </p>
            {s.summary ? <p className='mt-1 text-meta text-fg-body'>{s.summary}</p> : null}
          </div>
          <span className='inline-flex items-center gap-1 text-body font-semibold text-foreground tabular-nums'>
            <Star aria-hidden='true' className='size-4 text-warning' strokeWidth={1.75} />
            {s.rating.toFixed(1)}
          </span>
          <StatusPill tone={RECOMMENDATION_TONE[s.recommendation]}>{s.recommendation}</StatusPill>
        </li>
      ))}
    </ul>
  )

  const activityList = (limit?: number) => (
    <ol className='flex flex-col gap-4'>
      {activity.slice(0, limit).map(a => {
        const Icon = ACTIVITY_ICON[a.type]
        return (
          <li key={a._id} className='flex gap-3'>
            <span className='inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-icon'>
              <Icon className='size-4' strokeWidth={1.75} />
            </span>
            <div>
              <p className='text-body font-semibold text-foreground'>{a.text}</p>
              <p className='text-meta text-muted-foreground'>
                {formatRelative(a.at)}
                {a.actorName ? ` · ${a.actorName}` : ''}
              </p>
            </div>
          </li>
        )
      })}
    </ol>
  )

  const documentList = (
    <ul className='flex flex-col gap-2'>
      {documents.map(d => (
        <li key={d._id} className='flex items-center gap-2.5'>
          <FileText aria-hidden='true' className='size-4 shrink-0 text-icon' strokeWidth={1.75} />
          <button type='button' onClick={() => openDocument(d._id)} className='min-w-0 flex-1 truncate text-left text-body text-fg-body hover:underline'>
            {d.fileName ?? d.title}
          </button>
          <StatusPill tone={PERSON_DOC_TONE[d.status]}>{d.status}</StatusPill>
        </li>
      ))}
      {documents.length === 0 ? <li className='text-body text-muted-foreground'>No documents yet.</li> : null}
    </ul>
  )

  return (
    <div className='flex flex-col gap-6'>
      <Breadcrumb
        items={[
          { label: 'Candidates', href: '/dashboard/candidates' },
          ...(application ? [{ label: application.job.title, href: `/dashboard/jobs/${application.job._id}` }] : []),
          { label: candidate.name }
        ]}
      />

      <header className='flex flex-col gap-4 rounded-lg border border-border bg-card p-6 lg:flex-row lg:items-center'>
        <InitialsAvatar name={candidate.name} size={40} />
        <div className='min-w-0 flex-1'>
          <h1 className='text-page-title font-bold text-foreground'>{candidate.name}</h1>
          <p className='text-body text-fg-secondary'>
            {[application?.job.title, application?.job.department, application ? `Applied ${formatShortDate(application.appliedAt)} via ${candidate.sourceLabel}` : candidate.sourceLabel]
              .filter(Boolean)
              .join(' · ')}
          </p>
          <div className='mt-2 flex flex-wrap items-center gap-2'>
            {application?.tags.map(t => (
              <StatusPill key={t} tone={t === 'Stale' || t === 'Awaiting approval' ? 'warning' : 'info'}>
                {t}
              </StatusPill>
            ))}
            {application?.ratingAvg !== null && application?.ratingAvg !== undefined ? (
              <span className='inline-flex items-center gap-1 text-meta text-fg-secondary'>
                <Star aria-hidden='true' className='size-3.5 text-warning' strokeWidth={1.75} />
                {application.ratingAvg.toFixed(1)} avg · {application.scorecardCount} scorecards
              </span>
            ) : null}
          </div>
        </div>
        <div className='flex flex-wrap gap-2.5'>
          <HrButton asChild variant='secondary'>
            <a href={`mailto:${candidate.email}`}>
              <MessageSquare aria-hidden='true' />
              Message
            </a>
          </HrButton>
          <HrButton asChild variant='secondary'>
            <Link href={`/dashboard/calendar?candidate=${candidate._id}`}>
              <Calendar aria-hidden='true' />
              Schedule
            </Link>
          </HrButton>
          {application?.tags.includes('Awaiting approval') ? (
            <HrButton asChild variant='primary'>
              <Link href='/dashboard/inbox?filter=Approvals'>
                <Check aria-hidden='true' />
                Approve offer
              </Link>
            </HrButton>
          ) : null}
        </div>
      </header>

      {stageProgress.length > 0 ? (
        <ol aria-label='Hiring stages' className='flex flex-wrap items-center gap-x-3 gap-y-4 rounded-lg border border-border bg-card px-6 py-4'>
          {stageProgress.map((s, i) => (
            <li key={s.stage} className='flex min-w-0 flex-1 items-center gap-3'>
              <span
                aria-hidden='true'
                className={cn(
                  'inline-flex size-7 shrink-0 items-center justify-center rounded-full border-2',
                  s.reached && !s.current && 'border-primary bg-primary text-primary-foreground',
                  s.current && 'border-primary bg-card',
                  !s.reached && 'border-border bg-card'
                )}
              >
                {s.reached && !s.current ? <Check className='size-4' strokeWidth={2.5} /> : s.current ? <span className='size-2.5 rounded-full bg-primary' /> : null}
              </span>
              <span className='min-w-0'>
                <span className={cn('block text-body font-semibold', s.reached ? 'text-foreground' : 'text-muted-foreground')}>
                  {s.stage}
                  <span className='sr-only'>{s.current ? ' (current)' : s.reached ? ' (done)' : ''}</span>
                </span>
                <span className='block text-meta text-muted-foreground'>{s.enteredAt ? formatShortDate(s.enteredAt) : s.current ? 'In progress' : '—'}</span>
              </span>
              {i < stageProgress.length - 1 ? <span aria-hidden='true' className={cn('hidden h-0.5 flex-1 lg:block', stageProgress[i + 1].reached ? 'bg-primary' : 'bg-border')} /> : null}
            </li>
          ))}
        </ol>
      ) : null}

      <div className='grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]'>
        <div className='flex min-w-0 flex-col gap-6'>
          <TabsWithCount
            label='Candidate sections'
            value={tab}
            onValueChange={setTab}
            items={[
              { value: 'overview', label: 'Overview' },
              { value: 'scorecards', label: 'Scorecards', count: scorecards.length },
              { value: 'activity', label: 'Activity' },
              { value: 'documents', label: 'Documents', count: documents.length }
            ]}
          >
            <TabsWithCountContent value='overview' className='flex flex-col gap-6 pt-6'>
              {nextStep ? (
                <div className='flex flex-wrap items-center gap-3 rounded-lg border border-warning/40 bg-warning-soft px-5 py-4'>
                  <Clock aria-hidden='true' className='size-5 text-warning-foreground' strokeWidth={1.75} />
                  <div className='min-w-0 flex-1'>
                    <p className='text-body font-semibold text-foreground'>Next step: {nextStep.title}</p>
                    {nextStep.detail || nextStep.at ? (
                      <p className='text-meta text-fg-secondary'>
                        {[nextStep.detail, nextStep.at ? `${formatShortDate(nextStep.at)} ${formatTime(nextStep.at)}` : null].filter(Boolean).join(' · ')}
                      </p>
                    ) : null}
                  </div>
                  {nextStep.kind === 'offer' ? (
                    <HrButton asChild variant='primary' size='sm'>
                      <Link href='/dashboard/inbox?filter=Approvals'>Review</Link>
                    </HrButton>
                  ) : null}
                </div>
              ) : null}
              <SectionCard
                title='Scorecards'
                meta={application?.ratingAvg ? `${scorecards.length} submitted · avg ${application.ratingAvg.toFixed(1)}` : undefined}
              >
                {scorecards.length ? scorecardList : <p className='text-body text-muted-foreground'>No scorecards yet.</p>}
              </SectionCard>
              <SectionCard title='Activity'>
                <div className='flex flex-col gap-5'>
                  <NoteForm candidateId={candidate._id} applicationId={application?._id} />
                  {activityList(6)}
                </div>
              </SectionCard>
            </TabsWithCountContent>
            <TabsWithCountContent value='scorecards' className='pt-6'>
              <SectionCard title='Scorecards'>{scorecards.length ? scorecardList : <p className='text-body text-muted-foreground'>No scorecards yet.</p>}</SectionCard>
            </TabsWithCountContent>
            <TabsWithCountContent value='activity' className='pt-6'>
              <SectionCard title='Activity'>
                <div className='flex flex-col gap-5'>
                  <NoteForm candidateId={candidate._id} applicationId={application?._id} />
                  {activityList()}
                </div>
              </SectionCard>
            </TabsWithCountContent>
            <TabsWithCountContent value='documents' className='pt-6'>
              <SectionCard title='Documents'>{documentList}</SectionCard>
            </TabsWithCountContent>
          </TabsWithCount>
        </div>

        <aside className='flex flex-col gap-6 rounded-lg border border-border bg-card p-5 self-start'>
          <section>
            <h2 className='text-meta font-semibold tracking-overline text-muted-foreground uppercase'>Contact</h2>
            <ul className='mt-3 flex flex-col gap-2.5 text-body text-fg-body'>
              <li className='flex items-center gap-2.5'>
                <Mail aria-hidden='true' className='size-4 text-icon' strokeWidth={1.75} />
                <a href={`mailto:${candidate.email}`} className='truncate hover:underline'>{candidate.email}</a>
              </li>
              {candidate.phone ? (
                <li className='flex items-center gap-2.5'>
                  <Phone aria-hidden='true' className='size-4 text-icon' strokeWidth={1.75} />
                  <a href={`tel:${candidate.phone}`} className='hover:underline'>{candidate.phone}</a>
                </li>
              ) : null}
              {candidate.location ? (
                <li className='flex items-center gap-2.5'>
                  <MapPin aria-hidden='true' className='size-4 text-icon' strokeWidth={1.75} />
                  {candidate.location}
                </li>
              ) : null}
              {candidate.linkedinUrl ? (
                <li className='flex items-center gap-2.5'>
                  <Globe aria-hidden='true' className='size-4 text-icon' strokeWidth={1.75} />
                  <a href={candidate.linkedinUrl} target='_blank' rel='noopener noreferrer' className='truncate hover:underline'>
                    {candidate.linkedinUrl.replace(/^https?:\/\/(www\.)?/, '')}
                  </a>
                </li>
              ) : null}
            </ul>
          </section>
          <section>
            <h2 className='text-meta font-semibold tracking-overline text-muted-foreground uppercase'>Details</h2>
            <dl className='mt-2'>
              <DetailRow label='Current role'>{[candidate.currentRole, candidate.currentCompany].filter(Boolean).join(' · ') || null}</DetailRow>
              <DetailRow label='Experience'>{candidate.experienceYears !== null ? `${candidate.experienceYears} years` : null}</DetailRow>
              <DetailRow label='Expected pay'>{candidate.expectedPay}</DetailRow>
              <DetailRow label='Notice period'>{candidate.noticePeriod}</DetailRow>
              <DetailRow label='Source'>{candidate.sourceLabel}</DetailRow>
            </dl>
          </section>
          {candidate.skills.length ? (
            <section>
              <h2 className='text-meta font-semibold tracking-overline text-muted-foreground uppercase'>Skills</h2>
              <ul className='mt-3 flex flex-wrap gap-1.5'>
                {candidate.skills.map(s => (
                  <li key={s}>
                    <Tag tone='neutral' dot>
                      {s}
                    </Tag>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          <section>
            <h2 className='text-meta font-semibold tracking-overline text-muted-foreground uppercase'>Documents</h2>
            <div className='mt-3'>{documentList}</div>
          </section>
          {data.otherApplications.length ? (
            <section>
              <h2 className='text-meta font-semibold tracking-overline text-muted-foreground uppercase'>Other applications</h2>
              <ul className='mt-3 flex flex-col gap-2'>
                {data.otherApplications.map(a => (
                  <li key={a._id}>
                    <Link href={`/dashboard/candidates/${candidate._id}?application=${a._id}`} className='text-body text-brand-fg hover:underline'>
                      {a.jobTitle} · {a.stage}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          <p className='text-meta text-muted-foreground'>Profile created {application ? formatDate(application.appliedAt) : ''}</p>
        </aside>
      </div>
    </div>
  )
}

export default function CandidatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params)
  return (
    <React.Suspense>
      <CandidateProfile id={id as Id<'candidates'>} />
    </React.Suspense>
  )
}
