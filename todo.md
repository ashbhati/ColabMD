# ColabMD Backlog (todo.md)

Canonical backlog for implementation tracking.

## Current Priority Queue
1. [x] Test real-time collaboration with multiple users.
2. [x] Verify all 4 comment features work in production (Vercel).
3. [x] Fix shared document listing E2E validation closure ("Shared with me" checklist + sign-off).

## Google Drive Markdown Support (Phase 1)
- [x] Document schema migration for `document_sources` table.
- [x] API: `POST /api/integrations/google-drive/import` (URL/fileId input, markdown-only validation).
- [x] API: `POST /api/integrations/google-drive/refresh` (pull latest content for linked source).
- [x] Google Drive URL/fileId parser utility + validation.
- [x] OAuth token retrieval wiring for Drive read access.
- [x] UI: "Import from Google Drive" action in dashboard.
- [x] UI: "Refresh from Drive" action on linked docs.
- [x] End-to-end verification on Vercel with real Drive markdown file.
- [x] Add overwrite confirmation + diff preview.
- [x] Add audit logging events for import/refresh operations.

## Hardening / Quality
- [x] Fix unauthenticated `/doc/[id]` infinite loading state.
- [x] Add rollback on import partial failure (doc created, source-link upsert fails).
- [x] Tighten Drive host validation (reject deceptive hosts).
- [x] Add tests for Google Drive utilities.
- [x] Add route-level tests for import/refresh critical paths.

## Nice to Have
- [x] Improve share flow for recipients who do not yet have accounts (invite + pending access or guided signup), while preserving permission model.

## Upcoming Priority Queue
1. [x] Collaboration UX upgrades (presence names/colors + active state).
2. [x] E2E reliability coverage (share-link accept + multi-user sync).
3. [x] Performance pass (editor mount/switch profiling + targeted fixes).
4. [x] Share UX v2 (pending invites, resend/cancel).
5. [x] Drive import UX polish (progress/errors/retry).
