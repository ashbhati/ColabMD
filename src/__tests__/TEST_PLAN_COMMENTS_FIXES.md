# Test Plan: Comments System Fixes

## Overview

This document outlines the comprehensive test strategy for the 4 issues fixed in the ColabMD comments system.

## Issues Summary

| Issue | Description | Root Cause | Fix Location |
|-------|-------------|------------|--------------|
| #1 | Comments showing "Anonymous" instead of user name | User metadata missing `full_name` for email-based users | `/src/app/api/liveblocks-auth/route.ts` |
| #2 | Resolve button missing tooltip | No tooltip on circular tick icon | `/src/app/globals.css` |
| #3 | Emoji/reaction button not working | `showReactions` prop not passed to Thread | `/src/components/Comments/CommentsSidebar.tsx` |
| #4 | "..." overflow menu empty | `showActions` and `showResolveAction` props not passed | `/src/components/Comments/CommentsSidebar.tsx` |

---

## Test Files

### Unit Tests

| File | Coverage |
|------|----------|
| `liveblocks-auth-profile-fallback.test.ts` | Issue #1 - Profile fallback logic |
| `thread-component-props.test.tsx` | Issues #3 & #4 - Thread component props |
| `resolve-button-tooltip.test.ts` | Issue #2 - CSS tooltip specification |

### Integration/E2E Tests

| File | Coverage |
|------|----------|
| `e2e/comments-system-fixes.test.tsx` | All issues - Combined integration tests |

### Existing Test Updates

| File | Updates Needed |
|------|----------------|
| `unit/CommentsSidebar.test.tsx` | Already comprehensive, may need prop assertions |
| `api/liveblocks-auth.test.ts` | Add profile lookup scenarios |

---

## Issue #1: Anonymous User Name Fix

### Test Scenarios

#### Priority 1: user_metadata.full_name (OAuth users)
- [x] Use `full_name` from user_metadata when available
- [x] Prefer metadata name over profile name
- [x] Handle whitespace-only names

#### Priority 2: profiles table lookup (FIX)
- [x] Use `profile.display_name` when metadata name is missing
- [x] Use profile name when metadata is undefined
- [x] Use profile name when metadata.full_name is null
- [x] Use profile name when metadata.full_name is empty string

#### Priority 3: Email prefix fallback
- [x] Use email prefix when no profile name
- [x] Handle complex email addresses (user+tag@domain.com)

#### Priority 4: Anonymous fallback
- [x] Return "Anonymous" when no data available
- [x] Return "Anonymous" for minimal user object

#### Avatar URL Resolution
- [x] Use metadata avatar when available
- [x] Prefer metadata avatar over profile avatar
- [x] Fall back to profile avatar
- [x] Return empty string when no avatar

#### Edge Cases
- [x] Profile with empty display_name
- [x] Profile with whitespace-only display_name
- [x] Email with no @ symbol
- [x] Email with multiple @ symbols
- [x] Undefined user_metadata

### Test Commands

```bash
npm test -- --testPathPattern="liveblocks-auth-profile-fallback"
```

---

## Issue #2: Resolve Button Tooltip

### Test Scenarios

#### CSS Structure
- [x] Verify class name `.lb-thread-resolve-button` is used
- [x] Verify `::after` pseudo-element approach
- [x] Document tooltip text: "Mark as resolved"

#### CSS Properties
- [x] Absolute positioning
- [x] Centered horizontally (left: 50%, transform: translateX(-50%))
- [x] Positioned above button (bottom: 100%)
- [x] Appropriate padding (4px 8px)
- [x] Theme variable usage for colors
- [x] Small font size (12px)
- [x] Border radius
- [x] No text wrapping (white-space: nowrap)
- [x] Hidden by default (opacity: 0)
- [x] No pointer events when hidden
- [x] Smooth transition (150ms)

#### Hover State
- [x] Becomes visible on hover (opacity: 1)
- [x] Uses `:hover` pseudo-class on parent

#### Accessibility
- [x] Document that CSS tooltips are not accessible to screen readers
- [x] Liveblocks button should have proper aria-label
- [x] Sufficient color contrast
- [x] Readable font size

#### Dark Mode
- [x] CSS variables adapt to dark mode
- [x] Inverted colors work in both modes

### Test Commands

```bash
npm test -- --testPathPattern="resolve-button-tooltip"
```

### Manual Testing Required

1. Hover over resolve button
2. Verify tooltip appears above button
3. Verify text is "Mark as resolved"
4. Verify tooltip disappears when not hovering
5. Test in both light and dark mode

---

## Issue #3: Emoji/Reaction Button

### Test Scenarios

#### showReactions Prop
- [x] Pass `showReactions={true}` to Thread component
- [x] Enable for all unresolved threads
- [x] Enable for all resolved threads
- [x] Enable for AI-generated threads
- [x] Verify prop type is boolean

#### Integration
- [x] Reaction button renders when prop is true
- [x] All visible threads have reaction buttons
- [x] Reactions work with other Thread props

### Test Commands

```bash
npm test -- --testPathPattern="thread-component-props"
```

### Manual Testing Required

1. Open comments sidebar
2. Find any comment thread
3. Click emoji/reaction button
4. Verify emoji picker opens
5. Select an emoji
6. Verify reaction appears on comment

---

## Issue #4: Overflow Menu (Actions)

### Test Scenarios

#### showActions Prop
- [x] Pass `showActions={true}` explicitly
- [x] Enable for unresolved threads
- [x] Enable for resolved threads
- [x] Enable for threads without metadata
- [x] Verify explicit boolean type (not truthy)

#### showResolveAction Prop
- [x] Pass `showResolveAction` to Thread
- [x] Enable for unresolved threads (to resolve)
- [x] Enable for resolved threads (to unresolve)

#### Combined Props
- [x] All Thread instances receive consistent props
- [x] Props work together without conflicts

### Test Commands

```bash
npm test -- --testPathPattern="thread-component-props"
```

### Manual Testing Required

1. Open comments sidebar
2. Find any comment thread
3. Click "..." overflow menu button
4. Verify menu contains:
   - Edit option
   - Delete option
   - (Possibly: Copy link option)
5. Verify edit and delete work correctly

---

## Integration Test Scenarios

### Combined Fixes
- [x] Thread renders with all fixes applied
- [x] Fixes persist across sidebar open/close
- [x] Fixes apply to dynamically added threads

### Regression Prevention
- [x] Threads without metadata still render
- [x] AI threads still show AI badge
- [x] Resolved threads in correct section
- [x] Empty state displays correctly
- [x] Sidebar close button works

### Test Commands

```bash
npm test -- --testPathPattern="comments-system-fixes"
```

---

## Edge Cases to Test

| Scenario | Expected Behavior |
|----------|-------------------|
| Thread with null metadata | Should render without error |
| Thread with undefined resolved | Treated as unresolved |
| 100+ threads | All should have correct props |
| Rapid sidebar toggle | No visual glitches |
| User with no email | Show "Anonymous" |
| Profile query failure | Fall back to email prefix |

---

## Running All Tests

```bash
# Run all comment-related tests
npm test -- --testPathPattern="(liveblocks-auth|CommentsSidebar|thread-component|resolve-button|comments-system)"

# Run with coverage
npm test -- --coverage --testPathPattern="(liveblocks-auth|CommentsSidebar|thread-component|resolve-button|comments-system)"

# Run in watch mode during development
npm test -- --watch --testPathPattern="comments"
```

---

## Coverage Targets

| File | Branch | Function | Line | Statement |
|------|--------|----------|------|-----------|
| liveblocks-auth/route.ts | 85% | 90% | 90% | 90% |
| CommentsSidebar.tsx | 90% | 95% | 95% | 95% |
| globals.css (tooltip) | N/A | N/A | N/A | N/A |

---

## Manual E2E Testing Checklist

### Pre-requisites
- [ ] User logged in with email (not OAuth)
- [ ] At least one document with comments
- [ ] Both light and dark mode available

### Issue #1: User Name
- [ ] Create a new comment
- [ ] Verify your name appears (not "Anonymous")
- [ ] Refresh page, verify name persists
- [ ] Have another user comment, verify their name

### Issue #2: Tooltip
- [ ] Hover over resolve (checkmark) button
- [ ] Verify "Mark as resolved" tooltip appears
- [ ] Verify tooltip is above the button
- [ ] Test in dark mode

### Issue #3: Reactions
- [ ] Click emoji button on any comment
- [ ] Verify emoji picker opens
- [ ] Add a reaction
- [ ] Verify reaction appears
- [ ] Remove reaction
- [ ] Verify reaction removed

### Issue #4: Actions Menu
- [ ] Click "..." menu on a comment
- [ ] Verify "Edit" option present
- [ ] Verify "Delete" option present
- [ ] Edit a comment
- [ ] Delete a comment (confirm works)

### Regression Testing
- [ ] Sidebar opens/closes correctly
- [ ] Add comment button works
- [ ] Resolve/unresolve works
- [ ] AI comments still show badge
- [ ] Dark mode renders correctly

---

## Known Limitations

1. **CSS Tooltip Testing**: Jest/RTL cannot test CSS pseudo-elements. Visual regression or E2E tests (Playwright/Cypress) recommended.

2. **Liveblocks Integration**: Some behaviors depend on Liveblocks SDK internals. Mock-based tests verify prop passing, not actual functionality.

3. **Profile Database Query**: Full integration requires actual Supabase connection. Unit tests mock the database layer.

4. **Real-time Updates**: Tests use static mock data. Real-time thread updates should be tested in E2E environment.

---

## Future Improvements

1. Add Playwright E2E tests for full browser testing
2. Add visual regression tests for tooltip
3. Add performance tests for large thread counts
4. Add accessibility audit tests
5. Add cross-browser testing for CSS tooltip
