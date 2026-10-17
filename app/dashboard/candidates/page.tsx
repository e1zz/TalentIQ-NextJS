'use client'

import * as React from 'react'
import Link from 'next/link'
import { Users } from 'lucide-react'

import type { Id } from '@/convex/_generated/dataModel'
import { EmptyState, FilterSelect } from '@/components/hr'
import { PipelineBoard, useOpenJobs } from '@/components/screens/pipeline-board'
import { Skeleton } from '@/components/screens/skeleton'

/** Candidates: the pipeline for one open role at a time, most urgent role first. */
export default function CandidatesPage() {
  const jobs = useOpenJobs()
  const [jobId, setJobId] = React.useState<string>('')

  if (jobs === undefined) return <Skeleton className='h-96 w-full' />
  if (jobs.length === 0) {
    return (
      <EmptyState
        icon={<Users />}
        title='No open roles'
        description='Candidates appear here once a role is open.'
        action={<Link href='/dashboard/jobs?new=1'>Create a job</Link>}
      />
    )
  }

  const selected = (jobId || jobs[0]._id) as Id<'jobs'>
  return (
    <PipelineBoard
      key={selected}
      jobId={selected}
      breadcrumb={false}
      jobPicker={
        <FilterSelect
          label='Role'
          allLabel={null}
          value={selected}
          onChange={e => setJobId(e.target.value)}
          options={jobs.map(j => ({ value: j._id, label: j.title }))}
        />
      }
    />
  )
}
