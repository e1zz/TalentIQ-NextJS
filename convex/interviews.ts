import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { invalid, notFound, requireIdentity, requireUser } from './lib/auth'
import { calendarEvent, eventsBetween, toCalendarEvents } from './lib/events'
import { resolveNow, startOfWeek, WEEK } from './lib/time'
import { interviewStatus, interviewType, locationType } from './lib/validators'

/** Calendar events for a range (defaults to the week containing `start`), plus counts per type. */
export const week = query({
  args: {
    /** Any time in the week to show, or the exact range start when `end` is given. */
    start: v.number(),
    end: v.optional(v.number())
  },
  returns: v.object({
    rangeStart: v.number(),
    rangeEnd: v.number(),
    events: v.array(calendarEvent),
    typeCounts: v.array(v.object({ type: interviewType, count: v.number() }))
  }),
  handler: async (ctx, args) => {
    await requireIdentity(ctx)
    const rangeStart = args.end === undefined ? startOfWeek(args.start) : args.start
    const rangeEnd = args.end ?? rangeStart + WEEK
    if (rangeEnd <= rangeStart) throw invalid('`end` must be after `start`.')
    const events = await toCalendarEvents(ctx, await eventsBetween(ctx, rangeStart, rangeEnd))
    return {
      rangeStart,
      rangeEnd,
      events,
      typeCounts: interviewType.members.map(m => ({
        type: m.value,
        count: events.filter(e => e.type === m.value).length
      }))
    }
  }
})

/** The next scheduled events that haven't ended yet. */
export const upNext = query({
  args: { now: v.optional(v.number()), limit: v.optional(v.number()) },
  returns: v.array(calendarEvent),
  handler: async (ctx, args) => {
    await requireIdentity(ctx)
    const now = resolveNow(args.now)
    const candidates = await ctx.db
      .query('interviews')
      .withIndex('by_start', q => q.gte('start', now - 4 * 60 * 60 * 1000))
      .take(100)
    const upcoming = candidates
      .filter(e => e.status === 'Scheduled' && e.end > now)
      .slice(0, Math.min(Math.max(args.limit ?? 5, 1), 50))
    return await toCalendarEvents(ctx, upcoming)
  }
})

/** Schedules an interview, offer call or onboarding session. */
export const schedule = mutation({
  args: {
    type: interviewType,
    title: v.optional(v.string()),
    applicationId: v.optional(v.id('applications')),
    employeeId: v.optional(v.id('employees')),
    start: v.number(),
    end: v.number(),
    interviewerIds: v.array(v.id('employees')),
    location: v.string(),
    locationType
  },
  returns: v.id('interviews'),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    if (args.end <= args.start) throw invalid('An event must end after it starts.')
    const application = args.applicationId ? await ctx.db.get('applications', args.applicationId) : null
    if (args.applicationId && !application) throw notFound('Application')
    const candidate = application ? await ctx.db.get('candidates', application.candidateId) : null
    const job = application ? await ctx.db.get('jobs', application.jobId) : null
    const employee = args.employeeId ? await ctx.db.get('employees', args.employeeId) : null
    const subject = candidate?.name ?? employee?.name
    const title = args.title?.trim() || (subject ? `${args.type} · ${subject}` : args.type)
    const id = await ctx.db.insert('interviews', {
      type: args.type,
      title,
      candidateId: candidate?._id,
      applicationId: application?._id,
      jobId: job?._id,
      employeeId: employee?._id,
      start: args.start,
      end: args.end,
      interviewerIds: args.interviewerIds,
      location: args.location,
      locationType: args.locationType,
      status: 'Scheduled'
    })
    if (candidate) {
      await ctx.db.insert('activities', {
        candidateId: candidate._id,
        applicationId: application?._id,
        type: 'interview_scheduled',
        text: `${args.type} scheduled${job ? ` for ${job.title}` : ''}`,
        actorName: user.name,
        actorUserId: user._id,
        at: Date.now()
      })
    }
    return id
  }
})

/** Marks an event completed or cancelled (or back to scheduled). */
export const setStatus = mutation({
  args: { interviewId: v.id('interviews'), status: interviewStatus },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireUser(ctx)
    if (!(await ctx.db.get('interviews', args.interviewId))) throw notFound('Event')
    await ctx.db.patch('interviews', args.interviewId, { status: args.status })
    return null
  }
})
