'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMutation, useQuery } from 'convex/react'
import { ArrowLeft, Download, FileCheck, FileText, Globe, Mail, Trash2, Upload, User, UserPlus } from 'lucide-react'
import { toast } from 'sonner'

import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import type { DocumentFolder, SignatureStatus } from '@/convex/lib/validators'
import {
  EmptyState,
  HrButton,
  PageHeader,
  SectionCard,
  StatCard,
  StatusPill,
  type StatusTone
} from '@/components/hr'
import { useOpenDocument } from '@/components/screens/doc-bits'
import { errorText, Field, FormDialog } from '@/components/screens/form-dialog'
import { LoadingRows, Skeleton } from '@/components/screens/skeleton'
import { cn } from '@/lib/utils'
import { formatDate, formatRelative, formatShortDate, pluralize } from '@/lib/format'

const SIGNATURE_TONE: Record<SignatureStatus, StatusTone> = { Waiting: 'warning', Overdue: 'danger', Signed: 'success' }
const FOLDER_ICON: Record<DocumentFolder, typeof FileText> = {
  Contracts: FileText,
  'Offer letters': Mail,
  Onboarding: UserPlus,
  Policies: FileCheck,
  Compliance: Globe,
  'Candidate CVs': User
}
const FOLDERS = Object.keys(FOLDER_ICON) as DocumentFolder[]
const ACCEPT = '.pdf,.doc,.docx,.txt,.png,.jpg,.jpeg'

function DocumentDetail({ documentId }: { documentId: Id<'documents'> }) {
  const doc = useQuery(api.documents.get, { documentId })
  const remind = useMutation(api.documents.remind)
  const remove = useMutation(api.documents.remove)
  const openDocument = useOpenDocument()
  const router = useRouter()

  if (doc === undefined) return <LoadingRows rows={8} label='Loading document' />
  if (doc === null) return <EmptyState variant='plain' title='Document not found' />
  const signed = doc.signers.filter(s => s.status === 'Signed').length

  return (
    <div className='flex flex-col gap-5'>
      <div>
        <h2 className='text-card-title font-bold text-foreground'>{doc.title}</h2>
        <div className='mt-1.5 flex flex-wrap gap-2'>
          {doc.signatureStatus ? (
            <StatusPill tone={SIGNATURE_TONE[doc.signatureStatus]}>
              {doc.signatureStatus} · {signed} of {doc.signers.length} signed
            </StatusPill>
          ) : (
            <StatusPill tone={doc.status === 'Missing' ? 'danger' : 'neutral'}>{doc.status}</StatusPill>
          )}
          {doc.expiresInDays !== null ? (
            <StatusPill tone={doc.expiresInDays <= 30 ? 'warning' : 'neutral'}>
              {doc.expiresInDays < 0 ? 'Expired' : `Expires in ${pluralize(doc.expiresInDays, 'day')}`}
            </StatusPill>
          ) : null}
        </div>
      </div>

      <div aria-hidden='true' className='rounded-md bg-subtle p-4'>
        <div className='rounded-sm border border-border bg-card p-4'>
          <p className='text-body font-bold text-foreground'>TalentIQ · {doc.type}</p>
          <div className='mt-3 flex flex-col gap-1.5'>
            {[100, 92, 96, 70, 88, 60].map((w, i) => (
              <span key={i} className='h-1.5 rounded-full bg-muted' style={{ width: `${w}%` }} />
            ))}
          </div>
        </div>
      </div>

      <section>
        <h3 className='text-meta font-semibold tracking-overline text-muted-foreground uppercase'>Details</h3>
        <dl className='mt-2 grid grid-cols-[6.5rem_minmax(0,1fr)] gap-x-3 gap-y-1.5 text-body'>
          <dt className='text-muted-foreground'>Version</dt>
          <dd className='font-semibold text-foreground'>
            v{doc.version} · edited {formatShortDate(doc.updatedAt)}
          </dd>
          {doc.template ? (
            <>
              <dt className='text-muted-foreground'>Template</dt>
              <dd className='font-semibold text-foreground'>{doc.template}</dd>
            </>
          ) : null}
          <dt className='text-muted-foreground'>Owner</dt>
          <dd className='font-semibold text-foreground'>{doc.owner?.name ?? '—'}</dd>
          {doc.person ? (
            <>
              <dt className='text-muted-foreground'>{doc.person.kind === 'employee' ? 'Employee' : 'Candidate'}</dt>
              <dd className='font-semibold text-foreground'>{doc.person.name}</dd>
            </>
          ) : null}
          {doc.sharedWith.length ? (
            <>
              <dt className='text-muted-foreground'>Shared with</dt>
              <dd className='font-semibold text-foreground'>{doc.sharedWith.map(u => u.name).join(', ')}</dd>
            </>
          ) : null}
          {doc.fileName ? (
            <>
              <dt className='text-muted-foreground'>File</dt>
              <dd className='truncate font-semibold text-foreground'>{doc.fileName}</dd>
            </>
          ) : null}
        </dl>
      </section>

      {doc.signers.length ? (
        <section>
          <h3 className='text-meta font-semibold tracking-overline text-muted-foreground uppercase'>Signers</h3>
          <ul className='mt-2 flex flex-col gap-2'>
            {doc.signers.map(s => (
              <li key={s.name} className='flex items-center gap-2.5 text-body text-fg-body'>
                <User aria-hidden='true' className='size-4 text-icon' strokeWidth={1.75} />
                <span className='flex-1'>{s.name}</span>
                <StatusPill tone={s.status === 'Signed' ? 'success' : s.status === 'Declined' ? 'danger' : 'warning'}>
                  {s.status === 'Signed' && s.signedAt ? `Signed ${formatShortDate(s.signedAt)}` : s.status === 'Waiting' ? 'Not signed yet' : s.status}
                </StatusPill>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className='flex flex-wrap gap-2.5'>
        <HrButton variant='secondary' onClick={() => openDocument(doc._id)} disabled={!doc.hasFile}>
          <Download aria-hidden='true' />
          Download
        </HrButton>
        {doc.status === 'Waiting' ? (
          <HrButton
            variant='primary'
            onClick={async () => {
              try {
                const { waitingSigners } = await remind({ documentId: doc._id })
                toast.success(`Reminder sent to ${waitingSigners.join(', ')}`)
              } catch (err) {
                toast.error(errorText(err))
              }
            }}
          >
            <Mail aria-hidden='true' />
            Send reminder
          </HrButton>
        ) : null}
        <HrButton
          variant='ghost'
          className='ml-auto text-danger-foreground hover:bg-danger-soft'
          onClick={async () => {
            if (!window.confirm(`Delete “${doc.title}”? This can't be undone.`)) return
            await remove({ documentId: doc._id })
            toast.success('Document deleted')
            router.replace('/dashboard/documents', { scroll: false })
          }}
        >
          <Trash2 aria-hidden='true' />
          Delete
        </HrButton>
      </div>
    </div>
  )
}

function DocumentsScreen() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const folder = searchParams.get('folder') as DocumentFolder | null
  const [uploading, setUploading] = React.useState(false)

  const kpis = useQuery(api.documents.kpis, {})
  const signatures = useQuery(api.documents.outForSignature, { limit: 10 })
  const folders = useQuery(api.documents.folders, {})
  const folderDocs = useQuery(api.documents.list, folder ? { folder } : 'skip')
  const generateUploadUrl = useMutation(api.documents.generateUploadUrl)
  const saveDocument = useMutation(api.documents.saveDocument)
  const remind = useMutation(api.documents.remind)

  const selected = (searchParams.get('id') ?? (folder ? folderDocs?.[0]?._id : signatures?.[0]?._id)) as Id<'documents'> | undefined
  const go = (params: Record<string, string | undefined>) => {
    const next = new URLSearchParams()
    const merged = { folder: folder ?? undefined, ...params }
    Object.entries(merged).forEach(([k, v]) => v && next.set(k, v))
    router.replace(`/dashboard/documents?${next}`, { scroll: false })
  }

  return (
    <div className='flex flex-col gap-6'>
      <PageHeader
        title='Documents'
        subtitle={kpis ? `${kpis.waitingForSignature} waiting for signature · ${kpis.expiringIn30d} expiring in the next 30 days` : undefined}
        actions={
          <HrButton variant='primary' onClick={() => setUploading(true)}>
            <Upload aria-hidden='true' />
            Upload
          </HrButton>
        }
      />

      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        {kpis ? (
          <>
            <StatCard label='Waiting for signature' value={kpis.waitingForSignature} sublabel={kpis.overdue ? `${kpis.overdue} overdue` : 'None overdue'} />
            <StatCard label='Signed this month' value={kpis.signedThisMonth} sublabel='Contracts, offers and policies' />
            <StatCard label='Expiring in 30 days' value={kpis.expiringIn30d} sublabel='Contracts and permits' />
            <StatCard label='Missing documents' value={kpis.missing} sublabel='Requested, not uploaded' />
          </>
        ) : (
          Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className='h-24' />)
        )}
      </div>

      <div className='grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]'>
        <div className='flex min-w-0 flex-col gap-6'>
          {folder ? (
            <SectionCard
              title={folder}
              meta={folderDocs ? pluralize(folderDocs.length, 'file') : undefined}
              headerActions={
                <HrButton variant='ghost' size='sm' onClick={() => router.replace('/dashboard/documents', { scroll: false })}>
                  <ArrowLeft aria-hidden='true' />
                  All documents
                </HrButton>
              }
              padding='flush'
            >
              {folderDocs === undefined ? (
                <LoadingRows rows={5} className='p-5' label='Loading folder' />
              ) : folderDocs.length === 0 ? (
                <EmptyState variant='plain' title='This folder is empty' />
              ) : (
                <ul className='divide-y divide-border-subtle'>
                  {folderDocs.map(d => (
                    <li key={d._id} className={cn('flex items-center gap-3 px-5 py-3', d._id === selected && 'bg-info-soft/60')}>
                      <span className='inline-flex size-9 shrink-0 items-center justify-center rounded-sm bg-muted text-icon'>
                        <FileText aria-hidden='true' className='size-4' strokeWidth={1.75} />
                      </span>
                      <button type='button' onClick={() => go({ id: d._id })} className='min-w-0 flex-1 text-left'>
                        <span className='block truncate text-body font-semibold text-foreground hover:underline'>{d.title}</span>
                        <span className='block text-meta text-muted-foreground'>
                          {[d.person?.name, d.type, `updated ${formatDate(d.updatedAt)}`].filter(Boolean).join(' · ')}
                        </span>
                      </button>
                      <StatusPill tone={d.status === 'Missing' ? 'danger' : d.status === 'Waiting' ? 'warning' : d.status === 'Signed' ? 'success' : 'neutral'}>{d.status}</StatusPill>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>
          ) : (
            <SectionCard title='Out for signature' meta={signatures ? `${signatures.filter(s => s.status !== 'Signed').length} waiting` : undefined} padding='flush'>
              {signatures === undefined ? (
                <LoadingRows rows={5} className='p-5' label='Loading signatures' />
              ) : signatures.length === 0 ? (
                <EmptyState variant='plain' title='Nothing out for signature' />
              ) : (
                <ul className='divide-y divide-border-subtle'>
                  {signatures.map(s => (
                    <li key={s._id} className={cn('flex flex-wrap items-center gap-3 px-5 py-3', s._id === selected && 'bg-info-soft/60')}>
                      <span className='inline-flex size-9 shrink-0 items-center justify-center rounded-sm bg-muted text-icon'>
                        <FileText aria-hidden='true' className='size-4' strokeWidth={1.75} />
                      </span>
                      <button type='button' onClick={() => go({ id: s._id })} className='min-w-0 flex-1 text-left'>
                        <span className='block truncate text-body font-semibold text-foreground hover:underline'>{s.title}</span>
                        <span className='block text-meta text-muted-foreground'>
                          {s.status === 'Signed' ? 'Completed' : 'Sent'} {formatShortDate(s.sentAt)}
                          {s.sentBy ? ` by ${s.sentBy.name}` : ''} · {formatRelative(s.sentAt)}
                        </span>
                      </button>
                      <span className='text-meta text-muted-foreground tabular-nums'>
                        {s.signersSigned} of {s.signersTotal} signed
                      </span>
                      <StatusPill tone={SIGNATURE_TONE[s.status]}>{s.status}</StatusPill>
                      {s.status !== 'Signed' ? (
                        <HrButton
                          variant='secondary'
                          size='sm'
                          onClick={async () => {
                            try {
                              await remind({ documentId: s._id })
                              toast.success('Reminder sent')
                            } catch (err) {
                              toast.error(errorText(err))
                            }
                          }}
                        >
                          Remind
                        </HrButton>
                      ) : (
                        <HrButton variant='secondary' size='sm' onClick={() => go({ id: s._id })}>
                          View
                        </HrButton>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>
          )}

          <SectionCard title='Folders'>
            {folders === undefined ? (
              <LoadingRows rows={2} label='Loading folders' />
            ) : (
              <ul className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
                {folders.map(f => {
                  const Icon = FOLDER_ICON[f.folder]
                  return (
                    <li key={f.folder}>
                      <button
                        type='button'
                        aria-pressed={folder === f.folder}
                        onClick={() => router.replace(`/dashboard/documents?folder=${encodeURIComponent(f.folder)}`, { scroll: false })}
                        className={cn(
                          'flex w-full flex-col items-start gap-3 rounded-md border p-4 text-left transition-colors hover:bg-subtle',
                          folder === f.folder ? 'border-primary' : 'border-border'
                        )}
                      >
                        <span className='inline-flex size-9 items-center justify-center rounded-sm bg-brand-soft text-brand-fg'>
                          <Icon aria-hidden='true' className='size-4' strokeWidth={1.75} />
                        </span>
                        <span>
                          <span className='block text-body font-semibold text-foreground'>{f.folder}</span>
                          <span className='block text-meta text-muted-foreground'>{pluralize(f.count, 'file')}</span>
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </SectionCard>
        </div>

        <aside aria-label='Document details' className='self-start rounded-lg border border-border bg-card p-5'>
          {selected ? <DocumentDetail key={selected} documentId={selected} /> : <EmptyState variant='plain' size='compact' title='Select a document' />}
        </aside>
      </div>

      <FormDialog
        open={uploading}
        onOpenChange={setUploading}
        title='Upload document'
        description='PDF, Word, TXT, PNG or JPEG, up to 20 MB.'
        submitLabel='Upload'
        onSubmit={async form => {
          const file = form.get('file')
          if (!(file instanceof File) || file.size === 0) throw new Error('Choose a file to upload.')
          const url = await generateUploadUrl({})
          const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': file.type }, body: file })
          if (!res.ok) throw new Error(`Upload failed (${res.status}).`)
          const { storageId } = (await res.json()) as { storageId: Id<'_storage'> }
          const id = await saveDocument({
            storageId,
            fileName: file.name,
            title: String(form.get('title') ?? '').trim() || undefined,
            folder: form.get('folder') as DocumentFolder
          })
          toast.success('Document uploaded')
          go({ id, folder: String(form.get('folder')) })
        }}
      >
        <div className='flex flex-col gap-1.5'>
          <label htmlFor='upload-file' className='text-body font-semibold text-fg-body'>
            File <span aria-hidden='true' className='text-danger-foreground'>*</span>
          </label>
          <input
            id='upload-file'
            name='file'
            type='file'
            required
            accept={ACCEPT}
            className='text-body text-fg-body file:mr-3 file:h-10 file:rounded-sm file:border file:border-input file:bg-card file:px-4 file:font-semibold file:text-fg-body'
          />
        </div>
        <Field label='Title' name='title' placeholder='Defaults to the file name' />
        <Field label='Folder' name='folder' defaultValue={folder ?? 'Contracts'} options={FOLDERS.map(f => ({ value: f, label: f }))} />
      </FormDialog>
    </div>
  )
}

export default function DocumentsPage() {
  return (
    <React.Suspense>
      <DocumentsScreen />
    </React.Suspense>
  )
}
