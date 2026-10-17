import { v } from 'convex/values'
import type { Id } from './_generated/dataModel'
import { mutation, query } from './_generated/server'
import { invalid, notFound, requireIdentity, requireUser } from './lib/auth'
import { getEmployeesById, jobDaysOpen, metricValue, pct, refOrNull } from './lib/domain'
import { openJobs } from './lib/jobCards'
import { orgDate, orgYear, resolveNow } from './lib/time'
import { bonusStatus, department, employeeRef, stage, workMode } from './lib/validators'

const BONUS_CONDITION = 'Paid after the hire completes 90 days'

/** Referrals screen: KPIs, active referrals, top referrers and open roles to share. */
export const overview = query({
  args: { now: v.optional(v.number()) },
  returns: v.object({
    kpis: v.object({
      activeReferrals: v.number(),
      hiredYtd: v.number(),
      bonusesPaidYtd: v.number(),
      /** Share of all hires this year that came from referrals. */
      referralShareOfHiresPct: v.number(),
      currency: v.string()
    }),
    active: v.array(
      v.object({
        _id: v.id('referrals'),
        candidateId: v.union(v.id('candidates'), v.null()),
        candidateName: v.string(),
        jobId: v.union(v.id('jobs'), v.null()),
        jobTitle: v.string(),
        referrer: v.union(employeeRef, v.null()),
        stage,
        referredAt: v.number(),
        bonusAmount: v.number(),
        currency: v.string(),
        bonusCondition: v.string(),
        bonusStatus
      })
    ),
    topReferrers: v.array(
      v.object({
        referrer: employeeRef,
        department,
        referrals: v.number(),
        hires: v.number(),
        bonusEarned: v.number()
      })
    ),
    openRoles: v.array(
      v.object({
        _id: v.id('jobs'),
        title: v.string(),
        department,
        location: v.string(),
        workMode,
        referralBonus: v.number(),
        currency: v.string(),
        daysOpen: v.number()
      })
    )
  }),
  handler: async (ctx, args) => {
    await requireIdentity(ctx)
    const now = resolveNow(args.now)
    const year = orgYear(now)
    const yearStart = orgDate(year, 1, 1)
    const referrals = await ctx.db.query('referrals').take(2000)
    const people = await getEmployeesById(
      ctx,
      referrals.map(r => r.referrerId)
    )
    const active = referrals.filter(r => r.outcome === 'Active').sort((a, b) => b.referredAt - a.referredAt)
    const hiredYtd = referrals.filter(r => r.outcome === 'Hired' && (r.hiredAt ?? 0) >= yearStart)
    const bonusesPaidYtd = referrals
      .filter(r => r.bonusStatus === 'Paid' && (r.paidAt ?? 0) >= yearStart)
      .reduce((s, r) => s + r.bonusAmount, 0)
    let totalHires = 0
    for (const source of ['LinkedIn', 'Referral', 'Career site', 'Indeed', 'Agency']) {
      totalHires += (await metricValue(ctx, 'hires_by_source', String(year), source)) ?? 0
    }

    const byReferrer = new Map<Id<'employees'>, { referrals: number; hires: number; bonusEarned: number }>()
    for (const r of referrals) {
      const row = byReferrer.get(r.referrerId) ?? { referrals: 0, hires: 0, bonusEarned: 0 }
      row.referrals++
      if (r.outcome === 'Hired') row.hires++
      if (r.bonusStatus === 'Paid') row.bonusEarned += r.bonusAmount
      byReferrer.set(r.referrerId, row)
    }
    const topReferrers = [...byReferrer.entries()]
      .flatMap(([id, stats]) => {
        const employee = people.get(id)
        return employee
          ? [{ referrer: { _id: employee._id, name: employee.name, title: employee.title }, department: employee.department, ...stats }]
          : []
      })
      .sort((a, b) => b.hires - a.hires || b.referrals - a.referrals || a.referrer.name.localeCompare(b.referrer.name))
      .slice(0, 5)

    const jobs = (await openJobs(ctx)).filter(j => j.referralBonus !== undefined && j.referralBonus > 0)

    return {
      kpis: {
        activeReferrals: active.length,
        hiredYtd: hiredYtd.length,
        bonusesPaidYtd,
        referralShareOfHiresPct: pct(hiredYtd.length, Math.max(totalHires, hiredYtd.length)),
        currency: 'USD'
      },
      active: active.map(r => ({
        _id: r._id,
        candidateId: r.candidateId ?? null,
        candidateName: r.candidateName,
        jobId: r.jobId ?? null,
        jobTitle: r.jobTitle,
        referrer: refOrNull(people, r.referrerId),
        stage: r.stage,
        referredAt: r.referredAt,
        bonusAmount: r.bonusAmount,
        currency: r.currency,
        bonusCondition: r.bonusCondition,
        bonusStatus: r.bonusStatus
      })),
      topReferrers,
      openRoles: jobs
        .sort((a, b) => (b.referralBonus ?? 0) - (a.referralBonus ?? 0) || a.title.localeCompare(b.title))
        .map(j => ({
          _id: j._id,
          title: j.title,
          department: j.department,
          location: j.location,
          workMode: j.workMode,
          referralBonus: j.referralBonus!,
          currency: j.currency ?? 'USD',
          daysOpen: jobDaysOpen(j, now)
        }))
    }
  }
})

/** Refers someone for an open job: creates the candidate, the application and the referral. */
export const refer = mutation({
  args: {
    jobId: v.id('jobs'),
    /** Defaults to the signed-in user's employee record. */
    referrerId: v.optional(v.id('employees')),
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    note: v.optional(v.string())
  },
  returns: v.object({
    candidateId: v.id('candidates'),
    applicationId: v.id('applications'),
    referralId: v.id('referrals')
  }),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    const name = args.name.trim()
    const email = args.email.trim().toLowerCase()
    if (!name || !email.includes('@')) throw invalid('Add the candidate’s name and a valid email.')
    const job = await ctx.db.get('jobs', args.jobId)
    if (!job) throw notFound('Job')
    if (job.status !== 'Open') throw invalid('Referrals are only open for open jobs.')
    const referrerId = args.referrerId ?? user.employeeId
    if (!referrerId) throw invalid('Choose who is making the referral.')
    const referrer = await ctx.db.get('employees', referrerId)
    if (!referrer) throw notFound('Referrer')
    const now = Date.now()

    const existing = await ctx.db
      .query('candidates')
      .withIndex('by_email', q => q.eq('email', email))
      .first()
    const candidateId =
      existing?._id ??
      (await ctx.db.insert('candidates', {
        name,
        email,
        phone: args.phone,
        linkedinUrl: args.linkedinUrl,
        source: 'Referral',
        referrerId,
        skills: []
      }))
    const applicationId = await ctx.db.insert('applications', {
      candidateId,
      jobId: job._id,
      stage: 'Applied',
      status: 'Active',
      appliedAt: now,
      stageEnteredAt: now,
      stageHistory: [{ stage: 'Applied', enteredAt: now }],
      finalRound: false,
      nextAction: 'Review referral',
      nextActionDueAt: now + 2 * 24 * 60 * 60 * 1000
    })
    await ctx.db.patch('jobs', job._id, {
      stageCounts: { ...job.stageCounts, applied: job.stageCounts.applied + 1 },
      newApplicants: job.newApplicants + 1,
      applicantsThisWeek: job.applicantsThisWeek + 1
    })
    const referralId = await ctx.db.insert('referrals', {
      referrerId,
      candidateName: existing?.name ?? name,
      jobTitle: job.title,
      candidateId,
      applicationId,
      jobId: job._id,
      referredAt: now,
      stage: 'Applied',
      outcome: 'Active',
      bonusAmount: job.referralBonus ?? 0,
      currency: job.currency ?? 'USD',
      bonusCondition: BONUS_CONDITION,
      bonusStatus: 'Pending'
    })
    await ctx.db.insert('activities', {
      candidateId,
      applicationId,
      type: 'referral',
      text: `Referred by ${referrer.name} for ${job.title}${args.note ? `: ${args.note.trim()}` : ''}`,
      actorName: user.name,
      actorUserId: user._id,
      at: now
    })
    return { candidateId, applicationId, referralId }
  }
})
