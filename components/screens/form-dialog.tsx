'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { Search, X } from 'lucide-react'

import { cn } from '@/lib/utils'
import { HrButton } from '@/components/hr'

/** Pulls the user-facing message out of a ConvexError (or any error). */
export function errorText(err: unknown): string {
  const data = (err as { data?: { message?: string } } | null)?.data
  return data?.message ?? (err instanceof Error ? err.message : 'Something went wrong.')
}

/** Modal form: title, description, fields, Cancel + submit. `onSubmit` may throw to keep it open. */
export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  submitLabel,
  submitVariant = 'primary',
  onSubmit,
  children,
  className
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  submitLabel: string
  submitVariant?: 'primary' | 'danger'
  onSubmit: (data: FormData) => Promise<void> | void
  children?: React.ReactNode
  className?: string
}) {
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={next => {
        if (!next) setError(null)
        onOpenChange(next)
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className='fixed inset-0 z-50 bg-foreground/30 data-[state=open]:animate-in data-[state=open]:fade-in-0 dark:bg-black/60' />
        <DialogPrimitive.Content
          className={cn(
            'fixed top-1/2 left-1/2 z-50 flex max-h-[90dvh] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col rounded-lg border border-border bg-card font-sans text-foreground shadow-overlay data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
            className
          )}
        >
          <form
            className='flex min-h-0 flex-col'
            onSubmit={async event => {
              event.preventDefault()
              setPending(true)
              setError(null)
              try {
                await onSubmit(new FormData(event.currentTarget))
                onOpenChange(false)
              } catch (err) {
                setError(errorText(err))
              } finally {
                setPending(false)
              }
            }}
          >
            <div className='flex items-start justify-between gap-4 border-b border-border px-6 py-4'>
              <div>
                <DialogPrimitive.Title className='text-card-title font-bold'>{title}</DialogPrimitive.Title>
                <DialogPrimitive.Description className={description ? 'mt-1 text-body text-fg-secondary' : 'sr-only'}>
                  {description ?? title}
                </DialogPrimitive.Description>
              </div>
              <DialogPrimitive.Close
                aria-label='Close'
                className='hit-target -mr-2 inline-flex size-9 items-center justify-center rounded-sm text-icon hover:bg-muted'
              >
                <X aria-hidden='true' className='size-5' strokeWidth={1.75} />
              </DialogPrimitive.Close>
            </div>
            <div className='flex min-h-0 flex-col gap-4 overflow-y-auto px-6 py-5'>
              {children}
              {error ? (
                <p role='alert' className='rounded-sm bg-danger-soft px-3 py-2 text-body text-danger-foreground'>
                  {error}
                </p>
              ) : null}
            </div>
            <div className='flex justify-end gap-2.5 border-t border-border px-6 py-4'>
              <DialogPrimitive.Close asChild>
                <HrButton type='button' variant='secondary'>
                  Cancel
                </HrButton>
              </DialogPrimitive.Close>
              <HrButton type='submit' variant={submitVariant} disabled={pending}>
                {pending ? 'Saving…' : submitLabel}
              </HrButton>
            </div>
          </form>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

export const controlClass =
  'h-10 w-full rounded-sm border border-input bg-card px-3 text-body text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-primary/30'

/** Labelled input, select or textarea for FormDialog. */
export function Field({
  label,
  name,
  type = 'text',
  required,
  defaultValue,
  options,
  placeholder,
  multiline,
  hint,
  min,
  step
}: {
  label: string
  name: string
  type?: string
  required?: boolean
  defaultValue?: string | number
  options?: { value: string; label: string }[]
  placeholder?: string
  multiline?: boolean
  hint?: string
  min?: number
  step?: number
}) {
  const id = React.useId()
  const hintId = `${id}-hint`
  const common = { id, name, required, defaultValue, 'aria-describedby': hint ? hintId : undefined }
  return (
    <div className='flex flex-col gap-1.5'>
      <label htmlFor={id} className='text-body font-semibold text-fg-body'>
        {label}
        {required ? <span aria-hidden='true' className='text-danger-foreground'> *</span> : null}
      </label>
      {options ? (
        <select {...common} className={controlClass}>
          {options.map(o => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : multiline ? (
        <textarea {...common} placeholder={placeholder} rows={4} className={cn(controlClass, 'h-auto py-2')} />
      ) : (
        <input {...common} type={type} placeholder={placeholder} min={min} step={step} className={controlClass} />
      )}
      {hint ? (
        <p id={hintId} className='text-meta text-muted-foreground'>
          {hint}
        </p>
      ) : null}
    </div>
  )
}

/** Search box styled like the Figma SearchField. */
export function SearchField({
  label,
  value,
  onChange,
  placeholder,
  className
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}) {
  return (
    <div className={cn('relative', className)}>
      <Search aria-hidden='true' className='pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-icon' strokeWidth={1.75} />
      <input
        type='search'
        aria-label={label}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder ?? label}
        className={cn(controlClass, 'pl-9')}
      />
    </div>
  )
}
