'use client'

import { use } from 'react'

import type { Id } from '@/convex/_generated/dataModel'
import { PipelineBoard } from '@/components/screens/pipeline-board'

export default function JobPipelinePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return <PipelineBoard jobId={id as Id<'jobs'>} />
}
