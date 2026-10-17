import { v, type Infer } from 'convex/values'
import type { Doc } from '../_generated/dataModel'
import type { QueryCtx } from '../_generated/server'
import { getEmployeesById, jobDaysOpen, jobHealth, refOrNull } from './domain'
import {
  department,
  employeeRef,
  employmentType,
  jobHealth as jobHealthValidator,
  jobStatus,
  stageCounts,
  workMode
} from './validators'

export const jobCard = v.object({
  _id: v.id('jobs'),
  title: v.string(),
  department,
  status: jobStatus,
  /** Null unless the job is Open. */
  health: v.union(jobHealthValidator, v.null()),
  location: v.string(),
  workMode,
  employmentType,
  stageCounts,
  hiringManager: v.union(employeeRef, v.null()),
  postedAt: v.union(v.number(), v.null()),
  /** Days since posting ("Posted N days ago"); 0 for unposted jobs. */
  daysOpen: v.number(),
  applicants: v.number(),
  newApplicants: v.number(),
  /** "+N this week". */
  applicantsThisWeek: v.number(),
  headcount: v.number(),
  targetDays: v.number(),
  referralBonus: v.union(v.number(), v.null()),
  salaryMin: v.union(v.number(), v.null()),
  salaryMax: v.union(v.number(), v.null()),
  currency: v.union(v.string(), v.null()),
  publishedOnCareerSite: v.boolean()
})
export type JobCard = Infer<typeof jobCard>

export async function toJobCards(ctx: QueryCtx, jobs: Doc<'jobs'>[], now: number): Promise<JobCard[]> {
  const managers = await getEmployeesById(
    ctx,
    jobs.map(j => j.hiringManagerId)
  )
  return jobs.map(job => ({
    _id: job._id,
    title: job.title,
    department: job.department,
    status: job.status,
    health: jobHealth(job, now),
    location: job.location,
    workMode: job.workMode,
    employmentType: job.employmentType,
    stageCounts: job.stageCounts,
    hiringManager: refOrNull(managers, job.hiringManagerId),
    postedAt: job.postedAt ?? null,
    daysOpen: job.postedAt === undefined ? 0 : jobDaysOpen(job, now),
    applicants: job.stageCounts.applied,
    newApplicants: job.newApplicants,
    applicantsThisWeek: job.applicantsThisWeek,
    headcount: job.headcount,
    targetDays: job.targetDays,
    referralBonus: job.referralBonus ?? null,
    salaryMin: job.salaryMin ?? null,
    salaryMax: job.salaryMax ?? null,
    currency: job.currency ?? null,
    publishedOnCareerSite: job.publishedOnCareerSite
  }))
}

export async function openJobs(ctx: QueryCtx): Promise<Doc<'jobs'>[]> {
  return await ctx.db
    .query('jobs')
    .withIndex('by_status', q => q.eq('status', 'Open'))
    .take(500)
}
