import type { Doc, Id } from '../_generated/dataModel'
import type { QueryCtx } from '../_generated/server'

/** Inbox items visible to a user (team-wide items plus items addressed to them), newest first. */
export async function visibleItems(ctx: QueryCtx, userId: Id<'users'> | null): Promise<Doc<'inboxItems'>[]> {
  const items = await ctx.db.query('inboxItems').withIndex('by_createdAt').order('desc').take(500)
  return items.filter(i => i.recipientId === undefined || i.recipientId === userId)
}

export async function readItemIds(ctx: QueryCtx, userId: Id<'users'> | null): Promise<Set<Id<'inboxItems'>>> {
  if (userId === null) return new Set()
  const reads = await ctx.db
    .query('inboxReads')
    .withIndex('by_user_and_item', q => q.eq('userId', userId))
    .take(5000)
  return new Set(reads.map(r => r.itemId))
}

export async function unreadCount(ctx: QueryCtx, userId: Id<'users'> | null): Promise<number> {
  const [items, read] = await Promise.all([visibleItems(ctx, userId), readItemIds(ctx, userId)])
  return items.filter(i => !read.has(i._id)).length
}
