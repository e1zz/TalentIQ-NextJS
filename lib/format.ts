/**
 * Display helpers. Dates use the org timezone (America/Mexico_City), matching the
 * day boundaries Convex uses (`convex/lib/time.ts`).
 */
export const ORG_TIMEZONE = 'America/Mexico_City'

const fmt = (options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('en-US', { timeZone: ORG_TIMEZONE, ...options })

const longDate = fmt({ weekday: 'long', month: 'long', day: 'numeric' })
const shortDate = fmt({ month: 'short', day: 'numeric' })
const shortDateYear = fmt({ month: 'short', day: 'numeric', year: 'numeric' })
const weekdayShort = fmt({ weekday: 'short' })
const time24 = fmt({ hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
const monthYear = fmt({ month: 'long', year: 'numeric' })

/** "Friday, October 16" */
export const formatLongDate = (t: number) => longDate.format(t)
/** "Oct 16" */
export const formatShortDate = (t: number) => shortDate.format(t)
/** "Oct 16, 2026" */
export const formatDate = (t: number) => shortDateYear.format(t)
/** "Mon" */
export const formatWeekday = (t: number) => weekdayShort.format(t)
/** "09:30" */
export const formatTime = (t: number) => time24.format(t)
/** "October 2026" */
export const formatMonthYear = (t: number) => monthYear.format(t)

/** "Oct 26 – 30" or "Oct 30 – Nov 2" */
export function formatDateRange(start: number, end: number): string {
  const a = formatShortDate(start)
  const b = formatShortDate(end)
  if (a === b) return a
  const [am] = a.split(' ')
  const [bm, bd] = b.split(' ')
  return am === bm ? `${a} – ${bd}` : `${a} – ${b}`
}

const number = new Intl.NumberFormat('en-US')
export const formatNumber = (n: number) => number.format(n)

export function formatMoney(n: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n)
}

/** "$70k – $95k" */
export function formatSalaryRange(min: number | null, max: number | null, currency: string | null): string | null {
  if (min === null || max === null) return null
  const k = (n: number) => formatMoney(n / 1000, currency ?? 'USD') + 'k'
  return `${k(min)} – ${k(max)}`
}

/** "3h ago", "2d ago", "just now" */
export function formatRelative(t: number, now = Date.now()): string {
  const diff = Math.max(0, now - t)
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min}m ago`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return d < 30 ? `${d}d ago` : formatShortDate(t)
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${formatNumber(count)} ${count === 1 ? singular : plural}`
}

export function greetingFor(t: number): string {
  const hour = Number(fmt({ hour: 'numeric', hourCycle: 'h23' }).format(t))
  return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
}

/** `<input type="date">` value ("2026-10-19") to midnight in the org timezone (UTC-6). */
export function orgDateFromInput(value: string): number {
  const [y, m, d] = value.split('-').map(Number)
  return Date.UTC(y, m - 1, d) + 6 * 60 * 60 * 1000
}

/** Epoch ms to an `<input type="date">` value in the org timezone. */
export function toDateInput(t: number): string {
  return new Date(t - 6 * 60 * 60 * 1000).toISOString().slice(0, 10)
}
