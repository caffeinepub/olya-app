# Olya App

## Current State
The app has a `SessionManager` component that renders session cards with a delete (trash) button. The delete button calls `onDeleteSession` which triggers `handleDeleteSession` in `Dashboard.tsx`, which calls `deleteSession.mutateAsync(sessionId)` — a backend call via `useDeleteSession` hook. 

The reported issue is that "archived sessions can't be deleted." Based on code inspection:
- All sessions in the list come from `useGetSessions()` (backend only)
- `handleDeleteSession` strictly calls the backend `deleteSession` — if that fails, the error is caught and a toast error is shown, but the session stays in the UI
- There is no "archived" flag or separate UI state for archived sessions; all sessions shown are backend sessions
- The delete button is always visible and properly structured
- The issue is likely that when `deleteSession` backend call throws (e.g., "session not found" or ownership error), the UI shows an error but doesn't remove the session

## Requested Changes (Diff)

### Add
- Optimistic deletion: remove session from local query cache immediately when delete is triggered, before the backend call completes
- Fallback: if backend delete fails with "not found" or similar errors, still remove from local UI state so stale/orphaned sessions don't persist
- Error handling that distinguishes between "already deleted" (treat as success) vs real errors

### Modify
- `handleDeleteSession` in `Dashboard.tsx`: add optimistic update pattern using react-query's `queryClient.setQueryData` to immediately remove the session from the list
- `useDeleteSession` in `useQueries.ts`: enhance to support optimistic updates via `onMutate`/`onError` rollback

### Remove
- Nothing removed

## Implementation Plan
1. Update `useDeleteSession` in `useQueries.ts` to use optimistic updates: immediately remove session from cache on `onMutate`, rollback on `onError` (unless the error indicates session was already gone)
2. Update `handleDeleteSession` in `Dashboard.tsx` to handle errors more gracefully — if backend says session not found, still clear from UI
