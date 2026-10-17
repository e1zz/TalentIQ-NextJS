import { StatCard } from '@/components/hr'
import type { Kpi } from '@/convex/lib/validators'
import { formatMoney, formatNumber } from '@/lib/format'

const UNIT: Record<Kpi['unit'], string | undefined> = {
  count: undefined,
  days: 'days',
  percent: '%',
  usd: undefined,
  seconds: 'sec'
}

function deltaLabel(kpi: Kpi): string {
  const sign = kpi.delta > 0 ? '+' : kpi.delta < 0 ? '−' : '±'
  const abs = Math.abs(kpi.delta)
  const value =
    kpi.unit === 'percent' ? `${abs} pts` : kpi.unit === 'usd' ? formatMoney(abs) : kpi.unit === 'days' ? `${abs} days` : formatNumber(abs)
  return `${sign}${value} vs last month`
}

/** A Convex `kpi` rendered as a StatCard with sparkline and month-over-month delta. */
export function KpiCard({ kpi }: { kpi: Kpi }) {
  const improving = kpi.delta === 0 ? null : (kpi.delta > 0) === (kpi.goodDirection === 'up')
  return (
    <StatCard
      label={kpi.label}
      value={kpi.unit === 'usd' ? formatMoney(kpi.value) : formatNumber(kpi.value)}
      unit={UNIT[kpi.unit]}
      delta={{
        label: deltaLabel(kpi),
        direction: kpi.delta < 0 ? 'down' : 'up',
        sentiment: improving === null ? 'neutral' : improving ? 'positive' : 'negative'
      }}
      sparkline={{
        data: kpi.series.length > 1 ? kpi.series.map(p => p.value) : [kpi.value, kpi.value],
        tone: improving === false ? 'danger' : improving ? 'success' : 'brand',
        label: `${kpi.label} trend`
      }}
    />
  )
}
