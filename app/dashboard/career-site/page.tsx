'use client'

import Link from 'next/link'
import { useMutation, useQuery } from 'convex/react'
import { Briefcase, Check, ChevronRight, Eye, Globe, Search } from 'lucide-react'
import { toast } from 'sonner'

import { api } from '@/convex/_generated/api'
import type { CareerSiteStatus } from '@/convex/lib/validators'
import { FilterSelect, HrButton, PageHeader, SectionCard, StatusPill } from '@/components/hr'
import { errorText } from '@/components/screens/form-dialog'
import { KpiCard } from '@/components/screens/kpi'
import { LoadingRows, Skeleton } from '@/components/screens/skeleton'
import { formatShortDate, pluralize } from '@/lib/format'

const STATUS_TONE = { Live: 'success', Draft: 'neutral', Paused: 'warning', 'Not connected': 'neutral' } as const

export default function CareerSitePage() {
  const data = useQuery(api.careerSite.overview, {})
  const toggle = useMutation(api.careerSite.toggleChecklistItem)
  const setStatus = useMutation(api.careerSite.setStatus)

  const host = data?.page?.url.replace(/^https?:\/\//, '')

  return (
    <div className='flex flex-col gap-6'>
      <PageHeader
        title='Career site'
        subtitle={data?.page ? `${host} · ${data.page.status.toLowerCase()} · ${pluralize(data.openRoles.length, 'open role')}` : undefined}
        actions={
          data?.page ? (
            <>
              <FilterSelect
                label='Site status'
                allLabel={null}
                value={data.page.status}
                onChange={async e => {
                  try {
                    await setStatus({ status: e.target.value as CareerSiteStatus })
                    toast.success(`Career site is now ${e.target.value.toLowerCase()}`)
                  } catch (err) {
                    toast.error(errorText(err))
                  }
                }}
                options={['Live', 'Draft', 'Paused'].map(s => ({ value: s, label: `Status: ${s}` }))}
              />
              <HrButton asChild variant='primary'>
                <a href={data.page.url} target='_blank' rel='noopener noreferrer'>
                  <Eye aria-hidden='true' />
                  View live
                </a>
              </HrButton>
            </>
          ) : undefined
        }
      />

      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        {data ? data.kpis.map(k => <KpiCard key={k.key} kpi={k} />) : Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className='h-32' />)}
      </div>

      <SectionCard title='Job channels' titleAs='h2' meta='Where roles are posted and candidates come from'>
        {data === undefined ? (
          <LoadingRows rows={3} label='Loading channels' />
        ) : (
          <ul className='grid gap-3 md:grid-cols-3'>
            {data.channels.map(c => (
              <li key={c.source} className='flex flex-col gap-2 rounded-md border border-border p-4'>
                <div className='flex items-center justify-between gap-2'>
                  <span className='text-body font-semibold text-foreground'>{c.source}</span>
                  <StatusPill tone={STATUS_TONE[c.status]}>{c.status}</StatusPill>
                </div>
                <p className='text-meta text-muted-foreground'>
                  {c.candidatesCapped ? `${c.candidates}+ candidates` : pluralize(c.candidates, 'candidate')} · {pluralize(c.hiresYtd, 'hire')} this year
                </p>
                {c.status === 'Not connected' ? (
                  <p className='text-meta text-muted-foreground'>Posting and sync need {c.source} partner access.</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <div className='grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]'>
        {/* Preview of the public page */}
        <section aria-label='Career site preview' className='overflow-hidden rounded-lg border border-border bg-card'>
          <div className='flex items-center gap-2 border-b border-border px-4 py-2.5'>
            <span aria-hidden='true' className='size-2.5 rounded-full bg-danger/70' />
            <span aria-hidden='true' className='size-2.5 rounded-full bg-warning/70' />
            <span aria-hidden='true' className='size-2.5 rounded-full bg-success/70' />
            <span className='ml-2 flex-1 truncate rounded-full border border-border px-3 py-1 text-meta text-muted-foreground'>{host ?? '…'}</span>
          </div>
          <div className='bg-hero px-6 py-8 text-white md:px-8'>
            <p className='text-2xl font-bold'>Build the future of work with us</p>
            <p className='mt-2 text-body text-hero-muted'>Remote-friendly teams across Engineering, Product, Design, Data, Sales and more.</p>
            <div className='mt-5 flex h-10 max-w-sm items-center gap-2 rounded-sm bg-white px-3 text-body text-gray-500'>
              <Search aria-hidden='true' className='size-4' strokeWidth={1.75} />
              Search roles, teams or locations
            </div>
          </div>
          <div className='p-6'>
            <h2 className='text-card-title font-bold text-foreground'>Open roles · {data?.openRoles.length ?? '…'}</h2>
            {data === undefined ? (
              <LoadingRows rows={4} className='mt-4' label='Loading roles' />
            ) : (
              <ul className='mt-4 flex flex-col gap-2.5'>
                {data.openRoles.map(job => (
                  <li key={job._id}>
                    <Link href={`/dashboard/jobs/${job._id}`} className='flex items-center gap-3 rounded-md border border-border p-3 transition-colors hover:bg-subtle'>
                      <span className='inline-flex size-9 shrink-0 items-center justify-center rounded-sm bg-muted text-icon'>
                        <Briefcase aria-hidden='true' className='size-4' strokeWidth={1.75} />
                      </span>
                      <span className='min-w-0 flex-1'>
                        <span className='block truncate text-body font-semibold text-foreground'>{job.title}</span>
                        <span className='block text-meta text-muted-foreground'>
                          {job.department} · {job.location} · {job.workMode}
                        </span>
                      </span>
                      <ChevronRight aria-hidden='true' className='size-4 text-icon' strokeWidth={1.75} />
                    </Link>
                  </li>
                ))}
                {data.openRoles.length === 0 ? <li className='text-body text-muted-foreground'>No roles are published to the career site.</li> : null}
              </ul>
            )}
          </div>
        </section>

        <SectionCard title='Page status' titleAs='h2'>
          {data === undefined ? (
            <LoadingRows rows={8} label='Loading page status' />
          ) : (
            <div className='flex flex-col gap-6'>
              {data.page ? (
                <dl className='flex flex-col gap-2 text-body'>
                  <div className='flex justify-between gap-3'>
                    <dt className='text-muted-foreground'>Status</dt>
                    <dd>
                      <StatusPill tone={STATUS_TONE[data.page.status]}>{data.page.status}</StatusPill>
                    </dd>
                  </div>
                  <div className='flex justify-between gap-3'>
                    <dt className='text-muted-foreground'>Last published</dt>
                    <dd className='font-semibold text-foreground'>
                      {formatShortDate(data.page.lastPublishedAt)}
                      {data.page.publishedBy ? ` · ${data.page.publishedBy.name}` : ''}
                    </dd>
                  </div>
                  <div className='flex justify-between gap-3'>
                    <dt className='text-muted-foreground'>Domain</dt>
                    <dd className='truncate font-semibold text-foreground'>{host}</dd>
                  </div>
                  <div className='flex justify-between gap-3'>
                    <dt className='text-muted-foreground'>Jobs shown</dt>
                    <dd className='font-semibold text-foreground'>{pluralize(data.openRoles.length, 'open role')}</dd>
                  </div>
                </dl>
              ) : (
                <p className='text-body text-muted-foreground'>The career site hasn&apos;t been set up yet.</p>
              )}

              <section>
                <h3 className='text-meta font-semibold tracking-overline text-muted-foreground uppercase'>Traffic sources</h3>
                <ul className='mt-3 flex flex-col gap-2.5'>
                  {data.trafficSources.map(t => (
                    <li key={t.source} className='flex items-center gap-2.5 text-body text-fg-body'>
                      <Globe aria-hidden='true' className='size-4 text-icon' strokeWidth={1.75} />
                      <span className='flex-1'>{t.source}</span>
                      <StatusPill tone={t.pct >= 25 ? 'info' : 'neutral'}>{t.pct}%</StatusPill>
                    </li>
                  ))}
                  {data.trafficSources.length === 0 ? <li className='text-body text-muted-foreground'>No traffic recorded this month.</li> : null}
                </ul>
              </section>

              <section>
                <h3 className='text-meta font-semibold tracking-overline text-muted-foreground uppercase'>
                  Page checklist · {data.checklist.done}/{data.checklist.total}
                </h3>
                <ul className='mt-3 flex flex-col gap-1'>
                  {data.checklist.items.map(item => (
                    <li key={item.index}>
                      <button
                        type='button'
                        aria-pressed={item.done}
                        onClick={() => toggle({ index: item.index }).catch(err => toast.error(errorText(err)))}
                        className='flex min-h-10 w-full items-center gap-2.5 rounded-sm px-1 text-left text-body text-fg-body hover:bg-subtle'
                      >
                        <Check aria-hidden='true' className={item.done ? 'size-4 text-success' : 'size-4 text-border'} strokeWidth={2} />
                        <span className='flex-1'>{item.label}</span>
                        <StatusPill tone={item.done ? 'success' : 'warning'}>{item.done ? 'Done' : 'To do'}</StatusPill>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  )
}
