import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { anthropic, ASSISTANT_MODEL, ASSISTANT_SYSTEM_PROMPT, DOCUMENT_MIME_TYPES } from '@/lib/anthropic'
import { isAuthenticated } from '@/lib/utils/supabase/server'
import type { ChatRequest, ChatStreamEvent, Citation } from '@/types/chat'

export const runtime = 'nodejs'
export const maxDuration = 300

export async function POST(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { messages: history } = (await request.json()) as ChatRequest
  const isValid =
    Array.isArray(history) &&
    history.length > 0 &&
    history.every(m => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string') &&
    history[0].role === 'user' &&
    history[history.length - 1].role === 'user'
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid messages' }, { status: 400 })
  }

  // Every uploaded CV / job description is attached to the first user turn.
  // The list order is stable, so the prefix stays cacheable across turns.
  const documents: Anthropic.Beta.BetaContentBlockParam[] = []
  try {
    for await (const file of anthropic.files.list()) {
      if (!DOCUMENT_MIME_TYPES.includes(file.mime_type)) continue
      documents.push({
        type: 'document',
        source: { type: 'file', file_id: file.id },
        title: file.filename,
        citations: { enabled: true }
      })
    }
  } catch (error) {
    console.error('Failed to list files', error)
    return NextResponse.json({ error: 'Failed to load documents' }, { status: 502 })
  }

  const messages: Anthropic.Beta.BetaMessageParam[] = history.map((message, index) =>
    index === 0 && documents.length > 0
      ? { role: 'user', content: [...documents, { type: 'text', text: message.content }] }
      : { role: message.role, content: message.content }
  )

  const stream = anthropic.beta.messages.stream(
    {
      model: ASSISTANT_MODEL,
      max_tokens: 64000,
      system: ASSISTANT_SYSTEM_PROMPT,
      messages,
      output_config: { effort: 'medium' },
      // Caches the documents and conversation so follow-up turns re-read them cheaply
      cache_control: { type: 'ephemeral' },
      // If a safety classifier declines, retry on Anthropic's recommended fallback model
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default'
    },
    { signal: request.signal }
  )

  const encoder = new TextEncoder()
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: ChatStreamEvent) => {
        try {
          controller.enqueue(encoder.encode(JSON.stringify(event) + '\n'))
        } catch {
          // Client disconnected
        }
      }

      stream.on('text', text => send({ type: 'text', text }))

      try {
        const message = await stream.finalMessage()

        if (message.stop_reason === 'refusal') {
          send({ type: 'error', message: 'Claude declined this request. Try rephrasing it.' })
          return
        }

        // Text before a fallback block came from a model that declined; keep only the final answer.
        const lastFallback = message.content.findLastIndex(block => block.type === 'fallback')
        const textBlocks = message.content
          .slice(lastFallback + 1)
          .filter((block): block is Anthropic.Beta.BetaTextBlock => block.type === 'text')

        send({
          type: 'done',
          content: textBlocks.map(block => block.text).join(''),
          citations: dedupeCitations(textBlocks.flatMap(block => (block.citations ?? []).map(toCitation)))
        })
      } catch (error) {
        if (!(error instanceof Anthropic.APIUserAbortError)) {
          console.error('Chat request failed', error)
          send({
            type: 'error',
            message:
              error instanceof Anthropic.RateLimitError
                ? 'Too many requests. Please wait a moment and try again.'
                : 'Failed to get a response from Claude.'
          })
        }
      } finally {
        try {
          controller.close()
        } catch {
          // Already closed
        }
      }
    }
  })

  return new Response(body, {
    headers: { 'Content-Type': 'application/x-ndjson; charset=utf-8', 'Cache-Control': 'no-cache' }
  })
}

function toCitation(citation: Anthropic.Beta.BetaTextCitation): Citation {
  const base: Citation = {
    documentTitle: 'document_title' in citation ? citation.document_title : null,
    citedText: citation.cited_text
  }
  if (citation.type === 'page_location') {
    // end_page_number is exclusive
    return {
      ...base,
      startPage: citation.start_page_number,
      endPage: Math.max(citation.start_page_number, citation.end_page_number - 1)
    }
  }
  return base
}

function dedupeCitations(citations: Citation[]) {
  const seen = new Set<string>()
  return citations.filter(citation => {
    const key = `${citation.documentTitle}|${citation.startPage}|${citation.citedText}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
