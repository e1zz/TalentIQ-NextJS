import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isDashboardRoute = createRouteMatcher(['/dashboard(.*)'])
const isApiRoute = createRouteMatcher(['/api/(.*)'])

// Next.js 16 runs `proxy.ts` (formerly `middleware.ts`) before every matched request.
export default clerkMiddleware(
  async (auth, request) => {
    if (isApiRoute(request)) {
      // API callers get a JSON 401 instead of a redirect to the sign-in page.
      const { isAuthenticated } = await auth()
      if (!isAuthenticated) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      return
    }
    if (isDashboardRoute(request)) {
      await auth.protect()
    }
  },
  { signInUrl: '/sign-in', signUpUrl: '/sign-up' }
)

export const config = {
  matcher: [
    // Skip Next.js internals and static files, unless found in search params
    '/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)'
  ]
}
