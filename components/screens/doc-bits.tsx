'use client'

import { useConvex } from 'convex/react'
import { toast } from 'sonner'

import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import type { PersonDocumentStatus } from '@/convex/lib/validators'
import type { StatusTone } from '@/components/hr'
import { errorText } from '@/components/screens/form-dialog'

export const PERSON_DOC_TONE: Record<PersonDocumentStatus, StatusTone> = {
  Signed: 'success',
  Uploaded: 'success',
  Waiting: 'warning',
  Overdue: 'danger',
  'Expires soon': 'warning',
  Expired: 'danger',
  Missing: 'danger',
  Draft: 'neutral'
}

/** Returns a click handler that fetches a short-lived download URL and opens it. */
export function useOpenDocument() {
  const convex = useConvex()
  return async (documentId: Id<'documents'>) => {
    try {
      const url = await convex.query(api.documents.getDownloadUrl, { documentId })
      if (!url) {
        toast.info('No file has been uploaded for this document yet.')
        return
      }
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (err) {
      toast.error(errorText(err))
    }
  }
}
