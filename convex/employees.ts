import { paginationOptsValidator, paginationResultValidator } from 'convex/server'
import { v } from 'convex/values'
import type { Doc } from './_generated/dataModel'
import { query, type QueryCtx } from './_generated/server'
import { requireIdentity } from './lib/auth'
import { daysFrom, EXPIRING_WINDOW_DAYS, getEmployeesById, refOrNull } from './lib/domain'
import { personDocument, toPersonDocument } from './lib/documents'
import { openJobs } from './lib/jobCards'
import { DAY, daysBetween, resolveNow, startOfDay } from './lib/time'
import {
  department,
  employeeRef,
  employeeStatus,
  employeeTab,
  employmentType,
  timeOffStatus,
  timeOffType,
  workMode,
  type EmployeeTab
} from './lib/validators'

/** Days ahead that count as "permit or visa to renew". */
const PERMIT_WINDOW_DAYS = 60

async function currentEmployees(ctx: QueryCtx): Promise<Doc<'employees'>[]> {
  const all = await ctx.db.query('employees').take(5000)
  return all.filter(e => e.status !== 'Left')
}

/** Headcount, new hires and leavers in the last 30 days, and open positions. */
export const kpis = query({
  args: { now: v.optional(v.number()) },
  returns: v.object({
    headcount: v.number(),
    newHires30d: v.number(),
    leavers30d: v.number(),
    /** Seats still to fill across open jobs. */
    openPositions: v.number()
  }),
  handler: async (ctx, args) => {
    await requireIdentity(ctx)
    const now = resolveNow(args.now)
    const since = now - 30 * DAY
    const [employees, leavers, jobs] = await Promise.all([
      currentEmployees(ctx),
      ctx.db
        .query('employees')
        .withIndex('by_endDate', q => q.gte('endDate', since).lte('endDate', now))
        .take(1000),
      openJobs(ctx)
    ])
    return {
      headcount: employees.length,
      newHires30d: employees.filter(e => e.startDate >= since && e.startDate <= now).length,
      leavers30d: leavers.filter(e => e.status === 'Left').length,
      openPositions: jobs.reduce((sum, j) => sum + j.headcount, 0)
    }
  }
})

const attentionItem = v.object({
  employee: employeeRef,
  detail: v.string(),
  date: v.union(v.number(), v.null())
})

/** "Needs attention" on the Employees screen. */
export const attention = query({
  args: { now: v.optional(v.number()) },
  returns: v.array(
    v.object({
      key: v.union(
        v.literal('contractsExpiring'),
        v.literal('missingDocs'),
        v.literal('probationReviews'),
        v.literal('permitsToRenew')
      ),
      label: v.string(),
      count: v.number(),
      items: v.array(attentionItem)
    })
  ),
  handler: async (ctx, args) => {
    await requireIdentity(ctx)
    const now = resolveNow(args.now)
    const today = startOfDay(now)
    const inWindow = daysFrom(today, EXPIRING_WINDOW_DAYS)
    const [contracts, probations, permits, missing] = await Promise.all([
      ctx.db
        .query('employees')
        .withIndex('by_contractEndDate', q => q.gte('contractEndDate', today).lte('contractEndDate', inWindow))
        .take(200),
      ctx.db
        .query('employees')
        .withIndex('by_probationEndDate', q => q.gte('probationEndDate', today).lte('probationEndDate', inWindow))
        .take(200),
      ctx.db
        .query('employees')
        .withIndex('by_permitExpiresAt', q =>
          q.gte('permitExpiresAt', today).lte('permitExpiresAt', daysFrom(today, PERMIT_WINDOW_DAYS))
        )
        .take(200),
      ctx.db
        .query('documents')
        .withIndex('by_status', q => q.eq('status', 'Missing'))
        .take(500)
    ])
    const missingForEmployees = missing.filter(d => d.employeeId !== undefined)
    const owners = await getEmployeesById(
      ctx,
      missingForEmployees.map(d => d.employeeId)
    )
    const active = (list: Doc<'employees'>[]) => list.filter(e => e.status !== 'Left')
    const ref = (e: Doc<'employees'>) => ({ _id: e._id, name: e.name, title: e.title })
    const inDays = (date: number) => {
      const days = daysBetween(now, date)
      return days === 0 ? 'today' : days === 1 ? 'in 1 day' : `in ${days} days`
    }
    return [
      {
        key: 'contractsExpiring' as const,
        label: 'Contracts expiring in 30 days',
        items: active(contracts).map(e => ({
          employee: ref(e),
          detail: `Contract ends ${inDays(e.contractEndDate!)}`,
          date: e.contractEndDate!
        }))
      },
      {
        key: 'missingDocs' as const,
        label: 'Missing documents',
        items: missingForEmployees.flatMap(d => {
          const e = owners.get(d.employeeId!)
          return e && e.status !== 'Left' ? [{ employee: ref(e), detail: `${d.title} missing`, date: d.dueAt ?? null }] : []
        })
      },
      {
        key: 'probationReviews' as const,
        label: 'Probation reviews due',
        items: active(probations).map(e => ({
          employee: ref(e),
          detail: `Probation ends ${inDays(e.probationEndDate!)}`,
          date: e.probationEndDate!
        }))
      },
      {
        key: 'permitsToRenew' as const,
        label: 'Permits and visas to renew',
        items: active(permits).map(e => ({
          employee: ref(e),
          detail: `${e.permitType ?? 'Permit'} expires ${inDays(e.permitExpiresAt!)}`,
          date: e.permitExpiresAt!
        }))
      }
    ].map(group => ({ ...group, count: group.items.length }))
  }
})

const TABS: EmployeeTab[] = ['All', 'Active', 'On leave', 'Onboarding', 'Offboarding']

/** Counts for the status tabs. `All` excludes people who have left. */
export const statusCounts = query({
  args: {},
  returns: v.array(v.object({ tab: employeeTab, count: v.number() })),
  handler: async ctx => {
    await requireIdentity(ctx)
    const employees = await currentEmployees(ctx)
    return TABS.map(tab => ({
      tab,
      count: tab === 'All' ? employees.length : employees.filter(e => e.status === tab).length
    }))
  }
})

const employeeRow = v.object({
  _id: v.id('employees'),
  name: v.string(),
  email: v.string(),
  title: v.string(),
  department,
  location: v.string(),
  workMode,
  startDate: v.number(),
  status: employeeStatus
})

/** Paginated employee table, sorted by name. Use with `usePaginatedQuery`. */
export const list = query({
  args: {
    paginationOpts: paginationOptsValidator,
    status: v.optional(employeeTab),
    department: v.optional(department)
  },
  returns: paginationResultValidator(employeeRow),
  handler: async (ctx, args) => {
    await requireIdentity(ctx)
    const tab = args.status ?? 'All'
    const base =
      tab === 'All'
        ? ctx.db
            .query('employees')
            .withIndex('by_name')
            .filter(q => q.neq(q.field('status'), 'Left'))
        : ctx.db.query('employees').withIndex('by_status_and_name', q => q.eq('status', tab))
    const filtered =
      args.department === undefined ? base : base.filter(q => q.eq(q.field('department'), args.department))
    const page = await filtered.paginate(args.paginationOpts)
    return {
      ...page,
      page: page.page.map(e => ({
        _id: e._id,
        name: e.name,
        email: e.email,
        title: e.title,
        department: e.department,
        location: e.location,
        workMode: e.workMode,
        startDate: e.startDate,
        status: e.status
      }))
    }
  }
})

/** Detail panel for one employee. */
export const get = query({
  args: { employeeId: v.id('employees'), now: v.optional(v.number()) },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id('employees'),
      name: v.string(),
      title: v.string(),
      department,
      status: employeeStatus,
      email: v.string(),
      phone: v.union(v.string(), v.null()),
      location: v.string(),
      workMode,
      employmentType,
      manager: v.union(employeeRef, v.null()),
      startDate: v.number(),
      contractEndDate: v.union(v.number(), v.null()),
      probationEndDate: v.union(v.number(), v.null()),
      documents: v.array(personDocument),
      upcomingTimeOff: v.array(
        v.object({
          _id: v.id('timeOffRequests'),
          type: timeOffType,
          startDate: v.number(),
          endDate: v.number(),
          days: v.number(),
          status: timeOffStatus
        })
      )
    })
  ),
  handler: async (ctx, args) => {
    await requireIdentity(ctx)
    const now = resolveNow(args.now)
    const employee = await ctx.db.get('employees', args.employeeId)
    if (!employee) return null
    const [managers, documents, timeOff] = await Promise.all([
      getEmployeesById(ctx, [employee.managerId]),
      ctx.db
        .query('documents')
        .withIndex('by_employee', q => q.eq('employeeId', employee._id))
        .collect(),
      ctx.db
        .query('timeOffRequests')
        .withIndex('by_employee_and_startDate', q => q.eq('employeeId', employee._id).gte('startDate', startOfDay(now) - 31 * DAY))
        .take(50)
    ])
    return {
      _id: employee._id,
      name: employee.name,
      title: employee.title,
      department: employee.department,
      status: employee.status,
      email: employee.email,
      phone: employee.phone ?? null,
      location: employee.location,
      workMode: employee.workMode,
      employmentType: employee.employmentType,
      manager: refOrNull(managers, employee.managerId),
      startDate: employee.startDate,
      contractEndDate: employee.contractEndDate ?? null,
      probationEndDate: employee.probationEndDate ?? null,
      documents: documents.sort((a, b) => a.title.localeCompare(b.title)).map(d => toPersonDocument(d, now)),
      upcomingTimeOff: timeOff
        .filter(r => r.endDate >= startOfDay(now) && (r.status === 'Approved' || r.status === 'Pending'))
        .map(r => ({ _id: r._id, type: r.type, startDate: r.startDate, endDate: r.endDate, days: r.days, status: r.status }))
    }
  }
})
