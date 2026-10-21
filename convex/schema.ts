import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'
import {
  activityType,
  applicationStatus,
  bonusStatus,
  candidateSource,
  careerSiteStatus,
  citation,
  decision,
  department,
  documentFolder,
  documentStatus,
  documentType,
  employeeStatus,
  employmentType,
  inboxKind,
  interviewStatus,
  interviewType,
  jobStatus,
  locationType,
  messageRole,
  metricKey,
  offerStatus,
  onboardingPhase,
  onboardingTaskKind,
  ownerTeam,
  recommendation,
  referralOutcome,
  signer,
  stage,
  stageCounts,
  timeOffStatus,
  timeOffType,
  workMode
} from './lib/validators'

/**
 * TalentIQ data model. Single tenant: every signed-in user sees the same company data.
 * All dates are epoch milliseconds. Day-level dates are midnight in the org timezone
 * (see `convex/lib/time.ts`).
 */
export default defineSchema({
  /** People who sign in. Seeded HR users are linked to their employee record. */
  users: defineTable({
    name: v.string(),
    firstName: v.string(),
    email: v.optional(v.string()),
    title: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    /** Convex identity `tokenIdentifier` (issuer + subject). */
    tokenIdentifier: v.optional(v.string()),
    /** Clerk user ID (`sub` claim). The seeded current user uses `seed`. */
    subject: v.optional(v.string()),
    employeeId: v.optional(v.id('employees'))
  })
    .index('by_tokenIdentifier', ['tokenIdentifier'])
    .index('by_subject', ['subject']),

  employees: defineTable({
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    title: v.string(),
    department,
    location: v.string(),
    workMode,
    employmentType,
    managerId: v.optional(v.id('employees')),
    startDate: v.number(),
    endDate: v.optional(v.number()),
    status: employeeStatus,
    contractEndDate: v.optional(v.number()),
    probationEndDate: v.optional(v.number()),
    permitType: v.optional(v.union(v.literal('Work permit'), v.literal('Visa'))),
    permitExpiresAt: v.optional(v.number())
  })
    .index('by_name', ['name'])
    .index('by_status_and_name', ['status', 'name'])
    .index('by_department_and_status', ['department', 'status'])
    .index('by_startDate', ['startDate'])
    .index('by_endDate', ['endDate'])
    .index('by_contractEndDate', ['contractEndDate'])
    .index('by_probationEndDate', ['probationEndDate'])
    .index('by_permitExpiresAt', ['permitExpiresAt'])
    .searchIndex('search_name', { searchField: 'name', filterFields: ['status', 'department'] }),

  jobs: defineTable({
    title: v.string(),
    department,
    location: v.string(),
    workMode,
    employmentType,
    status: jobStatus,
    hiringManagerId: v.id('employees'),
    recruiterId: v.optional(v.id('users')),
    postedAt: v.optional(v.number()),
    closedAt: v.optional(v.number()),
    /** Target days to fill. Drives the On track / Slow / Overdue health. */
    targetDays: v.number(),
    /** Seats still to fill. */
    headcount: v.number(),
    /** Applicants who reached each stage (cumulative funnel). Kept in sync by `candidates.moveStage`. */
    stageCounts,
    /** Applicants not yet reviewed. */
    newApplicants: v.number(),
    /** Applicants received in the last 7 days. */
    applicantsThisWeek: v.number(),
    referralBonus: v.optional(v.number()),
    salaryMin: v.optional(v.number()),
    salaryMax: v.optional(v.number()),
    currency: v.optional(v.string()),
    publishedOnCareerSite: v.boolean()
  })
    .index('by_status', ['status'])
    .searchIndex('search_title', { searchField: 'title', filterFields: ['status', 'department'] }),

  candidates: defineTable({
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    location: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    currentRole: v.optional(v.string()),
    currentCompany: v.optional(v.string()),
    experienceYears: v.optional(v.number()),
    expectedPay: v.optional(v.string()),
    noticePeriod: v.optional(v.string()),
    source: candidateSource,
    referrerId: v.optional(v.id('employees')),
    agencyName: v.optional(v.string()),
    skills: v.array(v.string())
  })
    .index('by_email', ['email'])
    .index('by_source', ['source'])
    .searchIndex('search_name', { searchField: 'name' }),

  applications: defineTable({
    candidateId: v.id('candidates'),
    jobId: v.id('jobs'),
    stage,
    status: applicationStatus,
    appliedAt: v.number(),
    stageEnteredAt: v.number(),
    stageHistory: v.array(v.object({ stage, enteredAt: v.number() })),
    finalRound: v.boolean(),
    nextAction: v.optional(v.string()),
    nextActionDueAt: v.optional(v.number())
  })
    .index('by_job_and_stage', ['jobId', 'stage'])
    .index('by_candidate', ['candidateId'])
    .index('by_appliedAt', ['appliedAt']),

  scorecards: defineTable({
    applicationId: v.id('applications'),
    candidateId: v.id('candidates'),
    interviewId: v.optional(v.id('interviews')),
    interviewerId: v.id('employees'),
    round: v.string(),
    submittedAt: v.number(),
    /** 1 to 5. */
    rating: v.number(),
    recommendation,
    summary: v.optional(v.string())
  })
    .index('by_application', ['applicationId'])
    .index('by_candidate', ['candidateId'])
    .index('by_interview', ['interviewId']),

  /** Calendar events: interviews, offer calls and onboarding sessions. */
  interviews: defineTable({
    type: interviewType,
    title: v.string(),
    candidateId: v.optional(v.id('candidates')),
    applicationId: v.optional(v.id('applications')),
    jobId: v.optional(v.id('jobs')),
    employeeId: v.optional(v.id('employees')),
    start: v.number(),
    end: v.number(),
    interviewerIds: v.array(v.id('employees')),
    location: v.string(),
    locationType,
    status: interviewStatus
  })
    .index('by_start', ['start'])
    .index('by_candidate_and_start', ['candidateId', 'start']),

  offers: defineTable({
    applicationId: v.id('applications'),
    candidateId: v.id('candidates'),
    jobId: v.id('jobs'),
    salary: v.number(),
    currency: v.string(),
    bandMin: v.number(),
    bandMax: v.number(),
    startDate: v.number(),
    hiringManagerId: v.id('employees'),
    requestedById: v.optional(v.id('users')),
    approverId: v.optional(v.id('users')),
    status: offerStatus,
    createdAt: v.number(),
    decidedAt: v.optional(v.number()),
    decidedById: v.optional(v.id('users')),
    acceptedAt: v.optional(v.number())
  })
    .index('by_status', ['status'])
    .index('by_application', ['applicationId'])
    .index('by_candidate', ['candidateId']),

  /** Candidate activity feed. */
  activities: defineTable({
    candidateId: v.id('candidates'),
    applicationId: v.optional(v.id('applications')),
    type: activityType,
    text: v.string(),
    actorName: v.optional(v.string()),
    actorUserId: v.optional(v.id('users')),
    at: v.number()
  }).index('by_candidate_and_at', ['candidateId', 'at']),

  onboardings: defineTable({
    name: v.string(),
    title: v.string(),
    department,
    employeeId: v.optional(v.id('employees')),
    candidateId: v.optional(v.id('candidates')),
    applicationId: v.optional(v.id('applications')),
    startDate: v.number(),
    managerId: v.id('employees'),
    buddyId: v.optional(v.id('employees')),
    startedAt: v.number(),
    completedAt: v.optional(v.number())
  })
    .index('by_startDate', ['startDate'])
    .index('by_application', ['applicationId']),

  onboardingTasks: defineTable({
    onboardingId: v.id('onboardings'),
    title: v.string(),
    phase: onboardingPhase,
    ownerTeam,
    ownerId: v.optional(v.id('employees')),
    dueDate: v.number(),
    kind: onboardingTaskKind,
    done: v.boolean(),
    doneAt: v.optional(v.number()),
    doneById: v.optional(v.id('users')),
    order: v.number()
  })
    .index('by_onboarding_and_order', ['onboardingId', 'order'])
    .index('by_done_and_dueDate', ['done', 'dueDate']),

  timeOffRequests: defineTable({
    employeeId: v.id('employees'),
    type: timeOffType,
    /** First and last day off (midnight, org timezone), inclusive. */
    startDate: v.number(),
    endDate: v.number(),
    days: v.number(),
    status: timeOffStatus,
    note: v.optional(v.string()),
    requestedAt: v.number(),
    decidedById: v.optional(v.id('users')),
    decidedAt: v.optional(v.number()),
    declineReason: v.optional(v.string())
  })
    .index('by_status_and_startDate', ['status', 'startDate'])
    .index('by_employee_and_startDate', ['employeeId', 'startDate'])
    .index('by_startDate', ['startDate']),

  /** Team inbox. Items without a recipient are visible to every user. */
  inboxItems: defineTable({
    kind: inboxKind,
    title: v.string(),
    preview: v.string(),
    tag: v.optional(v.string()),
    createdAt: v.number(),
    recipientId: v.optional(v.id('users')),
    actorName: v.optional(v.string()),
    offerId: v.optional(v.id('offers')),
    timeOffRequestId: v.optional(v.id('timeOffRequests')),
    candidateId: v.optional(v.id('candidates')),
    applicationId: v.optional(v.id('applications')),
    employeeId: v.optional(v.id('employees')),
    jobId: v.optional(v.id('jobs')),
    documentId: v.optional(v.id('documents')),
    resolution: v.optional(decision),
    resolvedAt: v.optional(v.number()),
    resolvedById: v.optional(v.id('users'))
  }).index('by_createdAt', ['createdAt']),

  /** Per-user read state for inbox items. */
  inboxReads: defineTable({
    userId: v.id('users'),
    itemId: v.id('inboxItems'),
    readAt: v.number()
  })
    .index('by_user_and_item', ['userId', 'itemId']),

  comments: defineTable({
    inboxItemId: v.id('inboxItems'),
    authorId: v.id('users'),
    body: v.string(),
    createdAt: v.number()
  }).index('by_item_and_createdAt', ['inboxItemId', 'createdAt']),

  documents: defineTable({
    title: v.string(),
    type: documentType,
    folder: documentFolder,
    status: documentStatus,
    ownerId: v.optional(v.id('users')),
    employeeId: v.optional(v.id('employees')),
    candidateId: v.optional(v.id('candidates')),
    applicationId: v.optional(v.id('applications')),
    offerId: v.optional(v.id('offers')),
    /** Private file in Convex storage. URLs are only issued by `documents.getDownloadUrl`. */
    storageId: v.optional(v.id('_storage')),
    fileName: v.optional(v.string()),
    contentType: v.optional(v.string()),
    size: v.optional(v.number()),
    version: v.number(),
    template: v.optional(v.string()),
    sharedWithIds: v.array(v.id('users')),
    sentAt: v.optional(v.number()),
    sentById: v.optional(v.id('users')),
    dueAt: v.optional(v.number()),
    signedAt: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
    signers: v.array(signer),
    lastRemindedAt: v.optional(v.number()),
    uploadedById: v.optional(v.id('users')),
    updatedAt: v.number()
  })
    .index('by_folder', ['folder'])
    .index('by_status', ['status'])
    .index('by_sentAt', ['sentAt'])
    .index('by_signedAt', ['signedAt'])
    .index('by_expiresAt', ['expiresAt'])
    .index('by_employee', ['employeeId'])
    .index('by_candidate', ['candidateId'])
    .searchIndex('search_title', { searchField: 'title', filterFields: ['folder'] }),

  referrals: defineTable({
    referrerId: v.id('employees'),
    candidateName: v.string(),
    jobTitle: v.string(),
    candidateId: v.optional(v.id('candidates')),
    applicationId: v.optional(v.id('applications')),
    jobId: v.optional(v.id('jobs')),
    referredAt: v.number(),
    stage,
    outcome: referralOutcome,
    hiredAt: v.optional(v.number()),
    bonusAmount: v.number(),
    currency: v.string(),
    bonusCondition: v.string(),
    bonusStatus,
    paidAt: v.optional(v.number())
  })
    .index('by_referrer', ['referrerId'])
    .index('by_application', ['applicationId'])
    .index('by_outcome', ['outcome']),

  /** Career site settings (single row). */
  careerSite: defineTable({
    status: careerSiteStatus,
    url: v.string(),
    lastPublishedAt: v.number(),
    publishedById: v.optional(v.id('users')),
    checklist: v.array(v.object({ label: v.string(), done: v.boolean() }))
  }),

  /**
   * Pre-aggregated history for KPIs, sparklines and reports.
   * `period` is `YYYY-MM` for monthly values or `YYYY` for year-to-date totals.
   */
  metrics: defineTable({
    key: metricKey,
    period: v.string(),
    dimension: v.optional(v.string()),
    value: v.number()
  }).index('by_key_and_dimension_and_period', ['key', 'dimension', 'period']),

  conversations: defineTable({
    userId: v.id('users'),
    title: v.string(),
    updatedAt: v.number(),
    lastMessagePreview: v.optional(v.string())
  }).index('by_user_and_updatedAt', ['userId', 'updatedAt']),

  messages: defineTable({
    conversationId: v.id('conversations'),
    role: messageRole,
    content: v.string(),
    citations: v.optional(v.array(citation))
  }).index('by_conversation', ['conversationId'])
})
