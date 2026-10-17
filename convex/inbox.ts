import { v } from 'convex/values'
import type { Doc, Id } from './_generated/dataModel'
import { mutation, query, type MutationCtx } from './_generated/server'
import { invalid, notFound, requireUser, requireViewer } from './lib/auth'
import { getEmployeesById, getUsersById, refOrNull, userRefOrNull } from './lib/domain'
import { readItemIds, visibleItems } from './lib/inbox'
import { decideTimeOff } from './lib/timeOff'
import {
  decision,
  department,
  employeeRef,
  INBOX_CATEGORY,
  inboxCategory,
  inboxFilter,
  inboxKind,
  offerStatus,
  timeOffStatus,
  timeOffType,
  userRef,
  type Decision,
  type InboxFilter
} from './lib/validators'

const inboxItem = v.object({
  _id: v.id('inboxItems'),
  kind: inboxKind,
  category: inboxCategory,
  title: v.string(),
  preview: v.string(),
  tag: v.union(v.string(), v.null()),
  createdAt: v.number(),
  unread: v.boolean(),
  actorName: v.union(v.string(), v.null()),
  /** Set once an approval has been approved or declined. */
  resolution: v.union(decision, v.null()),
  /** Records the item links to, for navigation. */
  links: v.object({
    candidateId: v.union(v.id('candidates'), v.null()),
    applicationId: v.union(v.id('applications'), v.null()),
    employeeId: v.union(v.id('employees'), v.null()),
    jobId: v.union(v.id('jobs'), v.null()),
    documentId: v.union(v.id('documents'), v.null()),
    offerId: v.union(v.id('offers'), v.null()),
    timeOffRequestId: v.union(v.id('timeOffRequests'), v.null())
  })
})

function toInboxItem(item: Doc<'inboxItems'>, read: Set<Id<'inboxItems'>>) {
  return {
    _id: item._id,
    kind: item.kind,
    category: INBOX_CATEGORY[item.kind],
    title: item.title,
    preview: item.preview,
    tag: item.tag ?? null,
    createdAt: item.createdAt,
    unread: !read.has(item._id),
    actorName: item.actorName ?? null,
    resolution: item.resolution ?? null,
    links: {
      candidateId: item.candidateId ?? null,
      applicationId: item.applicationId ?? null,
      employeeId: item.employeeId ?? null,
      jobId: item.jobId ?? null,
      documentId: item.documentId ?? null,
      offerId: item.offerId ?? null,
      timeOffRequestId: item.timeOffRequestId ?? null
    }
  }
}

const FILTERS: InboxFilter[] = ['All', 'Approvals', 'Candidates', 'Mentions', 'System']

/** Inbox items for a filter, with total and unread counts for every filter. */
export const list = query({
  args: { filter: v.optional(inboxFilter), unreadOnly: v.optional(v.boolean()) },
  returns: v.object({
    unread: v.number(),
    filters: v.array(v.object({ filter: inboxFilter, count: v.number(), unread: v.number() })),
    items: v.array(inboxItem)
  }),
  handler: async (ctx, args) => {
    const { user } = await requireViewer(ctx)
    const userId = user?._id ?? null
    const [items, read] = await Promise.all([visibleItems(ctx, userId), readItemIds(ctx, userId)])
    const all = items.map(i => toInboxItem(i, read))
    const inFilter = (f: InboxFilter) => (f === 'All' ? all : all.filter(i => i.category === f))
    const filter = args.filter ?? 'All'
    return {
      unread: all.filter(i => i.unread).length,
      filters: FILTERS.map(f => ({ filter: f, count: inFilter(f).length, unread: inFilter(f).filter(i => i.unread).length })),
      items: inFilter(filter).filter(i => !args.unreadOnly || i.unread)
    }
  }
})

/** An inbox item with its approval details (offer or time off) and comment thread. */
export const get = query({
  args: { itemId: v.id('inboxItems') },
  returns: v.union(
    v.null(),
    v.object({
      item: inboxItem,
      offer: v.union(
        v.null(),
        v.object({
          _id: v.id('offers'),
          status: offerStatus,
          candidate: v.object({ _id: v.id('candidates'), name: v.string() }),
          applicationId: v.id('applications'),
          job: v.object({ _id: v.id('jobs'), title: v.string(), department }),
          salary: v.number(),
          currency: v.string(),
          bandMin: v.number(),
          bandMax: v.number(),
          /** Where the salary sits in the band, 0 (min) to 100 (max). */
          bandPositionPct: v.number(),
          startDate: v.number(),
          hiringManager: v.union(employeeRef, v.null()),
          requestedBy: v.union(userRef, v.null()),
          approver: v.union(userRef, v.null()),
          linkedRecords: v.array(
            v.object({
              kind: v.union(v.literal('candidate'), v.literal('job'), v.literal('document')),
              id: v.string(),
              label: v.string()
            })
          )
        })
      ),
      timeOff: v.union(
        v.null(),
        v.object({
          _id: v.id('timeOffRequests'),
          employee: employeeRef,
          type: timeOffType,
          status: timeOffStatus,
          startDate: v.number(),
          endDate: v.number(),
          days: v.number(),
          note: v.union(v.string(), v.null())
        })
      ),
      comments: v.array(
        v.object({
          _id: v.id('comments'),
          author: v.union(userRef, v.null()),
          body: v.string(),
          createdAt: v.number()
        })
      )
    })
  ),
  handler: async (ctx, args) => {
    const { user } = await requireViewer(ctx)
    const item = await ctx.db.get('inboxItems', args.itemId)
    if (!item || (item.recipientId !== undefined && item.recipientId !== user?._id)) return null
    const read = await readItemIds(ctx, user?._id ?? null)
    const comments = await ctx.db
      .query('comments')
      .withIndex('by_item_and_createdAt', q => q.eq('inboxItemId', item._id))
      .take(200)

    let offer = null
    const offerDoc = item.offerId ? await ctx.db.get('offers', item.offerId) : null
    if (offerDoc) {
      const [candidate, job, letters] = await Promise.all([
        ctx.db.get('candidates', offerDoc.candidateId),
        ctx.db.get('jobs', offerDoc.jobId),
        ctx.db
          .query('documents')
          .withIndex('by_candidate', q => q.eq('candidateId', offerDoc.candidateId))
          .collect()
      ])
      const managers = await getEmployeesById(ctx, [offerDoc.hiringManagerId])
      const users = await getUsersById(ctx, [offerDoc.requestedById, offerDoc.approverId])
      if (candidate && job) {
        const span = offerDoc.bandMax - offerDoc.bandMin
        offer = {
          _id: offerDoc._id,
          status: offerDoc.status,
          candidate: { _id: candidate._id, name: candidate.name },
          applicationId: offerDoc.applicationId,
          job: { _id: job._id, title: job.title, department: job.department },
          salary: offerDoc.salary,
          currency: offerDoc.currency,
          bandMin: offerDoc.bandMin,
          bandMax: offerDoc.bandMax,
          bandPositionPct: span <= 0 ? 50 : Math.round(((offerDoc.salary - offerDoc.bandMin) / span) * 100),
          startDate: offerDoc.startDate,
          hiringManager: refOrNull(managers, offerDoc.hiringManagerId),
          requestedBy: userRefOrNull(users, offerDoc.requestedById),
          approver: userRefOrNull(users, offerDoc.approverId),
          linkedRecords: [
            { kind: 'candidate' as const, id: candidate._id as string, label: `${candidate.name} · candidate profile` },
            { kind: 'job' as const, id: job._id as string, label: `${job.title} · job` },
            ...letters
              .filter(d => d.offerId === offerDoc._id || d.type === 'Offer letter')
              .map(d => ({ kind: 'document' as const, id: d._id as string, label: d.title }))
          ]
        }
      }
    }

    let timeOff = null
    const request = item.timeOffRequestId ? await ctx.db.get('timeOffRequests', item.timeOffRequestId) : null
    if (request) {
      const employee = await ctx.db.get('employees', request.employeeId)
      if (employee) {
        timeOff = {
          _id: request._id,
          employee: { _id: employee._id, name: employee.name, title: employee.title },
          type: request.type,
          status: request.status,
          startDate: request.startDate,
          endDate: request.endDate,
          days: request.days,
          note: request.note ?? null
        }
      }
    }

    const authors = await getUsersById(
      ctx,
      comments.map(c => c.authorId)
    )
    return {
      item: toInboxItem(item, read),
      offer,
      timeOff,
      comments: comments.map(c => ({
        _id: c._id,
        author: userRefOrNull(authors, c.authorId),
        body: c.body,
        createdAt: c.createdAt
      }))
    }
  }
})

async function markRead(ctx: MutationCtx, userId: Id<'users'>, itemId: Id<'inboxItems'>) {
  const existing = await ctx.db
    .query('inboxReads')
    .withIndex('by_user_and_item', q => q.eq('userId', userId).eq('itemId', itemId))
    .unique()
  if (!existing) await ctx.db.insert('inboxReads', { userId, itemId, readAt: Date.now() })
}

export const markAsRead = mutation({
  args: { itemId: v.id('inboxItems') },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    if (!(await ctx.db.get('inboxItems', args.itemId))) throw notFound('Inbox item')
    await markRead(ctx, user._id, args.itemId)
    return null
  }
})

export const markAllRead = mutation({
  args: {},
  returns: v.object({ marked: v.number() }),
  handler: async ctx => {
    const user = await requireUser(ctx)
    const [items, read] = await Promise.all([visibleItems(ctx, user._id), readItemIds(ctx, user._id)])
    const unread = items.filter(i => !read.has(i._id))
    const now = Date.now()
    for (const item of unread) await ctx.db.insert('inboxReads', { userId: user._id, itemId: item._id, readAt: now })
    return { marked: unread.length }
  }
})

async function resolve(ctx: MutationCtx, itemId: Id<'inboxItems'>, result: Decision, reason?: string) {
  const user = await requireUser(ctx)
  const item = await ctx.db.get('inboxItems', itemId)
  if (!item) throw notFound('Inbox item')
  if (item.resolution !== undefined) throw invalid(`Already ${item.resolution.toLowerCase()}.`)
  const now = Date.now()

  if (item.kind === 'Offer approval' && item.offerId) {
    const offer = await ctx.db.get('offers', item.offerId)
    if (!offer) throw notFound('Offer')
    if (offer.status !== 'Pending approval') throw invalid(`This offer is already ${offer.status.toLowerCase()}.`)
    await ctx.db.patch('offers', offer._id, { status: result, decidedAt: now, decidedById: user._id })
    await ctx.db.insert('activities', {
      candidateId: offer.candidateId,
      applicationId: offer.applicationId,
      type: 'offer',
      text: result === 'Approved' ? 'Offer approved' : `Offer declined${reason ? `: ${reason}` : ''}`,
      actorName: user.name,
      actorUserId: user._id,
      at: now
    })
    if (result === 'Declined') {
      const application = await ctx.db.get('applications', offer.applicationId)
      if (application && application.stage === 'Offer') {
        await ctx.db.patch('applications', application._id, { nextAction: 'Revise the offer and resubmit for approval' })
      }
    }
    await ctx.db.patch('inboxItems', item._id, { resolution: result, resolvedAt: now, resolvedById: user._id })
  } else if (item.kind === 'Time off' && item.timeOffRequestId) {
    await decideTimeOff(ctx, item.timeOffRequestId, result, user, reason)
  } else {
    throw invalid('Only offer and time-off approvals can be approved or declined.')
  }
  await markRead(ctx, user._id, item._id)
}

/** Approves the offer or time-off request behind an inbox item. */
export const approve = mutation({
  args: { itemId: v.id('inboxItems') },
  returns: v.null(),
  handler: async (ctx, args) => {
    await resolve(ctx, args.itemId, 'Approved')
    return null
  }
})

/** Declines the offer or time-off request behind an inbox item. */
export const decline = mutation({
  args: { itemId: v.id('inboxItems'), reason: v.optional(v.string()) },
  returns: v.null(),
  handler: async (ctx, args) => {
    await resolve(ctx, args.itemId, 'Declined', args.reason)
    return null
  }
})

/** Adds a comment to an inbox item's thread. */
export const comment = mutation({
  args: { itemId: v.id('inboxItems'), body: v.string() },
  returns: v.id('comments'),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    const body = args.body.trim()
    if (!body) throw invalid('A comment needs some text.')
    if (body.length > 5000) throw invalid('Comments are limited to 5,000 characters.')
    if (!(await ctx.db.get('inboxItems', args.itemId))) throw notFound('Inbox item')
    return await ctx.db.insert('comments', { inboxItemId: args.itemId, authorId: user._id, body, createdAt: Date.now() })
  }
})

