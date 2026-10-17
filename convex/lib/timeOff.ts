import type { Doc, Id } from '../_generated/dataModel'
import type { MutationCtx, QueryCtx } from '../_generated/server'
import { invalid, notFound } from './auth'
import { DAY, orgDate } from './time'
import { TIME_OFF_ALLOWANCE, timeOffType, type Decision, type TimeOffType } from './validators'

/** Longest request we look back for when finding overlaps. */
const MAX_REQUEST_DAYS = 60

export function overlaps(r: Doc<'timeOffRequests'>, from: number, to: number): boolean {
  return r.startDate <= to && r.endDate >= from
}

/** Approved and pending requests that overlap [from, to]. */
export async function requestsOverlapping(ctx: QueryCtx, from: number, to: number) {
  const rows = await ctx.db
    .query('timeOffRequests')
    .withIndex('by_startDate', q => q.gte('startDate', from - MAX_REQUEST_DAYS * DAY).lte('startDate', to))
    .take(2000)
  return rows.filter(r => (r.status === 'Approved' || r.status === 'Pending') && overlaps(r, from, to))
}

export type Balance = { type: TimeOffType; allowance: number; used: number; pending: number; remaining: number }

export function balancesFromRequests(requests: Doc<'timeOffRequests'>[]): Balance[] {
  return timeOffType.members.map(({ value: type }) => {
    const ofType = requests.filter(r => r.type === type)
    const used = ofType.filter(r => r.status === 'Approved').reduce((s, r) => s + r.days, 0)
    const pending = ofType.filter(r => r.status === 'Pending').reduce((s, r) => s + r.days, 0)
    const allowance = TIME_OFF_ALLOWANCE[type]
    return { type, allowance, used, pending, remaining: allowance - used }
  })
}

export async function balancesFor(ctx: QueryCtx, employeeId: Id<'employees'>, year: number): Promise<Balance[]> {
  const requests = await ctx.db
    .query('timeOffRequests')
    .withIndex('by_employee_and_startDate', q =>
      q.eq('employeeId', employeeId).gte('startDate', orgDate(year, 1, 1)).lt('startDate', orgDate(year + 1, 1, 1))
    )
    .take(500)
  return balancesFromRequests(requests)
}

/** Every request that starts in `year`. */
export async function requestsInYear(ctx: QueryCtx, year: number) {
  return await ctx.db
    .query('timeOffRequests')
    .withIndex('by_startDate', q => q.gte('startDate', orgDate(year, 1, 1)).lt('startDate', orgDate(year + 1, 1, 1)))
    .take(10000)
}

/** Approves or declines a pending request and resolves its inbox item. */
export async function decideTimeOff(
  ctx: MutationCtx,
  requestId: Id<'timeOffRequests'>,
  decision: Decision,
  user: Doc<'users'>,
  reason?: string
): Promise<void> {
  const request = await ctx.db.get('timeOffRequests', requestId)
  if (!request) throw notFound('Time-off request')
  if (request.status !== 'Pending') throw invalid(`This request is already ${request.status.toLowerCase()}.`)
  const now = Date.now()
  await ctx.db.patch('timeOffRequests', request._id, {
    status: decision,
    decidedById: user._id,
    decidedAt: now,
    declineReason: decision === 'Declined' ? reason : undefined
  })
  const items = await ctx.db.query('inboxItems').withIndex('by_createdAt').order('desc').take(500)
  for (const item of items.filter(i => i.timeOffRequestId === request._id && i.resolution === undefined)) {
    await ctx.db.patch('inboxItems', item._id, { resolution: decision, resolvedAt: now, resolvedById: user._id })
  }
}
