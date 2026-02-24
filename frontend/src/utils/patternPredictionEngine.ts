import type { TranscriptEntry } from '@/hooks/useDashboardState';

export type NegotiationDirection = 'escalating' | 'de-escalating' | 'stable';

export interface DeescalationWindow {
  timing: string;
  reasoning: string;
  urgency: 'immediate' | 'soon' | 'monitor';
}

export interface PatternProfile {
  patterns: Array<{
    speakerRole: string;
    intent: string;
    emotion: string;
    topic: string;
    occurrence: bigint;
  }>;
  biases: Array<{ category: string; count: bigint }>;
  ethicalViolations: Array<{ violationType: string; count: bigint }>;
}

export interface PatternPrediction {
  nextEmotion: { label: string; confidence: number };
  nextIntent: { label: string; confidence: number };
  negotiationDirection: NegotiationDirection;
  negotiationDirectionReasoning: string;
  deescalationWindow: DeescalationWindow;
}

function getEmotionTrend(entries: TranscriptEntry[]): string[] {
  return entries.slice(-5).map((e) => e.emotions[0]?.emotionType ?? 'neutral');
}

function getIntentTrend(entries: TranscriptEntry[]): string[] {
  return entries.slice(-5).map((e) => e.intents[0]?.intentType ?? 'statement');
}

function frequencyMap(items: string[]): Record<string, number> {
  const freq: Record<string, number> = {};
  for (const item of items) {
    freq[item] = (freq[item] ?? 0) + 1;
  }
  return freq;
}

function topByFrequency(freq: Record<string, number>): [string, number] {
  let topKey = 'neutral';
  let topCount = 0;
  for (const [key, count] of Object.entries(freq)) {
    if (count > topCount) {
      topCount = count;
      topKey = key;
    }
  }
  return [topKey, topCount];
}

function predictNextEmotion(
  entries: TranscriptEntry[],
  profile: PatternProfile | null
): { label: string; confidence: number } {
  const recentEmotions = getEmotionTrend(entries);
  const freq = frequencyMap(recentEmotions);

  // Weight recent entries more heavily
  const last = recentEmotions[recentEmotions.length - 1];
  if (last) {
    freq[last] = (freq[last] ?? 0) + 2;
  }

  // Incorporate profile patterns if available
  if (profile && profile.patterns.length > 0) {
    for (const p of profile.patterns) {
      if (p.emotion) {
        freq[p.emotion] = (freq[p.emotion] ?? 0) + Number(p.occurrence) * 0.1;
      }
    }
  }

  const [topEmotion, topCount] = topByFrequency(freq);
  const total = Object.values(freq).reduce((a, b) => a + b, 0);
  const confidence = total > 0 ? Math.min(0.92, topCount / total + 0.1) : 0.5;

  return { label: topEmotion, confidence };
}

function predictNextIntent(
  entries: TranscriptEntry[],
  profile: PatternProfile | null
): { label: string; confidence: number } {
  const recentIntents = getIntentTrend(entries);
  const freq = frequencyMap(recentIntents);

  const last = recentIntents[recentIntents.length - 1];
  if (last) {
    freq[last] = (freq[last] ?? 0) + 2;
  }

  if (profile && profile.patterns.length > 0) {
    for (const p of profile.patterns) {
      if (p.intent) {
        freq[p.intent] = (freq[p.intent] ?? 0) + Number(p.occurrence) * 0.1;
      }
    }
  }

  const [topIntent, topCount] = topByFrequency(freq);
  const total = Object.values(freq).reduce((a, b) => a + b, 0);
  const confidence = total > 0 ? Math.min(0.90, topCount / total + 0.1) : 0.5;

  return { label: topIntent, confidence };
}

function predictNegotiationDirection(entries: TranscriptEntry[]): {
  direction: NegotiationDirection;
  reasoning: string;
} {
  if (entries.length < 2) {
    return { direction: 'stable', reasoning: 'Insufficient data to determine trend.' };
  }

  const recent = entries.slice(-4);
  const hostileEmotions = ['anger', 'disgust', 'fear'];
  const cooperativeEmotions = ['joy', 'neutral'];
  const hostileIntents = ['make-threat', 'express-grievance'];
  const cooperativeIntents = ['cooperate', 'negotiate', 'request-help'];

  let hostileScore = 0;
  let cooperativeScore = 0;

  for (const entry of recent) {
    const topEmotion = entry.emotions[0]?.emotionType ?? 'neutral';
    const topIntent = entry.intents[0]?.intentType ?? 'statement';

    if (hostileEmotions.includes(topEmotion)) hostileScore += 1;
    if (cooperativeEmotions.includes(topEmotion)) cooperativeScore += 1;
    if (hostileIntents.includes(topIntent)) hostileScore += 1.5;
    if (cooperativeIntents.includes(topIntent)) cooperativeScore += 1.5;
  }

  // Check trend: compare first half vs second half
  const mid = Math.floor(recent.length / 2);
  const firstHalf = recent.slice(0, mid);
  const secondHalf = recent.slice(mid);

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

  if (secondHostile > firstHostile + 0.5) {
    return {
      direction: 'escalating',
      reasoning: `Hostility signals increasing in recent exchanges (score: ${hostileScore.toFixed(1)}).`,
    };
  }

  if (secondHostile < firstHostile - 0.5 || cooperativeScore > hostileScore * 1.5) {
    return {
      direction: 'de-escalating',
      reasoning: `Cooperative signals dominating recent exchanges (cooperative: ${cooperativeScore.toFixed(1)}, hostile: ${hostileScore.toFixed(1)}).`,
    };
  }

  return {
    direction: 'stable',
    reasoning: `Mixed signals with no clear trend (cooperative: ${cooperativeScore.toFixed(1)}, hostile: ${hostileScore.toFixed(1)}).`,
  };
}

function predictDeescalationWindow(
  entries: TranscriptEntry[],
  direction: NegotiationDirection
): DeescalationWindow {
  const recentEntry = entries[entries.length - 1];
  const topEmotion = recentEntry?.emotions[0]?.emotionType ?? 'neutral';
  const topIntent = recentEntry?.intents[0]?.intentType ?? 'statement';

  if (direction === 'escalating') {
    if (topEmotion === 'anger') {
      return {
        timing: 'Immediate intervention needed',
        reasoning: 'High anger detected with escalating pattern. Intervene now with de-escalation techniques.',
        urgency: 'immediate',
      };
    }
    return {
      timing: 'Within next 1-2 exchanges',
      reasoning: 'Escalation trend detected. Address underlying concerns before tension peaks.',
      urgency: 'soon',
    };
  }

  if (direction === 'de-escalating') {
    if (topIntent === 'cooperate' || topIntent === 'negotiate') {
      return {
        timing: 'Now — optimal window open',
        reasoning: 'Cooperative intent with de-escalating trend. This is the ideal moment to consolidate progress.',
        urgency: 'immediate',
      };
    }
    return {
      timing: 'Within next 2-3 exchanges',
      reasoning: 'Positive trajectory. Maintain current approach and look for agreement opportunities.',
      urgency: 'soon',
    };
  }

  return {
    timing: 'Monitor and reassess',
    reasoning: 'Stable pattern. Continue active listening and watch for shifts in emotional tone.',
    urgency: 'monitor',
  };
}

export function predictNextPattern(
  entries: TranscriptEntry[],
  profile: PatternProfile | null
): PatternPrediction {
  const nextEmotion = predictNextEmotion(entries, profile);
  const nextIntent = predictNextIntent(entries, profile);
  const { direction, reasoning } = predictNegotiationDirection(entries);
  const deescalationWindow = predictDeescalationWindow(entries, direction);

  return {
    nextEmotion,
    nextIntent,
    negotiationDirection: direction,
    negotiationDirectionReasoning: reasoning,
    deescalationWindow,
  };
}
