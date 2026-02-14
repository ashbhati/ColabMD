# ColabMD

Collaborative markdown editor with:
- real-time co-editing,
- sharing/permissions,
- comments,
- Google login,
- Google Drive Markdown import/refresh (Phase 1).

## Current Capabilities

### Core
- Create, rename, delete markdown documents.
- Real-time collaboration with presence indicators.
- Share documents via permission model (`view`, `comment`, `edit`) and token flows.
- "Shared with me" listing support in dashboard.

### Google Drive Markdown (Phase 1)
- Import markdown files from Google Drive (`.md` / `.markdown`).
- Refresh linked documents from Drive source file.
- Source-link metadata persisted in `document_sources`.
- Google Docs native format conversion is intentionally out of scope for Phase 1.

## Tech Stack
- Next.js (App Router)
- Supabase (Auth + Postgres)
- Liveblocks + Tiptap
- Tailwind CSS

## Local Development

```bash
npm install
npm run dev
```

Open: `http://localhost:3000`

## Required Environment Variables

Set these in local `.env.local` and in Vercel:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`
- `LIVEBLOCKS_SECRET_KEY`
- `AI_AGENT_API_KEY` (if AI comment-agent flow is enabled)

## Supabase Migration (Google Drive sources)

Apply migration:

- `migrations/2026-02-13_document_sources.sql`

This creates:
- `document_sources` table
- indexes
- RLS policies for owner-scoped read/write

## Google Cloud / OAuth Setup (for Drive import)

For the OAuth client used by Supabase Google provider:
1. Enable **Google Drive API**.
2. Add Drive scope via auth flow (`drive.readonly` requested by app).
3. If app is in testing mode, add tester emails in OAuth consent screen.

## API Endpoints Added

- `POST /api/integrations/google-drive/import`
  - input: `{ fileUrl?: string, fileId?: string, title?: string }`
  - imports markdown Drive file into new ColabMD doc

- `POST /api/integrations/google-drive/refresh`
  - input: `{ documentId: string, force?: boolean }`
  - refreshes local doc from linked Drive source

## Testing

Repo includes unit and route-level tests for Drive utilities and import/refresh behavior.

If `npm test` fails with `'jest' is not recognized`, ensure dependencies are fully installed in your environment and `node_modules/.bin` is available.

## Deployment

- `dev` branch for preview testing.
- `main` branch for production deploy (Vercel).
