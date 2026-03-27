/**
 * AI Pipeline Service Layer
 *
 * Provides one async function per pipeline stage.  Each function:
 *   - Accepts a typed input matching the shapes consumed by useDashboardState.ts
 *   - Returns a typed output matching the shapes consumed by panel components
 *   - Delegates to local simulators when USE_MOCK is true
 *   - Calls the configured external endpoint via fetch when USE_MOCK is false
 *
 * To add a real endpoint, set USE_MOCK = false and fill in PIPELINE_ENDPOINTS
 * in aiPipelineConfig.ts — no changes to this file are needed.
 */

import { PIPELINE_ENDPOINTS, USE_MOCK } from "./aiPipelineConfig";

import type {
  StrategyRecommendation,
  TranscriptEntry,
} from "../hooks/useDashboardState";
import {
  type BeliefGraph,
  initBeliefGraph,
  updateBeliefGraph,
} from "../utils/beliefStateSimulator";
// ── Simulator imports (mock/fallback implementations) ─────────────────────────
import {
  type EmotionIntentResult,
  analyzeEmotionIntent,
} from "../utils/emotionIntentSimulator";
import { type EthicsResult, analyzeEthics } from "../utils/ethicsSimulator";
import { type SemanticAnalysis, analyzeSemantics } from "../utils/nlpSimulator";
import { generateStrategies } from "../utils/strategySimulator";

// ── Shared helper ─────────────────────────────────────────────────────────────

/**
 * POST JSON to an external endpoint and return the parsed response.
 * Throws on non-2xx status or network failure.
 */
async function postToEndpoint<TReq, TRes>(
  url: string,
  body: TReq,
): Promise<TRes> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(
      `Pipeline API error [${response.status}]: ${response.statusText} — ${url}`,
    );
  }

  return response.json() as Promise<TRes>;
}

// ── Request / Response interfaces ─────────────────────────────────────────────

export interface ASRRequest {
  /** Raw audio bytes encoded as base64, or plain text for pass-through mode. */
  input: string;
  /** BCP-47 language hint, e.g. 'en', 'fr'. */
  language?: string;
}

export interface ASRResponse {
  /** Transcribed text. */
  transcript: string;
  /** Detected BCP-47 language code. */
  detectedLanguage: string;
}

export interface NLPRequest {
  text: string;
  language?: string;
}

export type NLPResponse = SemanticAnalysis;

export interface EmotionIntentRequest {
  text: string;
  detectedLanguage?: string;
}

export type EmotionIntentResponse = EmotionIntentResult;

export interface BeliefModelingRequest {
  currentGraph: BeliefGraph;
  text: string;
  entryIndex: number;
}

export type BeliefModelingResponse = BeliefGraph;

export interface StrategyEngineRequest {
  text: string;
  intents: string[];
  trustLevel: number;
  persuasionScore: number;
}

export type StrategyEngineResponse = StrategyRecommendation[];

export interface EthicsRequest {
  text: string;
}

export type EthicsResponse = EthicsResult;

// ── Pipeline stage functions ───────────────────────────────────────────────────

/**
 * ASR — Automatic Speech Recognition.
 * In mock mode this is a pass-through (text is already transcribed by the
 * browser's Web Speech API or the local ASR simulators).
 */
export async function runASR(request: ASRRequest): Promise<ASRResponse> {
  if (USE_MOCK) {
    // Local simulators handle ASR via useSpeechRecognition; this is a no-op
    // pass-through that normalises the response shape.
    return {
      transcript: request.input,
      detectedLanguage: request.language ?? "en",
    };
  }

  return postToEndpoint<ASRRequest, ASRResponse>(
    PIPELINE_ENDPOINTS.asr,
    request,
  );
}

/**
 * NLP — Natural Language Processing / Semantic Analysis.
 */
export async function runNLP(request: NLPRequest): Promise<NLPResponse> {
  if (USE_MOCK) {
    return analyzeSemantics(request.text);
  }

  return postToEndpoint<NLPRequest, NLPResponse>(
    PIPELINE_ENDPOINTS.nlp,
    request,
  );
}

/**
 * Emotion & Intent Detection.
 */
export async function runEmotionIntent(
  request: EmotionIntentRequest,
): Promise<EmotionIntentResponse> {
  if (USE_MOCK) {
    return analyzeEmotionIntent(request.text, request.detectedLanguage);
  }

  return postToEndpoint<EmotionIntentRequest, EmotionIntentResponse>(
    PIPELINE_ENDPOINTS.emotionIntent,
    request,
  );
}

/**
 * Belief Modeling — updates the belief-state graph.
 */
export async function runBeliefModeling(
  request: BeliefModelingRequest,
): Promise<BeliefModelingResponse> {
  if (USE_MOCK) {
    return updateBeliefGraph(
      request.currentGraph,
      request.text,
      request.entryIndex,
    );
  }

  return postToEndpoint<BeliefModelingRequest, BeliefModelingResponse>(
    PIPELINE_ENDPOINTS.beliefModeling,
    request,
  );
}

/**
 * Strategy Engine — LLaMA+RL strategy recommendation.
 */
export async function runStrategyEngine(
  request: StrategyEngineRequest,
): Promise<StrategyEngineResponse> {
  if (USE_MOCK) {
    return generateStrategies(
      request.text,
      request.intents,
      request.trustLevel,
      request.persuasionScore,
    );
  }

  return postToEndpoint<StrategyEngineRequest, StrategyEngineResponse>(
    PIPELINE_ENDPOINTS.strategyEngine,
    request,
  );
}

/**
 * Ethics & Safety — toxicity, bias, and ethical constraint analysis.
 */
export async function runEthics(
  request: EthicsRequest,
): Promise<EthicsResponse> {
  if (USE_MOCK) {
    return analyzeEthics(request.text);
  }

  return postToEndpoint<EthicsRequest, EthicsResponse>(
    PIPELINE_ENDPOINTS.ethics,
    request,
  );
}

/**
 * Convenience: initialise an empty belief graph (delegates to the simulator
 * utility regardless of mode — this is purely local state initialisation).
 */
export { initBeliefGraph };
