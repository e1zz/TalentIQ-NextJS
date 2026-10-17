import * as React from 'react'

import { cn } from '@/lib/utils'

export type AvatarTint = 'blue' | 'teal' | 'pink' | 'amber' | 'violet' | 'indigo'
export type AvatarSize = 24 | 28 | 32 | 36 | 40

export const AVATAR_TINTS: readonly AvatarTint[] = [
  'blue',
  'teal',
  'pink',
  'amber',
  'violet',
  'indigo'
]

const tintClass: Record<AvatarTint, string> = {
  blue: 'bg-avatar-blue text-avatar-blue-foreground',
  teal: 'bg-avatar-teal text-avatar-teal-foreground',
  pink: 'bg-avatar-pink text-avatar-pink-foreground',
  amber: 'bg-avatar-amber text-avatar-amber-foreground',
  violet: 'bg-avatar-violet text-avatar-violet-foreground',
  indigo: 'bg-avatar-indigo text-avatar-indigo-foreground'
}

// Figma: 24 tables, 28 stacks, 32 cards / lists, 36 sidebar, 40 profile headers
const sizeClass: Record<AvatarSize, string> = {
  24: 'size-6 text-[10px] leading-4',
  28: 'size-7 text-[11px] leading-5',
  32: 'size-8 text-meta',
  36: 'size-9 text-[13px] leading-5',
  40: 'size-10 text-body'
}

/** "Malaika Brown" -> "MB", "Tomás Álvarez" -> "TÁ", "Cher" -> "CH". */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toLocaleUpperCase()
  const first = Array.from(parts[0])[0] ?? ''
  const last = Array.from(parts[parts.length - 1])[0] ?? ''
  return (first + last).toLocaleUpperCase()
}

/** Deterministic soft tint from a name (FNV-1a, case-insensitive), so a
 * person keeps the same color everywhere they appear. The seed is chosen so
 * the Figma examples line up (Sara Lopez and Priya Nair blue, Liam Chen and
 * Tomás Álvarez pink, Carlos Mendes teal). */
export function getAvatarTint(name: string): AvatarTint {
  const key = name.trim().toLowerCase()
  let hash = (0x811c9dc5 ^ 698) >>> 0
  for (let i = 0; i < key.length; i++) {
    hash ^= key.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return AVATAR_TINTS[hash % AVATAR_TINTS.length]
}

export type InitialsAvatarProps = Omit<
  React.HTMLAttributes<HTMLSpanElement>,
  'children'
> & {
  /** Full name. Drives initials, tint and the accessible label. */
  name: string
  size?: AvatarSize
  /** Override the hashed tint. */
  tint?: AvatarTint
  /** Override the derived initials. */
  initials?: string
  /** Hide from assistive tech when the name is already shown next to it. */
  decorative?: boolean
  /** 2px ring in the surface color, for stacks. */
  ring?: boolean
}

/** Figma "Avatar" (4080:1383). Initials on a soft tint. */
export function InitialsAvatar({
  name,
  size = 32,
  tint,
  initials,
  decorative = false,
  ring = false,
  className,
  ...props
}: InitialsAvatarProps) {
  const a11y = decorative
    ? ({ 'aria-hidden': true } as const)
    : ({ role: 'img', 'aria-label': name } as const)

  return (
    <span
      {...a11y}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-bold select-none',
        sizeClass[size],
        tintClass[tint ?? getAvatarTint(name)],
        ring && 'ring-2 ring-card',
        className
      )}
      {...props}
    >
      {initials ?? getInitials(name)}
    </span>
  )
}

export type AvatarStackPerson = { name: string; tint?: AvatarTint }

export type AvatarStackProps = React.HTMLAttributes<HTMLDivElement> & {
  people: AvatarStackPerson[]
  /** Avatars shown before collapsing into "+N". Defaults to 4. */
  max?: number
  size?: AvatarSize
  /** Accessible summary. Defaults to the listed names. */
  label?: string
}

/** Overlapping avatars (interview panelists, owners). Figma: 28px, 2px
 * surface ring, 6px overlap. */
export function AvatarStack({
  people,
  max = 4,
  size = 28,
  label,
  className,
  ...props
}: AvatarStackProps) {
  const shown = people.slice(0, max)
  const hidden = people.length - shown.length
  const summary =
    label ??
    (hidden > 0
      ? `${shown.map((p) => p.name).join(', ')} and ${hidden} more`
      : shown.map((p) => p.name).join(', '))

  return (
    <div
      role='img'
      aria-label={summary}
      className={cn('flex items-center -space-x-1.5', className)}
      {...props}
    >
      {shown.map((person) => (
        <InitialsAvatar
          key={person.name}
          name={person.name}
          tint={person.tint}
          size={size}
          ring
          decorative
        />
      ))}
      {hidden > 0 ? (
        <span
          aria-hidden='true'
          className={cn(
            'inline-flex shrink-0 items-center justify-center rounded-full bg-muted font-semibold text-fg-body ring-2 ring-card',
            sizeClass[size]
          )}
        >
          +{hidden}
        </span>
      ) : null}
    </div>
  )
}
