# ColabMD Development Log

## Session: 2026-02-05

### Overview
Fixed comments system bugs discovered during user testing (Phase 2).

---

## Issues Fixed

### Issue 1: Comments Showing "Anonymous" Instead of User Name

**Symptoms:** All comments displayed "Anonymous" or "Anony..." instead of actual user names.

**Root Cause Discovery Process:**
1. Initially thought it was the liveblocks-auth endpoint not reading user metadata correctly
2. Added profile table fallback - still didn't work
3. Added debug logging - confirmed `displayName: Ashish Bhatia` was being sent correctly
4. **Actual root cause:** Liveblocks `@liveblocks/react-ui` components (Thread, etc.) require a `resolveUsers` callback function to display user names - the auth endpoint alone isn't enough

**Solution:**
1. Created new API endpoint `/api/users` that returns user info for given user IDs
2. Added `resolveUsers` callback to `liveblocks.config.ts` that calls the users API

**Files Modified:**
- `src/app/api/users/route.ts` (NEW)
- `liveblocks.config.ts`

**Key Code:**
```typescript
// liveblocks.config.ts
const client = createClient({
  authEndpoint: "/api/liveblocks-auth",
  resolveUsers: async ({ userIds }) => {
    const response = await fetch(`/api/users?userIds=${userIds.join(",")}`);
    return response.json();
  },
});
```

---

### Issue 2: Circular Tick Icon (Resolve Button) Needs Tooltip

**Solution:**
- Added CSS tooltip with dynamic text
- Shows "Mark as resolved" for open threads
- Shows "Reopen thread" for resolved threads
- Added keyboard accessibility (`:focus` states)
- Added `z-index: 10` for visibility

**File Modified:** `src/app/globals.css`

---

### Issue 3: Emoji/Reaction Button Not Working

**Root Cause:** `showReactions` prop was not set on Thread component.

**Solution:** Added `showReactions` prop to Thread components.

---

### Issue 4: "..." Overflow Menu Empty (No Edit/Delete)

**Root Cause:**
1. `showActions` needed to be explicitly `{true}` not just truthy
2. `showResolveAction` prop was missing

**Solution:** Added explicit props to Thread components.

---

### Additional Fix: FloatingThreads Not Using Correct Props

**Root Cause:** The `FloatingThreads` component in Editor.tsx uses its own Thread rendering, not the sidebar's Thread configuration.

**Solution:**
1. Created `CustomThread.tsx` wrapper component with all required props
2. Passed `CustomThread` to FloatingThreads via `components` prop

**Files Modified:**
- `src/components/Comments/CustomThread.tsx` (NEW)
- `src/components/Comments/index.ts`
- `src/components/Editor/Editor.tsx`

---

### Additional Fix: Missing `type` Field in UserInfo

**Root Cause:** `UserMeta` type requires `type: 'human' | 'ai-agent'` but auth route wasn't providing it.

**Solution:** Added `type: "human" as const` to userInfo in liveblocks-auth route.

---

## All Files Modified

| File | Change Type | Description |
|------|-------------|-------------|
| `liveblocks.config.ts` | Modified | Added `resolveUsers` callback |
| `src/app/api/liveblocks-auth/route.ts` | Modified | Profile fallback, error logging, type field |
| `src/app/api/users/route.ts` | NEW | User lookup API for resolveUsers |
| `src/app/globals.css` | Modified | Tooltip CSS with dynamic text, accessibility |
| `src/components/Comments/CommentsSidebar.tsx` | Modified | Thread props (showActions, showResolveAction, showReactions) |
| `src/components/Comments/CustomThread.tsx` | NEW | Wrapper component with consistent props |
| `src/components/Comments/index.ts` | Modified | Export CustomThread |
| `src/components/Editor/Editor.tsx` | Modified | Use CustomThread for FloatingThreads |

---

## Tests Added

- `src/__tests__/unit/liveblocks-auth-profile-fallback.test.ts` - 28 tests
- `src/__tests__/unit/thread-component-props.test.tsx` - 19 tests
- `src/__tests__/unit/resolve-button-tooltip.test.ts` - 31 tests
- `src/__tests__/e2e/comments-system-fixes.test.tsx` - 31 tests

**Total: 109 tests, all passing**

---

## Deployment Status

### Vercel Deployment
- **URL:** https://colab-md.vercel.app
- **Status:** Deployed and working

### Known Issue: OAuth Redirect to Localhost
**Problem:** When signing in with Google from Vercel deployment, redirects to localhost.

**Solution:** Add Vercel URL to Supabase allowed redirect URLs:
1. Supabase Dashboard → Authentication → URL Configuration
2. Add: `https://colab-md.vercel.app/auth/callback`

---

## Current Issue: Sharing Documents

### Problem
When trying to share a document with a friend by email, getting "user not found" error.

### Cause
The sharing system only works with users who have already signed up for ColabMD.

### Workaround
1. Friend must sign up first at https://colab-md.vercel.app
2. Sign in with Google
3. Then owner can share document with their email

### Future Enhancement
Could implement link-based sharing that doesn't require recipient to have an account first.

---

## Git Status

**Last Commit:** `5cf0cf7` - "Fix ColabMD comments system - Phase 2"
- 19 files changed
- 4992 insertions
- Pushed to `origin/main`

---

## Environment Setup

### Required Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
LIVEBLOCKS_SECRET_KEY=<your-liveblocks-secret>
```

### Commands
```bash
npm run dev      # Development server
npm run build    # Production build
npm test         # Run tests
```

---

## Architecture Notes

### How Comments/User Names Work
1. User logs in → `/api/liveblocks-auth` creates session with userInfo
2. User creates comment → Liveblocks stores comment with userId
3. Thread component renders → calls `resolveUsers({ userIds: [...] })`
4. `resolveUsers` calls `/api/users?userIds=...`
5. API returns `[{ id, name, avatar }]`
6. Thread displays actual user name

### Key Liveblocks Types (liveblocks.config.ts)
- `Presence` - Real-time cursor/status data
- `Storage` - Persistent room data (managed by Yjs)
- `UserMeta` - Static user info (name, email, avatar, color, type)
- `ThreadMetadata` - Comment thread metadata (resolved, AI fields)

---

## Screenshots
- `screengrabs/Screenshot 2026-02-02 at 9.00.20 PM.png` - Initial bug state
- `screengrabs/Screenshot 2026-02-02 at 9.05.57 PM.png` - After first fix attempt

---

## Next Steps / TODO
- [ ] Implement link-based sharing for users without accounts
- [ ] Remove debug logging from liveblocks-auth route (search for `console.log("[liveblocks-auth]`)
- [ ] Test real-time collaboration with multiple users
- [ ] Verify all 4 comment features work in production (Vercel)
