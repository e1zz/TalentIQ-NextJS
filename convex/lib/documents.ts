import { v, type Infer } from 'convex/values'
import type { Doc } from '../_generated/dataModel'
import { personDocumentStatus } from './domain'
import { documentType, personDocumentStatus as personDocumentStatusValidator } from './validators'

/** A document as listed on a person (employee detail panel, candidate profile). */
export const personDocument = v.object({
  _id: v.id('documents'),
  title: v.string(),
  type: documentType,
  status: personDocumentStatusValidator,
  /** Days until `expiresAt` (negative once expired), or null when it doesn't expire. */
  expiresInDays: v.union(v.number(), v.null()),
  hasFile: v.boolean(),
  fileName: v.union(v.string(), v.null()),
  updatedAt: v.number()
})
export type PersonDocument = Infer<typeof personDocument>

export function toPersonDocument(doc: Doc<'documents'>, now: number): PersonDocument {
  const { status, expiresInDays } = personDocumentStatus(doc, now)
  return {
    _id: doc._id,
    title: doc.title,
    type: doc.type,
    status,
    expiresInDays,
    hasFile: doc.storageId !== undefined,
    fileName: doc.fileName ?? null,
    updatedAt: doc.updatedAt
  }
}
