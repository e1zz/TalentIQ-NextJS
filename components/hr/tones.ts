/**
 * Semantic tones shared by the HR primitives. Every class here maps to a token
 * in app/globals.css, so light and dark mode switch automatically.
 */

/** Status tones from the Figma StatusPill: success = on track / approved,
 * warning = slow / pending, danger = overdue / rejected, info = new,
 * neutral = done / inactive. */
export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

/** Status tones plus the decorative tints used by tags and icon tiles. */
export type AccentTone = StatusTone | 'brand' | 'violet' | 'teal'

/** Soft background + readable foreground for pills and icon chips. */
export const toneSurfaceClass: Record<AccentTone, string> = {
  success: 'bg-success-soft text-success-foreground',
  warning: 'bg-warning-soft text-warning-foreground',
  danger: 'bg-danger-soft text-danger-foreground',
  info: 'bg-info-soft text-info-foreground',
  neutral: 'bg-neutral-soft text-neutral-foreground',
  brand: 'bg-brand-soft text-brand-fg',
  violet: 'bg-violet-soft text-violet-foreground',
  teal: 'bg-teal-soft text-teal-foreground'
}

/** Solid dot color for each tone. */
export const toneDotClass: Record<AccentTone, string> = {
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  info: 'bg-info',
  neutral: 'bg-neutral',
  brand: 'bg-brand',
  violet: 'bg-violet',
  teal: 'bg-teal-foreground'
}

/** Icon color inside a tinted chip. Neutral icons use icon/default. */
export const toneIconClass: Record<AccentTone, string> = {
  success: 'text-success-foreground',
  warning: 'text-warning-foreground',
  danger: 'text-danger-foreground',
  info: 'text-info-foreground',
  neutral: 'text-icon',
  brand: 'text-brand-fg',
  violet: 'text-violet-foreground',
  teal: 'text-teal-foreground'
}

/** Fill colors for bars, meters and sparklines. */
export type DataTone =
  | 'brand'
  | 'brand-light'
  | 'brand-muted'
  | 'success'
  | 'warning'
  | 'danger'
  | 'neutral'

export const dataFillClass: Record<DataTone, string> = {
  brand: 'bg-brand',
  'brand-light': 'bg-brand-400',
  'brand-muted': 'bg-bar-muted',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  neutral: 'bg-neutral'
}

export const dataStrokeClass: Record<DataTone, string> = {
  brand: 'text-brand',
  'brand-light': 'text-brand-400',
  'brand-muted': 'text-bar-muted',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  neutral: 'text-neutral'
}
