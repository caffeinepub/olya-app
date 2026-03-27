# Olya App v4.0

## Current State
The app is a multilingual AI-Driven Strategic Dialogue Intelligence System with:
- Dashboard with session management, transcript input, and 6 analysis panels (Emotion/Intent, Belief State, Semantic Analysis, Pattern Predictions, Safety/Quality, Strategy Engine)
- SessionSummaryBar showing health score, exchanges, dominant emotion, top strategy, and bias incidents
- AppHeader with ASR engine badge, NLP/Ethics status, API mode, manual link, theme, language selector, and login
- Version number not explicitly displayed in the UI

## Requested Changes (Diff)

### Add
- **Print Analysis button** in the Dashboard when an active session has transcript entries
- **PrintAnalysisView component** — a print-optimized layout that renders all analysis data (session summary, transcript entries, emotion/intent results, belief state, semantic analysis, pattern predictions, safety/quality, strategy engine recommendations)
- **Print CSS** — `@media print` styles to hide the sidebar, header, and controls; show only the print view
- **Version 4.0 label** in the AppHeader (e.g., a small badge or text next to the app name)

### Modify
- `Dashboard.tsx` — add a "Print Analysis" button in the toolbar above or below the SessionSummaryBar; clicking it triggers `window.print()` after making the PrintAnalysisView visible
- `AppHeader.tsx` — add "v4.0" text/badge next to the Olya logo/name
- `index.css` — add `@media print` rules to hide non-printable UI and show the print view

### Remove
- Nothing removed

## Implementation Plan
1. Create `src/frontend/src/components/PrintAnalysisView.tsx` — full analysis report layout (header with session metadata, summary stats, transcript log, all panel data)
2. Update `Dashboard.tsx` — import PrintAnalysisView, add Print button (Printer icon), pass all analysis data to PrintAnalysisView via a hidden `print-only` div
3. Update `AppHeader.tsx` — add v4.0 badge next to logo
4. Update `index.css` — add `@media print` CSS to hide `.no-print` elements and show `.print-only` elements
