# ColabMD Backlog (todo.md)

Canonical backlog for implementation tracking.

## Current Priority Queue
1. [ ] Test real-time collaboration with multiple users.
2. [ ] Verify all 4 comment features work in production (Vercel).
3. [ ] Fix shared document listing E2E validation closure ("Shared with me" checklist + sign-off).

## Google Drive Markdown Support (Phase 1)
- [x] Document schema migration for `document_sources` table.
- [x] API: `POST /api/integrations/google-drive/import` (URL/fileId input, markdown-only validation).
- [x] API: `POST /api/integrations/google-drive/refresh` (pull latest content for linked source).
- [x] Google Drive URL/fileId parser utility + validation.
- [x] OAuth token retrieval wiring for Drive read access.
- [x] UI: "Import from Google Drive" action in dashboard.
- [x] UI: "Refresh from Drive" action on linked docs.
- [x] End-to-end verification on Vercel with real Drive markdown file.
- [ ] Add overwrite confirmation + diff preview.
- [ ] Add audit logging events for import/refresh operations.

## Hardening / Quality
- [x] Fix unauthenticated `/doc/[id]` infinite loading state.
- [x] Add rollback on import partial failure (doc created, source-link upsert fails).
- [x] Tighten Drive host validation (reject deceptive hosts).
- [x] Add tests for Google Drive utilities.
- [x] Add route-level tests for import/refresh critical paths.

## Nice to Have
- [ ] Improve share flow for recipients who do not yet have accounts (invite + pending access or guided signup), while preserving permission model.
