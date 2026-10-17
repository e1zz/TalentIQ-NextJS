'use client'

import * as React from 'react'
import Markdown from 'react-markdown'
import { useMutation, useQuery } from 'convex/react'
import { ArrowRight, FileText, MessageSquare, Plus, Sparkles, Trash2, Upload } from 'lucide-react'
import { toast } from 'sonner'

import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import type { ChatMessage, ChatStreamEvent, Citation, ContextFile } from '@/types/chat'
import { HrButton, PageHeader, SectionCard, Tag } from '@/components/hr'
import { errorText } from '@/components/screens/form-dialog'
import { LoadingRows } from '@/components/screens/skeleton'
import { cn } from '@/lib/utils'

const SUGGESTIONS = [
  'Who are the strongest candidates for the open roles?',
  'Summarize the uploaded CVs against the job description',
  'Which skills are missing across the shortlist?'
]

function citationLabel(c: Citation) {
  const title = c.documentTitle ?? 'Document'
  if (c.startPage === undefined) return title
  return c.startPage === c.endPage ? `${title} · p. ${c.startPage}` : `${title} · pp. ${c.startPage}–${c.endPage}`
}

/** CVs and job descriptions sent to Claude with every question (Claude Files API). */
function ContextFiles() {
  const [files, setFiles] = React.useState<ContextFile[] | null>(null)
  const [busy, setBusy] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const [version, setVersion] = React.useState(0)
  const load = () => setVersion(v => v + 1)
  React.useEffect(() => {
    let cancelled = false
    fetch('/api/files')
      .then(res => (res.ok ? res.json() : []))
      .then((data: ContextFile[]) => {
        if (!cancelled) setFiles(data)
      })
      .catch(() => {
        if (!cancelled) setFiles([])
      })
    return () => {
      cancelled = true
    }
  }, [version])

  return (
    <SectionCard
      title='Documents in context'
      titleAs='h2'
      headerActions={
        <>
          <input
            ref={inputRef}
            type='file'
            accept='.pdf,.txt'
            className='sr-only'
            aria-label='Upload a CV or job description'
            onChange={async e => {
              const file = e.target.files?.[0]
              if (!file) return
              setBusy(true)
              const body = new FormData()
              body.append('file', file)
              const res = await fetch('/api/files', { method: 'POST', body })
              setBusy(false)
              e.target.value = ''
              if (!res.ok) toast.error((await res.json().catch(() => null))?.error ?? 'Upload failed')
              else {
                toast.success(`${file.name} added`)
                load()
              }
            }}
          />
          <HrButton variant='ghost' size='sm' disabled={busy} onClick={() => inputRef.current?.click()}>
            <Upload aria-hidden='true' />
            {busy ? 'Uploading…' : 'Add'}
          </HrButton>
        </>
      }
    >
      {files === null ? (
        <LoadingRows rows={2} label='Loading documents' />
      ) : files.length === 0 ? (
        <p className='text-meta text-muted-foreground'>Add CVs or a job description (PDF or TXT) so answers can cite them.</p>
      ) : (
        <ul className='flex flex-col gap-2'>
          {files.map(f => (
            <li key={f.file_id} className='flex items-center gap-2 text-body text-fg-body'>
              <FileText aria-hidden='true' className='size-4 shrink-0 text-icon' strokeWidth={1.75} />
              <span className='min-w-0 flex-1 truncate'>{f.filename}</span>
              <button
                type='button'
                aria-label={`Remove ${f.filename}`}
                className='hit-target inline-flex size-7 items-center justify-center rounded-sm text-icon hover:bg-muted hover:text-danger-foreground'
                onClick={async () => {
                  await fetch('/api/files', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fileId: f.file_id }) })
                  load()
                }}
              >
                <Trash2 aria-hidden='true' className='size-4' strokeWidth={1.75} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  )
}

export default function AssistantPage() {
  const [conversationId, setConversationId] = React.useState<Id<'conversations'> | null>(null)
  const [draft, setDraft] = React.useState<ChatMessage[] | null>(null)
  const [input, setInput] = React.useState('')
  const [streaming, setStreaming] = React.useState(false)
  const logRef = React.useRef<HTMLDivElement>(null)

  const recent = useQuery(api.assistant.recentConversations, { limit: 8 })
  const saved = useQuery(api.assistant.getConversation, conversationId ? { conversationId } : 'skip')
  const createConversation = useMutation(api.assistant.createConversation)
  const addMessage = useMutation(api.assistant.addMessage)
  const deleteConversation = useMutation(api.assistant.deleteConversation)

  // While a reply streams, show the local draft; otherwise the saved conversation.
  const messages: ChatMessage[] =
    draft ?? saved?.messages.map(m => ({ role: m.role, content: m.content, citations: m.citations })) ?? []

  React.useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight })
  }, [messages.length, draft])

  async function send(text: string) {
    const content = text.trim()
    if (!content || streaming) return
    const history: ChatMessage[] = [...messages, { role: 'user', content }]
    setDraft([...history, { role: 'assistant', content: '' }])
    setInput('')
    setStreaming(true)

    let id = conversationId
    try {
      if (id) await addMessage({ conversationId: id, role: 'user', content })
      else {
        id = await createConversation({ firstMessage: content })
        setConversationId(id)
      }

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history.map(({ role, content }) => ({ role, content })) })
      })
      if (!res.ok || !res.body) throw new Error((await res.json().catch(() => null))?.error ?? `Request failed (${res.status})`)

      const reader = res.body.pipeThrough(new TextDecoderStream()).getReader()
      let buffer = ''
      let final: { content: string; citations: Citation[] } | null = null
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        buffer += value
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.trim()) continue
          const event = JSON.parse(line) as ChatStreamEvent
          if (event.type === 'text') {
            setDraft(d => (d ? [...d.slice(0, -1), { ...d[d.length - 1], content: d[d.length - 1].content + event.text }] : d))
          } else if (event.type === 'done') {
            final = { content: event.content, citations: event.citations }
          } else {
            throw new Error(event.message)
          }
        }
      }
      if (final) await addMessage({ conversationId: id, role: 'assistant', content: final.content, citations: final.citations })
      setDraft(null)
    } catch (err) {
      const message = errorText(err)
      setDraft(d => (d ? [...d.slice(0, -1), { role: 'assistant', content: `⚠️ ${message}` }] : d))
      toast.error(message)
    } finally {
      setStreaming(false)
    }
  }

  function newChat() {
    setConversationId(null)
    setDraft(null)
  }

  return (
    <div className='flex flex-col gap-6'>
      <PageHeader
        title='AI assistant'
        subtitle='Ask about candidates, roles and the documents you add. Answers cite the CV pages they come from.'
        actions={
          <HrButton variant='primary' onClick={newChat}>
            <Plus aria-hidden='true' />
            New chat
          </HrButton>
        }
      />

      <div className='grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]'>
        <div className='flex flex-col gap-6'>
          <SectionCard title='Recent' titleAs='h2'>
            {recent === undefined ? (
              <LoadingRows rows={4} label='Loading conversations' />
            ) : recent.length === 0 ? (
              <p className='text-meta text-muted-foreground'>Your conversations will show here.</p>
            ) : (
              <ul className='-mx-2 flex flex-col'>
                {recent.map(c => (
                  <li key={c._id} className='group flex items-center'>
                    <button
                      type='button'
                      aria-current={c._id === conversationId ? 'true' : undefined}
                      onClick={() => {
                        setDraft(null)
                        setConversationId(c._id)
                      }}
                      className={cn(
                        'flex min-h-10 min-w-0 flex-1 items-center gap-2 rounded-sm px-2 text-left text-body text-fg-body hover:bg-muted',
                        c._id === conversationId && 'bg-brand-soft font-semibold text-brand-fg'
                      )}
                    >
                      <MessageSquare aria-hidden='true' className='size-4 shrink-0 text-icon' strokeWidth={1.75} />
                      <span className='truncate'>{c.title}</span>
                    </button>
                    <button
                      type='button'
                      aria-label={`Delete ${c.title}`}
                      onClick={async () => {
                        await deleteConversation({ conversationId: c._id })
                        if (c._id === conversationId) newChat()
                      }}
                      className='hit-target inline-flex size-8 items-center justify-center rounded-sm text-icon opacity-0 group-hover:opacity-100 hover:text-danger-foreground focus-visible:opacity-100'
                    >
                      <Trash2 aria-hidden='true' className='size-4' strokeWidth={1.75} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
          <ContextFiles />
        </div>

        <section aria-label='Conversation' className='flex min-h-[560px] flex-col rounded-lg border border-border bg-card'>
          <div ref={logRef} role='log' aria-live='polite' aria-busy={streaming} className='flex max-h-[calc(100dvh-20rem)] min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-6'>
            {messages.length === 0 ? (
              <div className='m-auto flex max-w-md flex-col items-center gap-3 text-center'>
                <span className='inline-flex size-12 items-center justify-center rounded-full bg-brand-soft text-brand-fg'>
                  <Sparkles aria-hidden='true' className='size-6' strokeWidth={1.75} />
                </span>
                <p className='text-card-title font-bold text-foreground'>What do you want to know?</p>
                <p className='text-body text-fg-secondary'>Add CVs and a job description on the left, then ask. Every claim links back to its page.</p>
              </div>
            ) : (
              messages.map((m, i) =>
                m.role === 'user' ? (
                  <p key={i} className='ml-auto max-w-[80%] rounded-lg rounded-br-sm bg-primary px-4 py-2.5 text-body whitespace-pre-wrap text-primary-foreground'>
                    {m.content}
                  </p>
                ) : (
                  <div key={i} className='flex max-w-[88%] gap-3'>
                    <span className='inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground'>
                      <Sparkles aria-hidden='true' className='size-4' strokeWidth={1.75} />
                    </span>
                    <div className='min-w-0 rounded-lg border border-border px-4 py-3 text-body text-fg-body'>
                      {m.content ? (
                        <div className='space-y-2 [&_a]:text-brand-fg [&_a]:underline [&_li]:ml-5 [&_ol]:list-decimal [&_strong]:text-foreground [&_table]:text-meta [&_td]:border [&_td]:border-border [&_td]:px-2 [&_th]:border [&_th]:border-border [&_th]:px-2 [&_ul]:list-disc'>
                          <Markdown>{m.content}</Markdown>
                        </div>
                      ) : (
                        <span className='inline-flex gap-1' role='status' aria-label='Thinking'>
                          {[0, 150, 300].map(d => (
                            <span key={d} className='size-1.5 animate-bounce rounded-full bg-icon motion-reduce:animate-none' style={{ animationDelay: `${d}ms` }} />
                          ))}
                        </span>
                      )}
                      {m.citations?.length ? (
                        <div className='mt-3 flex flex-wrap gap-1.5 border-t border-border-subtle pt-2.5'>
                          {m.citations.map((c, j) => (
                            <Tag key={j} tone='brand' icon={<FileText />} title={c.citedText}>
                              {citationLabel(c)}
                            </Tag>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                )
              )
            )}
          </div>

          <div className='border-t border-border p-4'>
            {messages.length === 0 ? (
              <div className='mb-3 flex flex-wrap gap-2'>
                {SUGGESTIONS.map(s => (
                  <button
                    key={s}
                    type='button'
                    onClick={() => send(s)}
                    className='inline-flex min-h-9 items-center gap-1.5 rounded-sm border border-input bg-card px-3 text-body font-semibold text-fg-body hover:bg-subtle'
                  >
                    <Sparkles aria-hidden='true' className='size-4 text-icon' strokeWidth={1.75} />
                    {s}
                  </button>
                ))}
              </div>
            ) : null}
            <form
              className='flex gap-2 rounded-md border border-input p-1.5 pl-3 focus-within:border-primary'
              onSubmit={e => {
                e.preventDefault()
                void send(input)
              }}
            >
              <label htmlFor='ask' className='sr-only'>
                Ask the assistant
              </label>
              <input
                id='ask'
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder='Ask anything about your candidates or hiring…'
                className='min-w-0 flex-1 bg-transparent text-body text-foreground outline-none placeholder:text-muted-foreground'
                disabled={streaming}
              />
              <HrButton type='submit' variant='primary' size='sm' disabled={streaming || !input.trim()}>
                <ArrowRight aria-hidden='true' />
                Send
              </HrButton>
            </form>
            <p className='mt-2 text-meta text-muted-foreground'>The assistant can be wrong. Check important details against the cited pages.</p>
          </div>
        </section>
      </div>
    </div>
  )
}
