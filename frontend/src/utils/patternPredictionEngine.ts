import type { TranscriptEntry } from '../hooks/useDashboardState';

export interface PatternPrediction {
  nextEmotion: string;
  nextIntent: string;
  conversationDirection: 'escalating' | 'de-escalating' | 'stable';
  actionWindow: string;
  confidence: number;
  hallucinationRisk: 'low' | 'medium' | 'high';
}

function getRecentEmotions(entries: TranscriptEntry[]): string[] {
  return entries.slice(-5).map((e) => e.emotions[0]?.emotionType ?? 'neutral');
}

function getRecentIntents(entries: TranscriptEntry[]): string[] {
  return entries.slice(-5).map((e) => e.intents[0]?.intentType ?? 'statement');
}

function predictNext(sequence: string[], fallback: string): string {
  if (sequence.length === 0) return fallback;
  // Simple frequency-based prediction: most common in recent window
  const counts: Record<string, number> = {};
  for (const item of sequence) {
    counts[item] = (counts[item] ?? 0) + 1;
  }
  return Object.entries(counts).sort(([, a], [, b]) => b - a)[0]?.[0] ?? fallback;
}

function assessConversationDirection(entries: TranscriptEntry[]): 'escalating' | 'de-escalating' | 'stable' {
  if (entries.length < 4) return 'stable';

  const hostileEmotions = ['anger', 'fear', 'disgust'];
  const hostileIntents = ['threatening', 'deflecting'];

  const firstHalf = entries.slice(0, Math.floor(entries.length / 2));
  const secondHalf = entries.slice(Math.floor(entries.length / 2));

  let firstHostile = 0;
  let secondHostile = 0;

  for (const e of firstHalf) {
    if (hostileEmotions.includes(e.emotions[0]?.emotionType ?? '')) firstHostile++;
    if (hostileIntents.includes(e.intents[0]?.intentType ?? '')) firstHostile++;
  }
  for (const e of secondHalf) {
    if (hostileEmotions.includes(e.emotions[0]?.emotionType ?? '')) secondHostile++;
    if (hostileIntents.includes(e.intents[0]?.intentType ?? '')) secondHostile++;
  }

  if (secondHostile > firstHostile + 1) return 'escalating';
  if (firstHostile > secondHostile + 1) return 'de-escalating';
  return 'stable';
}

function generateActionWindow(
  nextEmotion: string,
  nextIntent: string,
  direction: string
): string {
  if (direction === 'escalating') {
    return 'Immediate de-escalation recommended. Use empathetic language and avoid confrontational framing.';
  }
  if (nextIntent === 'threatening') {
    return 'Prepare counter-strategy. Acknowledge concerns while redirecting to shared interests.';
  }
  if (nextEmotion === 'fear' || nextEmotion === 'anxiety') {
    return 'Provide reassurance. Focus on safety and stability messaging.';
  }
  if (nextIntent === 'negotiating') {
    return 'Optimal negotiation window. Present key proposals with clear mutual benefits.';
  }
  if (nextEmotion === 'trust' || nextEmotion === 'joy') {
    return 'High receptivity detected. Good moment to advance key objectives.';
  }
  return 'Maintain current approach. Monitor for shifts in emotional tone.';
}

function assessHallucinationRisk(entries: TranscriptEntry[], confidence: number): 'low' | 'medium' | 'high' {
  if (entries.length < 3) return 'high';
  if (entries.length < 6) return 'medium';
  if (confidence < 0.4) return 'high';
  if (confidence < 0.6) return 'medium';
  return 'low';
}

export function predictPatterns(entries: TranscriptEntry[]): PatternPrediction | null {
  if (entries.length < 2) return null;

  const recentEmotions = getRecentEmotions(entries);
  const recentIntents = getRecentIntents(entries);

  const nextEmotion = predictNext(recentEmotions, 'neutral');
  const nextIntent = predictNext(recentIntents, 'acknowledging');
  const direction = assessConversationDirection(entries);
  const actionWindow = generateActionWindow(nextEmotion, nextIntent, direction);

  // Confidence based on data quantity and consistency
  const uniqueEmotions = new Set(recentEmotions).size;
  const uniqueIntents = new Set(recentIntents).size;
  const consistency = 1 - (uniqueEmotions + uniqueIntents) / (recentEmotions.length + recentIntents.length + 1);
  const confidence = Math.min(0.9, 0.3 + consistency * 0.6 + Math.min(entries.length / 20, 0.2));

  const hallucinationRisk = assessHallucinationRisk(entries, confidence);

  return {
    nextEmotion,
    nextIntent,
    conversationDirection: direction,
    actionWindow,
    confidence,
    hallucinationRisk,
  };
}

export interface PatternProfile {
  dominantEmotion: string;
  dominantIntent: string;
  entryCount: number;
  direction: 'escalating' | 'de-escalating' | 'stable';
}

export function buildPatternProfile(entries: TranscriptEntry[]): PatternProfile | null {
  if (entries.length === 0) return null;

  const recentEntry = entries[entries.length - 1];
  const topEmotion = recentEntry?.emotions[0]?.emotionType ?? 'neutral';
  const topIntent = recentEntry?.intents[0]?.intentType ?? 'statement';

  return {
    dominantEmotion: topEmotion,
    dominantIntent: topIntent,
    entryCount: entries.length,
    direction: assessConversationDirection(entries),
  };
}
