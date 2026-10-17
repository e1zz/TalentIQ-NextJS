'use client'

import * as React from 'react'
import { Briefcase, FileText, Search, User } from 'lucide-react'

import { CommandDialog, CommandGroup, CommandItem } from '@/components/app-shell/command-dialog'
import {
  DataTable,
  FilterChip,
  HrButton,
  InitialsAvatar,
  SegmentedControl,
  StatusPill,
  TableCellStack,
  TableCheckbox,
  type DataTableColumn,
  type DataTableSort,
  type StatusTone
} from '@/components/hr'

type Employee = {
  id: string
  name: string
  title: string
  department: string
  location: string
  start: string
  startSort: number
  tenure: string
  status: { label: string; tone: StatusTone }
}

const EMPLOYEES: Employee[] = [
  { id: 'pn', name: 'Priya Nair', title: 'Product Designer', department: 'Design', location: 'Washington D.C.', start: 'Mar 2023', startSort: 202303, tenure: '3y 7m', status: { label: 'Active', tone: 'success' } },
  { id: 'mw', name: 'Marcus Webb', title: 'Backend Engineer', department: 'Engineering', location: 'Remote', start: 'Aug 2022', startSort: 202208, tenure: '4y 2m', status: { label: 'Active', tone: 'success' } },
  { id: 'ep', name: 'Elena Petrova', title: 'Financial Analyst', department: 'Finance', location: 'Buffalo, NY', start: 'Jan 2024', startSort: 202401, tenure: '2y 9m', status: { label: 'On leave', tone: 'warning' } },
  { id: 'ta', name: 'Tomás Álvarez', title: 'Account Executive', department: 'Sales', location: 'Austin, TX', start: 'Oct 2026', startSort: 202610, tenure: '2 weeks', status: { label: 'Onboarding', tone: 'info' } },
  { id: 'jb', name: 'Jonas Berg', title: 'Security Analyst', department: 'IT', location: 'New Delhi', start: 'Sep 2020', startSort: 202009, tenure: '6y 1m', status: { label: 'Offboarding', tone: 'neutral' } }
]

const sortValue: Record<string, (e: Employee) => string | number> = {
  employee: (e) => e.name,
  department: (e) => e.department,
  location: (e) => e.location,
  start: (e) => e.startSort
}

export function EmployeesTableDemo() {
  const [sort, setSort] = React.useState<DataTableSort | null>({ columnId: 'start', direction: 'desc' })
  const [selected, setSelected] = React.useState<string[]>(['pn'])

  const rows = React.useMemo(() => {
    if (!sort) return EMPLOYEES
    const get = sortValue[sort.columnId]
    if (!get) return EMPLOYEES
    const factor = sort.direction === 'asc' ? 1 : -1
    return [...EMPLOYEES].sort((a, b) => (get(a) > get(b) ? factor : get(a) < get(b) ? -factor : 0))
  }, [sort])

  const toggle = (id: string) =>
    setSelected((current) => (current.includes(id) ? current.filter((x) => x !== id) : [...current, id]))

  const allSelected = selected.length === EMPLOYEES.length

  const columns: DataTableColumn<Employee>[] = [
    {
      id: 'select',
      width: '48px',
      header: (
        <TableCheckbox
          aria-label='Select all employees'
          checked={allSelected}
          onChange={() => setSelected(allSelected ? [] : EMPLOYEES.map((e) => e.id))}
        />
      ),
      cell: (e) => (
        <TableCheckbox
          aria-label={`Select ${e.name}`}
          checked={selected.includes(e.id)}
          onChange={() => toggle(e.id)}
        />
      )
    },
    {
      id: 'employee',
      header: 'Employee',
      sortable: true,
      cell: (e) => (
        <div className='flex items-center gap-3'>
          <InitialsAvatar name={e.name} size={32} decorative />
          <TableCellStack primary={e.name} secondary={e.title} />
        </div>
      )
    },
    { id: 'department', header: 'Department', sortable: true, width: '140px', cell: (e) => e.department },
    { id: 'location', header: 'Location', sortable: true, width: '160px', cell: (e) => e.location },
    {
      id: 'start',
      header: 'Start date',
      sortable: true,
      width: '130px',
      cell: (e) => (
        <div className='flex flex-col'>
          <span>{e.start}</span>
          <span className='text-meta text-muted-foreground'>{e.tenure}</span>
        </div>
      )
    },
    {
      id: 'status',
      header: 'Status',
      width: '140px',
      cell: (e) => <StatusPill tone={e.status.tone}>{e.status.label}</StatusPill>
    }
  ]

  return (
    <DataTable
      caption='Employees'
      columns={columns}
      rows={rows}
      getRowId={(e) => e.id}
      sort={sort}
      onSortChange={setSort}
      selectedRowIds={selected}
      footer={
        <>
          <span>Showing 1–5 of 160</span>
          <div className='flex gap-2'>
            <HrButton size='sm'>Previous</HrButton>
            <HrButton size='sm'>Next</HrButton>
          </div>
        </>
      }
    />
  )
}

const CHIPS = [
  { id: 'all', label: 'All', count: 10 },
  { id: 'approvals', label: 'Approvals', count: 4 },
  { id: 'candidates', label: 'Candidates', count: 3 },
  { id: 'mentions', label: 'Mentions', count: 2 },
  { id: 'system', label: 'System', count: 1 }
]

export function FilterChipsDemo() {
  const [active, setActive] = React.useState('all')
  return (
    <div role='group' aria-label='Inbox filter' className='flex flex-wrap gap-2'>
      {CHIPS.map((chip) => (
        <FilterChip
          key={chip.id}
          label={chip.label}
          count={chip.count}
          active={active === chip.id}
          onClick={() => setActive(chip.id)}
        />
      ))}
    </div>
  )
}

export function ControlledSegmentedDemo() {
  const [view, setView] = React.useState<'day' | 'week' | 'month'>('week')
  return (
    <div className='flex items-center gap-3'>
      <SegmentedControl
        label='Calendar range'
        value={view}
        onValueChange={setView}
        options={[
          { value: 'day', label: 'Day' },
          { value: 'week', label: 'Week' },
          { value: 'month', label: 'Month' }
        ]}
      />
      <span className='text-meta text-muted-foreground' aria-live='polite'>
        Showing {view}
      </span>
    </div>
  )
}

export function CommandDialogDemo() {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')
  const q = query.trim().toLowerCase()
  const people = ['Priya Nair', 'Marcus Webb', 'Malaika Brown'].filter((n) => n.toLowerCase().includes(q))
  const jobs = ['Sr. UX Designer', 'Growth Manager'].filter((n) => n.toLowerCase().includes(q))
  const docs = ['Offer letter - Malaika Brown.pdf'].filter((n) => n.toLowerCase().includes(q))

  return (
    <>
      <HrButton onClick={() => setOpen(true)}>
        <Search aria-hidden='true' />
        Open command dialog with sample results
      </HrButton>
      <CommandDialog open={open} onOpenChange={setOpen} query={query} onQueryChange={setQuery}>
        {people.length > 0 ? (
          <CommandGroup heading='People'>
            {people.map((name) => (
              <CommandItem key={name} href='/dashboard/employees' icon={<User />} label={name} meta='Employee' onSelect={() => setOpen(false)} />
            ))}
          </CommandGroup>
        ) : null}
        {jobs.length > 0 ? (
          <CommandGroup heading='Jobs'>
            {jobs.map((name) => (
              <CommandItem key={name} href='/dashboard/jobs' icon={<Briefcase />} label={name} meta='Open' onSelect={() => setOpen(false)} />
            ))}
          </CommandGroup>
        ) : null}
        {docs.length > 0 ? (
          <CommandGroup heading='Documents'>
            {docs.map((name) => (
              <CommandItem key={name} href='/dashboard/documents' icon={<FileText />} label={name} meta='PDF' onSelect={() => setOpen(false)} />
            ))}
          </CommandGroup>
        ) : null}
      </CommandDialog>
    </>
  )
}
