'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMutation, useQuery } from 'convex/react'
import { ArrowRight, Briefcase, FileText, LayoutGrid, List, MapPin, Plus } from 'lucide-react'

import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import type { JobCard } from '@/convex/lib/jobCards'
import type { Department, EmploymentType, JobStatus, WorkMode } from '@/convex/lib/validators'
import {
  EmptyState,
  FilterSelect,
  HrButton,
  InitialsAvatar,
  PageHeader,
  SegmentedControl,
  Table,
  TableBody,
  TableCell,
  TableCellStack,
  TableHead,
  TableHeader,
  TableRow,
  TabsWithCount
} from '@/components/hr'
import { Field, FormDialog, SearchField } from '@/components/screens/form-dialog'
import { JobHealthPill, StageBar } from '@/components/screens/job-bits'
import { Skeleton } from '@/components/screens/skeleton'
import { formatNumber, pluralize } from '@/lib/format'

const DEPARTMENTS: Department[] = ['Engineering', 'Product', 'Design', 'Data', 'Marketing', 'Sales', 'Finance', 'People']
const SORTS = [
  { value: 'urgent', label: 'Sort: Most urgent' },
  { value: 'newest', label: 'Sort: Newest' },
  { value: 'applicants', label: 'Sort: Most applicants' }
] as const

function JobCardView({ job }: { job: JobCard }) {
  const stats = [
    { label: 'Applied', value: job.stageCounts.applied },
    { label: 'Screening', value: job.stageCounts.screening },
    { label: 'Interview', value: job.stageCounts.interview },
    { label: 'Offer', value: job.stageCounts.offer }
  ]
  return (
    <article className='flex flex-col rounded-lg border border-border bg-card p-5'>
      <div className='flex items-center justify-between gap-2'>
        <p className='text-meta font-semibold tracking-overline text-muted-foreground uppercase'>{job.department}</p>
        <JobHealthPill job={job} />
      </div>
      <h2 className='mt-3 text-card-title font-bold text-foreground'>
        <Link href={`/dashboard/jobs/${job._id}`} className='hover:underline'>
          {job.title}
        </Link>
      </h2>
      <p className='mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-meta text-fg-secondary'>
        <span className='inline-flex items-center gap-1'>
          <MapPin aria-hidden='true' className='size-3.5' strokeWidth={1.75} />
          {job.location} · {job.workMode}
        </span>
        <span className='inline-flex items-center gap-1'>
          <Briefcase aria-hidden='true' className='size-3.5' strokeWidth={1.75} />
          {job.employmentType}
        </span>
      </p>
      <StageBar counts={job.stageCounts} className='mt-4 [&>div]:w-full' />
      <dl className='mt-3 grid grid-cols-4 gap-2 border-b border-border-subtle pb-4'>
        {stats.map(s => (
          <div key={s.label}>
            <dd className='text-body font-bold text-foreground tabular-nums'>{formatNumber(s.value)}</dd>
            <dt className='text-meta text-muted-foreground'>{s.label}</dt>
          </div>
        ))}
      </dl>
      <div className='mt-4 flex items-center gap-2.5'>
        {job.hiringManager ? <InitialsAvatar name={job.hiringManager.name} size={28} /> : null}
        <div className='min-w-0 flex-1'>
          <p className='truncate text-body font-semibold text-foreground'>{job.hiringManager?.name ?? 'No hiring manager'}</p>
          <p className='text-meta text-muted-foreground'>
            {job.postedAt ? `Posted ${pluralize(job.daysOpen, 'day')} ago` : 'Not posted yet'}
          </p>
        </div>
        {job.applicantsThisWeek > 0 ? (
          <span className='text-meta font-semibold text-success-foreground'>+{job.applicantsThisWeek} this week</span>
        ) : null}
      </div>
      <HrButton asChild variant='secondary' className='mt-4 w-full'>
        <Link href={`/dashboard/jobs/${job._id}`}>
          Review applicants
          <ArrowRight aria-hidden='true' />
        </Link>
      </HrButton>
    </article>
  )
}

function JobsTable({ jobs }: { jobs: JobCard[] }) {
  return (
    <div className='rounded-lg border border-border bg-card'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Role</TableHead>
            <TableHead>Hiring manager</TableHead>
            <TableHead align='right'>Applicants</TableHead>
            <TableHead>Pipeline</TableHead>
            <TableHead align='right'>Open for</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.map(job => (
            <TableRow key={job._id}>
              <TableCell>
                <TableCellStack
                  primary={<Link href={`/dashboard/jobs/${job._id}`} className='hover:underline'>{job.title}</Link>}
                  secondary={`${job.department} · ${job.location}`}
                />
              </TableCell>
              <TableCell>{job.hiringManager?.name ?? '—'}</TableCell>
              <TableCell align='right' className='tabular-nums'>{job.applicants}</TableCell>
              <TableCell>
                <StageBar counts={job.stageCounts} />
              </TableCell>
              <TableCell align='right' className='tabular-nums'>{job.daysOpen}d</TableCell>
              <TableCell>
                <JobHealthPill job={job} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function CreateJobDialog({
  open,
  onOpenChange,
  managers
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  managers: { _id: Id<'employees'>; name: string; title: string }[]
}) {
  const create = useMutation(api.jobs.create)
  const router = useRouter()
  const num = (v: FormDataEntryValue | null) => (v === null || v === '' ? undefined : Number(v))
  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Create job'
      description='Publish now or save as a draft to finish later.'
      submitLabel='Create job'
      onSubmit={async data => {
        const id = await create({
          title: String(data.get('title')),
          department: data.get('department') as Department,
          location: String(data.get('location')),
          workMode: data.get('workMode') as WorkMode,
          employmentType: data.get('employmentType') as EmploymentType,
          hiringManagerId: data.get('hiringManagerId') as Id<'employees'>,
          headcount: num(data.get('headcount')),
          salaryMin: num(data.get('salaryMin')),
          salaryMax: num(data.get('salaryMax')),
          currency: 'USD',
          publish: data.get('publish') === 'yes'
        })
        router.push(`/dashboard/jobs/${id}`)
      }}
    >
      <Field label='Job title' name='title' required placeholder='e.g. Senior Frontend Engineer' />
      <div className='grid gap-4 sm:grid-cols-2'>
        <Field label='Department' name='department' options={DEPARTMENTS.map(d => ({ value: d, label: d }))} />
        <Field label='Hiring manager' name='hiringManagerId' required options={managers.map(m => ({ value: m._id, label: m.name }))} />
        <Field label='Location' name='location' required placeholder='e.g. Mexico City' />
        <Field label='Work mode' name='workMode' options={['Hybrid', 'Onsite', 'Remote'].map(v => ({ value: v, label: v }))} />
        <Field label='Employment type' name='employmentType' options={['Full-time', 'Part-time', 'Contract', 'Internship'].map(v => ({ value: v, label: v }))} />
        <Field label='Openings' name='headcount' type='number' min={1} defaultValue={1} />
        <Field label='Salary from (USD)' name='salaryMin' type='number' min={0} step={1000} />
        <Field label='Salary to (USD)' name='salaryMax' type='number' min={0} step={1000} />
      </div>
      <Field
        label='Visibility'
        name='publish'
        options={[
          { value: 'yes', label: 'Publish to the career site now' },
          { value: 'no', label: 'Save as draft' }
        ]}
      />
    </FormDialog>
  )
}

function JobsScreen() {
  const searchParams = useSearchParams()
  const [status, setStatus] = React.useState<JobStatus>('Open')
  const [department, setDepartment] = React.useState('')
  const [location, setLocation] = React.useState('')
  const [manager, setManager] = React.useState('')
  const [sort, setSort] = React.useState<(typeof SORTS)[number]['value']>('urgent')
  const [view, setView] = React.useState<'grid' | 'table'>('grid')
  const [query, setQuery] = React.useState('')
  const [creating, setCreating] = React.useState(searchParams.get('new') === '1')

  const overview = useQuery(api.jobs.overview, {})
  const openJobs = useQuery(api.jobs.list, { status: 'Open' })
  const jobs = useQuery(api.jobs.list, {
    status,
    department: (department || undefined) as Department | undefined,
    location: location || undefined,
    hiringManagerId: (manager || undefined) as Id<'employees'> | undefined,
    sort
  })

  const visible = jobs?.filter(j => j.title.toLowerCase().includes(query.trim().toLowerCase()))
  const subtitle = openJobs
    ? `${pluralize(openJobs.length, 'open role')} · ${pluralize(
        openJobs.reduce((s, j) => s + j.stageCounts.applied - j.stageCounts.hired, 0),
        'active candidate'
      )} · ${pluralize(openJobs.reduce((s, j) => s + j.applicantsThisWeek, 0), 'new application')} this week`
    : undefined

  return (
    <div className='flex flex-col gap-6'>
      <PageHeader
        title='Jobs'
        subtitle={subtitle}
        actions={
          <>
            <HrButton variant='secondary' disabled title='Coming soon'>
              <FileText aria-hidden='true' />
              Job templates
            </HrButton>
            <HrButton variant='primary' onClick={() => setCreating(true)} disabled={!overview}>
              <Plus aria-hidden='true' />
              Create job
            </HrButton>
          </>
        }
      />

      <TabsWithCount
        label='Job status'
        value={status}
        onValueChange={v => setStatus(v as JobStatus)}
        items={(overview?.tabs ?? [{ status: 'Open' as const, label: 'Open', count: 0 }]).map(t => ({ value: t.status, label: t.label, count: t.count }))}
      />

      <div className='flex flex-wrap items-center gap-2.5'>
        <SearchField label='Search roles' value={query} onChange={setQuery} className='w-full sm:w-64' />
        <FilterSelect
          label='Department'
          value={department}
          onChange={e => setDepartment(e.target.value)}
          options={(overview?.filterOptions.departments ?? []).map(d => ({ value: d, label: d }))}
        />
        <FilterSelect
          label='Location'
          value={location}
          onChange={e => setLocation(e.target.value)}
          options={(overview?.filterOptions.locations ?? []).map(l => ({ value: l, label: l }))}
        />
        <FilterSelect
          label='Hiring manager'
          value={manager}
          onChange={e => setManager(e.target.value)}
          options={(overview?.filterOptions.hiringManagers ?? []).map(m => ({ value: m._id, label: m.name }))}
        />
        <div className='ml-auto flex items-center gap-2.5'>
          <FilterSelect
            label='Sort'
            allLabel={null}
            value={sort}
            onChange={e => setSort(e.target.value as typeof sort)}
            options={SORTS.map(s => ({ value: s.value, label: s.label }))}
          />
          <SegmentedControl
            label='Layout'
            value={view}
            onValueChange={setView}
            options={[
              { value: 'grid', label: 'Cards', icon: <LayoutGrid /> },
              { value: 'table', label: 'Table', icon: <List /> }
            ]}
          />
        </div>
      </div>

      {visible === undefined ? (
        <div className='grid gap-5 md:grid-cols-2 xl:grid-cols-3'>
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className='h-72' />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={<Briefcase />}
          title={query ? `No roles match “${query}”` : `No ${status === 'Draft' ? 'drafts' : status.toLowerCase() + ' roles'}`}
          description='Try another tab or clear the filters.'
        />
      ) : view === 'grid' ? (
        <div className='grid gap-5 md:grid-cols-2 xl:grid-cols-3'>
          {visible.map(job => (
            <JobCardView key={job._id} job={job} />
          ))}
        </div>
      ) : (
        <JobsTable jobs={visible} />
      )}

      {overview ? <CreateJobDialog open={creating} onOpenChange={setCreating} managers={overview.filterOptions.hiringManagers} /> : null}
    </div>
  )
}

export default function JobsPage() {
  return (
    <React.Suspense>
      <JobsScreen />
    </React.Suspense>
  )
}
