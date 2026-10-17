import { v } from 'convex/values'
import type { WithoutSystemFields } from 'convex/server'
import type { Doc, Id, TableNames } from './_generated/dataModel'
import { internalMutation, type MutationCtx } from './_generated/server'
import { DAY, HOUR, MINUTE, monthKey, orgYear, previousMonthKey, startOfDay } from './lib/time'
import {
  STAGE_COUNT_KEYS,
  STAGES,
  type CandidateSource,
  type Department,
  type Stage,
  type StageCounts
} from './lib/validators'

/**
 * Demo data for every screen. Run against a dev deployment:
 *
 *   npx convex run seed:run                  # no-op if data exists
 *   npx convex run seed:run '{"reset": true}' # wipe app tables, then seed
 *
 * Dates are relative to when the seed runs, so "today", "this week" and "expiring in
 * 30 days" stay meaningful. Signed-in Clerk users are not touched by `reset`.
 */

const APP_TABLES = [
  'messages',
  'conversations',
  'comments',
  'inboxReads',
  'inboxItems',
  'activities',
  'scorecards',
  'offers',
  'interviews',
  'referrals',
  'documents',
  'onboardingTasks',
  'onboardings',
  'timeOffRequests',
  'applications',
  'candidates',
  'jobs',
  'careerSite',
  'metrics',
  'employees'
] as const satisfies readonly TableNames[]

export const run = internalMutation({
  args: { reset: v.optional(v.boolean()) },
  returns: v.string(),
  handler: async (ctx, args) => {
    if (args.reset) {
      for (const table of APP_TABLES) {
        for await (const row of ctx.db.query(table)) await ctx.db.delete(table, row._id)
      }
      // Seeded HR users are recreated; real Clerk users keep their rows.
      for await (const user of ctx.db.query('users')) {
        if (user.subject?.startsWith('seed')) await ctx.db.delete('users', user._id)
        else if (user.employeeId) await ctx.db.patch('users', user._id, { employeeId: undefined })
      }
    } else if (await ctx.db.query('employees').first()) {
      return 'Data already exists. Pass {"reset": true} to reseed.'
    }
    const counts = await seed(ctx, Date.now())
    return `Seeded ${Object.entries(counts)
      .map(([table, n]) => `${n} ${table}`)
      .join(', ')}.`
  }
})

// Deterministic pseudo-random numbers so every seed looks the same.
function rng(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

const EMPLOYEES: [string, string, Department, string][] = [
  ['Maria Lopez', 'Head of People', 'People', 'Mexico City'],
  ['Daniel Kim', 'Talent Acquisition Lead', 'People', 'Mexico City'],
  ['Priya Shah', 'HR Business Partner', 'People', 'Austin'],
  ['Tom Becker', 'VP Engineering', 'Engineering', 'Berlin'],
  ['Aisha Bello', 'Engineering Manager', 'Engineering', 'Mexico City'],
  ['Lucas Moreau', 'Senior Backend Engineer', 'Engineering', 'Remote'],
  ['Sofia Rossi', 'Frontend Engineer', 'Engineering', 'Mexico City'],
  ['Kenji Tanaka', 'Staff Engineer', 'Engineering', 'Remote'],
  ['Emma Wilson', 'Platform Engineer', 'Engineering', 'Austin'],
  ['Carlos Mendez', 'QA Engineer', 'Engineering', 'Guadalajara'],
  ['Hannah Park', 'Head of Product', 'Product', 'Austin'],
  ['Omar Haddad', 'Product Manager', 'Product', 'Mexico City'],
  ['Lena Fischer', 'Product Manager', 'Product', 'Berlin'],
  ['Grace Liu', 'Design Lead', 'Design', 'Remote'],
  ['Mateo Garcia', 'Product Designer', 'Design', 'Mexico City'],
  ['Zoe Martin', 'UX Researcher', 'Design', 'Remote'],
  ['Ravi Patel', 'Data Lead', 'Data', 'Austin'],
  ['Elena Petrova', 'Data Scientist', 'Data', 'Remote'],
  ['Noah Brown', 'Analytics Engineer', 'Data', 'Mexico City'],
  ['Chloe Dubois', 'Marketing Director', 'Marketing', 'Berlin'],
  ['Diego Ruiz', 'Content Marketer', 'Marketing', 'Mexico City'],
  ['Mia Johnson', 'Growth Marketer', 'Marketing', 'Austin'],
  ['James Carter', 'VP Sales', 'Sales', 'Austin'],
  ['Valentina Cruz', 'Account Executive', 'Sales', 'Mexico City'],
  ['Ben Thompson', 'Account Executive', 'Sales', 'Austin'],
  ['Isabel Torres', 'Sales Development Rep', 'Sales', 'Guadalajara'],
  ['Ahmed Nasser', 'Finance Manager', 'Finance', 'Mexico City'],
  ['Laura Schmidt', 'Accountant', 'Finance', 'Berlin'],
  ['Pedro Alvarez', 'Payroll Specialist', 'Finance', 'Mexico City'],
  ['Nina Kowalski', 'People Operations', 'People', 'Remote']
]

const MANAGER_BY_DEPT: Record<Department, string> = {
  People: 'Maria Lopez',
  Engineering: 'Tom Becker',
  Product: 'Hannah Park',
  Design: 'Grace Liu',
  Data: 'Ravi Patel',
  Marketing: 'Chloe Dubois',
  Sales: 'James Carter',
  Finance: 'Ahmed Nasser'
}

const JOBS: {
  title: string
  department: Department
  location: string
  workMode: 'Onsite' | 'Hybrid' | 'Remote'
  status: 'Open' | 'Draft' | 'On hold' | 'Closed'
  manager: string
  daysOpen: number
  targetDays: number
  salary: [number, number]
  bonus?: number
}[] = [
  { title: 'Senior Frontend Engineer', department: 'Engineering', location: 'Mexico City', workMode: 'Hybrid', status: 'Open', manager: 'Aisha Bello', daysOpen: 38, targetDays: 45, salary: [70000, 95000], bonus: 2000 },
  { title: 'Backend Engineer, Payments', department: 'Engineering', location: 'Remote', workMode: 'Remote', status: 'Open', manager: 'Tom Becker', daysOpen: 61, targetDays: 45, salary: [75000, 100000], bonus: 2000 },
  { title: 'Product Designer', department: 'Design', location: 'Mexico City', workMode: 'Hybrid', status: 'Open', manager: 'Grace Liu', daysOpen: 22, targetDays: 40, salary: [55000, 75000], bonus: 1500 },
  { title: 'Data Scientist', department: 'Data', location: 'Austin', workMode: 'Hybrid', status: 'Open', manager: 'Ravi Patel', daysOpen: 47, targetDays: 50, salary: [90000, 120000], bonus: 2000 },
  { title: 'Account Executive', department: 'Sales', location: 'Austin', workMode: 'Onsite', status: 'Open', manager: 'James Carter', daysOpen: 15, targetDays: 30, salary: [60000, 80000], bonus: 1000 },
  { title: 'Product Manager, Platform', department: 'Product', location: 'Berlin', workMode: 'Hybrid', status: 'Open', manager: 'Hannah Park', daysOpen: 4, targetDays: 45, salary: [85000, 110000], bonus: 1500 },
  { title: 'Growth Marketer', department: 'Marketing', location: 'Remote', workMode: 'Remote', status: 'On hold', manager: 'Chloe Dubois', daysOpen: 70, targetDays: 40, salary: [50000, 70000] },
  { title: 'Financial Analyst', department: 'Finance', location: 'Mexico City', workMode: 'Onsite', status: 'Draft', manager: 'Ahmed Nasser', daysOpen: 0, targetDays: 35, salary: [45000, 60000] }
]

const FIRST = ['Alex', 'Sam', 'Jordan', 'Taylor', 'Riley', 'Morgan', 'Casey', 'Jamie', 'Avery', 'Quinn', 'Drew', 'Rowan', 'Camila', 'Andres', 'Fatima', 'Yuki', 'Marco', 'Ines', 'Leo', 'Sara', 'Ivan', 'Nora', 'Hugo', 'Ana', 'Felix', 'Julia', 'Tariq', 'Lucia', 'Erik', 'Maya', 'Pablo', 'Amara']
const LAST = ['Rivera', 'Chen', 'Novak', 'Okafor', 'Silva', 'Hughes', 'Ramos', 'Ivanova', 'Baker', 'Singh', 'Costa', 'Nguyen', 'Herrera', 'Muller', 'Ali', 'Sato', 'Romero', 'Larsen', 'Vega', 'Adams']
const SKILLS: Record<Department, string[]> = {
  Engineering: ['TypeScript', 'React', 'Node.js', 'Go', 'PostgreSQL', 'AWS', 'Kubernetes'],
  Design: ['Figma', 'Design systems', 'Prototyping', 'User research'],
  Data: ['Python', 'SQL', 'dbt', 'Machine learning', 'Statistics'],
  Sales: ['B2B SaaS', 'Salesforce', 'Negotiation', 'Pipeline management'],
  Product: ['Roadmapping', 'Discovery', 'Analytics', 'APIs'],
  Marketing: ['SEO', 'Paid acquisition', 'Lifecycle', 'Content'],
  Finance: ['FP&A', 'Excel', 'NetSuite', 'Forecasting'],
  People: ['Recruiting', 'HRIS', 'Employee relations']
}
const SOURCES: CandidateSource[] = ['LinkedIn', 'Career site', 'Referral', 'Indeed', 'Agency', 'LinkedIn', 'Career site']

async function seed(ctx: MutationCtx, now: number): Promise<Record<string, number>> {
  const random = rng(42)
  const pick = <T,>(xs: readonly T[]) => xs[Math.floor(random() * xs.length)]
  const today = startOfDay(now)
  const at = (days: number, hour = 10, minute = 0) => today + days * DAY + hour * HOUR + minute * MINUTE
  const counts: Record<string, number> = {}
  const count = (table: string) => (counts[table] = (counts[table] ?? 0) + 1)

  // Employees
  const emp: Record<string, Id<'employees'>> = {}
  for (const [i, [name, title, department, location]] of EMPLOYEES.entries()) {
    const status = i === 6 ? 'On leave' : i === 24 ? 'Offboarding' : 'Active'
    emp[name] = await ctx.db.insert('employees', {
      name,
      email: `${name.toLowerCase().replace(/\s+/g, '.')}@talentiq.dev`,
      phone: `+52 55 ${String(1000 + i * 37).slice(0, 4)} ${String(2000 + i * 53).slice(0, 4)}`,
      title,
      department,
      location,
      workMode: location === 'Remote' ? 'Remote' : i % 3 === 0 ? 'Onsite' : 'Hybrid',
      employmentType: i === 9 || i === 28 ? 'Contract' : 'Full-time',
      startDate: today - (120 + ((i * 97) % 1400)) * DAY,
      endDate: status === 'Offboarding' ? at(12, 0) : undefined,
      status,
      contractEndDate: i === 9 ? at(18, 0) : i === 28 ? at(26, 0) : undefined,
      probationEndDate: i === 18 ? at(9, 0) : undefined,
      permitType: i === 5 ? 'Work permit' : i === 17 ? 'Visa' : undefined,
      permitExpiresAt: i === 5 ? at(21, 0) : i === 17 ? at(140, 0) : undefined
    })
    count('employees')
  }
  for (const [name, , department] of EMPLOYEES) {
    const manager = MANAGER_BY_DEPT[department]
    if (manager !== name) await ctx.db.patch('employees', emp[name], { managerId: emp[manager] })
  }

  // HR users (the people who approve and send things). Real sign-ins get their own rows.
  const hrUser = async (name: string, title: string, subject: string) => {
    count('users')
    return await ctx.db.insert('users', {
      name,
      firstName: name.split(' ')[0],
      email: `${name.toLowerCase().replace(/\s+/g, '.')}@talentiq.dev`,
      title,
      subject,
      employeeId: emp[name]
    })
  }
  const maria = await hrUser('Maria Lopez', 'Head of People', 'seed')
  const daniel = await hrUser('Daniel Kim', 'Talent Acquisition Lead', 'seed-daniel')
  const priya = await hrUser('Priya Shah', 'HR Business Partner', 'seed-priya')

  // Jobs (stage counts are filled in after applications)
  const jobIds: Id<'jobs'>[] = []
  for (const job of JOBS) {
    jobIds.push(
      await ctx.db.insert('jobs', {
        title: job.title,
        department: job.department,
        location: job.location,
        workMode: job.workMode,
        employmentType: 'Full-time',
        status: job.status,
        hiringManagerId: emp[job.manager],
        recruiterId: job.department === 'Engineering' || job.department === 'Data' ? daniel : priya,
        postedAt: job.status === 'Draft' ? undefined : today - job.daysOpen * DAY,
        targetDays: job.targetDays,
        headcount: job.title.startsWith('Account') ? 2 : 1,
        stageCounts: { applied: 0, screening: 0, interview: 0, offer: 0, hired: 0 },
        newApplicants: 0,
        applicantsThisWeek: 0,
        referralBonus: job.bonus,
        salaryMin: job.salary[0],
        salaryMax: job.salary[1],
        currency: 'USD',
        publishedOnCareerSite: job.status === 'Open'
      })
    )
    count('jobs')
  }

  // Candidates and applications. Earlier stages get more people, like a real funnel.
  const stagePlan: Stage[] = ['Applied', 'Applied', 'Applied', 'Screening', 'Screening', 'Interview', 'Interview', 'Offer']
  type App = { id: Id<'applications'>; candidateId: Id<'candidates'>; jobIndex: number; stage: Stage; name: string }
  const apps: App[] = []
  const referrers = ['Sofia Rossi', 'Kenji Tanaka', 'Omar Haddad', 'Noah Brown', 'Valentina Cruz', 'Mateo Garcia']
  let n = 0
  for (const [jobIndex, job] of JOBS.entries()) {
    if (job.status === 'Draft') continue
    const perJob = job.status === 'On hold' ? 3 : stagePlan.length
    for (let k = 0; k < perJob; k++) {
      const name = `${FIRST[n % FIRST.length]} ${LAST[(n * 7) % LAST.length]}`
      const source = n % 9 === 4 ? 'Referral' : pick(SOURCES)
      const candidateId = await ctx.db.insert('candidates', {
        name,
        email: `${name.toLowerCase().replace(/\s+/g, '.')}${n}@example.com`,
        phone: `+1 512 555 ${String(1000 + n * 13).slice(0, 4)}`,
        location: pick(['Mexico City', 'Austin', 'Berlin', 'Remote', 'Guadalajara', 'Madrid']),
        linkedinUrl: `https://www.linkedin.com/in/${name.toLowerCase().replace(/\s+/g, '-')}`,
        currentRole: job.title.replace(/^Senior /, ''),
        currentCompany: pick(['Globex', 'Initech', 'Hooli', 'Stark Industries', 'Wayne Tech', 'Umbrella', 'Acme']),
        experienceYears: 2 + Math.floor(random() * 10),
        expectedPay: `$${Math.round((job.salary[0] + random() * (job.salary[1] - job.salary[0])) / 1000)}k`,
        noticePeriod: pick(['2 weeks', '1 month', 'Immediate', '6 weeks']),
        source,
        referrerId: source === 'Referral' ? emp[referrers[n % referrers.length]] : undefined,
        agencyName: source === 'Agency' ? 'Northstar Talent' : undefined,
        skills: SKILLS[job.department].slice(0, 3 + (n % 2))
      })
      count('candidates')
      const stage = job.status === 'On hold' ? 'Screening' : stagePlan[k]
      const stageIdx = STAGES.indexOf(stage)
      const appliedAt = now - (2 + Math.floor(random() * Math.max(job.daysOpen - 2, 3))) * DAY
      const history = STAGES.slice(0, stageIdx + 1).map((s, i) => ({
        stage: s,
        enteredAt: appliedAt + i * Math.max(1, Math.floor((now - appliedAt) / (stageIdx + 2)))
      }))
      const stageEnteredAt = history.at(-1)!.enteredAt
      const id = await ctx.db.insert('applications', {
        candidateId,
        jobId: jobIds[jobIndex],
        stage,
        status: k === 2 && jobIndex % 2 === 0 ? 'Rejected' : 'Active',
        appliedAt,
        stageEnteredAt,
        stageHistory: history,
        finalRound: stage === 'Interview' && k === 6,
        nextAction:
          stage === 'Applied' ? 'Review application' : stage === 'Screening' ? 'Schedule phone screen' : stage === 'Interview' ? 'Collect scorecards' : 'Get offer approved',
        nextActionDueAt: now + ((k % 4) - 1) * DAY
      })
      count('applications')
      apps.push({ id, candidateId, jobIndex, stage, name })
      await ctx.db.insert('activities', { candidateId, applicationId: id, type: 'applied', text: `Applied for ${job.title}`, actorName: name, at: appliedAt })
      count('activities')
      for (const h of history.slice(1)) {
        await ctx.db.insert('activities', { candidateId, applicationId: id, type: 'stage_changed', text: `Moved to ${h.stage}`, actorName: 'Daniel Kim', actorUserId: daniel, at: h.enteredAt })
        count('activities')
      }
      n++
    }
  }

  // Job funnel counters (cumulative: an Interview applicant also counts as Applied and Screening)
  for (const [jobIndex, jobId] of jobIds.entries()) {
    const stageCounts: StageCounts = { applied: 0, screening: 0, interview: 0, offer: 0, hired: 0 }
    const jobApps = apps.filter(a => a.jobIndex === jobIndex)
    for (const a of jobApps) {
      for (const s of STAGES.slice(0, STAGES.indexOf(a.stage) + 1)) stageCounts[STAGE_COUNT_KEYS[s]]++
    }
    const recent = await Promise.all(jobApps.map(a => ctx.db.get('applications', a.id)))
    await ctx.db.patch('jobs', jobId, {
      stageCounts,
      newApplicants: jobApps.filter(a => a.stage === 'Applied').length,
      applicantsThisWeek: recent.filter(a => a && a.appliedAt >= now - 7 * DAY).length
    })
  }

  // Interviews, scorecards and calendar events across this week and next
  const interviewers = ['Aisha Bello', 'Kenji Tanaka', 'Grace Liu', 'Ravi Patel', 'Hannah Park', 'James Carter']
  let slot = 0
  for (const a of apps.filter(a => a.stage === 'Screening' || a.stage === 'Interview')) {
    const job = JOBS[a.jobIndex]
    const dayOffset = (slot % 9) - 2
    const hour = 9 + (slot % 4) * 2
    const start = at(dayOffset, hour, slot % 2 === 0 ? 0 : 30)
    const done = start + HOUR < now
    const type = a.stage === 'Screening' ? 'Phone screen' : slot % 3 === 0 ? 'Panel' : 'Interview'
    const interviewer = emp[interviewers[slot % interviewers.length]]
    const interviewId = await ctx.db.insert('interviews', {
      type,
      title: `${type}: ${a.name}`,
      candidateId: a.candidateId,
      applicationId: a.id,
      jobId: jobIds[a.jobIndex],
      start,
      end: start + (type === 'Panel' ? 90 : type === 'Phone screen' ? 30 : 60) * MINUTE,
      interviewerIds: type === 'Panel' ? [interviewer, emp[MANAGER_BY_DEPT[job.department]]] : [interviewer],
      location: type === 'Phone screen' ? 'Phone' : slot % 2 ? 'Google Meet' : 'HQ, Room 3B',
      locationType: type === 'Phone screen' ? 'Phone' : slot % 2 ? 'Video' : 'Onsite',
      status: done ? 'Completed' : 'Scheduled'
    })
    count('interviews')
    if (done) {
      const rating = 3 + (slot % 3)
      await ctx.db.insert('scorecards', {
        applicationId: a.id,
        candidateId: a.candidateId,
        interviewId,
        interviewerId: interviewer,
        round: type,
        submittedAt: start + 2 * HOUR,
        rating,
        recommendation: rating >= 5 ? 'Strong hire' : rating === 4 ? 'Hire' : 'No hire',
        summary: rating >= 4 ? 'Strong fundamentals and clear communication.' : 'Gaps in system design depth.'
      })
      count('scorecards')
    }
    slot++
  }
  // Offer calls and onboarding sessions on the calendar
  await ctx.db.insert('interviews', {
    type: 'Onboarding',
    title: 'New hire orientation',
    start: at(1, 9),
    end: at(1, 11),
    interviewerIds: [emp['Nina Kowalski']],
    location: 'HQ, Townhall',
    locationType: 'Onsite',
    status: 'Scheduled'
  })
  count('interviews')

  // Offers: one waiting on approval, one sent, one accepted
  const offerApps = apps.filter(a => a.stage === 'Offer')
  const offerIds: Id<'offers'>[] = []
  for (const [i, a] of offerApps.entries()) {
    const job = JOBS[a.jobIndex]
    const status = i === 0 ? 'Pending approval' : i === 1 ? 'Sent' : i === 2 ? 'Accepted' : 'Approved'
    const salary = Math.round((job.salary[0] + job.salary[1]) / 2 / 1000) * 1000
    const id = await ctx.db.insert('offers', {
      applicationId: a.id,
      candidateId: a.candidateId,
      jobId: jobIds[a.jobIndex],
      salary,
      currency: 'USD',
      bandMin: job.salary[0],
      bandMax: job.salary[1],
      startDate: at(21 + i * 7, 0),
      hiringManagerId: emp[job.manager],
      requestedById: daniel,
      approverId: maria,
      status,
      createdAt: now - (i + 1) * DAY,
      decidedAt: status === 'Pending approval' ? undefined : now - i * HOUR * 6,
      decidedById: status === 'Pending approval' ? undefined : maria,
      acceptedAt: status === 'Accepted' ? now - 3 * HOUR : undefined
    })
    offerIds.push(id)
    count('offers')
    await ctx.db.insert('activities', { candidateId: a.candidateId, applicationId: a.id, type: 'offer', text: `Offer ${status.toLowerCase()}: $${salary.toLocaleString('en-US')}`, actorName: 'Daniel Kim', actorUserId: daniel, at: now - (i + 1) * DAY })
    count('activities')
    if (i === 0) {
      await ctx.db.insert('interviews', {
        type: 'Offer call',
        title: `Offer call: ${a.name}`,
        candidateId: a.candidateId,
        applicationId: a.id,
        jobId: jobIds[a.jobIndex],
        start: at(0, 16),
        end: at(0, 16, 30),
        interviewerIds: [emp[job.manager]],
        location: 'Zoom',
        locationType: 'Video',
        status: 'Scheduled'
      })
      count('interviews')
    }
  }

  // Referrals
  for (const a of apps) {
    const candidate = await ctx.db.get('candidates', a.candidateId)
    if (candidate?.source !== 'Referral' || !candidate.referrerId) continue
    const job = JOBS[a.jobIndex]
    await ctx.db.insert('referrals', {
      referrerId: candidate.referrerId,
      candidateName: a.name,
      jobTitle: job.title,
      candidateId: a.candidateId,
      applicationId: a.id,
      jobId: jobIds[a.jobIndex],
      referredAt: now - 12 * DAY,
      stage: a.stage,
      outcome: 'Active',
      bonusAmount: job.bonus ?? 1000,
      currency: 'USD',
      bonusCondition: 'Paid after 90 days of employment',
      bonusStatus: 'Pending'
    })
    count('referrals')
  }
  const pastReferrals: [string, string, string, 'Hired' | 'Not selected', 'Paid' | 'Eligible' | 'Not eligible', number][] = [
    ['Marta Diaz', 'Frontend Engineer', 'Kenji Tanaka', 'Hired', 'Paid', 140],
    ['Chris Young', 'Data Analyst', 'Noah Brown', 'Hired', 'Eligible', 95],
    ['Pat Lee', 'SDR', 'Valentina Cruz', 'Not selected', 'Not eligible', 60]
  ]
  for (const [candidateName, jobTitle, referrer, outcome, bonusStatus, daysAgo] of pastReferrals) {
    await ctx.db.insert('referrals', {
      referrerId: emp[referrer],
      candidateName,
      jobTitle,
      referredAt: now - daysAgo * DAY,
      stage: outcome === 'Hired' ? 'Hired' : 'Interview',
      outcome,
      hiredAt: outcome === 'Hired' ? now - (daysAgo - 30) * DAY : undefined,
      bonusAmount: 2000,
      currency: 'USD',
      bonusCondition: 'Paid after 90 days of employment',
      bonusStatus,
      paidAt: bonusStatus === 'Paid' ? now - 10 * DAY : undefined
    })
    count('referrals')
  }

  // Onboarding: two in progress (one at risk), one upcoming, one completed
  const onboardingPlan: [string, string, Department, number, string, string][] = [
    ['Rafael Ortiz', 'Backend Engineer', 'Engineering', -3, 'Aisha Bello', 'Lucas Moreau'],
    ['Julia Weber', 'Product Designer', 'Design', -8, 'Grace Liu', 'Mateo Garcia'],
    ['Samir Khan', 'Account Executive', 'Sales', 6, 'James Carter', 'Ben Thompson'],
    ['Clara Nunez', 'Data Analyst', 'Data', -45, 'Ravi Patel', 'Noah Brown']
  ]
  const TASKS: [string, 'Before day 1' | 'Week 1' | 'Month 1', 'People' | 'IT' | 'Manager' | 'Finance' | 'Buddy' | 'New hire', number, 'laptop' | 'documents' | 'day1_plan' | 'accounts' | 'other'][] = [
    ['Send welcome email', 'Before day 1', 'People', -7, 'other'],
    ['Collect signed contract and tax forms', 'Before day 1', 'People', -5, 'documents'],
    ['Order and ship laptop', 'Before day 1', 'IT', -4, 'laptop'],
    ['Create email and Slack accounts', 'Before day 1', 'IT', -1, 'accounts'],
    ['Prepare day 1 plan', 'Before day 1', 'Manager', -1, 'day1_plan'],
    ['Payroll and benefits enrollment', 'Week 1', 'Finance', 3, 'other'],
    ['Buddy coffee chat', 'Week 1', 'Buddy', 2, 'other'],
    ['Complete security training', 'Week 1', 'New hire', 5, 'other'],
    ['30-day check-in', 'Month 1', 'Manager', 30, 'other']
  ]
  for (const [i, [name, title, department, startIn, manager, buddy]] of onboardingPlan.entries()) {
    const startDate = at(startIn, 0)
    const employeeId = await ctx.db.insert('employees', {
      name,
      email: `${name.toLowerCase().replace(/\s+/g, '.')}@talentiq.dev`,
      title,
      department,
      location: 'Mexico City',
      workMode: 'Hybrid',
      employmentType: 'Full-time',
      managerId: emp[manager],
      startDate,
      status: startIn > -30 ? 'Onboarding' : 'Active',
      probationEndDate: startDate + 90 * DAY
    })
    count('employees')
    const completed = startIn <= -30
    const onboardingId = await ctx.db.insert('onboardings', {
      name,
      title,
      department,
      employeeId,
      startDate,
      managerId: emp[manager],
      buddyId: emp[buddy],
      startedAt: startDate - 14 * DAY,
      completedAt: completed ? startDate + 31 * DAY : undefined
    })
    count('onboardings')
    for (const [order, [taskTitle, phase, ownerTeam, dueIn, kind]] of TASKS.entries()) {
      const dueDate = startDate + dueIn * DAY
      // The second hire is at risk: laptop and documents are late.
      const atRisk = i === 1 && (kind === 'laptop' || kind === 'documents')
      const done = completed || (!atRisk && dueDate < now - DAY)
      await ctx.db.insert('onboardingTasks', {
        onboardingId,
        title: taskTitle,
        phase,
        ownerTeam,
        ownerId: ownerTeam === 'Manager' ? emp[manager] : ownerTeam === 'Buddy' ? emp[buddy] : ownerTeam === 'People' ? emp['Nina Kowalski'] : undefined,
        dueDate,
        kind,
        done,
        doneAt: done ? dueDate : undefined,
        doneById: done ? priya : undefined,
        order
      })
      count('onboardingTasks')
    }
  }

  // Time off
  const timeOff: [string, 'Vacation' | 'Sick leave' | 'Personal', number, number, 'Pending' | 'Approved' | 'Declined'][] = [
    ['Lucas Moreau', 'Vacation', 10, 14, 'Pending'],
    ['Mia Johnson', 'Personal', 3, 3, 'Pending'],
    ['Elena Petrova', 'Vacation', 21, 30, 'Pending'],
    ['Sofia Rossi', 'Sick leave', -5, 9, 'Approved'],
    ['Omar Haddad', 'Vacation', 0, 2, 'Approved'],
    ['Diego Ruiz', 'Vacation', -20, -16, 'Approved'],
    ['Ben Thompson', 'Personal', 7, 7, 'Declined'],
    ['Grace Liu', 'Vacation', 35, 39, 'Approved']
  ]
  const timeOffIds: Id<'timeOffRequests'>[] = []
  for (const [name, type, from, to, status] of timeOff) {
    let days = 0
    for (let d = from; d <= to; d++) {
      const dow = new Date(at(d, 12) - 6 * HOUR).getUTCDay()
      if (dow !== 0 && dow !== 6) days++
    }
    timeOffIds.push(
      await ctx.db.insert('timeOffRequests', {
        employeeId: emp[name],
        type,
        startDate: at(from, 0),
        endDate: at(to, 0),
        days: Math.max(days, 1),
        status,
        note: type === 'Vacation' ? 'Family trip' : undefined,
        requestedAt: now - 4 * DAY,
        decidedById: status === 'Pending' ? undefined : maria,
        decidedAt: status === 'Pending' ? undefined : now - 2 * DAY,
        declineReason: status === 'Declined' ? 'Quarter-end close, please pick another day.' : undefined
      })
    )
    count('timeOffRequests')
  }

  // Documents
  const doc = async (fields: {
    title: string
    type: 'Employment contract' | 'Contract renewal' | 'Offer letter' | 'NDA' | 'Policy acknowledgement' | 'Equipment agreement' | 'Work permit' | 'ID' | 'Tax form' | 'CV' | 'Portfolio' | 'Other'
    folder: 'Contracts' | 'Offer letters' | 'Onboarding' | 'Policies' | 'Compliance' | 'Candidate CVs'
    status: 'Draft' | 'Waiting' | 'Signed' | 'Missing' | 'Uploaded'
    employeeId?: Id<'employees'>
    candidateId?: Id<'candidates'>
    offerId?: Id<'offers'>
    sentDaysAgo?: number
    dueIn?: number
    expiresIn?: number
    signers?: { name: string; status: 'Signed' | 'Waiting' }[]
  }) => {
    count('documents')
    return await ctx.db.insert('documents', {
      title: fields.title,
      type: fields.type,
      folder: fields.folder,
      status: fields.status,
      ownerId: priya,
      employeeId: fields.employeeId,
      candidateId: fields.candidateId,
      offerId: fields.offerId,
      version: 1,
      template: fields.type === 'Employment contract' ? 'Standard employment v3' : undefined,
      sharedWithIds: [maria],
      sentAt: fields.sentDaysAgo === undefined ? undefined : now - fields.sentDaysAgo * DAY,
      sentById: fields.sentDaysAgo === undefined ? undefined : priya,
      dueAt: fields.dueIn === undefined ? undefined : at(fields.dueIn, 18),
      signedAt: fields.status === 'Signed' ? now - (fields.sentDaysAgo ?? 30) * DAY + DAY : undefined,
      expiresAt: fields.expiresIn === undefined ? undefined : at(fields.expiresIn, 0),
      signers: (fields.signers ?? []).map(s => ({ ...s, signedAt: s.status === 'Signed' ? now - DAY : undefined })),
      updatedAt: now - (fields.sentDaysAgo ?? 3) * DAY
    })
  }
  await doc({ title: 'Employment contract: Rafael Ortiz', type: 'Employment contract', folder: 'Contracts', status: 'Signed', sentDaysAgo: 2, signers: [{ name: 'Rafael Ortiz', status: 'Signed' }, { name: 'Maria Lopez', status: 'Signed' }] })
  await doc({ title: 'Employment contract: Julia Weber', type: 'Employment contract', folder: 'Contracts', status: 'Waiting', sentDaysAgo: 9, dueIn: -2, signers: [{ name: 'Julia Weber', status: 'Waiting' }, { name: 'Maria Lopez', status: 'Signed' }] })
  await doc({ title: 'Employment contract: Samir Khan', type: 'Employment contract', folder: 'Contracts', status: 'Waiting', sentDaysAgo: 1, dueIn: 4, signers: [{ name: 'Samir Khan', status: 'Waiting' }, { name: 'Maria Lopez', status: 'Waiting' }] })
  await doc({ title: 'Contract renewal: Carlos Mendez', type: 'Contract renewal', folder: 'Contracts', status: 'Draft', employeeId: emp['Carlos Mendez'], expiresIn: 18 })
  await doc({ title: 'Contract: Pedro Alvarez', type: 'Employment contract', folder: 'Contracts', status: 'Signed', employeeId: emp['Pedro Alvarez'], sentDaysAgo: 340, expiresIn: 26 })
  await doc({ title: 'Work permit: Lucas Moreau', type: 'Work permit', folder: 'Compliance', status: 'Uploaded', employeeId: emp['Lucas Moreau'], expiresIn: 21 })
  await doc({ title: 'Visa: Elena Petrova', type: 'Work permit', folder: 'Compliance', status: 'Uploaded', employeeId: emp['Elena Petrova'], expiresIn: 140 })
  await doc({ title: 'Tax form: Julia Weber', type: 'Tax form', folder: 'Onboarding', status: 'Missing' })
  await doc({ title: 'Equipment agreement: Rafael Ortiz', type: 'Equipment agreement', folder: 'Onboarding', status: 'Waiting', sentDaysAgo: 3, dueIn: 2, signers: [{ name: 'Rafael Ortiz', status: 'Waiting' }] })
  await doc({ title: 'NDA: Northstar Talent', type: 'NDA', folder: 'Compliance', status: 'Signed', sentDaysAgo: 12, signers: [{ name: 'Northstar Talent', status: 'Signed' }] })
  await doc({ title: 'Remote work policy 2026', type: 'Policy acknowledgement', folder: 'Policies', status: 'Waiting', sentDaysAgo: 5, dueIn: 9, signers: EMPLOYEES.slice(0, 6).map(([name], i) => ({ name, status: i < 4 ? 'Signed' : 'Waiting' })) })
  await doc({ title: 'Code of conduct', type: 'Policy acknowledgement', folder: 'Policies', status: 'Signed', sentDaysAgo: 60 })
  for (const [i, offerId] of offerIds.entries()) {
    const a = offerApps[i]
    await doc({ title: `Offer letter: ${a.name}`, type: 'Offer letter', folder: 'Offer letters', status: i === 2 ? 'Signed' : i === 1 ? 'Waiting' : 'Draft', candidateId: a.candidateId, offerId, sentDaysAgo: i === 0 ? undefined : i, dueIn: i === 1 ? 3 : undefined, signers: i === 0 ? [] : [{ name: a.name, status: i === 2 ? 'Signed' : 'Waiting' }] })
  }
  for (const a of apps.filter(a => a.stage !== 'Applied').slice(0, 10)) {
    await doc({ title: `CV: ${a.name}`, type: 'CV', folder: 'Candidate CVs', status: 'Missing', candidateId: a.candidateId })
  }

  // Inbox
  const inbox = async (fields: Omit<WithoutSystemFields<Doc<'inboxItems'>>, 'createdAt'> & { hoursAgo: number }) => {
    const { hoursAgo, ...rest } = fields
    count('inboxItems')
    return await ctx.db.insert('inboxItems', { ...rest, createdAt: now - hoursAgo * HOUR })
  }
  if (offerApps[0]) {
    await inbox({ kind: 'Offer approval', title: `Approve offer for ${offerApps[0].name}`, preview: `${JOBS[offerApps[0].jobIndex].title}, within band. Requested by Daniel Kim.`, tag: 'Needs approval', actorName: 'Daniel Kim', offerId: offerIds[0], candidateId: offerApps[0].candidateId, applicationId: offerApps[0].id, hoursAgo: 1 })
  }
  await inbox({ kind: 'Time off', title: 'Lucas Moreau requested vacation', preview: 'Family trip. 5 working days.', tag: 'Needs approval', actorName: 'Lucas Moreau', timeOffRequestId: timeOffIds[0], employeeId: emp['Lucas Moreau'], hoursAgo: 3 })
  await inbox({ kind: 'Time off', title: 'Mia Johnson requested a personal day', preview: '1 working day.', tag: 'Needs approval', actorName: 'Mia Johnson', timeOffRequestId: timeOffIds[1], employeeId: emp['Mia Johnson'], hoursAgo: 5 })
  const interviewApp = apps.find(a => a.stage === 'Interview')
  if (interviewApp) {
    await inbox({ kind: 'Candidate message', title: `${interviewApp.name} replied`, preview: 'Thanks! Thursday at 11 works for me. Should I prepare anything for the panel?', actorName: interviewApp.name, candidateId: interviewApp.candidateId, applicationId: interviewApp.id, hoursAgo: 2 })
  }
  await inbox({ kind: 'Mention', title: 'Aisha Bello mentioned you', preview: '@Maria can we fast-track the frontend role? Two strong finalists this week.', actorName: 'Aisha Bello', recipientId: maria, jobId: jobIds[0], hoursAgo: 6 })
  await inbox({ kind: 'Contract expiring', title: "Carlos Mendez's contract ends in 18 days", preview: 'A renewal draft is ready for review.', tag: 'Expiring', employeeId: emp['Carlos Mendez'], hoursAgo: 20 })
  await inbox({ kind: 'Job post', title: 'Product Manager, Platform is live', preview: 'Published to the career site, LinkedIn and Indeed.', jobId: jobIds[5], hoursAgo: 26 })
  await inbox({ kind: 'Time off', title: 'Ben Thompson: personal day declined', preview: 'Quarter-end close, please pick another day.', actorName: 'Maria Lopez', timeOffRequestId: timeOffIds[6], employeeId: emp['Ben Thompson'], resolution: 'Declined', resolvedAt: now - 2 * DAY, resolvedById: maria, hoursAgo: 50 })

  // Career site
  await ctx.db.insert('careerSite', {
    status: 'Live',
    url: 'https://careers.talentiq.dev',
    lastPublishedAt: now - 26 * HOUR,
    publishedById: priya,
    checklist: [
      { label: 'Company story and values', done: true },
      { label: 'Benefits section', done: true },
      { label: 'Team photos', done: false },
      { label: 'Diversity statement', done: true },
      { label: 'Application form under 5 minutes', done: false }
    ]
  })
  count('careerSite')

  // Metrics: 12 months of history ending this month, plus year-to-date breakdowns
  const periods: string[] = [monthKey(now)]
  for (let i = 0; i < 11; i++) periods.unshift(previousMonthKey(periods[0]))
  const metric = async (key: Doc<'metrics'>['key'], period: string, value: number, dimension?: string) => {
    count('metrics')
    await ctx.db.insert('metrics', { key, period, value, dimension })
  }
  const openJobs = JOBS.filter(j => j.status === 'Open').length
  const activeCandidates = apps.length
  for (const [i, period] of periods.entries()) {
    const t = i / 11
    const wobble = (k: number) => Math.round(Math.sin(i * 1.7 + k) * 100) / 100
    await metric('open_roles', period, Math.max(2, Math.round(4 + t * (openJobs - 4) + wobble(1))))
    await metric('active_candidates', period, Math.round(28 + t * (activeCandidates - 28) + wobble(2) * 3))
    await metric('time_to_hire_avg_days', period, Math.round(42 - t * 8 + wobble(3) * 2))
    await metric('time_to_hire_median_days', period, Math.round(38 - t * 7 + wobble(4) * 2))
    await metric('offer_acceptance_pct', period, Math.round(78 + t * 9 + wobble(5) * 3))
    await metric('cost_per_hire_usd', period, Math.round(5200 - t * 900 + wobble(6) * 150))
    await metric('turnover_pct', period, Math.round((1.8 - t * 0.5 + wobble(7) * 0.2) * 10) / 10)
    await metric('career_visitors', period, Math.round(3200 + t * 1600 + wobble(8) * 250))
    await metric('career_applications', period, Math.round(140 + t * 70 + wobble(9) * 15))
    await metric('career_avg_time_on_page_sec', period, Math.round(95 + t * 25 + wobble(10) * 8))
  }
  const current = periods.at(-1)!
  for (const [source, pct] of [['LinkedIn', 38], ['Google', 27], ['Direct', 18], ['Indeed', 11], ['Other', 6]] as const) {
    await metric('career_traffic_source_pct', current, pct, source)
  }
  const year = String(orgYear(now))
  for (const [source, hires] of [['LinkedIn', 9], ['Referral', 7], ['Career site', 6], ['Indeed', 3], ['Agency', 2]] as const) {
    await metric('hires_by_source', year, hires, source)
  }
  for (const [stage, value] of [['Applied', 1240], ['Screening', 412], ['Interview', 138], ['Offer', 34], ['Hired', 27]] as const) {
    await metric('funnel', year, value, stage)
  }
  const employees = await ctx.db.query('employees').take(500)
  for (const d of Object.keys(MANAGER_BY_DEPT) as Department[]) {
    const live = employees.filter(e => e.department === d && e.status !== 'Left').length
    await metric('headcount', `${year}-01`, Math.max(1, live - (d === 'Engineering' ? 3 : d === 'Sales' ? 1 : d === 'Data' ? 1 : 0)), d)
  }

  return counts
}
