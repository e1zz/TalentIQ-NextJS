import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { invalid, notFound, requireIdentity, requireUser } from './lib/auth'
import { compareJobUrgency, getEmployeesById, toEmployeeRef } from './lib/domain'
import { jobCard, toJobCards } from './lib/jobCards'
import { resolveNow } from './lib/time'
import { department, employeeRef, employmentType, jobStatus, workMode, type JobStatus } from './lib/validators'

const JOB_TABS: { status: JobStatus; label: string }[] = [
  { status: 'Open', label: 'Open' },
  { status: 'Draft', label: 'Drafts' },
  { status: 'On hold', label: 'On hold' },
  { status: 'Closed', label: 'Closed' }
]

/** Jobs screen header: tab counts and the options for the filter menus. */
export const overview = query({
  args: {},
  returns: v.object({
    tabs: v.array(v.object({ status: jobStatus, label: v.string(), count: v.number() })),
    filterOptions: v.object({
      departments: v.array(department),
      locations: v.array(v.string()),
      hiringManagers: v.array(employeeRef)
    })
  }),
  handler: async ctx => {
    await requireIdentity(ctx)
    const jobs = await ctx.db.query('jobs').take(500)
    const managers = await getEmployeesById(
      ctx,
      jobs.map(j => j.hiringManagerId)
    )
    return {
      tabs: JOB_TABS.map(tab => ({ ...tab, count: jobs.filter(j => j.status === tab.status).length })),
      filterOptions: {
        departments: [...new Set(jobs.map(j => j.department))].sort(),
        locations: [...new Set(jobs.map(j => j.location))].sort(),
        hiringManagers: [...managers.values()].map(toEmployeeRef).sort((a, b) => a.name.localeCompare(b.name))
      }
    }
  }
})

/** Job cards for one tab, filtered and sorted. `sort: 'urgent'` puts Overdue and Slow roles first. */
export const list = query({
  args: {
    status: v.optional(jobStatus),
    department: v.optional(department),
    location: v.optional(v.string()),
    hiringManagerId: v.optional(v.id('employees')),
    sort: v.optional(v.union(v.literal('urgent'), v.literal('newest'), v.literal('applicants'))),
    now: v.optional(v.number())
  },
  returns: v.array(jobCard),
  handler: async (ctx, args) => {
    await requireIdentity(ctx)
    const now = resolveNow(args.now)
    const jobs = (
      await ctx.db
        .query('jobs')
        .withIndex('by_status', q => q.eq('status', args.status ?? 'Open'))
        .take(500)
    ).filter(
      job =>
        (args.department === undefined || job.department === args.department) &&
        (args.location === undefined || job.location === args.location) &&
        (args.hiringManagerId === undefined || job.hiringManagerId === args.hiringManagerId)
    )
    const sort = args.sort ?? 'urgent'
    jobs.sort((a, b) => {
      if (sort === 'newest') return (b.postedAt ?? b._creationTime) - (a.postedAt ?? a._creationTime)
      if (sort === 'applicants') return b.stageCounts.applied - a.stageCounts.applied
      return compareJobUrgency(a, b, now)
    })
    return await toJobCards(ctx, jobs, now)
  }
})

export const get = query({
  args: { jobId: v.id('jobs'), now: v.optional(v.number()) },
  returns: v.union(jobCard, v.null()),
  handler: async (ctx, args) => {
    await requireIdentity(ctx)
    const job = await ctx.db.get('jobs', args.jobId)
    if (!job) return null
    const [card] = await toJobCards(ctx, [job], resolveNow(args.now))
    return card
  }
})

/** Creates a job as a Draft, or Open (posted now) when `publish` is true. */
export const create = mutation({
  args: {
    title: v.string(),
    department,
    location: v.string(),
    workMode,
    employmentType,
    hiringManagerId: v.id('employees'),
    targetDays: v.optional(v.number()),
    headcount: v.optional(v.number()),
    referralBonus: v.optional(v.number()),
    salaryMin: v.optional(v.number()),
    salaryMax: v.optional(v.number()),
    currency: v.optional(v.string()),
    publish: v.optional(v.boolean())
  },
  returns: v.id('jobs'),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    const title = args.title.trim()
    if (!title) throw invalid('A job needs a title.')
    if (!(await ctx.db.get('employees', args.hiringManagerId))) throw notFound('Hiring manager')
    const now = Date.now()
    return await ctx.db.insert('jobs', {
      title,
      department: args.department,
      location: args.location,
      workMode: args.workMode,
      employmentType: args.employmentType,
      status: args.publish ? 'Open' : 'Draft',
      hiringManagerId: args.hiringManagerId,
      recruiterId: user._id,
      postedAt: args.publish ? now : undefined,
      targetDays: args.targetDays ?? 45,
      headcount: args.headcount ?? 1,
      stageCounts: { applied: 0, screening: 0, interview: 0, offer: 0, hired: 0 },
      newApplicants: 0,
      applicantsThisWeek: 0,
      referralBonus: args.referralBonus,
      salaryMin: args.salaryMin,
      salaryMax: args.salaryMax,
      currency: args.currency,
      publishedOnCareerSite: args.publish ?? false
    })
  }
})

/** Moves a job between tabs. Opening sets the posted date; closing sets the closed date. */
export const setStatus = mutation({
  args: { jobId: v.id('jobs'), status: jobStatus },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireUser(ctx)
    const job = await ctx.db.get('jobs', args.jobId)
    if (!job) throw notFound('Job')
    const now = Date.now()
    await ctx.db.patch('jobs', job._id, {
      status: args.status,
      postedAt: args.status === 'Open' ? (job.postedAt ?? now) : job.postedAt,
      closedAt: args.status === 'Closed' ? now : undefined,
      publishedOnCareerSite: args.status === 'Open' ? job.publishedOnCareerSite : false
    })
    return null
  }
})
