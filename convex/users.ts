import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { requireIdentity, requireUser, requireViewer } from './lib/auth'
import { department } from './lib/validators'

const currentUser = v.object({
  _id: v.id('users'),
  name: v.string(),
  firstName: v.string(),
  email: v.union(v.string(), v.null()),
  title: v.union(v.string(), v.null()),
  imageUrl: v.union(v.string(), v.null()),
  department: v.union(department, v.null()),
  employeeId: v.union(v.id('employees'), v.null())
})

/** The signed-in user's profile, or null until `ensureUser` has created it. */
export const me = query({
  args: {},
  returns: v.union(currentUser, v.null()),
  handler: async ctx => {
    const { user } = await requireViewer(ctx)
    if (!user) return null
    const employee = user.employeeId ? await ctx.db.get('employees', user.employeeId) : null
    return {
      _id: user._id,
      name: user.name,
      firstName: user.firstName,
      email: user.email ?? employee?.email ?? null,
      title: user.title ?? employee?.title ?? null,
      imageUrl: user.imageUrl ?? null,
      department: employee?.department ?? null,
      employeeId: user.employeeId ?? null
    }
  }
})

/**
 * Creates (or refreshes) the `users` row for the signed-in Clerk user. Call it once after
 * sign-in. Clerk's default session token has no profile claims, so pass the name, email
 * and image from Clerk's `useUser()`.
 */
export const ensureUser = mutation({
  args: {
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    imageUrl: v.optional(v.string())
  },
  returns: v.id('users'),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args)
    const patch: { name?: string; firstName?: string; email?: string; imageUrl?: string } = {}
    const name = args.name?.trim()
    if (name && name !== user.name) {
      patch.name = name
      patch.firstName = name.split(/\s+/)[0]
    }
    if (args.email && args.email !== user.email) patch.email = args.email
    if (args.imageUrl && args.imageUrl !== user.imageUrl) patch.imageUrl = args.imageUrl
    if (Object.keys(patch).length > 0) await ctx.db.patch('users', user._id, patch)
    return user._id
  }
})

/** Everyone who uses TalentIQ, for pickers (approvers, document sharing). */
export const list = query({
  args: {},
  returns: v.array(v.object({ _id: v.id('users'), name: v.string(), title: v.union(v.string(), v.null()) })),
  handler: async ctx => {
    await requireIdentity(ctx)
    const users = await ctx.db.query('users').take(200)
    return users
      .map(u => ({ _id: u._id, name: u.name, title: u.title ?? null }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }
})
