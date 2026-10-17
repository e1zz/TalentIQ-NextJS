import type { Metadata } from 'next'
import {
  AlertTriangle,
  Calendar,
  Check,
  Clock,
  DollarSign,
  Download,
  FileText,
  Globe,
  Inbox,
  LayoutGrid,
  List,
  MessageSquare,
  Plus,
  Share2,
  Sun,
  Users
} from 'lucide-react'

import {
  AVATAR_TINTS,
  AttentionCard,
  AvatarStack,
  BarChart,
  CountBadge,
  EmptyState,
  FilterSelect,
  HrButton,
  InitialsAvatar,
  MeterRow,
  PageHeader,
  ProgressBar,
  SectionCard,
  SegmentedControl,
  Sparkline,
  StatCard,
  StatusPill,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableCellStack,
  TableHead,
  TableHeader,
  TableRow,
  TabsWithCount,
  Tag,
  type AvatarSize
} from '@/components/hr'
import {
  CommandDialogDemo,
  ControlledSegmentedDemo,
  EmployeesTableDemo,
  FilterChipsDemo
} from '@/app/dashboard/ui-kit/demos'

export const metadata: Metadata = {
  title: 'UI kit · TalentIQ',
  description: 'Every HR primitive in all of its variants'
}

function KitSection({
  id,
  title,
  description,
  children
}: {
  id: string
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section aria-labelledby={id} className='flex flex-col gap-4'>
      <div>
        <h2 id={id} className='text-card-title font-bold text-foreground'>
          {title}
        </h2>
        {description ? <p className='text-body text-muted-foreground'>{description}</p> : null}
      </div>
      {children}
    </section>
  )
}

function Swatch({ name, className }: { name: string; className: string }) {
  return (
    <div className='flex items-center gap-3'>
      <span className={`size-10 shrink-0 rounded-md border border-border ${className}`} />
      <code className='text-meta text-fg-secondary'>{name}</code>
    </div>
  )
}

const SWATCHES: Array<[string, string]> = [
  ['background', 'bg-background'],
  ['card / surface', 'bg-card'],
  ['subtle', 'bg-subtle'],
  ['muted', 'bg-muted'],
  ['primary / brand', 'bg-primary'],
  ['brand-soft', 'bg-brand-soft'],
  ['foreground', 'bg-foreground'],
  ['fg-body', 'bg-fg-body'],
  ['fg-secondary', 'bg-fg-secondary'],
  ['muted-foreground', 'bg-muted-foreground'],
  ['border', 'bg-border'],
  ['input', 'bg-input'],
  ['success', 'bg-success'],
  ['warning', 'bg-warning'],
  ['danger', 'bg-danger'],
  ['info', 'bg-info'],
  ['neutral', 'bg-neutral'],
  ['notification', 'bg-notification']
]

const AVATAR_SIZES: AvatarSize[] = [24, 28, 32, 36, 40]

const TIME_TO_HIRE = [
  { label: 'Jan', value: 41 },
  { label: 'Feb', value: 40 },
  { label: 'Mar', value: 38 },
  { label: 'Apr', value: 37 },
  { label: 'May', value: 36 },
  { label: 'Jun', value: 36 },
  { label: 'Jul', value: 35 },
  { label: 'Aug', value: 34 },
  { label: 'Sep', value: 33 },
  { label: 'Oct', value: 32 }
]

const ROLES = [
  { role: 'Sr. UX Designer', meta: 'Design · Hybrid', manager: 'Dana Kim', applicants: 45, fresh: '+6 new', age: '18d', status: 'On track', tone: 'success' as const },
  { role: 'Growth Manager', meta: 'Marketing · Remote', manager: 'Omar Haddad', applicants: 31, fresh: '+2 new', age: '26d', status: 'Slow', tone: 'warning' as const },
  { role: 'Data Engineer', meta: 'Engineering · Remote', manager: 'Chris Park', applicants: 12, fresh: '', age: '41d', status: 'Overdue', tone: 'danger' as const }
]

export default function UiKitPage() {
  return (
    <div className='flex flex-col gap-10'>
      <PageHeader
        breadcrumb={[{ label: 'Home', href: '/dashboard' }, { label: 'Design system' }, { label: 'UI kit' }]}
        title='UI kit'
        titleAdornment={<StatusPill tone='success'>On track</StatusPill>}
        subtitle='Every HR primitive in all of its variants. Toggle the theme in the top bar to check dark mode.'
        actions={
          <>
            <FilterSelect
              label='Range'
              allLabel={null}
              defaultValue='month'
              icon={<Calendar />}
              options={[
                { value: 'month', label: 'This month' },
                { value: 'quarter', label: 'This quarter' },
                { value: 'year', label: 'This year' }
              ]}
            />
            <HrButton variant='primary'>
              <Plus aria-hidden='true' />
              Post a job
            </HrButton>
          </>
        }
      />

      <KitSection id='kit-tokens' title='Color tokens' description='Semantic tokens from app/globals.css. Light values are the Figma variables.'>
        <div className='grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6'>
          {SWATCHES.map(([name, cls]) => (
            <Swatch key={name} name={name} className={cls} />
          ))}
        </div>
      </KitSection>

      <KitSection id='kit-buttons' title='Buttons (HrButton)'>
        <div className='flex flex-wrap items-center gap-3'>
          <HrButton variant='primary'><Plus aria-hidden='true' />Primary md</HrButton>
          <HrButton variant='secondary'><Download aria-hidden='true' />Secondary md</HrButton>
          <HrButton variant='ghost'><Plus aria-hidden='true' />Ghost md</HrButton>
          <HrButton variant='primary' size='sm'><Plus aria-hidden='true' />Primary sm</HrButton>
          <HrButton variant='secondary' size='sm'>Secondary sm</HrButton>
          <HrButton variant='ghost' size='sm'>Ghost sm</HrButton>
          <HrButton variant='secondary' size='icon' aria-label='More'><LayoutGrid aria-hidden='true' /></HrButton>
          <HrButton variant='primary' disabled>Disabled</HrButton>
        </div>
      </KitSection>

      <KitSection id='kit-pills' title='StatusPill, Tag, CountBadge'>
        <div className='flex flex-wrap items-center gap-2'>
          <StatusPill tone='success'>On track</StatusPill>
          <StatusPill tone='warning'>Slow</StatusPill>
          <StatusPill tone='danger'>Overdue</StatusPill>
          <StatusPill tone='info'>New</StatusPill>
          <StatusPill tone='neutral'>Done</StatusPill>
          <StatusPill tone='success'>Approved</StatusPill>
          <StatusPill tone='warning'>Pending</StatusPill>
          <StatusPill tone='danger' dot={false}>Rejected (no dot)</StatusPill>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          <Tag tone='violet' dot>Referral</Tag>
          <Tag tone='teal' dot>Career site</Tag>
          <Tag tone='brand'>LinkedIn</Tag>
          <Tag>Growth strategy</Tag>
          <Tag dot>SEO</Tag>
          <Tag tone='info' icon={<Globe />}>Remote</Tag>
          <Tag tone='warning'>Offer</Tag>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          <CountBadge>8</CountBadge>
          <CountBadge tone='brand'>12</CountBadge>
          <CountBadge tone='brand-strong'>10</CountBadge>
        </div>
      </KitSection>

      <KitSection id='kit-avatars' title='InitialsAvatar and AvatarStack' description='Tint is a deterministic hash of the name; sizes 24 / 28 / 32 / 36 / 40.'>
        <div className='flex flex-col gap-3'>
          {AVATAR_SIZES.map((size) => (
            <div key={size} className='flex flex-wrap items-center gap-3'>
              <span className='w-8 text-meta text-muted-foreground'>{size}</span>
              {AVATAR_TINTS.map((tint) => (
                <InitialsAvatar key={tint} name={`Sara ${tint}`} initials='SL' tint={tint} size={size} />
              ))}
            </div>
          ))}
          <div className='flex flex-wrap items-center gap-3'>
            <span className='w-8 text-meta text-muted-foreground'>hash</span>
            {['Priya Nair', 'Marcus Webb', 'Elena Petrova', 'Tomás Álvarez', 'Aisha Khan', 'Jonas Berg', 'Mei Tanaka', 'Carlos Mendes'].map((name) => (
              <InitialsAvatar key={name} name={name} size={32} />
            ))}
          </div>
          <div className='flex flex-wrap items-center gap-6'>
            <AvatarStack people={[{ name: 'Sara Lopez' }, { name: 'Omar Haddad' }]} />
            <AvatarStack
              people={[{ name: 'Sara Lopez' }, { name: 'Omar Haddad' }, { name: 'Dana Kim' }, { name: 'Chris Park' }, { name: 'Lena Fischer' }, { name: 'Priya Nair' }]}
              max={4}
            />
            <AvatarStack people={[{ name: 'Dana Kim' }, { name: 'Chris Park' }, { name: 'Lena Fischer' }]} size={32} />
          </div>
        </div>
      </KitSection>

      <KitSection id='kit-stats' title='StatCard'>
        <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
          <StatCard
            label='Open roles'
            value='8'
            delta={{ label: '+2 vs last month', direction: 'up' }}
            sparkline={{ data: [26, 24, 25, 21, 18, 16, 12].map((v) => 40 - v), tone: 'brand' }}
          />
          <StatCard
            label='Avg. time to hire'
            value='24'
            unit='days'
            delta={{ label: '3 days faster', direction: 'down', sentiment: 'positive' }}
            sparkline={{ data: [30, 29, 28, 27, 25.5, 24.5, 23], tone: 'success' }}
          />
          <StatCard
            label='Offer acceptance'
            value='86%'
            delta={{ label: '4 pts', direction: 'down', sentiment: 'negative' }}
            sublabel='vs last quarter'
            sparkline={{ data: [92, 91, 90, 90, 88, 87, 86], tone: 'danger' }}
          />
          <StatCard label='Headcount' value='160' sublabel='+4 this month' />
          <StatCard label='Median time to hire' value='32 days' sublabel='−4 days vs last quarter' />
          <StatCard label='Cost per hire' value='$4,200' sublabel='Within $4,500 budget' />
        </div>
      </KitSection>

      <KitSection id='kit-attention' title='AttentionCard (default and compact)'>
        <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
          <AttentionCard icon={<Users />} tone='info' value='12' label='New applications' sub='6 for Sr. UX Designer' action={{ label: 'Review now', href: '/dashboard/candidates' }} />
          <AttentionCard icon={<MessageSquare />} tone='warning' value='4' label='Interview feedback overdue' sub='Oldest: 3 days' action={{ label: 'Remind panel', href: '/dashboard/calendar' }} />
          <AttentionCard icon={<DollarSign />} tone='violet' value='2' label='Offers awaiting approval' sub='Needs finance sign-off' action={{ label: 'Open offers', href: '/dashboard/inbox' }} />
          <AttentionCard icon={<Sun />} tone='teal' value='3' label='Time-off requests' sub='Engineering · Sales' action={{ label: 'Approve', href: '/dashboard/time-off' }} />
        </div>
        <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
          <AttentionCard variant='compact' icon={<Clock />} tone='warning' value='5' label='Contracts expiring in 30 days' />
          <AttentionCard variant='compact' icon={<FileText />} tone='danger' value='7' label='Missing documents' />
          <AttentionCard variant='compact' icon={<Check />} tone='info' value='3' label='Probation reviews due' />
          <AttentionCard variant='compact' icon={<Globe />} tone='neutral' value='2' label='Permits / visas to renew' />
        </div>
      </KitSection>

      <KitSection id='kit-meters' title='SectionCard with MeterRow and ProgressBar'>
        <div className='grid gap-4 lg:grid-cols-2'>
          <SectionCard title='Hires by source' meta='32 hires'>
            <div className='flex flex-col gap-3.5'>
              <MeterRow label='Referrals' value={38} displayValue='38%' note='12 hires' />
              <MeterRow label='LinkedIn' value={25} displayValue='25%' note='8 hires' />
              <MeterRow label='Career site' value={19} displayValue='19%' note='6 hires' />
              <MeterRow label='Agencies' value={12} displayValue='12%' note='4 hires' />
              <MeterRow label='Other' value={6} displayValue='6%' note='2 hires' />
            </div>
          </SectionCard>
          <SectionCard title='Headcount by department' meta='160 people' action={{ label: 'View in Employees', href: '/dashboard/employees' }}>
            <div className='flex flex-col gap-3.5'>
              <MeterRow label='Engineering' value={48} max={48} note='+6 YTD' tone='brand-light' />
              <MeterRow label='Sales' value={26} max={48} note='+3 YTD' tone='brand-light' />
              <MeterRow label='Marketing' value={18} max={48} note='+2 YTD' tone='brand-light' />
              <MeterRow label='People' value={10} max={48} note='0 YTD' tone='brand-light' />
            </div>
          </SectionCard>
          <SectionCard title='Pipeline conversion' meta='step-to-step conversion' action={{ label: 'View in Jobs', href: '/dashboard/jobs' }}>
            <div className='flex flex-col gap-3.5'>
              <MeterRow label='Applied' value={312} max={312} note='100%' tone='success' />
              <MeterRow label='Screening' value={74} max={312} note='24%' tone='success' />
              <MeterRow label='Interview' value={31} max={312} note='42%' tone='success' />
              <MeterRow label='Offer' value={14} max={312} note='45%' tone='success' />
            </div>
          </SectionCard>
          <SectionCard title='Hiring funnel' meta='This month'>
            <div className='flex flex-col gap-3'>
              <MeterRow size='lg' label='Applied' value={1248} max={1248} displayValue='1,248' />
              <MeterRow size='lg' label='Screened' value={402} max={1248} displayValue='402' />
              <MeterRow size='lg' label='Interviewed' value={96} max={1248} displayValue='96' />
              <MeterRow size='lg' label='Hired' value={12} max={1248} displayValue='12' />
            </div>
          </SectionCard>
        </div>
        <div className='grid gap-3 sm:max-w-md'>
          <ProgressBar label='Onboarding checklist' value={60} size='sm' valueText='6 of 10 tasks' />
          <ProgressBar label='Vacation used' value={12} max={25} tone='brand-light' valueText='12 of 25 days' />
          <ProgressBar label='Budget used' value={93} tone='warning' valueText='93%' />
          <ProgressBar label='Overdue tasks' value={30} tone='danger' size='sm' valueText='30%' />
        </div>
      </KitSection>

      <KitSection id='kit-chart' title='BarChart and Sparkline'>
        <div className='grid gap-4 lg:grid-cols-2'>
          <SectionCard title='Time to hire by month' meta='median days'>
            <BarChart data={TIME_TO_HIRE} label='Median time to hire by month, in days' valueHeader='Median days' />
          </SectionCard>
          <SectionCard title='Sparklines' meta='tones'>
            <div className='flex flex-wrap items-center gap-6'>
              <Sparkline data={[14, 16, 15, 19, 22, 24, 28]} tone='brand' label='Brand trend' />
              <Sparkline data={[30, 28, 26, 24, 21, 19, 16]} tone='success' />
              <Sparkline data={[10, 12, 11, 15, 18, 21, 24]} tone='danger' />
              <Sparkline data={[8, 9, 8, 10, 9, 11, 10]} tone='neutral' width={160} height={48} />
            </div>
          </SectionCard>
        </div>
      </KitSection>

      <KitSection id='kit-controls' title='TabsWithCount, SegmentedControl, FilterSelect, FilterChip'>
        <TabsWithCount
          label='Employee status'
          items={[
            { value: 'all', label: 'All', count: 160 },
            { value: 'active', label: 'Active', count: 151 },
            { value: 'leave', label: 'On leave', count: 4 },
            { value: 'onboarding', label: 'Onboarding', count: 3 },
            { value: 'offboarding', label: 'Offboarding', count: 2 },
            { value: 'archived', label: 'Archived', disabled: true }
          ]}
        />
        <div className='flex flex-wrap items-center gap-3'>
          <SegmentedControl
            label='Pipeline view'
            defaultValue='board'
            options={[
              { value: 'board', label: 'Board' },
              { value: 'table', label: 'Table' }
            ]}
          />
          <SegmentedControl
            label='Layout'
            size='sm'
            options={[
              { value: 'grid', label: 'Grid', icon: <LayoutGrid /> },
              { value: 'list', label: 'List', icon: <List /> }
            ]}
          />
          <ControlledSegmentedDemo />
        </div>
        <div className='flex flex-wrap items-center gap-3'>
          <FilterSelect
            label='Department'
            options={[
              { value: 'design', label: 'Design' },
              { value: 'engineering', label: 'Engineering' },
              { value: 'sales', label: 'Sales' }
            ]}
          />
          <FilterSelect label='Location' options={[{ value: 'remote', label: 'Remote' }, { value: 'dc', label: 'Washington D.C.' }]} />
          <FilterSelect label='Source' icon={<Share2 />} options={[{ value: 'referral', label: 'Referral' }, { value: 'linkedin', label: 'LinkedIn' }]} />
          <FilterSelect label='Rating' disabled options={[{ value: '4', label: '4+ stars' }]} />
        </div>
        <FilterChipsDemo />
      </KitSection>

      <KitSection id='kit-tables' title='DataTable and table blocks'>
        <div className='overflow-hidden rounded-lg border border-border bg-card'>
          <EmployeesTableDemo />
        </div>
        <SectionCard title='Open roles' action={{ label: 'All jobs', href: '/dashboard/jobs' }} padding='flush'>
          <Table>
            <TableCaption>Open roles</TableCaption>
            <TableHeader>
              <tr>
                <TableHead>Role</TableHead>
                <TableHead>Hiring manager</TableHead>
                <TableHead sortable>Applicants</TableHead>
                <TableHead>Pipeline</TableHead>
                <TableHead>Open</TableHead>
                <TableHead>Status</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {ROLES.map((r) => (
                <TableRow key={r.role}>
                  <TableCell>
                    <TableCellStack primary={r.role} secondary={r.meta} />
                  </TableCell>
                  <TableCell>
                    <span className='flex items-center gap-2 text-foreground'>
                      <InitialsAvatar name={r.manager} size={24} decorative />
                      {r.manager}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className='font-bold text-foreground'>{r.applicants}</span>{' '}
                    {r.fresh ? <span className='text-meta font-semibold text-success-foreground'>{r.fresh}</span> : null}
                  </TableCell>
                  <TableCell>
                    <ProgressBar decorative size='sm' value={r.applicants} max={50} className='w-22' />
                  </TableCell>
                  <TableCell className='text-foreground'>{r.age}</TableCell>
                  <TableCell>
                    <StatusPill tone={r.tone}>{r.status}</StatusPill>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </SectionCard>
      </KitSection>

      <KitSection id='kit-empty' title='EmptyState'>
        <div className='grid gap-4 md:grid-cols-3'>
          <EmptyState
            icon={<Inbox />}
            title='You are all caught up'
            description='New approvals, mentions and candidate messages will show up here.'
            action={<HrButton size='sm'>View archive</HrButton>}
          />
          <EmptyState variant='dashed' size='compact' title='No hires yet — drag a candidate here' />
          <EmptyState
            variant='plain'
            icon={<AlertTriangle />}
            title='No matching employees'
            description='Try a different department or clear the filters.'
            action={<HrButton variant='ghost' size='sm'>Clear filters</HrButton>}
          />
        </div>
      </KitSection>

      <KitSection id='kit-command' title='Command dialog' description='Cmd/Ctrl+K or the top bar search opens the empty shell; this button opens it with sample results.'>
        <div>
          <CommandDialogDemo />
        </div>
      </KitSection>
    </div>
  )
}
