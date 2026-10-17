import type { StatusTone } from '@/components/hr'
import type { EmployeeStatus, TimeOffStatus } from '@/convex/lib/validators'

export const EMPLOYEE_STATUS_TONE: Record<EmployeeStatus, StatusTone> = {
  Active: 'success',
  'On leave': 'warning',
  Onboarding: 'info',
  Offboarding: 'neutral',
  Left: 'neutral'
}

export const TIME_OFF_STATUS_TONE: Record<TimeOffStatus, StatusTone> = {
  Pending: 'warning',
  Approved: 'success',
  Declined: 'danger',
  Cancelled: 'neutral'
}

/** "3y 7m", "2 weeks", "5 days" since `start`. */
export function tenure(start: number, now = Date.now()): string {
  const days = Math.floor((now - start) / 86_400_000)
  if (days < 0) return `starts in ${-days}d`
  if (days < 14) return `${days} days`
  if (days < 60) return `${Math.floor(days / 7)} weeks`
  const months = Math.floor(days / 30.44)
  const y = Math.floor(months / 12)
  const m = months % 12
  return y ? `${y}y ${m}m` : `${m}m`
}
