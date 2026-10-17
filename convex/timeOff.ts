import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { invalid, notFound, requireIdentity, requireUser } from './lib/auth'
import { getEmployeesById } from './lib/domain'
import {
  balancesFor,
  balancesFromRequests,
  decideTimeOff,
  overlaps,
  requestsInYear,
  requestsOverlapping
} from './lib/timeOff'
import { DAY, orgYear, resolveNow, startOfDay, startOfWeek, WEEK, workingDaysBetween } from './lib/time'
import { department, employeeRef, timeOffStatus, timeOffType } from './lib/validators'

const employeeSummary = v.object({
  _id: v.id('employees'),
  name: v.string(),
  title: v.string(),
  department
})

const balance = v.object({
  type: timeOffType,
  allowance: v.number(),
  used: v.number(),
  pending: v.number(),
  remaining: v.number()
})

/** Time-off KPIs. */
export const kpis = query({
  args: { now: v.optional(v.number()) },
  returns: v.object({
    pendingApprovals: v.number(),
    outToday: v.number(),
    outThisWeek: v.number(),
    /** Approved time off starting in the next 30 days. */
    upcoming30d: v.number()
  }),
  handler: async (ctx, args) => {
    await requireIdentity(ctx)
    const now = resolveNow(args.now)
    const today = startOfDay(now)
    const weekStart = startOfWeek(now)
    const [pending, thisWeek, upcoming] = await Promise.all([
      ctx.db
        .query('timeOffRequests')
        .withIndex('by_status_and_startDate', q => q.eq('status', 'Pending'))
        .take(1000),
      requestsOverlapping(ctx, weekStart, weekStart + WEEK - 1),
      ctx.db
        .query('timeOffRequests')
        .withIndex('by_status_and_startDate', q =>
          q.eq('status', 'Approved').gt('startDate', today).lte('startDate', today + 30 * DAY)
        )
        .take(1000)
    ])
    const approvedThisWeek = thisWeek.filter(r => r.status === 'Approved')
    return {
      pendingApprovals: pending.length,
      outToday: new Set(approvedThisWeek.filter(r => overlaps(r, today, today)).map(r => r.employeeId)).size,
      outThisWeek: new Set(approvedThisWeek.map(r => r.employeeId)).size,
      upcoming30d: upcoming.length
    }
  }
})

/** Pending approvals with overlap warnings and the balance before and after approving. */
export const pending = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id('timeOffRequests'),
      employee: employeeSummary,
      type: timeOffType,
      startDate: v.number(),
      endDate: v.number(),
      days: v.number(),
      note: v.union(v.string(), v.null()),
      requestedAt: v.number(),
      /** Teammates (same department) already off or requesting time off in the same range. */
      overlap: v.object({ count: v.number(), names: v.array(v.string()) }),
      balanceBefore: v.number(),
      balanceAfter: v.number()
    })
  ),
  handler: async ctx => {
    await requireIdentity(ctx)
    const requests = await ctx.db
      .query('timeOffRequests')
      .withIndex('by_status_and_startDate', q => q.eq('status', 'Pending'))
      .take(200)
    const rows = await Promise.all(
      requests.map(async r => {
        const others = (await requestsOverlapping(ctx, r.startDate, r.endDate)).filter(o => o._id !== r._id)
        const people = await getEmployeesById(ctx, [r.employeeId, ...others.map(o => o.employeeId)])
        const employee = people.get(r.employeeId)
        if (!employee) return null
        const overlapNames = [
          ...new Set(
            others
              .map(o => people.get(o.employeeId))
              .filter(p => p !== undefined && p._id !== employee._id && p.department === employee.department)
              .map(p => p!.name)
          )
        ]
        const balances = await balancesFor(ctx, employee._id, orgYear(r.startDate))
        const before = balances.find(b => b.type === r.type)?.remaining ?? 0
        return {
          _id: r._id,
          employee: { _id: employee._id, name: employee.name, title: employee.title, department: employee.department },
          type: r.type,
          startDate: r.startDate,
          endDate: r.endDate,
          days: r.days,
          note: r.note ?? null,
          requestedAt: r.requestedAt,
          overlap: { count: overlapNames.length, names: overlapNames },
          balanceBefore: before,
          balanceAfter: before - r.days
        }
      })
    )
    return rows.filter(r => r !== null)
  }
})

export const approve = mutation({
  args: { requestId: v.id('timeOffRequests') },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    await decideTimeOff(ctx, args.requestId, 'Approved', user)
    return null
  }
})

export const decline = mutation({
  args: { requestId: v.id('timeOffRequests'), reason: v.optional(v.string()) },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    await decideTimeOff(ctx, args.requestId, 'Declined', user, args.reason)
    return null
  }
})

/**
 * Team availability timeline, including pending requests. With a department, every
 * member gets a row; without one, only people with time off in the range.
 */
export const availability = query({
  args: {
    start: v.number(),
    days: v.optional(v.number()),
    department: v.optional(department)
  },
  returns: v.object({
    rangeStart: v.number(),
    rangeEnd: v.number(),
    /** Midnight of each day in the range. */
    days: v.array(v.number()),
    rows: v.array(
      v.object({
        employee: employeeSummary,
        absences: v.array(
          v.object({
            _id: v.id('timeOffRequests'),
            type: timeOffType,
            status: timeOffStatus,
            startDate: v.number(),
            endDate: v.number(),
            days: v.number()
          })
        )
      })
    )
  }),
  handler: async (ctx, args) => {
    await requireIdentity(ctx)
    const dayCount = Math.min(Math.max(args.days ?? 14, 1), 62)
    const rangeStart = startOfDay(args.start)
    const rangeEnd = rangeStart + dayCount * DAY - 1
    const requests = await requestsOverlapping(ctx, rangeStart, rangeEnd)
    const members = args.department
      ? (
          await ctx.db
            .query('employees')
            .withIndex('by_department_and_status', q => q.eq('department', args.department!))
            .take(1000)
        ).filter(e => e.status !== 'Left')
      : []
    const people = await getEmployeesById(ctx, [...members.map(m => m._id), ...requests.map(r => r.employeeId)])
    const employees = args.department
      ? members
      : [...new Set(requests.map(r => r.employeeId))].map(id => people.get(id)).filter(e => e !== undefined)
    return {
      rangeStart,
      rangeEnd,
      days: Array.from({ length: dayCount }, (_, i) => rangeStart + i * DAY),
      rows: employees
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(e => ({
          employee: { _id: e._id, name: e.name, title: e.title, department: e.department },
          absences: requests
            .filter(r => r.employeeId === e._id)
            .sort((a, b) => a.startDate - b.startDate)
            .map(r => ({ _id: r._id, type: r.type, status: r.status, startDate: r.startDate, endDate: r.endDate, days: r.days }))
        }))
    }
  }
})

/** One employee's balances for a year (defaults to the current year). */
export const balances = query({
  args: { employeeId: v.id('employees'), year: v.optional(v.number()) },
  returns: v.array(balance),
  handler: async (ctx, args) => {
    await requireIdentity(ctx)
    return await balancesFor(ctx, args.employeeId, args.year ?? orgYear(Date.now()))
  }
})

/** Balances for everyone in a department (or everyone), for the balances table. */
export const teamBalances = query({
  args: { department: v.optional(department), year: v.optional(v.number()) },
  returns: v.array(v.object({ employee: employeeRef, balances: v.array(balance) })),
  handler: async (ctx, args) => {
    await requireIdentity(ctx)
    const year = args.year ?? orgYear(Date.now())
    const employees = (
      args.department
        ? await ctx.db
            .query('employees')
            .withIndex('by_department_and_status', q => q.eq('department', args.department!))
            .take(1000)
        : await ctx.db.query('employees').withIndex('by_name').take(5000)
    ).filter(e => e.status !== 'Left')
    const requests = await requestsInYear(ctx, year)
    return employees.map(e => ({
      employee: { _id: e._id, name: e.name, title: e.title },
      balances: balancesFromRequests(requests.filter(r => r.employeeId === e._id))
    }))
  }
})

/** One employee's request history, newest first. */
export const history = query({
  args: { employeeId: v.id('employees') },
  returns: v.array(
    v.object({
      _id: v.id('timeOffRequests'),
      type: timeOffType,
      status: timeOffStatus,
      startDate: v.number(),
      endDate: v.number(),
      days: v.number(),
      note: v.union(v.string(), v.null()),
      requestedAt: v.number(),
      decidedAt: v.union(v.number(), v.null()),
      decidedBy: v.union(v.string(), v.null())
    })
  ),
  handler: async (ctx, args) => {
    await requireIdentity(ctx)
    const requests = await ctx.db
      .query('timeOffRequests')
      .withIndex('by_employee_and_startDate', q => q.eq('employeeId', args.employeeId))
      .order('desc')
      .take(200)
    const deciders = new Map(
      (await Promise.all([...new Set(requests.map(r => r.decidedById).filter(id => id !== undefined))].map(id => ctx.db.get('users', id))))
        .filter(u => u !== null)
        .map(u => [u._id, u.name])
    )
    return requests.map(r => ({
      _id: r._id,
      type: r.type,
      status: r.status,
      startDate: r.startDate,
      endDate: r.endDate,
      days: r.days,
      note: r.note ?? null,
      requestedAt: r.requestedAt,
      decidedAt: r.decidedAt ?? null,
      decidedBy: r.decidedById ? (deciders.get(r.decidedById) ?? null) : null
    }))
  }
})

/** Requests time off. Defaults to the signed-in user's own employee record. */
export const request = mutation({
  args: {
    employeeId: v.optional(v.id('employees')),
    type: timeOffType,
    startDate: v.number(),
    endDate: v.number(),
    note: v.optional(v.string())
  },
  returns: v.id('timeOffRequests'),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    const employeeId = args.employeeId ?? user.employeeId
    if (!employeeId) throw invalid('Choose the employee this request is for.')
    const employee = await ctx.db.get('employees', employeeId)
    if (!employee) throw notFound('Employee')
    const startDate = startOfDay(args.startDate)
    const endDate = startOfDay(args.endDate)
    if (endDate < startDate) throw invalid('The last day off must be on or after the first.')
    const days = workingDaysBetween(startDate, endDate)
    if (days === 0) throw invalid('That range has no working days.')
    const now = Date.now()
    const requestId = await ctx.db.insert('timeOffRequests', {
      employeeId,
      type: args.type,
      startDate,
      endDate,
      days,
      status: 'Pending',
      note: args.note,
      requestedAt: now
    })
    await ctx.db.insert('inboxItems', {
      kind: 'Time off',
      title: `${employee.name} requested ${days} ${days === 1 ? 'day' : 'days'} off`,
      preview: `${args.type}${args.note ? ` · ${args.note}` : ''}`,
      tag: 'Needs approval',
      createdAt: now,
      actorName: employee.name,
      employeeId,
      timeOffRequestId: requestId
    })
    return requestId
  }
})
