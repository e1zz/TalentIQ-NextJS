import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { invalid, notFound, requireIdentity, requireUser } from './lib/auth'
import { buildKpi, getUsersById, metricValue, userRefOrNull } from './lib/domain'
import { jobCard, openJobs, toJobCards } from './lib/jobCards'
import { monthKey, resolveNow } from './lib/time'
import { careerSiteStatus, kpi, userRef } from './lib/validators'

const TRAFFIC_SOURCES = ['LinkedIn', 'Google', 'Direct', 'Indeed', 'Other'] as const

/** Career site screen: KPIs, page status, traffic sources, checklist and published roles. */
export const overview = query({
  args: { now: v.optional(v.number()) },
  returns: v.object({
    period: v.string(),
    /** Visitors, applications, visit to apply % and average time on page (seconds). */
    kpis: v.array(kpi),
    page: v.union(
      v.null(),
      v.object({
        status: careerSiteStatus,
        url: v.string(),
        lastPublishedAt: v.number(),
        publishedBy: v.union(userRef, v.null())
      })
    ),
    trafficSources: v.array(v.object({ source: v.string(), pct: v.number() })),
    checklist: v.object({
      done: v.number(),
      total: v.number(),
      items: v.array(v.object({ index: v.number(), label: v.string(), done: v.boolean() }))
    }),
    openRoles: v.array(jobCard)
  }),
  handler: async (ctx, args) => {
    await requireIdentity(ctx)
    const now = resolveNow(args.now)
    const period = monthKey(now)
    const [visitors, applications, timeOnPage] = await Promise.all([
      buildKpi(ctx, { key: 'career_visitors', label: 'Visitors', unit: 'count', goodDirection: 'up', period }),
      buildKpi(ctx, { key: 'career_applications', label: 'Applications', unit: 'count', goodDirection: 'up', period }),
      buildKpi(ctx, { key: 'career_avg_time_on_page_sec', label: 'Avg. time on page', unit: 'seconds', goodDirection: 'up', period })
    ])
    const rate = (a: number, b: number) => (b === 0 ? 0 : Math.round((a / b) * 1000) / 10)
    const conversionSeries = visitors.series.map(p => ({
      period: p.period,
      value: rate(applications.series.find(a => a.period === p.period)?.value ?? 0, p.value)
    }))
    const conversion = conversionSeries.at(-1)?.value ?? 0
    const previousConversion = conversionSeries.at(-2)?.value ?? conversion
    const visitToApply = {
      key: 'career_visit_to_apply_pct',
      label: 'Visit to apply',
      value: conversion,
      unit: 'percent' as const,
      delta: Math.round((conversion - previousConversion) * 10) / 10,
      goodDirection: 'up' as const,
      series: conversionSeries
    }

    const site = await ctx.db.query('careerSite').first()
    const users = await getUsersById(ctx, [site?.publishedById])
    const trafficSources = await Promise.all(
      TRAFFIC_SOURCES.map(async source => ({
        source,
        pct: (await metricValue(ctx, 'career_traffic_source_pct', period, source)) ?? 0
      }))
    )
    const jobs = (await openJobs(ctx)).filter(j => j.publishedOnCareerSite)
    jobs.sort((a, b) => (b.postedAt ?? 0) - (a.postedAt ?? 0))
    const checklist = site?.checklist ?? []

    return {
      period,
      kpis: [visitors, applications, visitToApply, timeOnPage],
      page: site
        ? {
            status: site.status,
            url: site.url,
            lastPublishedAt: site.lastPublishedAt,
            publishedBy: userRefOrNull(users, site.publishedById)
          }
        : null,
      trafficSources: trafficSources.filter(t => t.pct > 0),
      checklist: {
        done: checklist.filter(c => c.done).length,
        total: checklist.length,
        items: checklist.map((c, index) => ({ index, label: c.label, done: c.done }))
      },
      openRoles: await toJobCards(ctx, jobs, now)
    }
  }
})

/** Ticks or unticks a career site checklist item. */
export const toggleChecklistItem = mutation({
  args: { index: v.number() },
  returns: v.object({ done: v.boolean() }),
  handler: async (ctx, args) => {
    await requireUser(ctx)
    const site = await ctx.db.query('careerSite').first()
    if (!site) throw notFound('Career site')
    const item = site.checklist[args.index]
    if (!item) throw invalid('No checklist item at that position.')
    const checklist = site.checklist.map((c, i) => (i === args.index ? { ...c, done: !c.done } : c))
    await ctx.db.patch('careerSite', site._id, { checklist })
    return { done: !item.done }
  }
})

/** Sets the career site status (Live, Draft or Paused); going Live records a publish. */
export const setStatus = mutation({
  args: { status: careerSiteStatus },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    const site = await ctx.db.query('careerSite').first()
    if (!site) throw notFound('Career site')
    await ctx.db.patch('careerSite', site._id, {
      status: args.status,
      ...(args.status === 'Live' ? { lastPublishedAt: Date.now(), publishedById: user._id } : {})
    })
    return null
  }
})
