import { v } from 'convex/values'
import type { Doc, Id } from './_generated/dataModel'
import { mutation, query, type MutationCtx, type QueryCtx } from './_generated/server'
import { invalid, notFound, requireIdentity, requireUser } from './lib/auth'
import { getEmployeesById, refOrNull } from './lib/domain'
import {
  checklistFromTemplate,
  hireCard,
  isOverdue,
  onboardingTabFor,
  toHireCards,
  type TaskOwners
} from './lib/onboarding'
import { changeStage } from './lib/pipeline'
import { DAY, resolveNow, startOfDay } from './lib/time'
import {
  department,
  employeeRef,
  onboardingPhase,
  onboardingTab,
  onboardingTaskKind,
  ownerTeam,
  ONBOARDING_PHASES,
  type OnboardingTab
} from './lib/validators'

async function allOnboardings(ctx: QueryCtx): Promise<Doc<'onboardings'>[]> {
  return await ctx.db.query('onboardings').withIndex('by_startDate').order('desc').take(500)
}

/** Onboarding KPIs. */
export const kpis = query({
  args: { now: v.optional(v.number()) },
  returns: v.object({
    inProgress: v.number(),
    /** Not yet started, starting in the next 30 days. */
    startingNext30d: v.number(),
    completedLast90d: v.number(),
    /** Average checklist completion across hires in progress. */
    avgProgressPct: v.number(),
    overdueTasks: v.number()
  }),
  handler: async (ctx, args) => {
    await requireIdentity(ctx)
    const now = resolveNow(args.now)
    const onboardings = await allOnboardings(ctx)
    const cards = await toHireCards(ctx, onboardings, now)
    const inProgress = cards.filter(c => c.tab === 'In progress')
    return {
      inProgress: inProgress.length,
      startingNext30d: cards.filter(c => c.tab === 'Upcoming' && c.startDate <= now + 30 * DAY).length,
      completedLast90d: onboardings.filter(o => o.completedAt !== undefined && o.completedAt >= now - 90 * DAY).length,
      avgProgressPct:
        inProgress.length === 0 ? 0 : Math.round(inProgress.reduce((s, c) => s + c.progressPct, 0) / inProgress.length),
      overdueTasks: cards.filter(c => c.tab !== 'Completed').reduce((s, c) => s + c.overdueTasks, 0)
    }
  }
})

const attentionKey = v.union(
  v.literal('overdueTasks'),
  v.literal('docsNotSigned'),
  v.literal('laptopNotShipped'),
  v.literal('day1PlanNotSent')
)

/** "Needs attention": overdue tasks, docs not signed, laptops not shipped, day-1 plans not sent. */
export const attention = query({
  args: { now: v.optional(v.number()) },
  returns: v.array(
    v.object({
      key: attentionKey,
      label: v.string(),
      count: v.number(),
      items: v.array(
        v.object({
          onboardingId: v.id('onboardings'),
          taskId: v.id('onboardingTasks'),
          name: v.string(),
          task: v.string(),
          dueDate: v.number(),
          overdue: v.boolean()
        })
      )
    })
  ),
  handler: async (ctx, args) => {
    await requireIdentity(ctx)
    const now = resolveNow(args.now)
    const open = (await allOnboardings(ctx)).filter(o => onboardingTabFor(o, now) !== 'Completed')
    const byId = new Map(open.map(o => [o._id, o]))
    const tasks = (
      await ctx.db
        .query('onboardingTasks')
        .withIndex('by_done_and_dueDate', q => q.eq('done', false))
        .take(2000)
    ).filter(t => byId.has(t.onboardingId))
    const item = (t: Doc<'onboardingTasks'>) => ({
      onboardingId: t.onboardingId,
      taskId: t._id,
      name: byId.get(t.onboardingId)!.name,
      task: t.title,
      dueDate: t.dueDate,
      overdue: isOverdue(t, now)
    })
    const groups = [
      { key: 'overdueTasks' as const, label: 'Overdue tasks', items: tasks.filter(t => isOverdue(t, now)).map(item) },
      { key: 'docsNotSigned' as const, label: 'Docs not signed', items: tasks.filter(t => t.kind === 'documents').map(item) },
      { key: 'laptopNotShipped' as const, label: 'Laptop not shipped', items: tasks.filter(t => t.kind === 'laptop').map(item) },
      { key: 'day1PlanNotSent' as const, label: 'Day-1 plan not sent', items: tasks.filter(t => t.kind === 'day1_plan').map(item) }
    ]
    return groups.map(g => ({ ...g, count: g.items.length }))
  }
})

/** Hire cards for a tab, plus the count for every tab. */
export const list = query({
  args: { tab: v.optional(onboardingTab), now: v.optional(v.number()) },
  returns: v.object({
    tabs: v.array(v.object({ tab: onboardingTab, count: v.number() })),
    hires: v.array(hireCard)
  }),
  handler: async (ctx, args) => {
    await requireIdentity(ctx)
    const now = resolveNow(args.now)
    const cards = await toHireCards(ctx, await allOnboardings(ctx), now)
    const tabs: OnboardingTab[] = ['In progress', 'Upcoming', 'Completed']
    const tab = args.tab ?? 'In progress'
    return {
      tabs: tabs.map(t => ({ tab: t, count: cards.filter(c => c.tab === t).length })),
      hires: cards
        .filter(c => c.tab === tab)
        .sort((a, b) => (tab === 'Completed' ? b.startDate - a.startDate : a.startDate - b.startDate))
    }
  }
})

/** "Offer accepted · not started": accepted offers that don't have an onboarding yet. */
export const offerAcceptedNotStarted = query({
  args: {},
  returns: v.array(
    v.object({
      offerId: v.id('offers'),
      applicationId: v.id('applications'),
      candidateId: v.id('candidates'),
      name: v.string(),
      jobTitle: v.string(),
      department,
      startDate: v.number(),
      acceptedAt: v.union(v.number(), v.null()),
      hiringManager: v.union(employeeRef, v.null())
    })
  ),
  handler: async ctx => {
    await requireIdentity(ctx)
    const accepted = await ctx.db
      .query('offers')
      .withIndex('by_status', q => q.eq('status', 'Accepted'))
      .take(200)
    const pending = (
      await Promise.all(
        accepted.map(async offer => {
          const existing = await ctx.db
            .query('onboardings')
            .withIndex('by_application', q => q.eq('applicationId', offer.applicationId))
            .first()
          return existing ? null : offer
        })
      )
    ).filter(o => o !== null)
    const managers = await getEmployeesById(
      ctx,
      pending.map(o => o.hiringManagerId)
    )
    const rows = await Promise.all(
      pending.map(async offer => {
        const [candidate, job] = await Promise.all([
          ctx.db.get('candidates', offer.candidateId),
          ctx.db.get('jobs', offer.jobId)
        ])
        if (!candidate || !job) return null
        return {
          offerId: offer._id,
          applicationId: offer.applicationId,
          candidateId: candidate._id,
          name: candidate.name,
          jobTitle: job.title,
          department: job.department,
          startDate: offer.startDate,
          acceptedAt: offer.acceptedAt ?? null,
          hiringManager: refOrNull(managers, offer.hiringManagerId)
        }
      })
    )
    return rows.filter(r => r !== null).sort((a, b) => a.startDate - b.startDate)
  }
})

const checklistTask = v.object({
  _id: v.id('onboardingTasks'),
  title: v.string(),
  ownerTeam,
  owner: v.union(employeeRef, v.null()),
  dueDate: v.number(),
  overdue: v.boolean(),
  done: v.boolean(),
  doneAt: v.union(v.number(), v.null()),
  kind: onboardingTaskKind
})

/** Per-hire checklist grouped into Before day 1, Week 1 and Month 1. */
export const checklist = query({
  args: { onboardingId: v.id('onboardings'), now: v.optional(v.number()) },
  returns: v.union(
    v.null(),
    v.object({
      hire: hireCard,
      groups: v.array(
        v.object({ phase: onboardingPhase, done: v.number(), total: v.number(), tasks: v.array(checklistTask) })
      )
    })
  ),
  handler: async (ctx, args) => {
    await requireIdentity(ctx)
    const now = resolveNow(args.now)
    const onboarding = await ctx.db.get('onboardings', args.onboardingId)
    if (!onboarding) return null
    const [hire] = await toHireCards(ctx, [onboarding], now)
    const tasks = await ctx.db
      .query('onboardingTasks')
      .withIndex('by_onboarding_and_order', q => q.eq('onboardingId', onboarding._id))
      .take(500)
    const owners = await getEmployeesById(
      ctx,
      tasks.map(t => t.ownerId)
    )
    return {
      hire,
      groups: ONBOARDING_PHASES.map(phase => {
        const inPhase = tasks.filter(t => t.phase === phase)
        return {
          phase,
          done: inPhase.filter(t => t.done).length,
          total: inPhase.length,
          tasks: inPhase.map(t => ({
            _id: t._id,
            title: t.title,
            ownerTeam: t.ownerTeam,
            owner: refOrNull(owners, t.ownerId),
            dueDate: t.dueDate,
            overdue: isOverdue(t, now),
            done: t.done,
            doneAt: t.doneAt ?? null,
            kind: t.kind
          }))
        }
      })
    }
  }
})

async function syncCompletion(ctx: MutationCtx, onboardingId: Id<'onboardings'>) {
  const tasks = await ctx.db
    .query('onboardingTasks')
    .withIndex('by_onboarding_and_order', q => q.eq('onboardingId', onboardingId))
    .take(500)
  const allDone = tasks.length > 0 && tasks.every(t => t.done)
  const onboarding = await ctx.db.get('onboardings', onboardingId)
  if (!onboarding) return
  if (allDone && onboarding.completedAt === undefined) {
    await ctx.db.patch('onboardings', onboardingId, { completedAt: Date.now() })
    if (onboarding.employeeId) {
      const employee = await ctx.db.get('employees', onboarding.employeeId)
      if (employee?.status === 'Onboarding') await ctx.db.patch('employees', employee._id, { status: 'Active' })
    }
  } else if (!allDone && onboarding.completedAt !== undefined) {
    await ctx.db.patch('onboardings', onboardingId, { completedAt: undefined })
  }
}

/** Ticks or unticks a checklist task. Completing every task completes the onboarding. */
export const toggleTask = mutation({
  args: { taskId: v.id('onboardingTasks') },
  returns: v.object({ done: v.boolean() }),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    const task = await ctx.db.get('onboardingTasks', args.taskId)
    if (!task) throw notFound('Task')
    const done = !task.done
    await ctx.db.patch('onboardingTasks', task._id, {
      done,
      doneAt: done ? Date.now() : undefined,
      doneById: done ? user._id : undefined
    })
    await syncCompletion(ctx, task.onboardingId)
    return { done }
  }
})

export const addTask = mutation({
  args: {
    onboardingId: v.id('onboardings'),
    title: v.string(),
    phase: onboardingPhase,
    ownerTeam,
    ownerId: v.optional(v.id('employees')),
    dueDate: v.number(),
    kind: v.optional(onboardingTaskKind)
  },
  returns: v.id('onboardingTasks'),
  handler: async (ctx, args) => {
    await requireUser(ctx)
    const title = args.title.trim()
    if (!title) throw invalid('A task needs a title.')
    if (!(await ctx.db.get('onboardings', args.onboardingId))) throw notFound('Onboarding')
    const last = await ctx.db
      .query('onboardingTasks')
      .withIndex('by_onboarding_and_order', q => q.eq('onboardingId', args.onboardingId))
      .order('desc')
      .first()
    const id = await ctx.db.insert('onboardingTasks', {
      onboardingId: args.onboardingId,
      title,
      phase: args.phase,
      ownerTeam: args.ownerTeam,
      ownerId: args.ownerId,
      dueDate: args.dueDate,
      kind: args.kind ?? 'other',
      done: false,
      order: (last?.order ?? -1) + 1
    })
    await syncCompletion(ctx, args.onboardingId)
    return id
  }
})

/**
 * Starts onboarding for a hire with an accepted offer: creates the employee record
 * (status Onboarding), the onboarding and the default checklist.
 */
export const start = mutation({
  args: {
    applicationId: v.id('applications'),
    buddyId: v.optional(v.id('employees')),
    startDate: v.optional(v.number())
  },
  returns: v.id('onboardings'),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    const existing = await ctx.db
      .query('onboardings')
      .withIndex('by_application', q => q.eq('applicationId', args.applicationId))
      .first()
    if (existing) return existing._id
    const application = await ctx.db.get('applications', args.applicationId)
    if (!application) throw notFound('Application')
    const offer = await ctx.db
      .query('offers')
      .withIndex('by_application', q => q.eq('applicationId', application._id))
      .order('desc')
      .first()
    if (offer?.status !== 'Accepted' && application.stage !== 'Hired') {
      throw invalid('Onboarding starts once the offer is accepted.')
    }
    const [candidate, job] = await Promise.all([
      ctx.db.get('candidates', application.candidateId),
      ctx.db.get('jobs', application.jobId)
    ])
    if (!candidate || !job) throw notFound('Candidate or job')
    const startDate = startOfDay(args.startDate ?? offer?.startDate ?? Date.now() + 14 * DAY)

    const employeeId = await ctx.db.insert('employees', {
      name: candidate.name,
      email: candidate.email,
      phone: candidate.phone,
      title: job.title,
      department: job.department,
      location: candidate.location ?? job.location,
      workMode: job.workMode,
      employmentType: job.employmentType,
      managerId: job.hiringManagerId,
      startDate,
      status: 'Onboarding',
      probationEndDate: startDate + 90 * DAY
    })
    const onboardingId = await ctx.db.insert('onboardings', {
      name: candidate.name,
      title: job.title,
      department: job.department,
      employeeId,
      candidateId: candidate._id,
      applicationId: application._id,
      startDate,
      managerId: job.hiringManagerId,
      buddyId: args.buddyId,
      startedAt: Date.now()
    })
    const owners: TaskOwners = {
      People: user.employeeId,
      Manager: job.hiringManagerId,
      Buddy: args.buddyId,
      'New hire': employeeId
    }
    for (const task of checklistFromTemplate(onboardingId, startDate, owners)) {
      await ctx.db.insert('onboardingTasks', task)
    }
    await changeStage(ctx, application, 'Hired', user)
    return onboardingId
  }
})
