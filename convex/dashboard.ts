import { v } from 'convex/values'
import type { Doc } from './_generated/dataModel'
import { query, type QueryCtx } from './_generated/server'
import { requireIdentity, requireViewer } from './lib/auth'
import { buildKpi, compareJobUrgency, pct } from './lib/domain'
import { calendarEvent, eventsBetween, toCalendarEvents } from './lib/events'
import { unreadCount } from './lib/inbox'
import { jobCard, openJobs, toJobCards } from './lib/jobCards'
import { hireCard, onboardingTabFor, toHireCards } from './lib/onboarding'
import { DAY, monthKey, resolveNow, startOfDay, startOfWeek, WEEK } from './lib/time'
import { department, DEPARTMENTS, kpi, stage, STAGE_COUNT_KEYS, STAGES } from './lib/validators'

/** Feedback is due this long after an interview ends. */
const FEEDBACK_DUE_MS = DAY

async function pendingOffers(ctx: QueryCtx) {
  return await ctx.db
    .query('offers')
    .withIndex('by_status', q => q.eq('status', 'Pending approval'))
    .take(200)
}

async function pendingTimeOff(ctx: QueryCtx) {
  return await ctx.db
    .query('timeOffRequests')
    .withIndex('by_status_and_startDate', q => q.eq('status', 'Pending'))
    .take(500)
}

/** Completed interviews from the last 30 days whose feedback is overdue. */
async function feedbackOverdue(ctx: QueryCtx, now: number) {
  const recent = await eventsBetween(ctx, now - 30 * DAY, now)
  const due = recent.filter(
    e =>
      e.status === 'Completed' &&
      e.applicationId !== undefined &&
      (e.type === 'Phone screen' || e.type === 'Interview' || e.type === 'Panel') &&
      e.end + FEEDBACK_DUE_MS < now
  )
  const missing: { event: Doc<'interviews'>; missing: number }[] = []
  for (const event of due) {
    const scorecards = await ctx.db
      .query('scorecards')
      .withIndex('by_interview', q => q.eq('interviewId', event._id))
      .take(50)
    const submitted = new Set(scorecards.map(s => s.interviewerId))
    const outstanding = event.interviewerIds.filter(id => !submitted.has(id)).length
    if (outstanding > 0) missing.push({ event, missing: outstanding })
  }
  return missing
}

/** Home greeting: the user's first name, today's date and headline counts. */
export const greeting = query({
  args: { now: v.optional(v.number()) },
  returns: v.object({
    firstName: v.union(v.string(), v.null()),
    /** Midnight today in the org timezone. */
    today: v.number(),
    counts: v.object({
      interviewsToday: v.number(),
      approvalsPending: v.number(),
      newApplications: v.number()
    })
  }),
  handler: async (ctx, args) => {
    const { user } = await requireViewer(ctx)
    const now = resolveNow(args.now)
    const today = startOfDay(now)
    const [events, offers, timeOff, jobs] = await Promise.all([
      eventsBetween(ctx, today, today + DAY),
      pendingOffers(ctx),
      pendingTimeOff(ctx),
      openJobs(ctx)
    ])
    return {
      firstName: user?.firstName ?? null,
      today,
      counts: {
        interviewsToday: events.filter(e => e.type !== 'Onboarding').length,
        approvalsPending: offers.length + timeOff.length,
        newApplications: jobs.reduce((s, j) => s + j.newApplicants, 0)
      }
    }
  }
})

/** "Needs your attention" on Home. */
export const attention = query({
  args: { now: v.optional(v.number()) },
  returns: v.array(
    v.object({
      key: v.union(
        v.literal('newApplications'),
        v.literal('feedbackOverdue'),
        v.literal('offersAwaitingApproval'),
        v.literal('timeOffRequests')
      ),
      label: v.string(),
      count: v.number(),
      detail: v.string(),
      /** Screen to open: jobs, interviews, inbox or timeOff. */
      target: v.union(v.literal('jobs'), v.literal('interviews'), v.literal('inbox'), v.literal('timeOff'))
    })
  ),
  handler: async (ctx, args) => {
    await requireIdentity(ctx)
    const now = resolveNow(args.now)
    const [jobs, overdue, offers, timeOff] = await Promise.all([
      openJobs(ctx),
      feedbackOverdue(ctx, now),
      pendingOffers(ctx),
      pendingTimeOff(ctx)
    ])
    const withNew = jobs.filter(j => j.newApplicants > 0)
    const candidateNames = await Promise.all(
      [...overdue.map(o => o.event.candidateId), ...offers.map(o => o.candidateId)].map(async id =>
        id ? ((await ctx.db.get('candidates', id))?.name ?? null) : null
      )
    )
    const overdueNames = candidateNames.slice(0, overdue.length).filter(n => n !== null)
    const offerNames = candidateNames.slice(overdue.length).filter(n => n !== null)
    const list = (names: string[]) =>
      names.length <= 2 ? names.join(' and ') : `${names.slice(0, 2).join(', ')} and ${names.length - 2} more`
    return [
      {
        key: 'newApplications' as const,
        label: 'New applications',
        count: jobs.reduce((s, j) => s + j.newApplicants, 0),
        detail: `Across ${withNew.length} open ${withNew.length === 1 ? 'role' : 'roles'}`,
        target: 'jobs' as const
      },
      {
        key: 'feedbackOverdue' as const,
        label: 'Interview feedback overdue',
        count: overdue.length,
        detail: overdue.length ? list(overdueNames) : 'All feedback is in',
        target: 'interviews' as const
      },
      {
        key: 'offersAwaitingApproval' as const,
        label: 'Offers awaiting approval',
        count: offers.length,
        detail: offers.length ? list(offerNames) : 'Nothing waiting',
        target: 'inbox' as const
      },
      {
        key: 'timeOffRequests' as const,
        label: 'Time-off requests',
        count: timeOff.length,
        detail: `${timeOff.reduce((s, r) => s + r.days, 0)} days requested`,
        target: 'timeOff' as const
      }
    ]
  }
})

/** KPI cards with sparklines: open roles, active candidates, avg time to hire, offer acceptance. */
export const kpis = query({
  args: { now: v.optional(v.number()) },
  returns: v.array(kpi),
  handler: async (ctx, args) => {
    await requireIdentity(ctx)
    const period = monthKey(resolveNow(args.now))
    const jobs = await openJobs(ctx)
    return await Promise.all([
      buildKpi(ctx, {
        key: 'open_roles',
        label: 'Open roles',
        unit: 'count',
        goodDirection: 'up',
        period,
        liveValue: jobs.length
      }),
      buildKpi(ctx, { key: 'active_candidates', label: 'Active candidates', unit: 'count', goodDirection: 'up', period }),
      buildKpi(ctx, { key: 'time_to_hire_avg_days', label: 'Avg. time to hire', unit: 'days', goodDirection: 'down', period }),
      buildKpi(ctx, { key: 'offer_acceptance_pct', label: 'Offer acceptance', unit: 'percent', goodDirection: 'up', period })
    ])
  }
})

/** Pipeline funnel across open roles, with step-to-step conversion. */
export const funnel = query({
  args: {},
  returns: v.object({
    stages: v.array(v.object({ stage, count: v.number(), conversionFromPreviousPct: v.union(v.number(), v.null()) })),
    /** Hired as a share of Applied. */
    overallConversionPct: v.number()
  }),
  handler: async ctx => {
    await requireIdentity(ctx)
    const jobs = await openJobs(ctx)
    const counts = STAGES.map(s => ({
      stage: s,
      count: jobs.reduce((sum, j) => sum + j.stageCounts[STAGE_COUNT_KEYS[s]], 0)
    }))
    return {
      stages: counts.map((c, i) => ({
        ...c,
        conversionFromPreviousPct: i === 0 ? null : pct(c.count, counts[i - 1].count)
      })),
      overallConversionPct: pct(counts[counts.length - 1].count, counts[0].count)
    }
  }
})

/** Today's interviews, offer calls and onboarding sessions, in time order. */
export const todaysInterviews = query({
  args: { now: v.optional(v.number()) },
  returns: v.array(calendarEvent),
  handler: async (ctx, args) => {
    await requireIdentity(ctx)
    const today = startOfDay(resolveNow(args.now))
    return await toCalendarEvents(ctx, await eventsBetween(ctx, today, today + DAY))
  }
})

/** Open roles table, most urgent first. */
export const openRoles = query({
  args: { now: v.optional(v.number()), limit: v.optional(v.number()) },
  returns: v.array(jobCard),
  handler: async (ctx, args) => {
    await requireIdentity(ctx)
    const now = resolveNow(args.now)
    const jobs = (await openJobs(ctx)).sort((a, b) => compareJobUrgency(a, b, now))
    return await toJobCards(ctx, jobs.slice(0, Math.min(Math.max(args.limit ?? 10, 1), 50)), now)
  }
})

/** Hires in onboarding this week: in progress, or starting this week. */
export const onboardingThisWeek = query({
  args: { now: v.optional(v.number()) },
  returns: v.array(hireCard),
  handler: async (ctx, args) => {
    await requireIdentity(ctx)
    const now = resolveNow(args.now)
    const weekStart = startOfWeek(now)
    const onboardings = await ctx.db
      .query('onboardings')
      .withIndex('by_startDate', q => q.gte('startDate', weekStart - 60 * DAY).lt('startDate', weekStart + WEEK))
      .take(200)
    const current = onboardings.filter(o => {
      const tab = onboardingTabFor(o, now)
      return tab === 'In progress' || (tab === 'Upcoming' && o.startDate < weekStart + WEEK)
    })
    return (await toHireCards(ctx, current, now)).sort((a, b) => a.startDate - b.startDate)
  }
})

/** Current headcount per department (people who have left are excluded). */
export const headcountByDepartment = query({
  args: {},
  returns: v.object({
    total: v.number(),
    departments: v.array(v.object({ department, headcount: v.number(), pct: v.number() }))
  }),
  handler: async ctx => {
    await requireIdentity(ctx)
    const employees = (await ctx.db.query('employees').take(5000)).filter(e => e.status !== 'Left')
    return {
      total: employees.length,
      departments: DEPARTMENTS.map(d => {
        const headcount = employees.filter(e => e.department === d).length
        return { department: d, headcount, pct: pct(headcount, employees.length) }
      }).sort((a, b) => b.headcount - a.headcount)
    }
  }
})

/** Sidebar badge counts. */
export const badges = query({
  args: { now: v.optional(v.number()) },
  returns: v.object({
    inboxUnread: v.number(),
    openJobs: v.number(),
    /** Hires with onboarding in progress. */
    onboarding: v.number(),
    timeOffPending: v.number()
  }),
  handler: async (ctx, args) => {
    const { user } = await requireViewer(ctx)
    const now = resolveNow(args.now)
    const [inboxUnread, jobs, onboardings, timeOff] = await Promise.all([
      unreadCount(ctx, user?._id ?? null),
      openJobs(ctx),
      ctx.db.query('onboardings').take(500),
      pendingTimeOff(ctx)
    ])
    return {
      inboxUnread,
      openJobs: jobs.length,
      onboarding: onboardings.filter(o => onboardingTabFor(o, now) === 'In progress').length,
      timeOffPending: timeOff.length
    }
  }
})
