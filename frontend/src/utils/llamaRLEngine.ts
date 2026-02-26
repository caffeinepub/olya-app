import type { TranscriptEntry, StrategyRecommendation } from '../hooks/useDashboardState';

interface RLWeights {
  trustWeight: number;
  persuasionWeight: number;
  emotionWeight: number;
  intentWeight: number;
}

interface StrategyCandidate {
  strategy: string;
  rationale: string;
  baseScore: number;
  tags: string[];
}

const STRATEGY_CANDIDATES: StrategyCandidate[] = [
  { strategy: 'Active Listening', rationale: 'Build rapport through attentive engagement', baseScore: 0.7, tags: ['rapport', 'trust'] },
  { strategy: 'Open-Ended Questions', rationale: 'Encourage elaboration and information sharing', baseScore: 0.65, tags: ['information', 'engagement'] },
  { strategy: 'Empathetic Acknowledgment', rationale: "Validate the speaker's perspective", baseScore: 0.6, tags: ['trust', 'rapport'] },
  { strategy: 'Reframing', rationale: 'Present the situation from a different angle', baseScore: 0.6, tags: ['persuasion', 'negotiation'] },
  { strategy: 'Common Ground', rationale: 'Identify shared interests to build alignment', baseScore: 0.65, tags: ['cooperation', 'trust'] },
  { strategy: 'Gradual Commitment', rationale: 'Secure small agreements to build momentum', baseScore: 0.55, tags: ['negotiation', 'persuasion'] },
  { strategy: 'Mirroring', rationale: 'Reflect language and tone to build connection', baseScore: 0.6, tags: ['rapport', 'trust'] },
  { strategy: 'Strategic Pause', rationale: 'Allow silence to encourage the other party to fill the gap', baseScore: 0.5, tags: ['negotiation', 'information'] },
  { strategy: 'Anchoring', rationale: 'Set a reference point to influence the negotiation range', baseScore: 0.6, tags: ['negotiation', 'persuasion'] },
  { strategy: 'De-escalation', rationale: 'Reduce tension to create a more productive dialogue', baseScore: 0.75, tags: ['trust', 'cooperation'] },
  { strategy: 'Socratic Questioning', rationale: 'Guide reasoning through targeted questions', baseScore: 0.6, tags: ['information', 'persuasion'] },
  { strategy: 'Concession Strategy', rationale: 'Offer calculated concessions to advance negotiations', baseScore: 0.55, tags: ['negotiation', 'cooperation'] },
];

function buildRLWeights(trustLevel: number, persuasionScore: number): RLWeights {
  const trustNorm = trustLevel / 100;
  const persuasionNorm = persuasionScore / 100;
  return {
    trustWeight: 0.3 + trustNorm * 0.2,
    persuasionWeight: 0.2 + persuasionNorm * 0.2,
    emotionWeight: 0.25,
    intentWeight: 0.25,
  };
}

function buildContextWindow(entries: TranscriptEntry[]): TranscriptEntry[] {
  return entries.slice(-5);
}

function scoreCandidate(
  candidate: StrategyCandidate,
  window: TranscriptEntry[],
  weights: RLWeights,
  dominantEmotion: string,
  dominantIntent: string
): number {
  let score = candidate.baseScore;

  // Boost trust-building strategies when trust is low
  if (weights.trustWeight < 0.4 && candidate.tags.includes('trust')) {
    score += 0.1;
  }

  // Boost persuasion strategies when persuasion score is high
  if (weights.persuasionWeight > 0.35 && candidate.tags.includes('persuasion')) {
    score += 0.08;
  }

  // Emotion-based adjustments
  if (dominantEmotion === 'anger' || dominantEmotion === 'fear') {
    if (candidate.tags.includes('rapport') || candidate.strategy === 'De-escalation') {
      score += 0.12;
    }
  }
  if (dominantEmotion === 'trust' || dominantEmotion === 'joy') {
    if (candidate.tags.includes('negotiation')) {
      score += 0.08;
    }
  }

  // Intent-based adjustments
  if (dominantIntent === 'negotiating' && candidate.tags.includes('negotiation')) {
    score += 0.1;
  }
  if (dominantIntent === 'threatening' && candidate.strategy === 'De-escalation') {
    score += 0.15;
  }
  if (dominantIntent === 'cooperating' && candidate.tags.includes('cooperation')) {
    score += 0.1;
  }
  if (dominantIntent === 'information-seeking' && candidate.tags.includes('information')) {
    score += 0.08;
  }

  // Recency bias: check last entry
  const lastEntry = window[window.length - 1];
  if (lastEntry) {
    const lastEmotion = lastEntry.emotions[0]?.emotionType ?? 'neutral';
    if (lastEmotion === 'anger' && candidate.strategy === 'De-escalation') {
      score += 0.1;
    }
  }

  return Math.min(0.99, score);
}

export function generateLlamaRLStrategies(
  entries: TranscriptEntry[],
  trustLevel: number = 50,
  persuasionScore: number = 0
): StrategyRecommendation[] {
  if (entries.length === 0) {
    return STRATEGY_CANDIDATES.slice(0, 3).map((c) => ({
      strategy: c.strategy,
      confidence: c.baseScore,
      rationale: c.rationale,
    }));
  }

  const window = buildContextWindow(entries);
  const weights = buildRLWeights(trustLevel, persuasionScore);

  // Aggregate emotions and intents from window
  const emotionCounts: Record<string, number> = {};
  const intentCounts: Record<string, number> = {};

  for (const e of window) {
    for (const em of e.emotions) {
      emotionCounts[em.emotionType] = (emotionCounts[em.emotionType] ?? 0) + em.confidence;
    }
    for (const i of e.intents) {
      intentCounts[i.intentType] = (intentCounts[i.intentType] ?? 0) + i.confidence;
    }
  }

  const dominantEmotion = Object.entries(emotionCounts).sort(([, a], [, b]) => b - a)[0]?.[0] ?? 'neutral';
  const dominantIntent = Object.entries(intentCounts).sort(([, a], [, b]) => b - a)[0]?.[0] ?? 'acknowledging';

  const scored = STRATEGY_CANDIDATES.map((candidate) => ({
    strategy: candidate.strategy,
    confidence: scoreCandidate(candidate, window, weights, dominantEmotion, dominantIntent),
    rationale: candidate.rationale,
  }));

  return scored.sort((a, b) => b.confidence - a.confidence).slice(0, 5);
}
