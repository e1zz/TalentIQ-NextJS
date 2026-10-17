import { v, type Infer } from 'convex/values'

/**
 * Shared value validators and their TypeScript types.
 * Literal unions match the copy the UI shows, so labels can be rendered as-is.
 */

export const STAGES = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired'] as const
export const stage = v.union(
  v.literal('Applied'),
  v.literal('Screening'),
  v.literal('Interview'),
  v.literal('Offer'),
  v.literal('Hired')
)
export type Stage = Infer<typeof stage>

/** Funnel counters stored on each job: how many applicants reached each stage. */
export const stageCounts = v.object({
  applied: v.number(),
  screening: v.number(),
  interview: v.number(),
  offer: v.number(),
  hired: v.number()
})
export type StageCounts = Infer<typeof stageCounts>
export const STAGE_COUNT_KEYS: Record<Stage, keyof StageCounts> = {
  Applied: 'applied',
  Screening: 'screening',
  Interview: 'interview',
  Offer: 'offer',
  Hired: 'hired'
}

export const applicationStatus = v.union(v.literal('Active'), v.literal('Rejected'), v.literal('Withdrawn'))
export type ApplicationStatus = Infer<typeof applicationStatus>

export const candidateSource = v.union(
  v.literal('LinkedIn'),
  v.literal('Referral'),
  v.literal('Career site'),
  v.literal('Indeed'),
  v.literal('Agency')
)
export type CandidateSource = Infer<typeof candidateSource>

export const candidateTag = v.union(
  v.literal('Referral'),
  v.literal('Final round'),
  v.literal('Stale'),
  v.literal('Awaiting approval')
)
export type CandidateTag = Infer<typeof candidateTag>

export const DEPARTMENTS = ['Engineering', 'Product', 'Design', 'Data', 'Marketing', 'Sales', 'Finance', 'People'] as const
export const department = v.union(
  v.literal('Engineering'),
  v.literal('Product'),
  v.literal('Design'),
  v.literal('Data'),
  v.literal('Marketing'),
  v.literal('Sales'),
  v.literal('Finance'),
  v.literal('People')
)
export type Department = Infer<typeof department>

export const workMode = v.union(v.literal('Onsite'), v.literal('Hybrid'), v.literal('Remote'))
export type WorkMode = Infer<typeof workMode>

export const employmentType = v.union(
  v.literal('Full-time'),
  v.literal('Part-time'),
  v.literal('Contract'),
  v.literal('Internship')
)
export type EmploymentType = Infer<typeof employmentType>

export const jobStatus = v.union(v.literal('Open'), v.literal('Draft'), v.literal('On hold'), v.literal('Closed'))
export type JobStatus = Infer<typeof jobStatus>

/** Derived from days open vs. the job's target days to fill. */
export const jobHealth = v.union(v.literal('On track'), v.literal('Slow'), v.literal('Overdue'), v.literal('New'))
export type JobHealth = Infer<typeof jobHealth>

export const interviewType = v.union(
  v.literal('Phone screen'),
  v.literal('Interview'),
  v.literal('Panel'),
  v.literal('Offer call'),
  v.literal('Onboarding')
)
export type InterviewType = Infer<typeof interviewType>

export const interviewStatus = v.union(v.literal('Scheduled'), v.literal('Completed'), v.literal('Cancelled'))
export type InterviewStatus = Infer<typeof interviewStatus>

/** Badge for Home "Today's interviews": Done once completed, otherwise the short type. */
export const interviewBadge = v.union(
  v.literal('Done'),
  v.literal('Screen'),
  v.literal('Interview'),
  v.literal('Panel'),
  v.literal('Offer'),
  v.literal('Onboarding')
)
export type InterviewBadge = Infer<typeof interviewBadge>

export const locationType = v.union(v.literal('Video'), v.literal('Phone'), v.literal('Onsite'))
export type LocationType = Infer<typeof locationType>

export const recommendation = v.union(v.literal('Strong hire'), v.literal('Hire'), v.literal('No hire'))
export type Recommendation = Infer<typeof recommendation>

export const offerStatus = v.union(
  v.literal('Draft'),
  v.literal('Pending approval'),
  v.literal('Approved'),
  v.literal('Declined'),
  v.literal('Sent'),
  v.literal('Accepted'),
  v.literal('Rejected')
)
export type OfferStatus = Infer<typeof offerStatus>

export const activityType = v.union(
  v.literal('applied'),
  v.literal('stage_changed'),
  v.literal('note'),
  v.literal('email'),
  v.literal('interview_scheduled'),
  v.literal('scorecard'),
  v.literal('offer'),
  v.literal('document'),
  v.literal('referral')
)
export type ActivityType = Infer<typeof activityType>

export const employeeStatus = v.union(
  v.literal('Active'),
  v.literal('On leave'),
  v.literal('Onboarding'),
  v.literal('Offboarding'),
  v.literal('Left')
)
export type EmployeeStatus = Infer<typeof employeeStatus>

/** Tabs on the Employees screen. `Left` employees are excluded from every tab. */
export const employeeTab = v.union(
  v.literal('All'),
  v.literal('Active'),
  v.literal('On leave'),
  v.literal('Onboarding'),
  v.literal('Offboarding')
)
export type EmployeeTab = Infer<typeof employeeTab>

export const ONBOARDING_PHASES = ['Before day 1', 'Week 1', 'Month 1'] as const
export const onboardingPhase = v.union(v.literal('Before day 1'), v.literal('Week 1'), v.literal('Month 1'))
export type OnboardingPhase = Infer<typeof onboardingPhase>

export const ownerTeam = v.union(
  v.literal('People'),
  v.literal('IT'),
  v.literal('Manager'),
  v.literal('Finance'),
  v.literal('Buddy'),
  v.literal('New hire')
)
export type OwnerTeam = Infer<typeof ownerTeam>

/** Tags tasks the "Needs attention" panel tracks. */
export const onboardingTaskKind = v.union(
  v.literal('laptop'),
  v.literal('documents'),
  v.literal('day1_plan'),
  v.literal('accounts'),
  v.literal('other')
)
export type OnboardingTaskKind = Infer<typeof onboardingTaskKind>

export const onboardingTab = v.union(v.literal('In progress'), v.literal('Upcoming'), v.literal('Completed'))
export type OnboardingTab = Infer<typeof onboardingTab>

export const onboardingHealth = v.union(v.literal('At risk'), v.literal('On track'), v.literal('Not started'))
export type OnboardingHealth = Infer<typeof onboardingHealth>

export const timeOffType = v.union(v.literal('Vacation'), v.literal('Sick leave'), v.literal('Personal'))
export type TimeOffType = Infer<typeof timeOffType>

export const timeOffStatus = v.union(
  v.literal('Pending'),
  v.literal('Approved'),
  v.literal('Declined'),
  v.literal('Cancelled')
)
export type TimeOffStatus = Infer<typeof timeOffStatus>

/** Yearly allowance in days per time-off type. */
export const TIME_OFF_ALLOWANCE: Record<TimeOffType, number> = {
  Vacation: 20,
  'Sick leave': 10,
  Personal: 3
}

export const inboxKind = v.union(
  v.literal('Offer approval'),
  v.literal('Time off'),
  v.literal('Candidate message'),
  v.literal('Mention'),
  v.literal('Contract expiring'),
  v.literal('Job post')
)
export type InboxKind = Infer<typeof inboxKind>

export const inboxCategory = v.union(
  v.literal('Approvals'),
  v.literal('Candidates'),
  v.literal('Mentions'),
  v.literal('System')
)
export type InboxCategory = Infer<typeof inboxCategory>

export const inboxFilter = v.union(
  v.literal('All'),
  v.literal('Approvals'),
  v.literal('Candidates'),
  v.literal('Mentions'),
  v.literal('System')
)
export type InboxFilter = Infer<typeof inboxFilter>

export const INBOX_CATEGORY: Record<InboxKind, InboxCategory> = {
  'Offer approval': 'Approvals',
  'Time off': 'Approvals',
  'Candidate message': 'Candidates',
  Mention: 'Mentions',
  'Contract expiring': 'System',
  'Job post': 'System'
}

export const decision = v.union(v.literal('Approved'), v.literal('Declined'))
export type Decision = Infer<typeof decision>

export const documentType = v.union(
  v.literal('Employment contract'),
  v.literal('Contract renewal'),
  v.literal('Offer letter'),
  v.literal('NDA'),
  v.literal('Policy acknowledgement'),
  v.literal('Equipment agreement'),
  v.literal('Work permit'),
  v.literal('ID'),
  v.literal('Tax form'),
  v.literal('CV'),
  v.literal('Portfolio'),
  v.literal('Other')
)
export type DocumentType = Infer<typeof documentType>

export const documentFolder = v.union(
  v.literal('Contracts'),
  v.literal('Offer letters'),
  v.literal('Onboarding'),
  v.literal('Policies'),
  v.literal('Compliance'),
  v.literal('Candidate CVs')
)
export type DocumentFolder = Infer<typeof documentFolder>
export const DOCUMENT_FOLDERS = [
  'Contracts',
  'Offer letters',
  'Onboarding',
  'Policies',
  'Compliance',
  'Candidate CVs'
] as const

/** Stored document state. `Overdue` and `Expires in N days` are derived when read. */
export const documentStatus = v.union(
  v.literal('Draft'),
  v.literal('Waiting'),
  v.literal('Signed'),
  v.literal('Missing'),
  v.literal('Uploaded')
)
export type DocumentStatus = Infer<typeof documentStatus>

/** Signature status shown on the Documents screen. */
export const signatureStatus = v.union(v.literal('Waiting'), v.literal('Overdue'), v.literal('Signed'))
export type SignatureStatus = Infer<typeof signatureStatus>

/** Status shown next to a person's documents (employee panel, candidate profile). */
export const personDocumentStatus = v.union(
  v.literal('Signed'),
  v.literal('Waiting'),
  v.literal('Overdue'),
  v.literal('Expires soon'),
  v.literal('Expired'),
  v.literal('Missing'),
  v.literal('Uploaded'),
  v.literal('Draft')
)
export type PersonDocumentStatus = Infer<typeof personDocumentStatus>

export const signerStatus = v.union(v.literal('Signed'), v.literal('Waiting'), v.literal('Declined'))
export type SignerStatus = Infer<typeof signerStatus>

export const signer = v.object({
  name: v.string(),
  email: v.optional(v.string()),
  role: v.optional(v.string()),
  status: signerStatus,
  signedAt: v.optional(v.number())
})
export type Signer = Infer<typeof signer>

export const referralOutcome = v.union(v.literal('Active'), v.literal('Hired'), v.literal('Not selected'))
export type ReferralOutcome = Infer<typeof referralOutcome>

export const bonusStatus = v.union(
  v.literal('Pending'),
  v.literal('Eligible'),
  v.literal('Paid'),
  v.literal('Not eligible')
)
export type BonusStatus = Infer<typeof bonusStatus>

export const messageRole = v.union(v.literal('user'), v.literal('assistant'))
export type MessageRole = Infer<typeof messageRole>

export const citation = v.object({
  documentTitle: v.union(v.string(), v.null()),
  citedText: v.string(),
  startPage: v.optional(v.number()),
  endPage: v.optional(v.number())
})
export type Citation = Infer<typeof citation>

export const metricKey = v.union(
  v.literal('open_roles'),
  v.literal('active_candidates'),
  v.literal('time_to_hire_avg_days'),
  v.literal('time_to_hire_median_days'),
  v.literal('offer_acceptance_pct'),
  v.literal('cost_per_hire_usd'),
  v.literal('turnover_pct'),
  v.literal('headcount'),
  v.literal('hires_by_source'),
  v.literal('funnel'),
  v.literal('career_visitors'),
  v.literal('career_applications'),
  v.literal('career_avg_time_on_page_sec'),
  v.literal('career_traffic_source_pct')
)
export type MetricKey = Infer<typeof metricKey>

export const careerSiteStatus = v.union(v.literal('Live'), v.literal('Draft'), v.literal('Paused'))
export type CareerSiteStatus = Infer<typeof careerSiteStatus>

/** A KPI card: current value, change vs. last month and a sparkline series (oldest first). */
export const kpi = v.object({
  key: v.string(),
  label: v.string(),
  value: v.number(),
  unit: v.union(v.literal('count'), v.literal('days'), v.literal('percent'), v.literal('usd'), v.literal('seconds')),
  delta: v.number(),
  /** `up` is good for most metrics; for time to hire, cost and turnover, `down` is good. */
  goodDirection: v.union(v.literal('up'), v.literal('down')),
  series: v.array(v.object({ period: v.string(), value: v.number() }))
})
export type Kpi = Infer<typeof kpi>

/** A compact reference to an employee for display. */
export const employeeRef = v.object({
  _id: v.id('employees'),
  name: v.string(),
  title: v.string()
})
export type EmployeeRef = Infer<typeof employeeRef>

/** A compact reference to an app user for display. */
export const userRef = v.object({
  _id: v.id('users'),
  name: v.string(),
  title: v.optional(v.string())
})
export type UserRef = Infer<typeof userRef>
