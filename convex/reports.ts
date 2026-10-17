import { v } from 'convex/values'
import { query } from './_generated/server'
import { requireIdentity } from './lib/auth'
import { buildKpi, metricSeries, metricValue, pct } from './lib/domain'
import { monthKey, orgYear, resolveNow } from './lib/time'
import { candidateSource, department, DEPARTMENTS, kpi, stage, STAGES } from './lib/validators'

/**
 * Reports screen. History comes from pre-aggregated `metrics` rows; headcount by
 * department is live, compared with the January snapshot for the YTD delta.
 */
export const overview = query({
  args: { now: v.optional(v.number()) },
  returns: v.object({
    period: v.string(),
    kpis: v.array(kpi),
    /** Median days to hire per month, January to the current month. */
    timeToHireByMonth: v.array(v.object({ period: v.string(), value: v.number() })),
    hiresBySource: v.array(v.object({ source: candidateSource, hires: v.number(), pct: v.number() })),
    headcountByDepartment: v.array(
      v.object({ department, headcount: v.number(), startOfYear: v.number(), ytdDelta: v.number() })
    ),
    /** Year-to-date funnel with conversion from the previous step. */
    pipelineConversion: v.array(
      v.object({ stage, count: v.number(), conversionFromPreviousPct: v.union(v.number(), v.null()) })
    )
  }),
  handler: async (ctx, args) => {
    await requireIdentity(ctx)
    const now = resolveNow(args.now)
    const period = monthKey(now)
    const year = String(orgYear(now))

    const kpis = await Promise.all([
      buildKpi(ctx, { key: 'time_to_hire_median_days', label: 'Median time to hire', unit: 'days', goodDirection: 'down', period }),
      buildKpi(ctx, { key: 'offer_acceptance_pct', label: 'Offer acceptance', unit: 'percent', goodDirection: 'up', period }),
      buildKpi(ctx, { key: 'cost_per_hire_usd', label: 'Cost per hire', unit: 'usd', goodDirection: 'down', period }),
      buildKpi(ctx, { key: 'turnover_pct', label: 'Turnover', unit: 'percent', goodDirection: 'down', period })
    ])

    const timeToHireByMonth = (await metricSeries(ctx, 'time_to_hire_median_days')).filter(
      p => p.period.startsWith(year) && p.period <= period
    )

    const sources = await Promise.all(
      candidateSource.members.map(async m => ({
        source: m.value,
        hires: (await metricValue(ctx, 'hires_by_source', year, m.value)) ?? 0
      }))
    )
    const totalHires = sources.reduce((s, r) => s + r.hires, 0)

    const employees = (await ctx.db.query('employees').take(5000)).filter(e => e.status !== 'Left')
    const headcountByDepartment = await Promise.all(
      DEPARTMENTS.map(async d => {
        const headcount = employees.filter(e => e.department === d).length
        const startOfYear = (await metricValue(ctx, 'headcount', `${year}-01`, d)) ?? headcount
        return { department: d, headcount, startOfYear, ytdDelta: headcount - startOfYear }
      })
    )

    const funnel = await Promise.all(
      STAGES.map(async s => ({ stage: s, count: (await metricValue(ctx, 'funnel', year, s)) ?? 0 }))
    )

    return {
      period,
      kpis,
      timeToHireByMonth,
      hiresBySource: sources
        .map(s => ({ ...s, pct: pct(s.hires, totalHires) }))
        .sort((a, b) => b.hires - a.hires),
      headcountByDepartment: headcountByDepartment.sort((a, b) => b.headcount - a.headcount),
      pipelineConversion: funnel.map((f, i) => ({
        ...f,
        conversionFromPreviousPct: i === 0 ? null : pct(f.count, funnel[i - 1].count)
      }))
    }
  }
})
