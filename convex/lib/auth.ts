import { ConvexError } from 'convex/values'
import type { UserIdentity } from 'convex/server'
import type { Doc } from '../_generated/dataModel'
import type { ActionCtx, MutationCtx, QueryCtx } from '../_generated/server'

/**
 * Every public query and mutation calls one of these first.
 * Identities come from Clerk session tokens validated by `convex/auth.config.ts`.
 */
export async function requireIdentity(ctx: QueryCtx | MutationCtx | ActionCtx): Promise<UserIdentity> {
  const identity = await ctx.auth.getUserIdentity()
  if (identity === null) {
    throw new ConvexError({ code: 'UNAUTHENTICATED', message: 'Sign in to continue.' })
  }
  return identity
}

/** The `users` row for an identity, or null if `users.ensureUser` hasn't run yet. */
export async function findUser(ctx: QueryCtx, identity: UserIdentity): Promise<Doc<'users'> | null> {
  const byToken = await ctx.db
    .query('users')
    .withIndex('by_tokenIdentifier', q => q.eq('tokenIdentifier', identity.tokenIdentifier))
    .unique()
  if (byToken) return byToken
  return await ctx.db
    .query('users')
    .withIndex('by_subject', q => q.eq('subject', identity.subject))
    .first()
}

/** Requires a signed-in caller and returns their `users` row (null before `ensureUser`). */
export async function requireViewer(ctx: QueryCtx): Promise<{ identity: UserIdentity; user: Doc<'users'> | null }> {
  const identity = await requireIdentity(ctx)
  return { identity, user: await findUser(ctx, identity) }
}

function nameFromIdentity(identity: UserIdentity, fallback?: string): string {
  const fromParts = [identity.givenName, identity.familyName].filter(Boolean).join(' ')
  return identity.name ?? (fromParts || undefined) ?? fallback ?? identity.email ?? 'TalentIQ user'
}

/**
 * Requires a signed-in caller and returns their `users` row, creating it on first use.
 * Mutations use this so actions are always attributed to a user.
 */
export async function requireUser(
  ctx: MutationCtx,
  profile: { name?: string; email?: string; imageUrl?: string } = {}
): Promise<Doc<'users'>> {
  const identity = await requireIdentity(ctx)
  const existing = await findUser(ctx, identity)
  if (existing) {
    if (existing.tokenIdentifier !== identity.tokenIdentifier) {
      await ctx.db.patch('users', existing._id, { tokenIdentifier: identity.tokenIdentifier })
    }
    return (await ctx.db.get('users', existing._id))!
  }
  const name = nameFromIdentity(identity, profile.name)
  const userId = await ctx.db.insert('users', {
    name,
    firstName: identity.givenName ?? name.split(' ')[0],
    email: identity.email ?? profile.email,
    imageUrl: identity.pictureUrl ?? profile.imageUrl,
    tokenIdentifier: identity.tokenIdentifier,
    subject: identity.subject
  })
  return (await ctx.db.get('users', userId))!
}

export function notFound(what: string): ConvexError<{ code: string; message: string }> {
  return new ConvexError({ code: 'NOT_FOUND', message: `${what} not found.` })
}

export function invalid(message: string): ConvexError<{ code: string; message: string }> {
  return new ConvexError({ code: 'INVALID', message })
}
