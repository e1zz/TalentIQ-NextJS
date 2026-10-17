'use client'

import { useQuery } from 'convex/react'
import { Download } from 'lucide-react'

import { api } from '@/convex/_generated/api'
import { BarChart, HrButton, MeterRow, PageHeader, SectionCard } from '@/components/hr'
import { KpiCard } from '@/components/screens/kpi'
import { LoadingRows, Skeleton } from '@/components/screens/skeleton'
import { formatNumber, pluralize } from '@/lib/format'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const monthLabel = (period: string) => MONTHS[Number(period.slice(5, 7)) - 1] ?? period

type Overview = NonNullable<ReturnType<typeof useOverview>>
function useOverview() {
  return useQuery(api.reports.overview, {})
}

function exportCsv(data: Overview) {
  const rows: (string | number)[][] = [
    ['Section', 'Label', 'Value', 'Detail'],
    ...data.kpis.map(k => ['KPI', k.label, k.value, `${k.delta >= 0 ? '+' : ''}${k.delta} vs last month`]),
    ...data.timeToHireByMonth.map(p => ['Time to hire (median days)', p.period, p.value, '']),
    ...data.hiresBySource.map(s => ['Hires by source', s.source, s.hires, `${s.pct}%`]),
    ...data.headcountByDepartment.map(d => ['Headcount', d.department, d.headcount, `${d.ytdDelta >= 0 ? '+' : ''}${d.ytdDelta} YTD`]),
    ...data.pipelineConversion.map(p => ['Pipeline', p.stage, p.count, p.conversionFromPreviousPct === null ? '' : `${p.conversionFromPreviousPct}%`])
  ]
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  const a = Object.assign(document.createElement('a'), { href: url, download: `talentiq-report-${data.period}.csv` })
  a.click()
  URL.revokeObjectURL(url)
}

export default function ReportsPage() {
  const data = useOverview()
  const year = data?.period.slice(0, 4)
  const range = data ? `Jan – ${monthLabel(data.period)} ${year}` : undefined
  const totalHires = data?.hiresBySource.reduce((s, h) => s + h.hires, 0) ?? 0
  const totalHeadcount = data?.headcountByDepartment.reduce((s, d) => s + d.headcount, 0) ?? 0

  return (
    <div className='flex flex-col gap-6'>
      <PageHeader
        title='Reports'
        subtitle={range ? `Hiring and people analytics · ${range}` : undefined}
        actions={
          <HrButton variant='primary' disabled={!data} onClick={() => data && exportCsv(data)}>
            <Download aria-hidden='true' />
            Export CSV
          </HrButton>
        }
      />

      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        {data ? data.kpis.map(k => <KpiCard key={k.key} kpi={k} />) : Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className='h-32' />)}
      </div>

      <div className='grid gap-6 xl:grid-cols-2'>
        <SectionCard title='Time to hire by month' meta='median days'>
          {data ? (
            <BarChart
              label='Median days to hire by month'
              valueHeader='Median days'
              highlightLast
              data={data.timeToHireByMonth.map(p => ({ label: monthLabel(p.period), value: p.value }))}
            />
          ) : (
            <Skeleton className='h-56' />
          )}
        </SectionCard>

        <SectionCard title='Hires by source' meta={data ? pluralize(totalHires, 'hire') : undefined}>
          {data ? (
            <div className='flex flex-col gap-3'>
              {data.hiresBySource.map(s => (
                <MeterRow key={s.source} label={s.source} value={s.pct} displayValue={`${s.pct}%`} note={pluralize(s.hires, 'hire')} />
              ))}
            </div>
          ) : (
            <LoadingRows rows={5} label='Loading sources' />
          )}
        </SectionCard>

        <SectionCard
          title='Headcount by department'
          meta={data ? pluralize(totalHeadcount, 'person', 'people') : undefined}
          action={{ label: 'View in Employees', href: '/dashboard/employees' }}
        >
          {data ? (
            <div className='flex flex-col gap-3'>
              {data.headcountByDepartment.map(d => (
                <MeterRow
                  key={d.department}
                  label={d.department}
                  value={d.headcount}
                  max={Math.max(...data.headcountByDepartment.map(x => x.headcount), 1)}
                  tone='brand-light'
                  note={`${d.ytdDelta > 0 ? '+' : ''}${d.ytdDelta} YTD`}
                />
              ))}
            </div>
          ) : (
            <LoadingRows rows={8} label='Loading headcount' />
          )}
        </SectionCard>

        <SectionCard title='Pipeline conversion' meta='step-to-step conversion' action={{ label: 'View in Jobs', href: '/dashboard/jobs' }}>
          {data ? (
            <div className='flex flex-col gap-3'>
              {data.pipelineConversion.map(p => (
                <MeterRow
                  key={p.stage}
                  label={p.stage}
                  value={p.count}
                  max={Math.max(data.pipelineConversion[0]?.count ?? 1, 1)}
                  displayValue={formatNumber(p.count)}
                  tone='success'
                  note={p.conversionFromPreviousPct === null ? '100%' : `${p.conversionFromPreviousPct}%`}
                />
              ))}
            </div>
          ) : (
            <LoadingRows rows={5} label='Loading pipeline' />
          )}
        </SectionCard>
      </div>
    </div>
  )
}
