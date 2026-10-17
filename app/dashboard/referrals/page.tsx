'use client'

import * as React from 'react'
import Link from 'next/link'
import { useMutation, useQuery } from 'convex/react'
import { ChevronRight, Share2, User, UserPlus } from 'lucide-react'
import { toast } from 'sonner'

import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import {
  HrButton,
  InitialsAvatar,
  PageHeader,
  SectionCard,
  StatCard,
  StatusPill,
  Table,
  TableBody,
  TableCell,
  TableCellStack,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/hr'
import { Field, FormDialog } from '@/components/screens/form-dialog'
import { STAGE_TONE } from '@/components/screens/job-bits'
import { LoadingRows, Skeleton } from '@/components/screens/skeleton'
import { formatMoney, formatShortDate, pluralize } from '@/lib/format'

export default function ReferralsPage() {
  const data = useQuery(api.referrals.overview, {})
  const refer = useMutation(api.referrals.refer)
  const [open, setOpen] = React.useState(false)

  const openRoleCount = data ? new Set(data.active.map(r => r.jobId).filter(Boolean)).size : 0

  return (
    <div className='flex flex-col gap-6'>
      <PageHeader
        title='Referrals'
        subtitle={data ? `${pluralize(data.kpis.activeReferrals, 'active referral')} · ${pluralize(data.kpis.hiredYtd, 'hire')} from referrals this year` : undefined}
        actions={
          <HrButton variant='primary' onClick={() => setOpen(true)} disabled={!data?.openRoles.length}>
            <UserPlus aria-hidden='true' />
            Refer someone
          </HrButton>
        }
      />

      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        {data ? (
          <>
            <StatCard label='Active referrals' value={data.kpis.activeReferrals} sublabel={`Across ${pluralize(openRoleCount, 'open role')}`} />
            <StatCard label='Hired via referral' value={data.kpis.hiredYtd} sublabel={`${data.kpis.referralShareOfHiresPct}% of all hires`} />
            <StatCard label='Bonuses paid' value={formatMoney(data.kpis.bonusesPaidYtd, data.kpis.currency)} sublabel='This year' />
            <StatCard label='Open roles with a bonus' value={data.openRoles.length} sublabel='Share them with your network' />
          </>
        ) : (
          Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className='h-24' />)
        )}
      </div>

      <div className='grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]'>
        <SectionCard title='Active referrals' meta={data ? pluralize(data.active.length, 'referral') : undefined} padding='flush'>
          {data === undefined ? (
            <LoadingRows rows={6} className='p-5' label='Loading referrals' />
          ) : data.active.length === 0 ? (
            <p className='px-5 py-8 text-center text-body text-muted-foreground'>No active referrals yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Referred by</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Bonus</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.active.map(r => (
                  <TableRow key={r._id}>
                    <TableCell>
                      <span className='flex items-center gap-2.5'>
                        <InitialsAvatar name={r.candidateName} size={32} />
                        <TableCellStack
                          primary={r.candidateId ? <Link href={`/dashboard/candidates/${r.candidateId}`} className='hover:underline'>{r.candidateName}</Link> : r.candidateName}
                          secondary={r.jobTitle}
                        />
                      </span>
                    </TableCell>
                    <TableCell>
                      {r.referrer ? (
                        <span className='flex items-center gap-2'>
                          <InitialsAvatar name={r.referrer.name} size={24} decorative />
                          {r.referrer.name}
                        </span>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusPill tone={STAGE_TONE[r.stage]}>{r.stage}</StatusPill>
                    </TableCell>
                    <TableCell>
                      <TableCellStack primary={formatMoney(r.bonusAmount, r.currency)} secondary={`${r.bonusStatus} · referred ${formatShortDate(r.referredAt)}`} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </SectionCard>

        <div className='flex flex-col gap-6'>
          <SectionCard title='Top referrers this year'>
            {data === undefined ? (
              <LoadingRows rows={4} label='Loading referrers' />
            ) : (
              <ul className='flex flex-col gap-3'>
                {data.topReferrers.map(t => (
                  <li key={t.referrer._id} className='flex items-center gap-2.5'>
                    <User aria-hidden='true' className='size-4 text-icon' strokeWidth={1.75} />
                    <span className='min-w-0 flex-1 truncate text-body text-fg-body'>{t.referrer.name}</span>
                    <StatusPill tone={t.hires > 0 ? 'success' : 'neutral'}>
                      {pluralize(t.referrals, 'referral')} · {t.hires} hired
                    </StatusPill>
                  </li>
                ))}
                {data.topReferrers.length === 0 ? <li className='text-body text-muted-foreground'>No referrals yet this year.</li> : null}
              </ul>
            )}
          </SectionCard>

          <SectionCard title='Share an open role'>
            {data === undefined ? (
              <LoadingRows rows={3} label='Loading roles' />
            ) : (
              <ul className='flex flex-col gap-2.5'>
                {data.openRoles.slice(0, 5).map(role => (
                  <li key={role._id}>
                    <button
                      type='button'
                      onClick={async () => {
                        await navigator.clipboard.writeText(`${window.location.origin}/dashboard/jobs/${role._id}`)
                        toast.success(`Link to ${role.title} copied`)
                      }}
                      className='flex w-full items-center gap-3 rounded-md border border-border p-3 text-left transition-colors hover:bg-subtle'
                    >
                      <span className='inline-flex size-9 shrink-0 items-center justify-center rounded-sm bg-muted text-icon'>
                        <Share2 aria-hidden='true' className='size-4' strokeWidth={1.75} />
                      </span>
                      <span className='min-w-0 flex-1'>
                        <span className='block truncate text-body font-semibold text-foreground'>{role.title}</span>
                        <span className='block text-meta text-muted-foreground'>
                          {role.department} · {formatMoney(role.referralBonus, role.currency)} bonus
                        </span>
                      </span>
                      <ChevronRight aria-hidden='true' className='size-4 text-icon' strokeWidth={1.75} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>
      </div>

      {data ? (
        <FormDialog
          open={open}
          onOpenChange={setOpen}
          title='Refer someone'
          description='They join the pipeline as a referral and you are credited for the bonus.'
          submitLabel='Send referral'
          onSubmit={async form => {
            const s = (k: string) => {
              const v = String(form.get(k) ?? '').trim()
              return v || undefined
            }
            await refer({
              jobId: form.get('jobId') as Id<'jobs'>,
              name: String(form.get('name')),
              email: String(form.get('email')),
              phone: s('phone'),
              linkedinUrl: s('linkedinUrl'),
              note: s('note')
            })
            toast.success('Referral sent')
          }}
        >
          <Field label='Role' name='jobId' required options={data.openRoles.map(r => ({ value: r._id, label: `${r.title} · ${formatMoney(r.referralBonus, r.currency)} bonus` }))} />
          <Field label='Full name' name='name' required />
          <div className='grid gap-4 sm:grid-cols-2'>
            <Field label='Email' name='email' type='email' required />
            <Field label='Phone' name='phone' type='tel' />
          </div>
          <Field label='LinkedIn URL' name='linkedinUrl' type='url' placeholder='https://linkedin.com/in/…' />
          <Field label='Why are they a good fit?' name='note' multiline />
        </FormDialog>
      ) : null}
    </div>
  )
}
