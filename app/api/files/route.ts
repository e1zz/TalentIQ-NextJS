import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { anthropic, DOCUMENT_MIME_TYPES } from '@/lib/anthropic'
import { isAuthenticated } from '@/lib/utils/supabase/server'
import type { ContextFile } from '@/types/chat'

// Documents in a Messages request are capped at 32 MB in total.
const MAX_FILE_BYTES = 32 * 1024 * 1024

const unauthorized = () => NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

function apiError(error: unknown, fallback: string) {
  console.error(fallback, error)
  const status = error instanceof Anthropic.APIError && error.status ? error.status : 500
  return NextResponse.json({ error: fallback }, { status })
}

// List the documents uploaded for the assistant (Claude Files API)
export async function GET() {
  if (!(await isAuthenticated())) return unauthorized()

  try {
    const files: ContextFile[] = []
    for await (const file of anthropic.files.list()) {
      if (!DOCUMENT_MIME_TYPES.includes(file.mime_type)) continue
      files.push({
        file_id: file.id,
        filename: file.filename,
        size_bytes: file.size_bytes,
        created_at: file.created_at
      })
    }
    return NextResponse.json(files)
  } catch (error) {
    return apiError(error, 'Failed to list files')
  }
}

// Upload a CV or job description once; chat requests reference it by file_id
export async function POST(request: NextRequest) {
  if (!(await isAuthenticated())) return unauthorized()

  const file = (await request.formData()).get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }
  if (!DOCUMENT_MIME_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Only PDF and TXT files are supported' }, { status: 415 })
  }
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: 'File must be 32 MB or smaller' }, { status: 413 })
  }

  try {
    const uploaded = await anthropic.files.upload({ file })
    return NextResponse.json({ file_id: uploaded.id, filename: uploaded.filename })
  } catch (error) {
    return apiError(error, 'Failed to upload file')
  }
}

export async function DELETE(request: NextRequest) {
  if (!(await isAuthenticated())) return unauthorized()

  const { fileId } = await request.json()
  if (typeof fileId !== 'string') {
    return NextResponse.json({ error: 'fileId is required' }, { status: 400 })
  }

  try {
    await anthropic.files.delete(fileId)
    return NextResponse.json({ success: true })
  } catch (error) {
    return apiError(error, 'Failed to delete file')
  }
}
