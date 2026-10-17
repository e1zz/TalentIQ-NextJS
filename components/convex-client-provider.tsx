'use client'

import { useCallback, useMemo, type ReactNode } from 'react'
import { useAuth } from '@clerk/nextjs'
import { ConvexProviderWithAuth, ConvexReactClient } from 'convex/react'

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL
if (!convexUrl) {
  throw new Error('Missing NEXT_PUBLIC_CONVEX_URL. Run `npx convex dev` to create .env.local.')
}

const convex = new ConvexReactClient(convexUrl)

/**
 * Adapts Clerk's auth state to Convex.
 *
 * Convex validates Clerk's default session token with the `customJwt` provider
 * in `convex/auth.config.ts`, so no Clerk JWT template is needed. That is why
 * this calls `getToken()` without a `template` (unlike `ConvexProviderWithClerk`).
 */
function useConvexAuthFromClerk() {
  const { isLoaded, isSignedIn, getToken, sessionId } = useAuth()

  const fetchAccessToken = useCallback(
    async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
      if (!sessionId) return null
      try {
        return await getToken({ skipCache: forceRefreshToken })
      } catch {
        return null
      }
    },
    // A new session gets a new fetcher, which makes Convex re-authenticate.
    [getToken, sessionId]
  )

  return useMemo(
    () => ({ isLoading: !isLoaded, isAuthenticated: isSignedIn ?? false, fetchAccessToken }),
    [isLoaded, isSignedIn, fetchAccessToken]
  )
}

export default function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexProviderWithAuth client={convex} useAuth={useConvexAuthFromClerk}>
      {children}
    </ConvexProviderWithAuth>
  )
}
