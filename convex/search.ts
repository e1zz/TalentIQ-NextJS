import { v } from 'convex/values'
import { query } from './_generated/server'
import { requireIdentity } from './lib/auth'
import { documentFolder, employeeStatus, jobStatus, stage } from './lib/validators'

/** Global search across people (employees and candidates), jobs and documents. */
export const global = query({
  args: { q: v.string(), limit: v.optional(v.number()) },
  returns: v.object({
    people: v.array(
      v.union(
        v.object({
          kind: v.literal('employee'),
          _id: v.id('employees'),
          name: v.string(),
          subtitle: v.string(),
          status: employeeStatus
        }),
        v.object({
          kind: v.literal('candidate'),
          _id: v.id('candidates'),
          name: v.string(),
          subtitle: v.string(),
          stage: v.union(stage, v.null())
        })
      )
    ),
    jobs: v.array(v.object({ _id: v.id('jobs'), title: v.string(), subtitle: v.string(), status: jobStatus })),
    documents: v.array(v.object({ _id: v.id('documents'), title: v.string(), subtitle: v.string(), folder: documentFolder }))
  }),
  handler: async (ctx, args) => {
    await requireIdentity(ctx)
    const q = args.q.trim()
    if (q.length === 0) return { people: [], jobs: [], documents: [] }
    const limit = Math.min(Math.max(args.limit ?? 5, 1), 20)

    const [employees, candidates, jobs, documents] = await Promise.all([
      ctx.db
        .query('employees')
        .withSearchIndex('search_name', s => s.search('name', q))
        .take(limit * 2),
      ctx.db
        .query('candidates')
        .withSearchIndex('search_name', s => s.search('name', q))
        .take(limit),
      ctx.db
        .query('jobs')
        .withSearchIndex('search_title', s => s.search('title', q))
        .take(limit),
      ctx.db
        .query('documents')
        .withSearchIndex('search_title', s => s.search('title', q))
        .take(limit)
    ])

    const candidateRows = await Promise.all(
      candidates.map(async c => {
        const application = await ctx.db
          .query('applications')
          .withIndex('by_candidate', ix => ix.eq('candidateId', c._id))
          .order('desc')
          .first()
        const job = application ? await ctx.db.get('jobs', application.jobId) : null
        return {
          kind: 'candidate' as const,
          _id: c._id,
          name: c.name,
          subtitle: job ? `Candidate · ${job.title}` : 'Candidate',
          stage: application?.stage ?? null
        }
      })
    )
    const employeeRows = employees
      .filter(e => e.status !== 'Left')
      .slice(0, limit)
      .map(e => ({
        kind: 'employee' as const,
        _id: e._id,
        name: e.name,
        subtitle: `${e.title} · ${e.department}`,
        status: e.status
      }))

    return {
      people: [...employeeRows, ...candidateRows],
      jobs: jobs.map(j => ({ _id: j._id, title: j.title, subtitle: `${j.department} · ${j.location}`, status: j.status })),
      documents: documents.map(d => ({ _id: d._id, title: d.title, subtitle: `${d.folder} · ${d.type}`, folder: d.folder }))
    }
  }
})
