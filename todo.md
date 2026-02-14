# ColabMD Backlog (todo.md)

This is the canonical backlog file for ColabMD.

## High Priority
- [ ] Fix shared document listing so when an `.md` file/document is shared with a collaborator, it appears on their homepage under **"Shared with me"**.
  - Current behavior: collaborator can access via direct shared link, but **"Shared with me"** remains empty.
  - Expected behavior: shared docs are discoverable in dashboard list plus direct-link access.

## Existing Pending Work
- [ ] Test real-time collaboration with multiple users.
- [ ] Verify all 4 comment features work in production (Vercel).

## New Feature Track: Google Drive Markdown Support (Phase 1)
- [ ] Document schema migration for `document_sources` table. *(migration SQL added at `migrations/2026-02-13_document_sources.sql`; needs apply in Supabase)*
- [x] Add API: `POST /api/integrations/google-drive/import` (URL/fileId input, markdown-only validation).
- [x] Add API: `POST /api/integrations/google-drive/refresh` (pull latest content for linked source).
- [x] Add Google Drive URL/fileId parser utility + validation.
- [x] Wire OAuth/token retrieval for Drive read access.
- [x] UI: "Import from Google Drive" action in dashboard.
- [ ] UI: "Refresh from Google Drive" action on linked docs.
- [ ] Add overwrite confirmation + diff preview.
- [ ] Add audit logging events for import/refresh operations.
- [x] End-to-end verification on Vercel with real Drive markdown file.

## Nice to Have
- [ ] Improve share flow for recipients who do not yet have accounts (invite + pending access or guided signup), while preserving permission model.
