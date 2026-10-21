# Convex API

Every public function the app can call. Use them from React with `useQuery(api.<file>.<name>, args)` / `useMutation(...)` (`import { api } from '@/convex/_generated/api'`). Exact return shapes are the `returns` validators in each file; `convex/_generated/api.d.ts` gives you the TypeScript types.

## Conventions

- **Auth:** every function requires a signed-in Clerk user. Queries throw `UNAUTHENTICATED` otherwise; mutations also create the caller's `users` row on first use. Call `users.ensureUser` once after sign-in with Clerk's name, email and image.
- **Single tenant:** every signed-in user sees the same company data.
- **Time:** dates are epoch milliseconds. Day boundaries use `America/Mexico_City` (`convex/lib/time.ts`); format with `timeZone: 'America/Mexico_City'`. Queries that depend on "now" take an optional `now` arg so the UI can pin time; omit it to use the server clock.
- **Errors:** `ConvexError` with `{ code: 'UNAUTHENTICATED' | 'NOT_FOUND' | 'INVALID', message }`. Show `error.data.message`.
- **Files:** uploads are two steps: `documents.generateUploadUrl()` → `POST` the file to that URL → `documents.saveDocument({ storageId, fileName, ... })`. Get download URLs on demand with `documents.getDownloadUrl` (never store them).
- **Demo data:** `npx convex run seed:run` (`'{"reset": true}'` to start over). See `convex/seed.ts`.

## Screen map

| Screen | Functions |
| --- | --- |
| Home | `dashboard.greeting`, `dashboard.attention`, `dashboard.kpis`, `dashboard.funnel`, `dashboard.todaysInterviews`, `dashboard.openRoles`, `dashboard.onboardingThisWeek` |
| Jobs | `jobs.*` |
| Pipeline | `candidates.pipeline`, `candidates.moveStage` |
| Candidate profile | `candidates.profile`, `candidates.addNote`, `documents.list({ candidateId })` |
| Calendar | `interviews.*` |
| Referrals | `referrals.*` |
| Career site | `careerSite.*` |
| Employees | `employees.*`, `documents.list({ employeeId })` |
| Onboarding | `onboarding.*` |
| Time off | `timeOff.*` |
| Inbox | `inbox.*` |
| Documents | `documents.*` |
| Reports | `reports.overview` |
| AI assistant | `assistant.*` (conversation history), plus `app/api/chat` and `app/api/files` for Claude |
| Top bar | `search.*`, `users.me` |

## Functions

### `convex/assistant.ts`

| Function | Kind | Args | Description |
| --- | --- | --- | --- |
| `assistant.recentConversations` | query | `{ limit: v.number() (optional) }` | The signed-in user's recent conversations, newest first. |
| `assistant.getConversation` | query | `{ conversationId: v.id('conversations') }` | A conversation and its messages, oldest first. Null if it isn't the caller's. |
| `assistant.createConversation` | mutation | `{ title: v.string() (optional), firstMessage: v.string() (optional) }` | Starts a conversation, optionally with the first user message (which also sets the title). |
| `assistant.addMessage` | mutation | `{ conversationId: v.id('conversations'), role: messageRole, content: v.string(), citations: v.array(citation) (optional) }` | Appends a user or assistant message (with Claude's citations, if any). |
| `assistant.renameConversation` | mutation | `{ conversationId: v.id('conversations'), title: v.string() }` |  |
| `assistant.deleteConversation` | mutation | `{ conversationId: v.id('conversations') }` | Deletes a conversation and its messages. |

### `convex/candidates.ts`

| Function | Kind | Args | Description |
| --- | --- | --- | --- |
| `candidates.pipeline` | query | `{ jobId: v.id('jobs'), source: candidateSource (optional), minRating: v.number() (optional), needsAction: v.boolean() (optional), now: v.number() (optional) }` | Kanban board for one job: Applied, Screening, Interview, Offer, Hired. |
| `candidates.moveStage` | mutation | `{ applicationId: v.id('applications'), stage }` | Moves an application to another stage. Keeps the job's funnel counters, the referral record and the activity feed in sync. |
| `candidates.addNote` | mutation | `{ candidateId: v.id('candidates'), applicationId: v.id('applications') (optional), text: v.string() }` | Adds a note to a candidate's activity feed. |
| `candidates.profile` | query | `{ candidateId: v.id('candidates'), applicationId: v.id('applications') (optional), now: v.number() (optional) }` | Everything on the candidate profile. Uses the latest application unless `applicationId` is given. |

### `convex/careerSite.ts`

| Function | Kind | Args | Description |
| --- | --- | --- | --- |
| `careerSite.overview` | query | `{ now: v.number() (optional) }` | Career site screen: KPIs, page status, traffic sources, job channels (career site, LinkedIn, Indeed), checklist and published roles. |
| `careerSite.toggleChecklistItem` | mutation | `{ index: v.number() }` | Ticks or unticks a career site checklist item. |
| `careerSite.setStatus` | mutation | `{ status: careerSiteStatus }` | Sets the career site status (Live, Draft or Paused); going Live records a publish. |

### `convex/dashboard.ts`

| Function | Kind | Args | Description |
| --- | --- | --- | --- |
| `dashboard.greeting` | query | `{ now: v.number() (optional) }` | Home greeting: the user's first name, today's date and headline counts. |
| `dashboard.attention` | query | `{ now: v.number() (optional) }` | "Needs your attention" on Home. |
| `dashboard.kpis` | query | `{ now: v.number() (optional) }` | KPI cards with sparklines: open roles, active candidates, avg time to hire, offer acceptance. |
| `dashboard.funnel` | query | `{}` | Pipeline funnel across open roles, with step-to-step conversion. |
| `dashboard.todaysInterviews` | query | `{ now: v.number() (optional) }` | Today's interviews, offer calls and onboarding sessions, in time order. |
| `dashboard.openRoles` | query | `{ now: v.number() (optional), limit: v.number() (optional) }` | Open roles table, most urgent first. |
| `dashboard.onboardingThisWeek` | query | `{ now: v.number() (optional) }` | Hires in onboarding this week: in progress, or starting this week. |
| `dashboard.headcountByDepartment` | query | `{}` | Current headcount per department (people who have left are excluded). |
| `dashboard.badges` | query | `{ now: v.number() (optional) }` | Sidebar badge counts. |

### `convex/documents.ts`

| Function | Kind | Args | Description |
| --- | --- | --- | --- |
| `documents.kpis` | query | `{ now: v.number() (optional) }` | Documents KPIs: waiting for signature, signed this month, expiring in 30 days, missing. |
| `documents.outForSignature` | query | `{ now: v.number() (optional), limit: v.number() (optional) }` | "Out for signature": waiting documents plus those signed in the last 30 days, newest first. |
| `documents.folders` | query | `{}` | Every folder with its document count. |
| `documents.list` | query | `{ folder: documentFolder (optional), employeeId: v.id('employees') (optional), candidateId: v.id('candidates') (optional), limit: v.number() (optional) }` | Documents in a folder, or for one employee or candidate, newest first. |
| `documents.get` | query | `{ documentId: v.id('documents'), now: v.number() (optional) }` | Document detail: version, template, owner, sharing and signer statuses. |
| `documents.remind` | mutation | `{ documentId: v.id('documents') }` | Records a reminder to everyone who still has to sign. |
| `documents.generateUploadUrl` | mutation | `{}` | Step 1 of an upload: a short-lived URL to POST the file to. The response JSON has `storageId`; pass it to `saveDocument`. |
| `documents.saveDocument` | mutation | `{ storageId: v.id('_storage'), fileName: v.string(), documentId: v.id('documents') (optional), title: v.string() (optional), type: documentType (optional), folder: documentFolder (optional), employeeId: v.id('employees') (optional), candidateId: v.id('candidates') (optional), applicationId: v.id('applications') (optional) }` | Step 2 of an upload: validates the stored file (20 MB max; PDF, Word, TXT, PNG or JPEG) and creates the document. With `documentId`, attaches the file to an existing document instead (fills a Missing document or adds a new version). |
| `documents.getDownloadUrl` | query | `{ documentId: v.id('documents') }` | A download URL for a document's file, issued only to signed-in users and never stored. Null when the document has no file. Fetch it when the user clicks download. |
| `documents.remove` | mutation | `{ documentId: v.id('documents') }` | Deletes a document and its file. |

### `convex/employees.ts`

| Function | Kind | Args | Description |
| --- | --- | --- | --- |
| `employees.kpis` | query | `{ now: v.number() (optional) }` | Headcount, new hires and leavers in the last 30 days, and open positions. |
| `employees.attention` | query | `{ now: v.number() (optional) }` | "Needs attention" on the Employees screen. |
| `employees.statusCounts` | query | `{}` | Counts for the status tabs. `All` excludes people who have left. |
| `employees.list` | query | `{ paginationOpts: paginationOptsValidator, status: employeeTab (optional), department: department (optional) }` | Paginated employee table, sorted by name. Use with `usePaginatedQuery`. |
| `employees.get` | query | `{ employeeId: v.id('employees'), now: v.number() (optional) }` | Detail panel for one employee. |

### `convex/inbox.ts`

| Function | Kind | Args | Description |
| --- | --- | --- | --- |
| `inbox.list` | query | `{ filter: inboxFilter (optional), unreadOnly: v.boolean() (optional) }` | Inbox items for a filter, with total and unread counts for every filter. |
| `inbox.get` | query | `{ itemId: v.id('inboxItems') }` | An inbox item with its approval details (offer or time off) and comment thread. |
| `inbox.markAsRead` | mutation | `{ itemId: v.id('inboxItems') }` |  |
| `inbox.markAllRead` | mutation | `{}` |  |
| `inbox.approve` | mutation | `{ itemId: v.id('inboxItems') }` | Approves the offer or time-off request behind an inbox item. |
| `inbox.decline` | mutation | `{ itemId: v.id('inboxItems'), reason: v.string() (optional) }` | Declines the offer or time-off request behind an inbox item. |
| `inbox.comment` | mutation | `{ itemId: v.id('inboxItems'), body: v.string() }` | Adds a comment to an inbox item's thread. |

### `convex/interviews.ts`

| Function | Kind | Args | Description |
| --- | --- | --- | --- |
| `interviews.week` | query | `{ start: v.number(), end: v.number() (optional) }` | Calendar events for a range (defaults to the week containing `start`), plus counts per type. |
| `interviews.upNext` | query | `{ now: v.number() (optional), limit: v.number() (optional) }` | The next scheduled events that haven't ended yet. |
| `interviews.schedule` | mutation | `{ type: interviewType, title: v.string() (optional), applicationId: v.id('applications') (optional), employeeId: v.id('employees') (optional), start: v.number(), end: v.number(), interviewerIds: v.array(v.id('employees')), location: v.string(), locationType }` | Schedules an interview, offer call or onboarding session. |
| `interviews.setStatus` | mutation | `{ interviewId: v.id('interviews'), status: interviewStatus }` | Marks an event completed or cancelled (or back to scheduled). |

### `convex/jobs.ts`

| Function | Kind | Args | Description |
| --- | --- | --- | --- |
| `jobs.overview` | query | `{}` | Jobs screen header: tab counts and the options for the filter menus. |
| `jobs.list` | query | `{ status: jobStatus (optional), department: department (optional), location: v.string() (optional), hiringManagerId: v.id('employees') (optional), sort: v.optional(v.union(v.literal('urgent'), v.literal('newest'), v.literal('applicants'))), now: v.number() (optional) }` | Job cards for one tab, filtered and sorted. `sort: 'urgent'` puts Overdue and Slow roles first. |
| `jobs.get` | query | `{ jobId: v.id('jobs'), now: v.number() (optional) }` |  |
| `jobs.create` | mutation | `{ title: v.string(), department, location: v.string(), workMode, employmentType, hiringManagerId: v.id('employees'), targetDays: v.number() (optional), headcount: v.number() (optional), referralBonus: v.number() (optional), salaryMin: v.number() (optional), salaryMax: v.number() (optional), currency: v.string() (optional), publish: v.boolean() (optional) }` | Creates a job as a Draft, or Open (posted now) when `publish` is true. |
| `jobs.setStatus` | mutation | `{ jobId: v.id('jobs'), status: jobStatus }` | Moves a job between tabs. Opening sets the posted date; closing sets the closed date. |

### `convex/onboarding.ts`

| Function | Kind | Args | Description |
| --- | --- | --- | --- |
| `onboarding.kpis` | query | `{ now: v.number() (optional) }` | Onboarding KPIs. |
| `onboarding.attention` | query | `{ now: v.number() (optional) }` | "Needs attention": overdue tasks, docs not signed, laptops not shipped, day-1 plans not sent. |
| `onboarding.list` | query | `{ tab: onboardingTab (optional), now: v.number() (optional) }` | Hire cards for a tab, plus the count for every tab. |
| `onboarding.offerAcceptedNotStarted` | query | `{}` | "Offer accepted · not started": accepted offers that don't have an onboarding yet. |
| `onboarding.checklist` | query | `{ onboardingId: v.id('onboardings'), now: v.number() (optional) }` | Per-hire checklist grouped into Before day 1, Week 1 and Month 1. |
| `onboarding.toggleTask` | mutation | `{ taskId: v.id('onboardingTasks') }` | Ticks or unticks a checklist task. Completing every task completes the onboarding. |
| `onboarding.addTask` | mutation | `{ onboardingId: v.id('onboardings'), title: v.string(), phase: onboardingPhase, ownerTeam, ownerId: v.id('employees') (optional), dueDate: v.number(), kind: onboardingTaskKind (optional) }` |  |
| `onboarding.start` | mutation | `{ applicationId: v.id('applications'), buddyId: v.id('employees') (optional), startDate: v.number() (optional) }` | Starts onboarding for a hire with an accepted offer: creates the employee record (status Onboarding), the onboarding and the default checklist. |

### `convex/referrals.ts`

| Function | Kind | Args | Description |
| --- | --- | --- | --- |
| `referrals.overview` | query | `{ now: v.number() (optional) }` | Referrals screen: KPIs, active referrals, top referrers and open roles to share. |
| `referrals.refer` | mutation | `{ jobId: v.id('jobs'), referrerId: v.id('employees') (optional), name: v.string(), email: v.string(), phone: v.string() (optional), linkedinUrl: v.string() (optional), note: v.string() (optional) }` | Refers someone for an open job: creates the candidate, the application and the referral. |

### `convex/reports.ts`

| Function | Kind | Args | Description |
| --- | --- | --- | --- |
| `reports.overview` | query | `{ now: v.number() (optional) }` | Reports screen. History comes from pre-aggregated `metrics` rows; headcount by department is live, compared with the January snapshot for the YTD delta. |

### `convex/search.ts`

| Function | Kind | Args | Description |
| --- | --- | --- | --- |
| `search.global` | query | `{ q: v.string(), limit: v.number() (optional) }` | Global search across people (employees and candidates), jobs and documents. |

### `convex/timeOff.ts`

| Function | Kind | Args | Description |
| --- | --- | --- | --- |
| `timeOff.kpis` | query | `{ now: v.number() (optional) }` | Time-off KPIs. |
| `timeOff.pending` | query | `{}` | Pending approvals with overlap warnings and the balance before and after approving. |
| `timeOff.approve` | mutation | `{ requestId: v.id('timeOffRequests') }` |  |
| `timeOff.decline` | mutation | `{ requestId: v.id('timeOffRequests'), reason: v.string() (optional) }` |  |
| `timeOff.availability` | query | `{ start: v.number(), days: v.number() (optional), department: department (optional) }` | Team availability timeline, including pending requests. With a department, every member gets a row; without one, only people with time off in the range. |
| `timeOff.balances` | query | `{ employeeId: v.id('employees'), year: v.number() (optional) }` | One employee's balances for a year (defaults to the current year). |
| `timeOff.teamBalances` | query | `{ department: department (optional), year: v.number() (optional) }` | Balances for everyone in a department (or everyone), for the balances table. |
| `timeOff.history` | query | `{ employeeId: v.id('employees') }` | One employee's request history, newest first. |
| `timeOff.request` | mutation | `{ employeeId: v.id('employees') (optional), type: timeOffType, startDate: v.number(), endDate: v.number(), note: v.string() (optional) }` | Requests time off. Defaults to the signed-in user's own employee record. |

### `convex/users.ts`

| Function | Kind | Args | Description |
| --- | --- | --- | --- |
| `users.me` | query | `{}` | The signed-in user's profile, or null until `ensureUser` has created it. |
| `users.ensureUser` | mutation | `{ name: v.string() (optional), email: v.string() (optional), imageUrl: v.string() (optional) }` | Creates (or refreshes) the `users` row for the signed-in Clerk user. Call it once after sign-in. Clerk's default session token has no profile claims, so pass the name, email and image from Clerk's `useUser()`. |
| `users.list` | query | `{}` | Everyone who uses TalentIQ, for pickers (approvers, document sharing). |
