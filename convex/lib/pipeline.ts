import type { Doc } from '../_generated/dataModel'
import type { MutationCtx } from '../_generated/server'
import { stageIndex } from './domain'
import { STAGE_COUNT_KEYS, STAGES, type Stage } from './validators'

/**
 * Moves an application to `stage` and keeps everything that depends on it in sync:
 * the job's cumulative funnel counters, the referral record and the activity feed.
 */
export async function changeStage(
  ctx: MutationCtx,
  application: Doc<'applications'>,
  stage: Stage,
  actor: Doc<'users'>
): Promise<void> {
  if (application.stage === stage) return
  const now = Date.now()
  const from = stageIndex(application.stage)
  const to = stageIndex(stage)

  const job = await ctx.db.get('jobs', application.jobId)
  if (job) {
    const counts = { ...job.stageCounts }
    const [lo, hi, delta] = to > from ? [from + 1, to, 1] : [to + 1, from, -1]
    for (let i = lo; i <= hi; i++) {
      const key = STAGE_COUNT_KEYS[STAGES[i]]
      counts[key] = Math.max(0, counts[key] + delta)
    }
    await ctx.db.patch('jobs', job._id, { stageCounts: counts })
  }

  await ctx.db.patch('applications', application._id, {
    stage,
    stageEnteredAt: now,
    stageHistory: [
      ...application.stageHistory.filter(h => stageIndex(h.stage) < to),
      { stage, enteredAt: now }
    ],
    finalRound: stage === 'Interview' ? application.finalRound : false
  })

  const referral = await ctx.db
    .query('referrals')
    .withIndex('by_application', q => q.eq('applicationId', application._id))
    .first()
  if (referral) {
    const hired = stage === 'Hired'
    await ctx.db.patch('referrals', referral._id, {
      stage,
      outcome: hired ? 'Hired' : 'Active',
      hiredAt: hired ? now : undefined,
      bonusStatus: hired ? 'Pending' : referral.bonusStatus
    })
  }

  await ctx.db.insert('activities', {
    candidateId: application.candidateId,
    applicationId: application._id,
    type: 'stage_changed',
    text: `Moved from ${application.stage} to ${stage}`,
    actorName: actor.name,
    actorUserId: actor._id,
    at: now
  })
}
