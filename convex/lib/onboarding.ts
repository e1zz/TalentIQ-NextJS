import { v, type Infer } from 'convex/values'
import type { Doc, Id } from '../_generated/dataModel'
import type { QueryCtx } from '../_generated/server'
import { getEmployeesById, refOrNull } from './domain'
import { DAY, startOfDay } from './time'
import {
  department,
  employeeRef,
  onboardingHealth,
  onboardingTab,
  type OnboardingHealth,
  type OnboardingPhase,
  type OnboardingTab,
  type OnboardingTaskKind,
  type OwnerTeam
} from './validators'

export type TaskTemplate = {
  title: string
  phase: OnboardingPhase
  ownerTeam: OwnerTeam
  kind: OnboardingTaskKind
  /** Due date relative to the start date, in days. */
  offsetDays: number
}

/** Default checklist created by `onboarding.start` (and used by the seed). */
export const DEFAULT_CHECKLIST: TaskTemplate[] = [
  { title: 'Send contract and NDA for signature', phase: 'Before day 1', ownerTeam: 'People', kind: 'documents', offsetDays: -10 },
  { title: 'Assign an onboarding buddy', phase: 'Before day 1', ownerTeam: 'People', kind: 'other', offsetDays: -7 },
  { title: 'Ship laptop and accessories', phase: 'Before day 1', ownerTeam: 'IT', kind: 'laptop', offsetDays: -4 },
  { title: 'Create email, Slack and HRIS accounts', phase: 'Before day 1', ownerTeam: 'IT', kind: 'accounts', offsetDays: -2 },
  { title: 'Send day-1 plan and welcome email', phase: 'Before day 1', ownerTeam: 'Manager', kind: 'day1_plan', offsetDays: -2 },
  { title: 'Welcome session and office tour', phase: 'Week 1', ownerTeam: 'People', kind: 'other', offsetDays: 0 },
  { title: 'Set up payroll and benefits', phase: 'Week 1', ownerTeam: 'Finance', kind: 'other', offsetDays: 2 },
  { title: 'Coffee with buddy and team intros', phase: 'Week 1', ownerTeam: 'Buddy', kind: 'other', offsetDays: 3 },
  { title: 'Security and compliance training', phase: 'Week 1', ownerTeam: 'New hire', kind: 'other', offsetDays: 4 },
  { title: 'Agree 30-60-90 day goals', phase: 'Month 1', ownerTeam: 'Manager', kind: 'other', offsetDays: 7 },
  { title: 'Product and customer deep-dive sessions', phase: 'Month 1', ownerTeam: 'New hire', kind: 'other', offsetDays: 14 },
  { title: '30-day check-in', phase: 'Month 1', ownerTeam: 'People', kind: 'other', offsetDays: 30 }
]

export type TaskOwners = Partial<Record<OwnerTeam, Id<'employees'>>>

export function checklistFromTemplate(onboardingId: Id<'onboardings'>, startDate: number, owners: TaskOwners) {
  return DEFAULT_CHECKLIST.map((t, order) => ({
    onboardingId,
    title: t.title,
    phase: t.phase,
    ownerTeam: t.ownerTeam,
    ownerId: owners[t.ownerTeam],
    dueDate: startOfDay(startDate) + t.offsetDays * DAY,
    kind: t.kind,
    done: false,
    order
  }))
}

export const hireCard = v.object({
  _id: v.id('onboardings'),
  name: v.string(),
  title: v.string(),
  department,
  startDate: v.number(),
  manager: v.union(employeeRef, v.null()),
  buddy: v.union(employeeRef, v.null()),
  employeeId: v.union(v.id('employees'), v.null()),
  tab: onboardingTab,
  status: onboardingHealth,
  tasksDone: v.number(),
  tasksTotal: v.number(),
  progressPct: v.number(),
  overdueTasks: v.number()
})
export type HireCard = Infer<typeof hireCard>

export function onboardingTabFor(onboarding: Doc<'onboardings'>, now: number): OnboardingTab {
  if (onboarding.completedAt !== undefined) return 'Completed'
  return onboarding.startDate > now ? 'Upcoming' : 'In progress'
}

export function isOverdue(task: Doc<'onboardingTasks'>, now: number): boolean {
  return !task.done && task.dueDate < startOfDay(now)
}

export function onboardingHealthFor(tasks: Doc<'onboardingTasks'>[], now: number): OnboardingHealth {
  if (tasks.some(t => isOverdue(t, now))) return 'At risk'
  if (!tasks.some(t => t.done)) return 'Not started'
  return 'On track'
}

export async function tasksFor(ctx: QueryCtx, onboardingId: Id<'onboardings'>) {
  return await ctx.db
    .query('onboardingTasks')
    .withIndex('by_onboarding_and_order', q => q.eq('onboardingId', onboardingId))
    .take(500)
}

export async function toHireCards(ctx: QueryCtx, onboardings: Doc<'onboardings'>[], now: number): Promise<HireCard[]> {
  const people = await getEmployeesById(ctx, [
    ...onboardings.map(o => o.managerId),
    ...onboardings.map(o => o.buddyId)
  ])
  return await Promise.all(
    onboardings.map(async o => {
      const tasks = await tasksFor(ctx, o._id)
      const done = tasks.filter(t => t.done).length
      return {
        _id: o._id,
        name: o.name,
        title: o.title,
        department: o.department,
        startDate: o.startDate,
        manager: refOrNull(people, o.managerId),
        buddy: refOrNull(people, o.buddyId),
        employeeId: o.employeeId ?? null,
        tab: onboardingTabFor(o, now),
        status: onboardingHealthFor(tasks, now),
        tasksDone: done,
        tasksTotal: tasks.length,
        progressPct: tasks.length === 0 ? 0 : Math.round((done / tasks.length) * 100),
        overdueTasks: tasks.filter(t => isOverdue(t, now)).length
      }
    })
  )
}
