# Collaborative Markdown Editor - Implementation Plan

## Overview
A web-based collaborative markdown editor with real-time co-editing, inline/sidebar comments, and Google authentication.

## Tech Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Framework | Next.js 14+ (App Router) | Full-stack React, SSR, API routes |
| Real-time | Liveblocks | Managed collaboration, CRDT-based, has Tiptap integration |
| Database | Supabase (PostgreSQL) | Hosted Postgres, built-in auth, good DX |
| Auth | Supabase Auth + Google OAuth | Easy Google sign-in, integrates with DB |
| Editor | Tiptap | WYSIWYG, extensible, excellent Liveblocks integration |
| Styling | Tailwind CSS | Consistent with existing projects |
| Comments | Liveblocks Comments | Built-in threads, mentions, inline anchoring |

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Next.js App                        │
├─────────────────────────────────────────────────────────┤
│  Pages/Routes                                           │
│  ├── /                  → Dashboard (document list)     │
│  ├── /login             → Google sign-in                │
│  ├── /doc/[id]          → Editor with collaboration     │
│  └── /doc/[id]/share    → Sharing settings              │
├─────────────────────────────────────────────────────────┤
│  Components                                             │
│  ├── Editor (Tiptap + Liveblocks)                       │
│  ├── Comments (inline highlights + sidebar threads)     │
│  ├── Presence (avatars, cursors)                        │
│  └── DocumentList                                       │
├─────────────────────────────────────────────────────────┤
│  API Routes                                             │
│  ├── /api/liveblocks-auth  → Liveblocks authentication  │
│  ├── /api/documents        → CRUD for documents         │
│  └── /api/share            → Sharing/permissions        │
└─────────────────────────────────────────────────────────┘
         │                              │
         ▼                              ▼
┌─────────────────┐          ┌─────────────────┐
│   Liveblocks    │          │    Supabase     │
│  - Real-time    │          │  - PostgreSQL   │
│  - Presence     │          │  - Auth         │
│  - Comments     │          │  - Storage      │
│  - History      │          │                 │
└─────────────────┘          └─────────────────┘
```

## Database Schema (Supabase/PostgreSQL)

```sql
-- Users (managed by Supabase Auth, extended with profile)
profiles (
  id UUID PRIMARY KEY REFERENCES auth.users,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP
)

-- Documents
documents (
  id UUID PRIMARY KEY,
  title TEXT,
  content TEXT,  -- Markdown content (source of truth)
  owner_id UUID REFERENCES profiles,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- Document permissions
document_shares (
  id UUID PRIMARY KEY,
  document_id UUID REFERENCES documents,
  user_id UUID REFERENCES profiles NULL,  -- NULL for link shares
  share_token TEXT UNIQUE,  -- For link sharing
  permission TEXT CHECK (permission IN ('view', 'edit', 'comment')),
  created_at TIMESTAMP
)
```

## Implementation Phases

### Phase 1: Project Setup & Auth
1. Initialize Next.js project in `ColabMD/` directory
2. Configure Supabase project and database schema
3. Implement Google OAuth via Supabase Auth
4. Create basic layout with header/navigation
5. Build login/logout flow

### Phase 2: Document Management
1. Create document list dashboard
2. Implement create/rename/delete document APIs
3. Build document cards with metadata (title, last edited, collaborators)
4. Add basic routing to editor page

### Phase 3: Editor with Real-time Collaboration
1. Set up Liveblocks with Next.js
2. Integrate Tiptap editor with markdown support
3. Connect Liveblocks Yjs provider for real-time sync
4. Add presence indicators (avatars, live cursors)
5. Implement auto-save to Supabase

### Phase 4: Comments System
1. Enable Liveblocks Comments
2. Implement inline text selection → comment creation
3. Build sidebar comments panel with threads
4. Add reply and resolve functionality
5. Style comment highlights in editor

### Phase 5: Sharing & Permissions
1. Build share modal with permission levels (view/comment/edit)
2. Implement invite by email flow
3. Add link sharing with token generation
4. Enforce permissions in API and Liveblocks auth

## Key Files to Create

```
ColabMD/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                    # Dashboard
│   │   ├── login/page.tsx
│   │   ├── doc/[id]/page.tsx           # Editor
│   │   └── api/
│   │       ├── liveblocks-auth/route.ts
│   │       └── documents/route.ts
│   ├── components/
│   │   ├── Editor/
│   │   │   ├── Editor.tsx              # Main Tiptap editor
│   │   │   ├── Toolbar.tsx
│   │   │   └── extensions/             # Custom Tiptap extensions
│   │   ├── Comments/
│   │   │   ├── CommentsSidebar.tsx
│   │   │   └── InlineComment.tsx
│   │   ├── Presence/
│   │   │   ├── Avatars.tsx
│   │   │   └── Cursors.tsx
│   │   └── DocumentList.tsx
│   ├── lib/
│   │   ├── supabase.ts                 # Supabase client
│   │   └── liveblocks.ts               # Liveblocks config
│   └── types/
│       └── index.ts
├── liveblocks.config.ts
└── package.json
```

## External Setup Required

1. **Supabase Project**
   - Create project at supabase.com
   - Enable Google OAuth provider
   - Run database migrations

2. **Liveblocks Account**
   - Create account at liveblocks.io
   - Get API keys (public + secret)
   - Enable Comments feature

3. **Google Cloud Console**
   - Create OAuth 2.0 credentials
   - Configure authorized redirect URIs for Supabase

## Verification Plan

1. **Auth Flow**: Sign in with Google, verify user appears in Supabase
2. **Document CRUD**: Create, rename, delete documents from dashboard
3. **Real-time Editing**: Open same doc in 2 browsers, verify changes sync
4. **Presence**: See collaborator avatars and cursors
5. **Comments**: Select text → add comment → verify in sidebar → reply → resolve
6. **Sharing**: Generate share link, open in incognito, verify permission level
