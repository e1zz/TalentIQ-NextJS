import { v, type Infer } from 'convex/values'
import type { Doc, Id } from '../_generated/dataModel'
import type { QueryCtx } from '../_generated/server'
import { getEmployeesById, interviewBadge, toEmployeeRef } from './domain'
import { employeeRef, interviewBadge as interviewBadgeValidator, interviewStatus, interviewType, locationType } from './validators'

export const calendarEvent = v.object({
  _id: v.id('interviews'),
  type: interviewType,
  title: v.string(),
  start: v.number(),
  end: v.number(),
  status: interviewStatus,
  /** Done / Screen / Interview / Panel / Offer / Onboarding. */
  badge: interviewBadgeValidator,
  candidate: v.union(v.object({ _id: v.id('candidates'), name: v.string() }), v.null()),
  applicationId: v.union(v.id('applications'), v.null()),
  job: v.union(v.object({ _id: v.id('jobs'), title: v.string() }), v.null()),
  /** The new hire, for onboarding sessions. */
  employee: v.union(employeeRef, v.null()),
  interviewers: v.array(employeeRef),
  location: v.string(),
  locationType
})
export type CalendarEvent = Infer<typeof calendarEvent>

export async function toCalendarEvents(ctx: QueryCtx, events: Doc<'interviews'>[]): Promise<CalendarEvent[]> {
  const employees = await getEmployeesById(ctx, [
    ...events.flatMap(e => e.interviewerIds),
    ...events.map(e => e.employeeId)
  ])
  const candidateIds = [...new Set(events.map(e => e.candidateId).filter((id): id is Id<'candidates'> => !!id))]
  const jobIds = [...new Set(events.map(e => e.jobId).filter((id): id is Id<'jobs'> => !!id))]
  const candidates = new Map(
    (await Promise.all(candidateIds.map(id => ctx.db.get('candidates', id)))).filter(c => c !== null).map(c => [c._id, c])
  )
  const jobs = new Map(
    (await Promise.all(jobIds.map(id => ctx.db.get('jobs', id)))).filter(j => j !== null).map(j => [j._id, j])
  )
  return events.map(e => {
    const candidate = e.candidateId ? candidates.get(e.candidateId) : undefined
    const job = e.jobId ? jobs.get(e.jobId) : undefined
    const employee = e.employeeId ? employees.get(e.employeeId) : undefined
    return {
      _id: e._id,
      type: e.type,
      title: e.title,
      start: e.start,
      end: e.end,
      status: e.status,
      badge: interviewBadge(e),
      candidate: candidate ? { _id: candidate._id, name: candidate.name } : null,
      applicationId: e.applicationId ?? null,
      job: job ? { _id: job._id, title: job.title } : null,
      employee: employee ? toEmployeeRef(employee) : null,
      interviewers: e.interviewerIds.flatMap(id => {
        const interviewer = employees.get(id)
        return interviewer ? [toEmployeeRef(interviewer)] : []
      }),
      location: e.location,
      locationType: e.locationType
    }
  })
}

/** Events that start in [from, to), excluding cancelled ones, ordered by start. */
export async function eventsBetween(ctx: QueryCtx, from: number, to: number): Promise<Doc<'interviews'>[]> {
  const events = await ctx.db
    .query('interviews')
    .withIndex('by_start', q => q.gte('start', from).lt('start', to))
    .take(500)
  return events.filter(e => e.status !== 'Cancelled')
}
