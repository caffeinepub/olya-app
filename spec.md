# Specification

## Summary
**Goal:** Extend the Olya application with conversation pattern learning, expanded bias detection, hallucination guardrails, ethical constraints enforcement, and a Safety & Quality Dashboard.

**Planned changes:**
- Add backend (Motoko) methods to record transcript utterances and accumulate per-user communication pattern statistics (emotion trends, intent distribution, topic clusters) that persist across sessions via stable variables.
- Add backend methods to store and query per-session bias incident logs and ethical violation logs.
- Create a `PatternPredictionsPanel` frontend component that reads the accumulated pattern profile and displays predicted next emotion, next intent, conversation direction, and suggested action window; shows a "Building pattern baseline…" placeholder when fewer than 3 entries exist.
- Extend `ethicsSimulator.ts` to detect at least four bias categories (gender, racial, socioeconomic, confirmation bias), tagging each instance with category, severity, and offending text fragment.
- Update `EthicsBadge.tsx` to display specific bias category labels and reflect new violation types.
- Show a bias incident count in `SessionSummaryBar` alongside the existing health score.
- Create a new `hallucinationGuard.ts` utility exporting `checkForHallucination(text, context)` that returns a `HallucinationResult` (flagged boolean, confidence score, suspect phrases array); route strategy recommendations and pattern predictions through this guard before rendering, annotating flagged outputs with a "Verify" warning badge.
- Create a new `ethicalConstraints.ts` utility exporting `enforceEthics(text)` returning `EnforcementResult` (isViolation, violationType, sanitizedText); apply it to every transcript entry and all AI-generated output, flagging violations in `TranscriptPanel` with a red "Ethics Violation" badge and blocking violating AI outputs with a "Content withheld – ethical constraint triggered" notice.
- Add a `SafetyQualityPanel` component to `Dashboard.tsx` consolidating bias incident count, hallucination flag rate, ethical violation count, and a color-coded Trustworthiness Score (0–100), all updating in real-time.
- Integrate all new panels into `Dashboard.tsx` within `PanelContainer` for consistent styling.

**User-visible outcome:** Operators can view real-time pattern-based predictions, see bias incidents categorized and counted, receive hallucination warnings on AI-generated content, and monitor ethical constraint violations — all consolidated in a new Safety & Quality Dashboard with a live Trustworthiness Score.
