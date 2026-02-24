import { useState, useCallback } from 'react';
import type { SpeakerRole } from '@/components/TranscriptInput';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EmotionResult {
  emotionType: string;
  confidence: number;
}

export interface IntentResult {
  intentType: string;
  confidence: number;
}

export interface ToxicityFlag {
  flagType: string;
  confidence: number;
}

export interface BeliefStateData {
  persuasionLevel: number;
  trustLevel: number;
  concerns: string[];
}

export interface StrategyRecommendation {
  strategy: string;
  confidence: number;
  rationale: string;
}

export interface TranscriptEntry {
  id: string;
  text: string;
  speaker: SpeakerRole;
  timestamp: Date;
  emotions: EmotionResult[];
  intents: IntentResult[];
  toxicityFlags: ToxicityFlag[];
  beliefState: BeliefStateData;
  strategyRecommendations: StrategyRecommendation[];
}

export interface DashboardState {
  transcriptEntries: TranscriptEntry[];
  currentBeliefState: BeliefStateData;
  latestEntry: TranscriptEntry | null;
}

// ─── NLP Simulation ───────────────────────────────────────────────────────────

function detectEmotions(text: string): EmotionResult[] {
  const lower = text.toLowerCase();
  const emotions: EmotionResult[] = [];

  const emotionKeywords: Record<string, string[]> = {
    anger: ['angry', 'furious', 'mad', 'rage', 'hate', 'kill', 'hurt', 'attack', 'threat'],
    fear: ['scared', 'afraid', 'terrified', 'fear', 'panic', 'worried', 'anxious', 'nervous'],
    sadness: ['sad', 'cry', 'depressed', 'hopeless', 'miserable', 'grief', 'loss', 'alone'],
    joy: ['happy', 'glad', 'excited', 'great', 'wonderful', 'love', 'amazing', 'fantastic'],
    surprise: ['shocked', 'surprised', 'unexpected', 'sudden', 'wow', 'unbelievable'],
    disgust: ['disgusting', 'horrible', 'awful', 'terrible', 'gross', 'sick'],
    neutral: [],
  };

  let maxScore = 0;
  let dominantEmotion = 'neutral';

  for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
    if (emotion === 'neutral') continue;
    const matches = keywords.filter((kw) => lower.includes(kw)).length;
    if (matches > 0) {
      const confidence = Math.min(0.95, 0.5 + matches * 0.15);
      emotions.push({ emotionType: emotion, confidence });
      if (confidence > maxScore) {
        maxScore = confidence;
        dominantEmotion = emotion;
      }
    }
  }

  if (emotions.length === 0) {
    emotions.push({ emotionType: 'neutral', confidence: 0.75 });
    dominantEmotion = 'neutral';
  }

  return emotions.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
}

function detectIntents(text: string): IntentResult[] {
  const lower = text.toLowerCase();
  const intents: IntentResult[] = [];

  const intentPatterns: Record<string, string[]> = {
    'request-help': ['help', 'need', 'please', 'assist', 'support', 'can you'],
    'express-grievance': ['unfair', 'wrong', 'unjust', 'complaint', 'problem', 'issue'],
    'make-threat': ['will hurt', 'going to', 'you will', 'regret', 'pay for', 'threat'],
    'seek-information': ['what', 'why', 'how', 'when', 'where', 'who', 'tell me', 'explain'],
    'negotiate': ['deal', 'agree', 'compromise', 'offer', 'accept', 'terms', 'condition'],
    'deny-accusation': ["didn't", "didn't", 'not me', 'innocent', 'false', 'lie', 'wrong'],
    'cooperate': ['okay', 'yes', 'agree', 'understand', 'cooperate', 'comply', 'will do'],
  };

  for (const [intent, patterns] of Object.entries(intentPatterns)) {
    const matches = patterns.filter((p) => lower.includes(p)).length;
    if (matches > 0) {
      intents.push({
        intentType: intent,
        confidence: Math.min(0.95, 0.45 + matches * 0.2),
      });
    }
  }

  if (intents.length === 0) {
    intents.push({ intentType: 'statement', confidence: 0.7 });
  }

  return intents.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
}

function detectToxicity(text: string): ToxicityFlag[] {
  const lower = text.toLowerCase();
  const flags: ToxicityFlag[] = [];

  const toxicPatterns: Record<string, string[]> = {
    threat: ['kill', 'hurt', 'attack', 'destroy', 'harm', 'threat', 'going to get you'],
    harassment: ['stupid', 'idiot', 'moron', 'loser', 'worthless', 'pathetic'],
    'hate-speech': ['hate', 'despise', 'disgusting person'],
    coercion: ['must', 'have to', 'no choice', 'or else', 'forced'],
  };

  for (const [flagType, patterns] of Object.entries(toxicPatterns)) {
    const matches = patterns.filter((p) => lower.includes(p)).length;
    if (matches > 0) {
      flags.push({
        flagType,
        confidence: Math.min(0.95, 0.55 + matches * 0.2),
      });
    }
  }

  return flags.sort((a, b) => b.confidence - a.confidence);
}

function updateBeliefState(
  current: BeliefStateData,
  entry: { text: string; emotions: EmotionResult[]; intents: IntentResult[]; speaker: SpeakerRole }
): BeliefStateData {
  const lower = entry.text.toLowerCase();

  // Adjust trust based on speaker and content
  let trustDelta = 0;
  let persuasionDelta = 0;
  const newConcerns = [...current.concerns];

  const cooperativeIntents = ['cooperate', 'negotiate', 'request-help'];
  const hostileIntents = ['make-threat', 'express-grievance'];

  const hasCooperative = entry.intents.some((i) => cooperativeIntents.includes(i.intentType));
  const hasHostile = entry.intents.some((i) => hostileIntents.includes(i.intentType));

  if (hasCooperative) {
    trustDelta += 0.05;
    persuasionDelta += 0.04;
  }
  if (hasHostile) {
    trustDelta -= 0.08;
    persuasionDelta -= 0.03;
  }

  // Emotion-based adjustments
  const dominantEmotion = entry.emotions[0]?.emotionType;
  if (dominantEmotion === 'anger') {
    trustDelta -= 0.06;
    if (!newConcerns.includes('Elevated hostility')) newConcerns.push('Elevated hostility');
  } else if (dominantEmotion === 'fear') {
    if (!newConcerns.includes('Subject shows fear')) newConcerns.push('Subject shows fear');
  } else if (dominantEmotion === 'joy') {
    trustDelta += 0.04;
  }

  // Speaker-specific adjustments
  if (entry.speaker === 'Subject') {
    if (lower.includes('understand') || lower.includes('okay')) {
      persuasionDelta += 0.06;
    }
  }

  const concerns = newConcerns.slice(-4); // keep last 4 concerns

  return {
    trustLevel: Math.max(0, Math.min(1, current.trustLevel + trustDelta)),
    persuasionLevel: Math.max(0, Math.min(1, current.persuasionLevel + persuasionDelta)),
    concerns,
  };
}

function generateStrategies(
  emotions: EmotionResult[],
  intents: IntentResult[],
  beliefState: BeliefStateData,
  speaker: SpeakerRole
): StrategyRecommendation[] {
  const strategies: StrategyRecommendation[] = [];
  const dominantEmotion = emotions[0]?.emotionType;
  const dominantIntent = intents[0]?.intentType;

  if (dominantEmotion === 'anger') {
    strategies.push({
      strategy: 'De-escalation',
      confidence: 0.88,
      rationale: 'High anger detected; use calm, measured language to reduce tension.',
    });
  }

  if (dominantEmotion === 'fear') {
    strategies.push({
      strategy: 'Reassurance',
      confidence: 0.82,
      rationale: 'Fear detected; provide clear, non-threatening information to build safety.',
    });
  }

  if (dominantIntent === 'negotiate') {
    strategies.push({
      strategy: 'Active Negotiation',
      confidence: 0.85,
      rationale: 'Negotiation intent detected; explore common ground and mutual interests.',
    });
  }

  if (dominantIntent === 'seek-information') {
    strategies.push({
      strategy: 'Information Provision',
      confidence: 0.79,
      rationale: 'Subject seeking information; provide clear, factual responses.',
    });
  }

  if (beliefState.trustLevel < 0.3) {
    strategies.push({
      strategy: 'Trust Building',
      confidence: 0.76,
      rationale: 'Low trust level; focus on transparency and consistency.',
    });
  }

  if (beliefState.persuasionLevel > 0.7) {
    strategies.push({
      strategy: 'Consolidate Progress',
      confidence: 0.8,
      rationale: 'High persuasion level; reinforce positive momentum.',
    });
  }

  if (strategies.length === 0) {
    strategies.push({
      strategy: 'Active Listening',
      confidence: 0.72,
      rationale: 'Maintain rapport through attentive, empathetic engagement.',
    });
  }

  return strategies.slice(0, 3);
}

// ─── Initial State ─────────────────────────────────────────────────────────────

const initialBeliefState: BeliefStateData = {
  persuasionLevel: 0.3,
  trustLevel: 0.4,
  concerns: [],
};

// ─── Hook ──────────────────────────────────────────────────────────────────────

export function useDashboardState() {
  const [transcriptEntries, setTranscriptEntries] = useState<TranscriptEntry[]>([]);
  const [currentBeliefState, setCurrentBeliefState] =
    useState<BeliefStateData>(initialBeliefState);
  const [latestEntry, setLatestEntry] = useState<TranscriptEntry | null>(null);

  const addTranscriptEntry = useCallback(
    (text: string, speaker: SpeakerRole) => {
      const emotions = detectEmotions(text);
      const intents = detectIntents(text);
      const toxicityFlags = detectToxicity(text);

      const newBeliefState = updateBeliefState(currentBeliefState, {
        text,
        emotions,
        intents,
        speaker,
      });

      const strategies = generateStrategies(emotions, intents, newBeliefState, speaker);

      const entry: TranscriptEntry = {
        id: `entry-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        text,
        speaker,
        timestamp: new Date(),
        emotions,
        intents,
        toxicityFlags,
        beliefState: newBeliefState,
        strategyRecommendations: strategies,
      };

      setTranscriptEntries((prev) => [...prev, entry]);
      setCurrentBeliefState(newBeliefState);
      setLatestEntry(entry);

      return entry;
    },
    [currentBeliefState]
  );

  const resetState = useCallback(() => {
    setTranscriptEntries([]);
    setCurrentBeliefState(initialBeliefState);
    setLatestEntry(null);
  }, []);

  return {
    transcriptEntries,
    currentBeliefState,
    latestEntry,
    addTranscriptEntry,
    resetState,
  };
}
