/**
 * AI Pipeline Configuration
 *
 * This file is the single source of truth for external API connectivity.
 *
 * ─── HOW TO SWITCH TO LIVE MODE ───────────────────────────────────────────────
 * 1. Set USE_MOCK to `false`.
 * 2. Fill in the real endpoint URLs in PIPELINE_ENDPOINTS below.
 * 3. Redeploy the frontend — no other code changes are required.
 * ──────────────────────────────────────────────────────────────────────────────
 *
 * When USE_MOCK is `true` (default), all pipeline stages delegate to the local
 * simulator utilities bundled with the app (zero network calls).
 *
 * When USE_MOCK is `false`, each stage calls its configured endpoint via the
 * browser fetch API.  The request body is JSON-encoded and the response is
 * expected to be JSON matching the typed interfaces in aiPipelineService.ts.
 */

/** Toggle between mock (local simulators) and live (external API) mode. */
export const USE_MOCK: boolean = true;

/**
 * Per-stage external API endpoint URLs.
 *
 * Replace the empty strings with your real API base URLs, e.g.:
 *   asr: 'https://api.example.com/v1/asr',
 *
 * These values are only used when USE_MOCK is `false`.
 */
export const PIPELINE_ENDPOINTS: Record<PipelineStageKey, string> = {
  /** Automatic Speech Recognition — converts audio/text input to a transcript. */
  asr: "",

  /** Natural Language Processing — semantic analysis of transcript text. */
  nlp: "",

  /** Emotion & Intent Detection — classifies emotions and speaker intents. */
  emotionIntent: "",

  /** Belief Modeling — updates the belief-state graph from new transcript entries. */
  beliefModeling: "",

  /** Strategy Engine — LLaMA+RL strategy recommendation generation. */
  strategyEngine: "",

  /** Ethics & Safety — toxicity, bias, and ethical constraint analysis. */
  ethics: "",
};

/** Union of all valid pipeline stage keys. */
export type PipelineStageKey =
  | "asr"
  | "nlp"
  | "emotionIntent"
  | "beliefModeling"
  | "strategyEngine"
  | "ethics";
