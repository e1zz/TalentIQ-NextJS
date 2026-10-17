import type { Doc, Id } from '../_generated/dataModel'
import type { QueryCtx } from '../_generated/server'
import { daysBetween, DAY, previousMonthKey } from './time'
import {
  STAGES,
  type CandidateTag,
  type EmployeeRef,
  type InterviewBadge,
  type JobHealth,
  type Kpi,
  type MetricKey,
  type PersonDocumentStatus,
  type SignatureStatus,
  type Stage,
  type UserRef
} from './validators'

/** Days in the same stage before a card is tagged "Stale". */
export const STALE_AFTER_DAYS = 14
/** Days before expiry that count as "expiring soon". */
export const EXPIRING_WINDOW_DAYS = 30

export function stageIndex(stage: Stage): number {
  return STAGES.indexOf(stage)
}

export function jobDaysOpen(job: Doc<'jobs'>, now: number): number {
  return job.postedAt === undefined ? 0 : Math.max(0, daysBetween(job.postedAt, job.closedAt ?? now))
}

/** New in the first week, Overdue past the target, Slow past 75% of it, otherwise On track. */
export function jobHealth(job: Doc<'jobs'>, now: number): JobHealth | null {
  if (job.status !== 'Open' || job.postedAt === undefined) return null
  const days = jobDaysOpen(job, now)
  if (days <= 7) return 'New'
  if (days > job.targetDays) return 'Overdue'
  if (days > job.targetDays * 0.75) return 'Slow'
  return 'On track'
}

const HEALTH_URGENCY: Record<JobHealth, number> = { Overdue: 0, Slow: 1, 'On track': 2, New: 3 }

/** Most urgent first: Overdue, Slow, On track, New; then longest open. */
export function compareJobUrgency(a: Doc<'jobs'>, b: Doc<'jobs'>, now: number): number {
  const ha = jobHealth(a, now)
  const hb = jobHealth(b, now)
  const ua = ha === null ? 9 : HEALTH_URGENCY[ha]
  const ub = hb === null ? 9 : HEALTH_URGENCY[hb]
  return ua - ub || jobDaysOpen(b, now) - jobDaysOpen(a, now)
}

export async function getEmployeesById(
  ctx: QueryCtx,
  ids: Iterable<Id<'employees'> | undefined>
): Promise<Map<Id<'employees'>, Doc<'employees'>>> {
  const unique = [...new Set([...ids].filter((id): id is Id<'employees'> => id !== undefined))]
  const docs = await Promise.all(unique.map(id => ctx.db.get('employees', id)))
  const map = new Map<Id<'employees'>, Doc<'employees'>>()
  for (const doc of docs) if (doc) map.set(doc._id, doc)
  return map
}

export async function getUsersById(
  ctx: QueryCtx,
  ids: Iterable<Id<'users'> | undefined>
): Promise<Map<Id<'users'>, Doc<'users'>>> {
  const unique = [...new Set([...ids].filter((id): id is Id<'users'> => id !== undefined))]
  const docs = await Promise.all(unique.map(id => ctx.db.get('users', id)))
  const map = new Map<Id<'users'>, Doc<'users'>>()
  for (const doc of docs) if (doc) map.set(doc._id, doc)
  return map
}

export function toEmployeeRef(employee: Doc<'employees'>): EmployeeRef {
  return { _id: employee._id, name: employee.name, title: employee.title }
}

export function toUserRef(user: Doc<'users'>): UserRef {
  return { _id: user._id, name: user.name, title: user.title }
}

export function refOrNull(map: Map<Id<'employees'>, Doc<'employees'>>, id: Id<'employees'> | undefined) {
  const employee = id === undefined ? undefined : map.get(id)
  return employee ? toEmployeeRef(employee) : null
}

export function userRefOrNull(map: Map<Id<'users'>, Doc<'users'>>, id: Id<'users'> | undefined) {
  const user = id === undefined ? undefined : map.get(id)
  return user ? toUserRef(user) : null
}

export function ratingSummary(scorecards: Doc<'scorecards'>[]): { ratingAvg: number | null; scorecardCount: number } {
  if (scorecards.length === 0) return { ratingAvg: null, scorecardCount: 0 }
  const avg = scorecards.reduce((sum, s) => sum + s.rating, 0) / scorecards.length
  return { ratingAvg: Math.round(avg * 10) / 10, scorecardCount: scorecards.length }
}

export function candidateTags(
  application: Doc<'applications'>,
  candidate: Doc<'candidates'>,
  offer: Doc<'offers'> | null,
  now: number
): CandidateTag[] {
  const tags: CandidateTag[] = []
  if (candidate.source === 'Referral') tags.push('Referral')
  if (application.finalRound) tags.push('Final round')
  if (offer?.status === 'Pending approval') tags.push('Awaiting approval')
  if (application.stage !== 'Hired' && daysBetween(application.stageEnteredAt, now) >= STALE_AFTER_DAYS) {
    tags.push('Stale')
  }
  return tags
}

export function sourceLabel(candidate: Doc<'candidates'>, referrer: Doc<'employees'> | undefined): string {
  if (candidate.source === 'Referral' && referrer) return `Referral · ${referrer.name}`
  if (candidate.source === 'Agency' && candidate.agencyName) return `Agency · ${candidate.agencyName}`
  return candidate.source
}

export function interviewBadge(event: Doc<'interviews'>): InterviewBadge {
  if (event.status === 'Completed') return 'Done'
  switch (event.type) {
    case 'Phone screen':
      return 'Screen'
    case 'Offer call':
      return 'Offer'
    default:
      return event.type
  }
}

/** Waiting signatures past their due date are Overdue. */
export function signatureStatus(doc: Doc<'documents'>, now: number): SignatureStatus {
  if (doc.status === 'Signed') return 'Signed'
  return doc.dueAt !== undefined && doc.dueAt < now ? 'Overdue' : 'Waiting'
}

/** Status shown next to a person's document, plus days until expiry when relevant. */
export function personDocumentStatus(
  doc: Doc<'documents'>,
  now: number
): { status: PersonDocumentStatus; expiresInDays: number | null } {
  const expiresInDays = doc.expiresAt === undefined ? null : daysBetween(now, doc.expiresAt)
  if (doc.status === 'Missing') return { status: 'Missing', expiresInDays }
  if (expiresInDays !== null && expiresInDays < 0) return { status: 'Expired', expiresInDays }
  if (expiresInDays !== null && expiresInDays <= EXPIRING_WINDOW_DAYS) return { status: 'Expires soon', expiresInDays }
  if (doc.status === 'Waiting') return { status: signatureStatus(doc, now), expiresInDays }
  return { status: doc.status, expiresInDays }
}

export function signerProgress(doc: Doc<'documents'>): { signed: number; total: number } {
  return { signed: doc.signers.filter(s => s.status === 'Signed').length, total: doc.signers.length }
}

export async function metricSeries(
  ctx: QueryCtx,
  key: MetricKey,
  dimension?: string
): Promise<{ period: string; value: number }[]> {
  const rows = await ctx.db
    .query('metrics')
    .withIndex('by_key_and_dimension_and_period', q => q.eq('key', key).eq('dimension', dimension))
    .collect()
  return rows.filter(r => r.period.length === 7).map(r => ({ period: r.period, value: r.value }))
}

export async function metricValue(
  ctx: QueryCtx,
  key: MetricKey,
  period: string,
  dimension?: string
): Promise<number | null> {
  const row = await ctx.db
    .query('metrics')
    .withIndex('by_key_and_dimension_and_period', q =>
      q.eq('key', key).eq('dimension', dimension).eq('period', period)
    )
    .unique()
  return row?.value ?? null
}

/**
 * Builds a KPI from monthly history. `liveValue` replaces the current month when the
 * value can be computed from live data. Delta compares with the previous month.
 */
export async function buildKpi(
  ctx: QueryCtx,
  opts: {
    key: MetricKey
    label: string
    unit: Kpi['unit']
    goodDirection: Kpi['goodDirection']
    period: string
    liveValue?: number
    months?: number
  }
): Promise<Kpi> {
  const history = await metricSeries(ctx, opts.key)
  const upToNow = history.filter(p => p.period <= opts.period)
  const series = upToNow.filter(p => p.period !== opts.period)
  const stored = upToNow.find(p => p.period === opts.period)?.value
  const value = opts.liveValue ?? stored ?? 0
  series.push({ period: opts.period, value })
  const previous = upToNow.find(p => p.period === previousMonthKey(opts.period))?.value ?? value
  return {
    key: opts.key,
    label: opts.label,
    value,
    unit: opts.unit,
    delta: Math.round((value - previous) * 10) / 10,
    goodDirection: opts.goodDirection,
    series: series.slice(-(opts.months ?? 10))
  }
}

export function pct(part: number, whole: number): number {
  return whole === 0 ? 0 : Math.round((part / whole) * 1000) / 10
}

export function isWithin(t: number | undefined, from: number, to: number): t is number {
  return t !== undefined && t >= from && t < to
}

export function daysFrom(now: number, days: number): number {
  return now + days * DAY
}
