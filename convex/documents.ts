import { v } from 'convex/values'
import type { Doc } from './_generated/dataModel'
import { mutation, query, type QueryCtx } from './_generated/server'
import { invalid, notFound, requireIdentity, requireUser } from './lib/auth'
import { EXPIRING_WINDOW_DAYS, getUsersById, signatureStatus, signerProgress, toUserRef, userRefOrNull } from './lib/domain'
import { DAY, daysBetween, resolveNow, startOfDay, startOfMonth } from './lib/time'
import {
  DOCUMENT_FOLDERS,
  documentFolder,
  documentStatus,
  documentType,
  signatureStatus as signatureStatusValidator,
  signer,
  userRef
} from './lib/validators'

/** Largest file `saveDocument` accepts. */
const MAX_FILE_BYTES = 20 * 1024 * 1024
const ALLOWED_CONTENT_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'image/png',
  'image/jpeg'
])

const person = v.union(
  v.object({ kind: v.literal('employee'), _id: v.id('employees'), name: v.string() }),
  v.object({ kind: v.literal('candidate'), _id: v.id('candidates'), name: v.string() })
)

async function personFor(ctx: QueryCtx, doc: Doc<'documents'>) {
  if (doc.employeeId) {
    const employee = await ctx.db.get('employees', doc.employeeId)
    if (employee) return { kind: 'employee' as const, _id: employee._id, name: employee.name }
  }
  if (doc.candidateId) {
    const candidate = await ctx.db.get('candidates', doc.candidateId)
    if (candidate) return { kind: 'candidate' as const, _id: candidate._id, name: candidate.name }
  }
  return null
}

/** Documents KPIs: waiting for signature, signed this month, expiring in 30 days, missing. */
export const kpis = query({
  args: { now: v.optional(v.number()) },
  returns: v.object({
    waitingForSignature: v.number(),
    /** Of those waiting, how many are past their due date. */
    overdue: v.number(),
    signedThisMonth: v.number(),
    expiringIn30d: v.number(),
    missing: v.number()
  }),
  handler: async (ctx, args) => {
    await requireIdentity(ctx)
    const now = resolveNow(args.now)
    const today = startOfDay(now)
    const [waiting, signed, expiring, missing] = await Promise.all([
      ctx.db
        .query('documents')
        .withIndex('by_status', q => q.eq('status', 'Waiting'))
        .take(1000),
      ctx.db
        .query('documents')
        .withIndex('by_signedAt', q => q.gte('signedAt', startOfMonth(now)).lte('signedAt', now))
        .take(1000),
      ctx.db
        .query('documents')
        .withIndex('by_expiresAt', q => q.gte('expiresAt', today).lte('expiresAt', today + EXPIRING_WINDOW_DAYS * DAY))
        .take(1000),
      ctx.db
        .query('documents')
        .withIndex('by_status', q => q.eq('status', 'Missing'))
        .take(1000)
    ])
    return {
      waitingForSignature: waiting.length,
      overdue: waiting.filter(d => signatureStatus(d, now) === 'Overdue').length,
      signedThisMonth: signed.length,
      expiringIn30d: expiring.length,
      missing: missing.length
    }
  }
})

const signatureRow = v.object({
  _id: v.id('documents'),
  title: v.string(),
  type: documentType,
  person: v.union(person, v.null()),
  sentAt: v.number(),
  sentBy: v.union(userRef, v.null()),
  dueAt: v.union(v.number(), v.null()),
  signersSigned: v.number(),
  signersTotal: v.number(),
  status: signatureStatusValidator,
  lastRemindedAt: v.union(v.number(), v.null())
})

/** "Out for signature": waiting documents plus those signed in the last 30 days, newest first. */
export const outForSignature = query({
  args: { now: v.optional(v.number()), limit: v.optional(v.number()) },
  returns: v.array(signatureRow),
  handler: async (ctx, args) => {
    await requireIdentity(ctx)
    const now = resolveNow(args.now)
    const recent = await ctx.db
      .query('documents')
      .withIndex('by_sentAt', q => q.gt('sentAt', 0))
      .order('desc')
      .take(500)
    const rows = recent
      .filter(d => d.status === 'Waiting' || (d.status === 'Signed' && (d.signedAt ?? 0) >= now - 30 * DAY))
      .slice(0, Math.min(Math.max(args.limit ?? 25, 1), 100))
    const senders = await getUsersById(
      ctx,
      rows.map(d => d.sentById)
    )
    return await Promise.all(
      rows.map(async d => {
        const progress = signerProgress(d)
        return {
          _id: d._id,
          title: d.title,
          type: d.type,
          person: await personFor(ctx, d),
          sentAt: d.sentAt!,
          sentBy: userRefOrNull(senders, d.sentById),
          dueAt: d.dueAt ?? null,
          signersSigned: progress.signed,
          signersTotal: progress.total,
          status: signatureStatus(d, now),
          lastRemindedAt: d.lastRemindedAt ?? null
        }
      })
    )
  }
})

/** Every folder with its document count. */
export const folders = query({
  args: {},
  returns: v.array(v.object({ folder: documentFolder, count: v.number() })),
  handler: async ctx => {
    await requireIdentity(ctx)
    return await Promise.all(
      DOCUMENT_FOLDERS.map(async folder => ({
        folder,
        count: (
          await ctx.db
            .query('documents')
            .withIndex('by_folder', q => q.eq('folder', folder))
            .take(5000)
        ).length
      }))
    )
  }
})

const documentRow = v.object({
  _id: v.id('documents'),
  title: v.string(),
  type: documentType,
  folder: documentFolder,
  status: documentStatus,
  person: v.union(person, v.null()),
  owner: v.union(userRef, v.null()),
  hasFile: v.boolean(),
  fileName: v.union(v.string(), v.null()),
  contentType: v.union(v.string(), v.null()),
  size: v.union(v.number(), v.null()),
  version: v.number(),
  updatedAt: v.number()
})

/** Documents in a folder, or for one employee or candidate, newest first. */
export const list = query({
  args: {
    folder: v.optional(documentFolder),
    employeeId: v.optional(v.id('employees')),
    candidateId: v.optional(v.id('candidates')),
    limit: v.optional(v.number())
  },
  returns: v.array(documentRow),
  handler: async (ctx, args) => {
    await requireIdentity(ctx)
    const limit = Math.min(Math.max(args.limit ?? 100, 1), 500)
    let docs: Doc<'documents'>[]
    if (args.employeeId) {
      docs = await ctx.db
        .query('documents')
        .withIndex('by_employee', q => q.eq('employeeId', args.employeeId))
        .take(500)
    } else if (args.candidateId) {
      docs = await ctx.db
        .query('documents')
        .withIndex('by_candidate', q => q.eq('candidateId', args.candidateId))
        .take(500)
    } else if (args.folder) {
      docs = await ctx.db
        .query('documents')
        .withIndex('by_folder', q => q.eq('folder', args.folder!))
        .take(5000)
    } else {
      docs = await ctx.db.query('documents').order('desc').take(limit)
    }
    if (args.folder) docs = docs.filter(d => d.folder === args.folder)
    docs = docs.sort((a, b) => b.updatedAt - a.updatedAt).slice(0, limit)
    const owners = await getUsersById(
      ctx,
      docs.map(d => d.ownerId)
    )
    return await Promise.all(
      docs.map(async d => ({
        _id: d._id,
        title: d.title,
        type: d.type,
        folder: d.folder,
        status: d.status,
        person: await personFor(ctx, d),
        owner: userRefOrNull(owners, d.ownerId),
        hasFile: d.storageId !== undefined,
        fileName: d.fileName ?? null,
        contentType: d.contentType ?? null,
        size: d.size ?? null,
        version: d.version,
        updatedAt: d.updatedAt
      }))
    )
  }
})

/** Document detail: version, template, owner, sharing and signer statuses. */
export const get = query({
  args: { documentId: v.id('documents'), now: v.optional(v.number()) },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id('documents'),
      title: v.string(),
      type: documentType,
      folder: documentFolder,
      status: documentStatus,
      /** Null unless the document was sent for signature. */
      signatureStatus: v.union(signatureStatusValidator, v.null()),
      version: v.number(),
      template: v.union(v.string(), v.null()),
      owner: v.union(userRef, v.null()),
      sharedWith: v.array(userRef),
      person: v.union(person, v.null()),
      sentAt: v.union(v.number(), v.null()),
      sentBy: v.union(userRef, v.null()),
      dueAt: v.union(v.number(), v.null()),
      signedAt: v.union(v.number(), v.null()),
      expiresAt: v.union(v.number(), v.null()),
      expiresInDays: v.union(v.number(), v.null()),
      signers: v.array(signer),
      lastRemindedAt: v.union(v.number(), v.null()),
      hasFile: v.boolean(),
      fileName: v.union(v.string(), v.null()),
      contentType: v.union(v.string(), v.null()),
      size: v.union(v.number(), v.null()),
      updatedAt: v.number()
    })
  ),
  handler: async (ctx, args) => {
    await requireIdentity(ctx)
    const now = resolveNow(args.now)
    const doc = await ctx.db.get('documents', args.documentId)
    if (!doc) return null
    const users = await getUsersById(ctx, [doc.ownerId, doc.sentById, ...doc.sharedWithIds])
    return {
      _id: doc._id,
      title: doc.title,
      type: doc.type,
      folder: doc.folder,
      status: doc.status,
      signatureStatus: doc.sentAt === undefined ? null : signatureStatus(doc, now),
      version: doc.version,
      template: doc.template ?? null,
      owner: userRefOrNull(users, doc.ownerId),
      sharedWith: doc.sharedWithIds.flatMap(id => {
        const u = users.get(id)
        return u ? [toUserRef(u)] : []
      }),
      person: await personFor(ctx, doc),
      sentAt: doc.sentAt ?? null,
      sentBy: userRefOrNull(users, doc.sentById),
      dueAt: doc.dueAt ?? null,
      signedAt: doc.signedAt ?? null,
      expiresAt: doc.expiresAt ?? null,
      expiresInDays: doc.expiresAt === undefined ? null : daysBetween(now, doc.expiresAt),
      signers: doc.signers,
      lastRemindedAt: doc.lastRemindedAt ?? null,
      hasFile: doc.storageId !== undefined,
      fileName: doc.fileName ?? null,
      contentType: doc.contentType ?? null,
      size: doc.size ?? null,
      updatedAt: doc.updatedAt
    }
  }
})

/** Records a reminder to everyone who still has to sign. */
export const remind = mutation({
  args: { documentId: v.id('documents') },
  returns: v.object({ remindedAt: v.number(), waitingSigners: v.array(v.string()) }),
  handler: async (ctx, args) => {
    await requireUser(ctx)
    const doc = await ctx.db.get('documents', args.documentId)
    if (!doc) throw notFound('Document')
    if (doc.status !== 'Waiting') throw invalid('Only documents waiting for signature can be reminded.')
    const remindedAt = Date.now()
    await ctx.db.patch('documents', doc._id, { lastRemindedAt: remindedAt })
    return { remindedAt, waitingSigners: doc.signers.filter(s => s.status === 'Waiting').map(s => s.name) }
  }
})

/**
 * Step 1 of an upload: a short-lived URL to POST the file to. The response JSON has
 * `storageId`; pass it to `saveDocument`.
 */
export const generateUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async ctx => {
    await requireUser(ctx)
    return await ctx.storage.generateUploadUrl()
  }
})

/**
 * Step 2 of an upload: validates the stored file (20 MB max; PDF, Word, TXT, PNG or JPEG)
 * and creates the document. With `documentId`, attaches the file to an existing document
 * instead (fills a Missing document or adds a new version).
 */
export const saveDocument = mutation({
  args: {
    storageId: v.id('_storage'),
    fileName: v.string(),
    documentId: v.optional(v.id('documents')),
    title: v.optional(v.string()),
    type: v.optional(documentType),
    folder: v.optional(documentFolder),
    employeeId: v.optional(v.id('employees')),
    candidateId: v.optional(v.id('candidates')),
    applicationId: v.optional(v.id('applications'))
  },
  returns: v.id('documents'),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    const meta = await ctx.db.system.get('_storage', args.storageId)
    if (!meta) throw notFound('Uploaded file')
    const contentType = meta.contentType ?? ''
    if (meta.size > MAX_FILE_BYTES || !ALLOWED_CONTENT_TYPES.has(contentType)) {
      await ctx.storage.delete(args.storageId)
      throw invalid(
        meta.size > MAX_FILE_BYTES ? 'Files must be 20 MB or smaller.' : 'Upload a PDF, Word, TXT, PNG or JPEG file.'
      )
    }
    const fileName = args.fileName.trim().slice(0, 200) || 'Untitled'
    const now = Date.now()

    if (args.documentId) {
      const existing = await ctx.db.get('documents', args.documentId)
      if (!existing) {
        await ctx.storage.delete(args.storageId)
        throw notFound('Document')
      }
      if (existing.storageId) await ctx.storage.delete(existing.storageId)
      await ctx.db.patch('documents', existing._id, {
        storageId: args.storageId,
        fileName,
        contentType,
        size: meta.size,
        version: existing.storageId ? existing.version + 1 : existing.version,
        status: existing.status === 'Missing' ? 'Uploaded' : existing.status,
        uploadedById: user._id,
        updatedAt: now
      })
      return existing._id
    }

    if (args.employeeId && !(await ctx.db.get('employees', args.employeeId))) throw notFound('Employee')
    if (args.candidateId && !(await ctx.db.get('candidates', args.candidateId))) throw notFound('Candidate')
    const type = args.type ?? (args.candidateId ? 'CV' : 'Other')
    return await ctx.db.insert('documents', {
      title: args.title?.trim() || fileName.replace(/\.[^.]+$/, ''),
      type,
      folder: args.folder ?? (type === 'CV' || type === 'Portfolio' ? 'Candidate CVs' : 'Compliance'),
      status: 'Uploaded',
      ownerId: user._id,
      employeeId: args.employeeId,
      candidateId: args.candidateId,
      applicationId: args.applicationId,
      storageId: args.storageId,
      fileName,
      contentType,
      size: meta.size,
      version: 1,
      sharedWithIds: [],
      signers: [],
      uploadedById: user._id,
      updatedAt: now
    })
  }
})

/**
 * A download URL for a document's file, issued only to signed-in users and never stored.
 * Null when the document has no file. Fetch it when the user clicks download.
 */
export const getDownloadUrl = query({
  args: { documentId: v.id('documents') },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    await requireIdentity(ctx)
    const doc = await ctx.db.get('documents', args.documentId)
    if (!doc?.storageId) return null
    return await ctx.storage.getUrl(doc.storageId)
  }
})

/** Deletes a document and its file. */
export const remove = mutation({
  args: { documentId: v.id('documents') },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireUser(ctx)
    const doc = await ctx.db.get('documents', args.documentId)
    if (!doc) return null
    if (doc.storageId) await ctx.storage.delete(doc.storageId)
    const items = await ctx.db.query('inboxItems').withIndex('by_createdAt').order('desc').take(500)
    for (const item of items.filter(i => i.documentId === doc._id)) {
      await ctx.db.patch('inboxItems', item._id, { documentId: undefined })
    }
    await ctx.db.delete('documents', doc._id)
    return null
  }
})
