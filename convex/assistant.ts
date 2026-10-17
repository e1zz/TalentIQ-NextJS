import { v } from 'convex/values'
import type { Doc, Id } from './_generated/dataModel'
import { mutation, query, type MutationCtx } from './_generated/server'
import { invalid, notFound, requireUser, requireViewer } from './lib/auth'
import { citation, messageRole } from './lib/validators'

/**
 * Conversation history for the AI assistant. Claude itself is called from
 * `app/api/chat`; the UI stores each turn here with `addMessage`.
 */

const MAX_MESSAGE_CHARS = 100_000

function preview(text: string): string {
  const flat = text.replace(/\s+/g, ' ').trim()
  return flat.length > 140 ? `${flat.slice(0, 139)}…` : flat
}

function titleFrom(text: string): string {
  const flat = text.replace(/\s+/g, ' ').trim()
  return flat.length > 60 ? `${flat.slice(0, 59)}…` : flat || 'New conversation'
}

async function ownConversation(ctx: MutationCtx, userId: Id<'users'>, conversationId: Id<'conversations'>) {
  const conversation = await ctx.db.get('conversations', conversationId)
  if (!conversation || conversation.userId !== userId) throw notFound('Conversation')
  return conversation
}

/** The signed-in user's recent conversations, newest first. */
export const recentConversations = query({
  args: { limit: v.optional(v.number()) },
  returns: v.array(
    v.object({
      _id: v.id('conversations'),
      title: v.string(),
      updatedAt: v.number(),
      lastMessagePreview: v.union(v.string(), v.null())
    })
  ),
  handler: async (ctx, args) => {
    const { user } = await requireViewer(ctx)
    if (!user) return []
    const conversations = await ctx.db
      .query('conversations')
      .withIndex('by_user_and_updatedAt', q => q.eq('userId', user._id))
      .order('desc')
      .take(Math.min(Math.max(args.limit ?? 10, 1), 100))
    return conversations.map(c => ({
      _id: c._id,
      title: c.title,
      updatedAt: c.updatedAt,
      lastMessagePreview: c.lastMessagePreview ?? null
    }))
  }
})

/** A conversation and its messages, oldest first. Null if it isn't the caller's. */
export const getConversation = query({
  args: { conversationId: v.id('conversations') },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id('conversations'),
      title: v.string(),
      updatedAt: v.number(),
      messages: v.array(
        v.object({
          _id: v.id('messages'),
          role: messageRole,
          content: v.string(),
          citations: v.array(citation),
          createdAt: v.number()
        })
      )
    })
  ),
  handler: async (ctx, args) => {
    const { user } = await requireViewer(ctx)
    const conversation = await ctx.db.get('conversations', args.conversationId)
    if (!user || !conversation || conversation.userId !== user._id) return null
    const messages: Doc<'messages'>[] = await ctx.db
      .query('messages')
      .withIndex('by_conversation', q => q.eq('conversationId', conversation._id))
      .take(1000)
    return {
      _id: conversation._id,
      title: conversation.title,
      updatedAt: conversation.updatedAt,
      messages: messages.map(m => ({
        _id: m._id,
        role: m.role,
        content: m.content,
        citations: m.citations ?? [],
        createdAt: m._creationTime
      }))
    }
  }
})

/** Starts a conversation, optionally with the first user message (which also sets the title). */
export const createConversation = mutation({
  args: { title: v.optional(v.string()), firstMessage: v.optional(v.string()) },
  returns: v.id('conversations'),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    const first = args.firstMessage?.trim()
    if (first && first.length > MAX_MESSAGE_CHARS) throw invalid('That message is too long.')
    const now = Date.now()
    const conversationId = await ctx.db.insert('conversations', {
      userId: user._id,
      title: args.title?.trim() || titleFrom(first ?? ''),
      updatedAt: now,
      lastMessagePreview: first ? preview(first) : undefined
    })
    if (first) await ctx.db.insert('messages', { conversationId, role: 'user', content: first })
    return conversationId
  }
})

/** Appends a user or assistant message (with Claude's citations, if any). */
export const addMessage = mutation({
  args: {
    conversationId: v.id('conversations'),
    role: messageRole,
    content: v.string(),
    citations: v.optional(v.array(citation))
  },
  returns: v.id('messages'),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    const conversation = await ownConversation(ctx, user._id, args.conversationId)
    if (args.content.length > MAX_MESSAGE_CHARS) throw invalid('That message is too long.')
    const id = await ctx.db.insert('messages', {
      conversationId: conversation._id,
      role: args.role,
      content: args.content,
      citations: args.citations
    })
    await ctx.db.patch('conversations', conversation._id, { updatedAt: Date.now(), lastMessagePreview: preview(args.content) })
    return id
  }
})

export const renameConversation = mutation({
  args: { conversationId: v.id('conversations'), title: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    const conversation = await ownConversation(ctx, user._id, args.conversationId)
    const title = args.title.trim()
    if (!title) throw invalid('A conversation needs a title.')
    await ctx.db.patch('conversations', conversation._id, { title: title.slice(0, 120) })
    return null
  }
})

/** Deletes a conversation and its messages. */
export const deleteConversation = mutation({
  args: { conversationId: v.id('conversations') },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    const conversation = await ownConversation(ctx, user._id, args.conversationId)
    const messages = await ctx.db
      .query('messages')
      .withIndex('by_conversation', q => q.eq('conversationId', conversation._id))
      .take(4000)
    for (const m of messages) await ctx.db.delete('messages', m._id)
    await ctx.db.delete('conversations', conversation._id)
    return null
  }
})
