# Specification

## Summary
**Goal:** Fix the bug preventing new conversation sessions from being created.

**Planned changes:**
- Investigate and fix the session creation failure, tracing the root cause through the backend `createSession` call, the React Query mutation in `useQueries.ts`, and the session creation handler in `Dashboard.tsx`
- Ensure the newly created session appears immediately in the session list and becomes the active session without a page refresh

**User-visible outcome:** Users can successfully create new sessions by clicking the "New Session" button, with the new session appearing instantly in the session list and becoming active.
