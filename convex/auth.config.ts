import type { AuthConfig } from 'convex/server'

// Clerk issuer, e.g. https://supreme-kodiak-3291.clerk.accounts.dev
// Set with: npx convex env set CLERK_JWT_ISSUER_DOMAIN <Clerk Frontend API URL>
const issuer = process.env.CLERK_JWT_ISSUER_DOMAIN!

/**
 * Convex validates Clerk's default session token (no JWT template needed) as a
 * custom JWT: signature checked against Clerk's JWKS, issuer must match.
 * Clerk session tokens carry no `aud` claim, so `applicationID` is omitted.
 * This instance only issues tokens for this app, so the issuer check scopes it.
 */
export default {
  providers: [
    {
      type: 'customJwt',
      issuer,
      jwks: `${issuer}/.well-known/jwks.json`,
      algorithm: 'RS256'
    }
  ]
} satisfies AuthConfig
