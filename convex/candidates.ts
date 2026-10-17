import { v } from 'convex/values'
import type { Doc, Id } from './_generated/dataModel'
import { mutation, query, type QueryCtx } from './_generated/server'
import { invalid, notFound, requireIdentity, requireUser } from './lib/auth'
import {
  candidateTags,
  getEmployeesById,
  ratingSummary,
  refOrNull,
  sourceLabel,
  stageIndex
} from './lib/domain'
import { personDocument, toPersonDocument } from './lib/documents'
import { changeStage } from './lib/pipeline'
import { jobCard, toJobCards } from './lib/jobCards'
import { DAY, daysBetween, resolveNow } from './lib/time'
import {
  activityType,
  applicationStatus,
  candidateSource,
  candidateTag,
  department,
  employeeRef,
  recommendation,
  stage,
  STAGES
} from './lib/validators'

const pipelineCard = v.object({
  applicationId: v.id('applications'),
  candidateId: v.id('candidates'),
  name: v.string(),
  stage,
  source: candidateSource,
  /** "LinkedIn", "Referral · Marcus Webb", "Agency · Hays"... */
  sourceLabel: v.string(),
  tags: v.array(candidateTag),
  nextAction: v.union(v.string(), v.null()),
  nextActionDueAt: v.union(v.number(), v.null()),
  ratingAvg: v.union(v.number(), v.null()),
  scorecardCount: v.number(),
  daysInStage: v.number(),
  /** Next action due within a day, or the card is stale. */
  needsAction: v.boolean()
})

async function latestOfferByApplication(ctx: QueryCtx, applicationId: Id<'applications'>) {
  return await ctx.db
    .query('offers')
    .withIndex('by_application', q => q.eq('applicationId', applicationId))
    .order('desc')
    .first()
}

async function buildCard(ctx: QueryCtx, application: Doc<'applications'>, now: number) {
  const candidate = await ctx.db.get('candidates', application.candidateId)
  if (!candidate) return null
  const [scorecards, offer, referrer] = await Promise.all([
    ctx.db
      .query('scorecards')
      .withIndex('by_application', q => q.eq('applicationId', application._id))
      .collect(),
    latestOfferByApplication(ctx, application._id),
    candidate.referrerId ? ctx.db.get('employees', candidate.referrerId) : Promise.resolve(null)
  ])
  const tags = candidateTags(application, candidate, offer, now)
  const { ratingAvg, scorecardCount } = ratingSummary(scorecards)
  const dueSoon = application.nextActionDueAt !== undefined && application.nextActionDueAt <= now + DAY
  return {
    applicationId: application._id,
    candidateId: candidate._id,
    name: candidate.name,
    stage: application.stage,
    source: candidate.source,
    sourceLabel: sourceLabel(candidate, referrer ?? undefined),
    tags,
    nextAction: application.nextAction ?? null,
    nextActionDueAt: application.nextActionDueAt ?? null,
    ratingAvg,
    scorecardCount,
    daysInStage: daysBetween(application.stageEnteredAt, now),
    needsAction: dueSoon || tags.includes('Stale')
  }
}

/** Kanban board for one job: Applied, Screening, Interview, Offer, Hired. */
export const pipeline = query({
  args: {
    jobId: v.id('jobs'),
    source: v.optional(candidateSource),
    /** Keep cards whose average rating is at least this (cards without ratings are dropped). */
    minRating: v.optional(v.number()),
    needsAction: v.optional(v.boolean()),
    now: v.optional(v.number())
  },
  returns: v.union(
    v.null(),
    v.object({
      job: jobCard,
      columns: v.array(v.object({ stage, count: v.number(), cards: v.array(pipelineCard) })),
      sourceCounts: v.array(v.object({ source: candidateSource, count: v.number() }))
    })
  ),
  handler: async (ctx, args) => {
    await requireIdentity(ctx)
    const now = resolveNow(args.now)
    const job = await ctx.db.get('jobs', args.jobId)
    if (!job) return null
    const [card] = await toJobCards(ctx, [job], now)
    const columns = await Promise.all(
      STAGES.map(async columnStage => {
        const applications = await ctx.db
          .query('applications')
          .withIndex('by_job_and_stage', q => q.eq('jobId', job._id).eq('stage', columnStage))
          .take(200)
        const cards = (
          await Promise.all(applications.filter(a => a.status === 'Active').map(a => buildCard(ctx, a, now)))
        ).filter(c => c !== null)
        return { stage: columnStage, cards }
      })
    )
    const allCards = columns.flatMap(c => c.cards)
    const sourceCounts = candidateSource.members
      .map(m => ({ source: m.value, count: allCards.filter(c => c.source === m.value).length }))
      .filter(s => s.count > 0)
    const keep = (c: (typeof allCards)[number]) =>
      (args.source === undefined || c.source === args.source) &&
      (args.minRating === undefined || (c.ratingAvg !== null && c.ratingAvg >= args.minRating)) &&
      (args.needsAction !== true || c.needsAction)
    return {
      job: card,
      columns: columns.map(c => {
        const cards = c.cards.filter(keep).sort((a, b) => b.daysInStage - a.daysInStage)
        return { stage: c.stage, count: cards.length, cards }
      }),
      sourceCounts
    }
  }
})

/**
 * Moves an application to another stage. Keeps the job's funnel counters, the
 * referral record and the activity feed in sync.
 */
export const moveStage = mutation({
  args: { applicationId: v.id('applications'), stage },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    const application = await ctx.db.get('applications', args.applicationId)
    if (!application) throw notFound('Application')
    if (application.status !== 'Active') throw invalid('Only active applications can move stage.')
    await changeStage(ctx, application, args.stage, user)
    return null
  }
})

/** Adds a note to a candidate's activity feed. */
export const addNote = mutation({
  args: { candidateId: v.id('candidates'), applicationId: v.optional(v.id('applications')), text: v.string() },
  returns: v.id('activities'),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    const text = args.text.trim()
    if (!text) throw invalid('A note needs some text.')
    if (!(await ctx.db.get('candidates', args.candidateId))) throw notFound('Candidate')
    return await ctx.db.insert('activities', {
      candidateId: args.candidateId,
      applicationId: args.applicationId,
      type: 'note',
      text,
      actorName: user.name,
      actorUserId: user._id,
      at: Date.now()
    })
  }
})

const stepKind = v.union(v.literal('interview'), v.literal('offer'), v.literal('action'))

/** Everything on the candidate profile. Uses the latest application unless `applicationId` is given. */
export const profile = query({
  args: {
    candidateId: v.id('candidates'),
    applicationId: v.optional(v.id('applications')),
    now: v.optional(v.number())
  },
  returns: v.union(
    v.null(),
    v.object({
      candidate: v.object({
        _id: v.id('candidates'),
        name: v.string(),
        email: v.string(),
        phone: v.union(v.string(), v.null()),
        location: v.union(v.string(), v.null()),
        linkedinUrl: v.union(v.string(), v.null()),
        currentRole: v.union(v.string(), v.null()),
        currentCompany: v.union(v.string(), v.null()),
        experienceYears: v.union(v.number(), v.null()),
        expectedPay: v.union(v.string(), v.null()),
        noticePeriod: v.union(v.string(), v.null()),
        source: candidateSource,
        sourceLabel: v.string(),
        referrer: v.union(employeeRef, v.null()),
        skills: v.array(v.string())
      }),
      application: v.union(
        v.null(),
        v.object({
          _id: v.id('applications'),
          stage,
          status: applicationStatus,
          appliedAt: v.number(),
          daysInStage: v.number(),
          job: v.object({ _id: v.id('jobs'), title: v.string(), department }),
          tags: v.array(candidateTag),
          ratingAvg: v.union(v.number(), v.null()),
          scorecardCount: v.number()
        })
      ),
      stageProgress: v.array(
        v.object({ stage, reached: v.boolean(), current: v.boolean(), enteredAt: v.union(v.number(), v.null()) })
      ),
      nextStep: v.union(
        v.null(),
        v.object({ kind: stepKind, title: v.string(), detail: v.union(v.string(), v.null()), at: v.union(v.number(), v.null()) })
      ),
      scorecards: v.array(
        v.object({
          _id: v.id('scorecards'),
          interviewer: v.union(employeeRef, v.null()),
          round: v.string(),
          submittedAt: v.number(),
          rating: v.number(),
          recommendation,
          summary: v.union(v.string(), v.null())
        })
      ),
      activity: v.array(
        v.object({
          _id: v.id('activities'),
          type: activityType,
          text: v.string(),
          actorName: v.union(v.string(), v.null()),
          at: v.number()
        })
      ),
      documents: v.array(personDocument),
      otherApplications: v.array(
        v.object({ _id: v.id('applications'), jobTitle: v.string(), stage, status: applicationStatus })
      )
    })
  ),
  handler: async (ctx, args) => {
    await requireIdentity(ctx)
    const now = resolveNow(args.now)
    const candidate = await ctx.db.get('candidates', args.candidateId)
    if (!candidate) return null

    const applications = await ctx.db
      .query('applications')
      .withIndex('by_candidate', q => q.eq('candidateId', candidate._id))
      .collect()
    applications.sort((a, b) => b.appliedAt - a.appliedAt)
    const application =
      (args.applicationId ? applications.find(a => a._id === args.applicationId) : applications[0]) ?? null

    const [scorecards, activity, documents, upcoming] = await Promise.all([
      ctx.db
        .query('scorecards')
        .withIndex('by_candidate', q => q.eq('candidateId', candidate._id))
        .collect(),
      ctx.db
        .query('activities')
        .withIndex('by_candidate_and_at', q => q.eq('candidateId', candidate._id))
        .order('desc')
        .take(50),
      ctx.db
        .query('documents')
        .withIndex('by_candidate', q => q.eq('candidateId', candidate._id))
        .collect(),
      ctx.db
        .query('interviews')
        .withIndex('by_candidate_and_start', q => q.eq('candidateId', candidate._id).gte('start', now - 2 * 60 * 60 * 1000))
        .take(10)
    ])
    const appScorecards = application ? scorecards.filter(s => s.applicationId === application._id) : scorecards
    const employees = await getEmployeesById(ctx, [
      candidate.referrerId,
      ...appScorecards.map(s => s.interviewerId)
    ])
    const referrer = candidate.referrerId ? employees.get(candidate.referrerId) : undefined
    const job = application ? await ctx.db.get('jobs', application.jobId) : null
    const offer = application ? await latestOfferByApplication(ctx, application._id) : null
    const { ratingAvg, scorecardCount } = ratingSummary(appScorecards)

    const currentIndex = application ? stageIndex(application.stage) : -1
    const stageProgress = STAGES.map((s, i) => ({
      stage: s,
      reached: i <= currentIndex,
      current: i === currentIndex,
      enteredAt: application?.stageHistory.findLast(h => h.stage === s)?.enteredAt ?? null
    }))

    const nextInterview = upcoming.find(e => e.status === 'Scheduled' && e.end >= now)
    let nextStep: {
      kind: 'interview' | 'offer' | 'action'
      title: string
      detail: string | null
      at: number | null
    } | null = null
    if (nextInterview) {
      nextStep = { kind: 'interview', title: nextInterview.title, detail: nextInterview.location, at: nextInterview.start }
    } else if (offer && (offer.status === 'Pending approval' || offer.status === 'Approved' || offer.status === 'Sent')) {
      nextStep = {
        kind: 'offer',
        title: offer.status === 'Pending approval' ? 'Offer awaiting approval' : offer.status === 'Approved' ? 'Send the approved offer' : 'Waiting for the candidate to accept the offer',
        detail: application?.nextAction ?? null,
        at: application?.nextActionDueAt ?? null
      }
    } else if (application?.nextAction) {
      nextStep = { kind: 'action', title: application.nextAction, detail: null, at: application.nextActionDueAt ?? null }
    }

    const otherJobs = await Promise.all(
      applications.filter(a => a._id !== application?._id).map(async a => ({ a, job: await ctx.db.get('jobs', a.jobId) }))
    )

    return {
      candidate: {
        _id: candidate._id,
        name: candidate.name,
        email: candidate.email,
        phone: candidate.phone ?? null,
        location: candidate.location ?? null,
        linkedinUrl: candidate.linkedinUrl ?? null,
        currentRole: candidate.currentRole ?? null,
        currentCompany: candidate.currentCompany ?? null,
        experienceYears: candidate.experienceYears ?? null,
        expectedPay: candidate.expectedPay ?? null,
        noticePeriod: candidate.noticePeriod ?? null,
        source: candidate.source,
        sourceLabel: sourceLabel(candidate, referrer),
        referrer: refOrNull(employees, candidate.referrerId),
        skills: candidate.skills
      },
      application:
        application && job
          ? {
              _id: application._id,
              stage: application.stage,
              status: application.status,
              appliedAt: application.appliedAt,
              daysInStage: daysBetween(application.stageEnteredAt, now),
              job: { _id: job._id, title: job.title, department: job.department },
              tags: candidateTags(application, candidate, offer, now),
              ratingAvg,
              scorecardCount
            }
          : null,
      stageProgress,
      nextStep,
      scorecards: appScorecards
        .sort((a, b) => b.submittedAt - a.submittedAt)
        .map(s => ({
          _id: s._id,
          interviewer: refOrNull(employees, s.interviewerId),
          round: s.round,
          submittedAt: s.submittedAt,
          rating: s.rating,
          recommendation: s.recommendation,
          summary: s.summary ?? null
        })),
      activity: activity.map(a => ({ _id: a._id, type: a.type, text: a.text, actorName: a.actorName ?? null, at: a.at })),
      documents: documents.sort((a, b) => b.updatedAt - a.updatedAt).map(d => toPersonDocument(d, now)),
      otherApplications: otherJobs.map(({ a, job: j }) => ({
        _id: a._id,
        jobTitle: j?.title ?? 'Unknown job',
        stage: a.stage,
        status: a.status
      }))
    }
  }
})
