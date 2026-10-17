# TalentIQ

AI-powered talent search for headhunters and recruiters hiring for specialized, managerial and executive roles.

## Stack

- **Frontend:** Next.js 16 (App Router, Turbopack, React Compiler), React 19, Tailwind CSS 4 + shadcn/ui, Motion, Recharts 3
- **Backend & data:** Convex (database, real-time queries, file storage for CVs and documents), Next.js Route Handlers
- **Auth:** Clerk (`@clerk/nextjs`, `clerkMiddleware` in `proxy.ts`), validated by Convex as a custom JWT
- **AI:** Claude Opus 5.5 through the Anthropic TypeScript SDK: streaming chat, Files API for CVs and job descriptions, page-level citations, prompt caching and server-side refusal fallbacks
- **Tooling:** TypeScript 7 (`tsc`) with the TypeScript 6 API kept for ESLint and Next.js, ESLint 10, Prettier, pnpm
- **Analytics:** Vercel Analytics and Speed Insights, Hotjar

## Getting started

```bash
pnpm install
cp .env.example .env.local   # fill in ANTHROPIC_API_KEY and the Clerk keys
npx convex dev               # logs in, creates/links a dev deployment, writes the Convex vars, keeps functions in sync
```

In a second terminal:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Clerk

1. Create a Clerk application and copy the publishable and secret keys into `.env.local`.
2. Tell Convex which Clerk instance issues tokens (its Frontend API URL, e.g. `https://xxx.clerk.accounts.dev`):
   ```bash
   npx convex env set CLERK_JWT_ISSUER_DOMAIN https://xxx.clerk.accounts.dev
   ```
   `convex/auth.config.ts` validates Clerk's default session token as a custom JWT, so no Clerk JWT template is needed.

### Demo data

Sign in once (this creates your `users` row), then seed the dev deployment:

```bash
npx convex run seed:run
```

The seed is idempotent: it does nothing if data already exists. Pass `'{"reset": true}'` to wipe the app tables and seed again. See `convex/API.md` for every query and mutation.

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Start the dev server (Turbopack) |
| `pnpm build` | Production build |
| `pnpm lint` | ESLint 10 (flat config) |
| `pnpm typecheck` | Type check with TypeScript 7 |

## AI Assistant

`/dashboard/Assistant` lets a signed-in recruiter upload CVs and job descriptions (PDF or TXT) and chat with Claude about them.

- `app/api/files/route.ts` lists, uploads and deletes documents with the Claude Files API.
- `app/api/chat/route.ts` attaches every uploaded document to the conversation, streams Claude's answer as NDJSON, and returns citations to the CV pages the answer is based on.
- `lib/anthropic.ts` holds the model ID and the system prompt, including the merit-based, bias-aware screening rules.

Both API routes require a Clerk session.
