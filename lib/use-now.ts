'use client'

import * as React from 'react'

/** Current time, refreshed every `intervalMs`. Keeps `Date.now()` out of render. */
export function useNow(intervalMs = 60_000): number {
  const [now, setNow] = React.useState(() => Date.now())
  React.useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}
