'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { usePaginatedQuery, useQuery } from 'convex/react'
import { Calendar, CircleCheck, Clock, Download, FileText, Globe, Mail, MapPin, MessageSquare, Phone, Plus, Sun, User } from 'lucide-react'

import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import type { Department, EmployeeTab } from '@/convex/lib/validators'
import {
  AttentionCard,
  EmptyState,
  FilterSelect,
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
  TableRow,
  TabsWithCount,
  type AccentTone
} from '@/components/hr'
import { PERSON_DOC_TONE, useOpenDocument } from '@/components/screens/doc-bits'
import { SearchField } from '@/components/screens/form-dialog'
import { EMPLOYEE_STATUS_TONE, TIME_OFF_STATUS_TONE, tenure } from '@/components/screens/people-bits'
import { LoadingRows, Skeleton } from '@/components/screens/skeleton'
import { formatDate, formatDateRange, pluralize } from '@/lib/format'

const DEPARTMENTS: Department[] = ['Engineering', 'Product', 'Design', 'Data', 'Marketing', 'Sales', 'Finance', 'People']
const PAGE_SIZE = 10
const ATTENTION_STYLE = {
  contractsExpiring: { icon: <Clock />, tone: 'warning' },
  missingDocs: { icon: <FileText />, tone: 'danger' },
  probationReviews: { icon: <CircleCheck />, tone: 'info' },
  permitsToRenew: { icon: <Globe />, tone: 'neutral' }
} satisfies Record<string, { icon: React.ReactNode; tone: AccentTone }>

function EmployeePanel({ id }: { id: Id<'employees'> }) {
  const employee = useQuery(api.employees.get, { employeeId: id })
  const openDocument = useOpenDocument()
  if (employee === undefined) return <LoadingRows rows={8} label='Loading employee' />
  if (employee === null) return <p className='text-body text-muted-foreground'>Employee not found.</p>
  return (
    <div className='flex flex-col gap-5'>
      <div className='flex items-start gap-3'>
        <InitialsAvatar name={employee.name} size={40} />
        <div className='min-w-0'>
          <h2 className='text-card-title font-bold text-foreground'>{employee.name}</h2>
          <p className='text-body text-fg-secondary'>
            {employee.title} · {employee.department}
          </p>
          <StatusPill className='mt-1.5' tone={EMPLOYEE_STATUS_TONE[employee.status]}>
            {employee.status}
          </StatusPill>
        </div>
      </div>
      <ul className='flex flex-col gap-2.5 border-t border-border-subtle pt-4 text-body text-fg-body'>
        <li className='flex items-center gap-2.5'>
          <Mail aria-hidden='true' className='size-4 text-icon' strokeWidth={1.75} />
          <a href={`mailto:${employee.email}`} className='truncate hover:underline'>{employee.email}</a>
        </li>
        {employee.phone ? (
          <li className='flex items-center gap-2.5'>
            <Phone aria-hidden='true' className='size-4 text-icon' strokeWidth={1.75} />
            {employee.phone}
          </li>
        ) : null}
        <li className='flex items-center gap-2.5'>
          <MapPin aria-hidden='true' className='size-4 text-icon' strokeWidth={1.75} />
          {employee.location} · {employee.workMode}
        </li>
        {employee.manager ? (
          <li className='flex items-center gap-2.5'>
            <User aria-hidden='true' className='size-4 text-icon' strokeWidth={1.75} />
            Reports to{' '}
            <Link href={`/dashboard/employees?id=${employee.manager._id}`} className='font-semibold hover:underline'>
              {employee.manager.name}
            </Link>
          </li>
        ) : null}
        <li className='flex items-center gap-2.5'>
          <Calendar aria-hidden='true' className='size-4 text-icon' strokeWidth={1.75} />
          Started {formatDate(employee.startDate)} · {tenure(employee.startDate)}
        </li>
      </ul>
      <section>
        <h3 className='text-meta font-semibold tracking-overline text-muted-foreground uppercase'>Documents</h3>
        <ul className='mt-2.5 flex flex-col gap-2'>
          {employee.documents.map(d => (
            <li key={d._id} className='flex items-center gap-2.5'>
              <FileText aria-hidden='true' className='size-4 shrink-0 text-icon' strokeWidth={1.75} />
              <button type='button' onClick={() => openDocument(d._id)} className='min-w-0 flex-1 truncate text-left text-body text-fg-body hover:underline'>
                {d.title}
              </button>
              <StatusPill tone={PERSON_DOC_TONE[d.status]}>
                {d.status === 'Expires soon' && d.expiresInDays !== null ? `Expires in ${d.expiresInDays} days` : d.status}
              </StatusPill>
            </li>
          ))}
          {employee.documents.length === 0 ? <li className='text-body text-muted-foreground'>No documents.</li> : null}
        </ul>
      </section>
      <section>
        <h3 className='text-meta font-semibold tracking-overline text-muted-foreground uppercase'>Upcoming time off</h3>
        <ul className='mt-2.5 flex flex-col gap-2'>
          {employee.upcomingTimeOff.map(t => (
            <li key={t._id} className='flex items-center gap-2.5 text-body text-fg-body'>
              <Sun aria-hidden='true' className='size-4 text-icon' strokeWidth={1.75} />
              <span className='flex-1'>
                {formatDateRange(t.startDate, t.endDate)} · {pluralize(t.days, 'day')}
              </span>
              <StatusPill tone={TIME_OFF_STATUS_TONE[t.status]}>{t.status}</StatusPill>
            </li>
          ))}
          {employee.upcomingTimeOff.length === 0 ? <li className='text-body text-muted-foreground'>Nothing booked.</li> : null}
        </ul>
      </section>
      <HrButton asChild variant='secondary'>
        <a href={`mailto:${employee.email}`}>
          <MessageSquare aria-hidden='true' />
          Message
        </a>
      </HrButton>
    </div>
  )
}

function EmployeesScreen() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const selectedId = searchParams.get('id') as Id<'employees'> | null
  const [tab, setTab] = React.useState<EmployeeTab>('All')
  const [department, setDepartment] = React.useState('')
  const [query, setQuery] = React.useState('')

  const kpis = useQuery(api.employees.kpis, {})
  const attention = useQuery(api.employees.attention, {})
  const counts = useQuery(api.employees.statusCounts, {})
  const { results, status, loadMore } = usePaginatedQuery(
    api.employees.list,
    { status: tab, department: (department || undefined) as Department | undefined },
    { initialNumItems: PAGE_SIZE }
  )

  const q = query.trim().toLowerCase()
  const rows = q ? results.filter(r => `${r.name} ${r.title} ${r.email}`.toLowerCase().includes(q)) : results
  const total = counts?.find(c => c.tab === tab)?.count
  const select = (id: string) => router.replace(`/dashboard/employees?id=${id}`, { scroll: false })

  return (
    <div className='flex flex-col gap-6'>
      <PageHeader
        title='Employees'
        subtitle={kpis ? `${pluralize(kpis.headcount, 'person', 'people')} across ${DEPARTMENTS.length} departments` : undefined}
        actions={
          <>
            <HrButton variant='secondary' disabled title='Coming soon'>
              <Download aria-hidden='true' />
              Export
            </HrButton>
            <HrButton variant='primary' disabled title='Coming soon'>
              <Plus aria-hidden='true' />
              Add employee
            </HrButton>
          </>
        }
      />

      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        {kpis ? (
          <>
            <StatCard label='Headcount' value={kpis.headcount} sublabel={`+${kpis.newHires30d} in the last 30 days`} />
            <StatCard label='New hires' value={kpis.newHires30d} sublabel='Last 30 days' />
            <StatCard label='Leavers' value={kpis.leavers30d} sublabel='Last 30 days' />
            <StatCard label='Open positions' value={kpis.openPositions} sublabel={<Link href='/dashboard/jobs' className='hover:underline'>View in Jobs →</Link>} />
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
        label='Employee status'
        value={tab}
        onValueChange={v => setTab(v as EmployeeTab)}
        items={(counts ?? [{ tab: 'All' as const, count: 0 }]).map(c => ({ value: c.tab, label: c.tab, count: c.count }))}
      />

      <div className='grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]'>
        <div className='min-w-0 rounded-lg border border-border bg-card'>
          <div className='flex flex-wrap items-center gap-2.5 border-b border-border p-4'>
            <SearchField label='Search people' value={query} onChange={setQuery} className='w-full sm:w-56' />
            <FilterSelect label='Department' value={department} onChange={e => setDepartment(e.target.value)} options={DEPARTMENTS.map(d => ({ value: d, label: d }))} />
          </div>
          {status === 'LoadingFirstPage' ? (
            <LoadingRows rows={8} className='p-4' label='Loading employees' />
          ) : rows.length === 0 ? (
            <EmptyState variant='plain' title='No employees match' description='Try another tab or filter.' />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Start date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(e => (
                  <TableRow key={e._id} selected={e._id === selectedId}>
                    <TableCell>
                      <span className='flex items-center gap-2.5'>
                        <InitialsAvatar name={e.name} size={32} />
                        <TableCellStack
                          primary={
                            <button type='button' onClick={() => select(e._id)} className='text-left hover:underline' aria-pressed={e._id === selectedId}>
                              {e.name}
                            </button>
                          }
                          secondary={e.title}
                        />
                      </span>
                    </TableCell>
                    <TableCell>{e.department}</TableCell>
                    <TableCell>{e.location}</TableCell>
                    <TableCell>
                      <TableCellStack primary={formatDate(e.startDate)} secondary={tenure(e.startDate)} />
                    </TableCell>
                    <TableCell>
                      <StatusPill tone={EMPLOYEE_STATUS_TONE[e.status]}>{e.status}</StatusPill>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <div className='flex items-center justify-between gap-3 border-t border-border px-4 py-3 text-body text-muted-foreground'>
            <span>
              Showing {results.length}
              {total !== undefined ? ` of ${total}` : ''}
            </span>
            {status === 'CanLoadMore' ? (
              <HrButton variant='secondary' size='sm' onClick={() => loadMore(PAGE_SIZE)}>
                Load more
              </HrButton>
            ) : null}
          </div>
        </div>

        <aside className='self-start rounded-lg border border-border bg-card p-5' aria-label='Employee details'>
          {selectedId ? (
            <EmployeePanel id={selectedId} />
          ) : (
            <EmptyState variant='plain' size='compact' icon={<User />} title='Select an employee' description='Their contact details, documents and time off show here.' />
          )}
        </aside>
      </div>
    </div>
  )
}

export default function EmployeesPage() {
  return (
    <React.Suspense>
      <EmployeesScreen />
    </React.Suspense>
  )
}
