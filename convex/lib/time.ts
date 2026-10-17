/**
 * Date helpers. Day, week and month boundaries use the organization's timezone,
 * America/Mexico_City, which is a fixed UTC-6 (no daylight saving time since 2022).
 * Format dates in the UI with `timeZone: ORG_TIMEZONE` so they line up.
 */
export const ORG_TIMEZONE = 'America/Mexico_City'
export const ORG_UTC_OFFSET_MS = -6 * 60 * 60 * 1000

export const MINUTE = 60 * 1000
export const HOUR = 60 * MINUTE
export const DAY = 24 * HOUR
export const WEEK = 7 * DAY

/** Queries take an optional `now` so the UI can pin time; defaults to the server clock. */
export function resolveNow(now: number | undefined): number {
  return now ?? Date.now()
}

/** Epoch ms for a wall-clock time in the org timezone. `month` is 1-12. */
export function orgDate(year: number, month: number, day: number, hour = 0, minute = 0): number {
  return Date.UTC(year, month - 1, day, hour, minute) - ORG_UTC_OFFSET_MS
}

function toLocal(t: number): Date {
  return new Date(t + ORG_UTC_OFFSET_MS)
}

export function startOfDay(t: number): number {
  const local = t + ORG_UTC_OFFSET_MS
  return local - (((local % DAY) + DAY) % DAY) - ORG_UTC_OFFSET_MS
}

/** Monday 00:00 of the week containing `t`. */
export function startOfWeek(t: number): number {
  const day = startOfDay(t)
  const dow = toLocal(day).getUTCDay()
  return day - ((dow + 6) % 7) * DAY
}

export function startOfMonth(t: number): number {
  const local = toLocal(t)
  return orgDate(local.getUTCFullYear(), local.getUTCMonth() + 1, 1)
}

export function startOfYear(t: number): number {
  return orgDate(toLocal(t).getUTCFullYear(), 1, 1)
}

/** `YYYY-MM` for the month containing `t`. */
export function monthKey(t: number): string {
  const local = toLocal(t)
  return `${local.getUTCFullYear()}-${String(local.getUTCMonth() + 1).padStart(2, '0')}`
}

export function orgYear(t: number): number {
  return toLocal(t).getUTCFullYear()
}

export function yearKey(t: number): string {
  return String(orgYear(t))
}

/** `YYYY-MM` for the month before `period` (`YYYY-MM`). */
export function previousMonthKey(period: string): string {
  const [y, m] = period.split('-').map(Number)
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`
}

/** Whole calendar days from `from` to `to` (org timezone). */
export function daysBetween(from: number, to: number): number {
  return Math.round((startOfDay(to) - startOfDay(from)) / DAY)
}

/** Working days (Mon-Fri) from `start` to `end`, both inclusive. */
export function workingDaysBetween(start: number, end: number): number {
  let count = 0
  for (let d = startOfDay(start); d <= startOfDay(end); d += DAY) {
    const dow = toLocal(d).getUTCDay()
    if (dow !== 0 && dow !== 6) count++
  }
  return count
}
