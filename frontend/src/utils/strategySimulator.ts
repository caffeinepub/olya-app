import { generateLlamaRLStrategies } from './llamaRLEngine';
import type { TranscriptEntry, StrategyRecommendation } from '../hooks/useDashboardState';

/**
 * Generate strategies using the LLaMA+RL engine.
 */
export function generateStrategies(
  text: string,
  intents: string[],
  trustLevel: number = 50,
  persuasionScore: number = 0
): StrategyRecommendation[] {
  // Build a minimal fake entry for the LLaMA+RL engine
  const fakeEntry: TranscriptEntry = {
    text,
    speaker: 'Unknown',
    timestamp: Date.now(),
    emotions: [{ emotionType: 'neutral', confidence: 0.5 }],
    intents: intents.map((i) => ({ intentType: i, confidence: 0.7 })),
    toxicityFlags: [],
    strategies: [],
    detectedLanguage: 'en',
    showTranslation: false,
  };

  try {
    return generateLlamaRLStrategies([fakeEntry], trustLevel, persuasionScore);
  } catch {
    // Fallback strategies
    return [
      { strategy: 'Active Listening', confidence: 0.7, rationale: 'Build rapport through attentive engagement' },
      { strategy: 'Open-Ended Questions', confidence: 0.65, rationale: 'Encourage elaboration and information sharing' },
      { strategy: 'Empathetic Acknowledgment', confidence: 0.6, rationale: 'Validate the speaker\'s perspective' },
    ];
  }
}

/**
 * Generate strategies from a list of entries (used by LLaMA+RL engine wrapper).
 */
export function generateStrategiesFromEntries(
  entries: TranscriptEntry[],
  trustLevel: number = 50,
  persuasionScore: number = 0
): StrategyRecommendation[] {
  try {
    return generateLlamaRLStrategies(entries, trustLevel, persuasionScore);
  } catch {
    return [
      { strategy: 'Active Listening', confidence: 0.7, rationale: 'Build rapport through attentive engagement' },
      { strategy: 'Open-Ended Questions', confidence: 0.65, rationale: 'Encourage elaboration and information sharing' },
    ];
  }
}
