# Specification

## Summary
**Goal:** Fix the New Session button in SessionManager so it correctly creates and selects a new session.

**Planned changes:**
- Wire the New Session button's click handler to invoke the existing `createSession` mutation from `useQueries.ts`.
- Update the session list in the UI immediately after a new session is created.
- Automatically select the newly created session as the active session upon creation.
- Ensure the button is not disabled and responds to click events, providing appropriate feedback when the user is not authenticated.

**User-visible outcome:** Clicking the New Session button creates a new session, adds it to the session list, and selects it as the active session without errors.
