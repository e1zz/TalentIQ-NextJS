# TalentIQ

AI-powered talent search for headhunters and recruiters hiring for specialized, managerial and executive roles.

## Stack

- **Frontend:** Next.js 16 (App Router, Turbopack, React Compiler), React 19, Tailwind CSS 4 + shadcn/ui, Motion, Recharts 3
- **Backend & data:** Next.js Route Handlers, `proxy.ts` session refresh, Supabase (Auth via `@supabase/ssr`, Postgres, Storage)
- **AI:** Claude Opus 5.5 through the Anthropic TypeScript SDK: streaming chat, Files API for CVs and job descriptions, page-level citations, prompt caching and server-side refusal fallbacks
- **Tooling:** TypeScript 7 (`tsc`) with the TypeScript 6 API kept for ESLint and Next.js, ESLint 10, Prettier, pnpm
- **Analytics:** Vercel Analytics and Speed Insights, Hotjar

## Getting started

Create `.env.local`:

```bash
ANTHROPIC_API_KEY=...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Then:

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

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

Both API routes require a Supabase session.
