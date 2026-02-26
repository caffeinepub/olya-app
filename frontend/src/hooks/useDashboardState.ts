import { useState, useCallback } from 'react';
import { detectLanguage } from '../utils/languageDetector';
import { translateText } from '../utils/translationSimulator';
import { analyzeEmotionIntent } from '../utils/emotionIntentSimulator';
import { analyzeEthics } from '../utils/ethicsSimulator';
import { generateStrategies } from '../utils/strategySimulator';

export type SpeakerRole = 'Operator' | 'Subject' | 'Witness' | 'Unknown';

export interface EmotionScore {
  emotionType: string;
  confidence: number;
}

export interface IntentScore {
  intentType: string;
  confidence: number;
}

export interface ToxicityFlag {
  flagType: string;
  confidence: number;
}

export interface StrategyRecommendation {
  strategy: string;
  confidence: number;
  rationale: string;
}

export interface TranscriptEntry {
  text: string;
  speaker: SpeakerRole;
  timestamp: number;
  emotions: EmotionScore[];
  intents: IntentScore[];
  toxicityFlags: ToxicityFlag[];
  strategies: StrategyRecommendation[];
  detectedLanguage: string;
  translatedText?: string;
  showTranslation: boolean;
}

export interface BeliefState {
  trustLevel: number;
  persuasionScore: number;
  concerns: string[];
  speakerStates: Record<SpeakerRole, { entryCount: number; dominantEmotion: string }>;
}

const initialBeliefState: BeliefState = {
  trustLevel: 50,
  persuasionScore: 0,
  concerns: [],
  speakerStates: {
    Operator: { entryCount: 0, dominantEmotion: 'neutral' },
    Subject: { entryCount: 0, dominantEmotion: 'neutral' },
    Witness: { entryCount: 0, dominantEmotion: 'neutral' },
    Unknown: { entryCount: 0, dominantEmotion: 'neutral' },
  },
};

function updateBeliefState(prev: BeliefState, entry: TranscriptEntry): BeliefState {
  const speaker = entry.speaker;
  const topEmotion = entry.emotions[0]?.emotionType ?? 'neutral';
  const topIntent = entry.intents[0]?.intentType ?? 'acknowledging';

  let trustDelta = 0;
  if (topIntent === 'cooperating' || topIntent === 'acknowledging') trustDelta = 2;
  if (topIntent === 'threatening' || topIntent === 'deflecting') trustDelta = -3;
  if (topEmotion === 'anger' || topEmotion === 'disgust') trustDelta -= 2;
  if (topEmotion === 'trust' || topEmotion === 'joy') trustDelta += 1;

  const newTrust = Math.max(0, Math.min(100, prev.trustLevel + trustDelta));

  let persuasionDelta = 0;
  if (topIntent === 'persuading') persuasionDelta = 3;
  if (topIntent === 'negotiating') persuasionDelta = 1;
  const newPersuasion = Math.max(0, Math.min(100, prev.persuasionScore + persuasionDelta));

  const newConcerns = [...prev.concerns];
  if (entry.toxicityFlags.length > 0 && !newConcerns.includes('toxicity')) {
    newConcerns.push('toxicity');
  }

  const prevSpeakerState = prev.speakerStates[speaker];
  return {
    ...prev,
    trustLevel: newTrust,
    persuasionScore: newPersuasion,
    concerns: newConcerns,
    speakerStates: {
      ...prev.speakerStates,
      [speaker]: {
        entryCount: prevSpeakerState.entryCount + 1,
        dominantEmotion: topEmotion,
      },
    },
  };
}

export function useDashboardState() {
  const [transcriptEntries, setTranscriptEntries] = useState<TranscriptEntry[]>([]);
  const [beliefState, setBeliefState] = useState<BeliefState>(initialBeliefState);
  const [latestEntry, setLatestEntry] = useState<TranscriptEntry | null>(null);

  const addTranscriptEntry = useCallback(
    (text: string, speaker: SpeakerRole = 'Unknown', providedDetectedLanguage?: string): TranscriptEntry => {
      const detectedLanguage = providedDetectedLanguage || detectLanguage(text);

      // For NLP analysis, translate to English if needed
      let analysisText = text;
      if (detectedLanguage !== 'en' && detectedLanguage !== 'unknown') {
        const translated = translateText(text, detectedLanguage, 'en');
        if (translated && !translated.startsWith('[Translated from')) {
          analysisText = translated;
        }
      }

      const ethicsResult = analyzeEthics(analysisText);
      const emotionIntentResult = analyzeEmotionIntent(analysisText, detectedLanguage);

      // Convert string arrays to typed objects
      const emotions: EmotionScore[] = emotionIntentResult.emotions.map((e) => ({
        emotionType: e,
        confidence: emotionIntentResult.confidence[e] ?? 0.5,
      }));

      const intents: IntentScore[] = emotionIntentResult.intents.map((i) => ({
        intentType: i,
        confidence: emotionIntentResult.confidence[i] ?? 0.5,
      }));

      // EthicsResult has `flags: string[]` — convert to ToxicityFlag objects
      const toxicityFlags: ToxicityFlag[] = (ethicsResult.flags ?? []).map((f) => ({
        flagType: f,
        confidence: 0.8,
      }));

      // Generate strategies using the top intent string
      const topIntentStr = intents[0]?.intentType ?? 'acknowledging';
      const rawStrategies = generateStrategies(analysisText, [topIntentStr], beliefState.trustLevel, beliefState.persuasionScore);
      const strategies: StrategyRecommendation[] = Array.isArray(rawStrategies)
        ? rawStrategies.map((s) => {
            if (typeof s === 'string') {
              return { strategy: s, confidence: 0.7, rationale: '' };
            }
            return s as StrategyRecommendation;
          })
        : [];

      const entry: TranscriptEntry = {
        text,
        speaker,
        timestamp: Date.now(),
        emotions,
        intents,
        toxicityFlags,
        strategies,
        detectedLanguage,
        translatedText: undefined,
        showTranslation: false,
      };

      setTranscriptEntries((prev) => [...prev, entry]);
      setLatestEntry(entry);
      setBeliefState((prev) => updateBeliefState(prev, entry));

      return entry;
    },
    [beliefState]
  );

  const toggleTranslation = useCallback((entryIndex: number) => {
    setTranscriptEntries((prev) =>
      prev.map((entry, idx) =>
        idx === entryIndex ? { ...entry, showTranslation: !entry.showTranslation } : entry
      )
    );
  }, []);

  const translateEntry = useCallback((entryIndex: number, targetLanguage: string) => {
    setTranscriptEntries((prev) =>
      prev.map((entry, idx) => {
        if (idx !== entryIndex) return entry;
        if (entry.translatedText) return entry;
        const translated = translateText(entry.text, entry.detectedLanguage, targetLanguage);
        return { ...entry, translatedText: translated };
      })
    );
  }, []);

  const clearEntries = useCallback(() => {
    setTranscriptEntries([]);
    setBeliefState(initialBeliefState);
    setLatestEntry(null);
  }, []);

  return {
    transcriptEntries,
    beliefState,
    latestEntry,
    addTranscriptEntry,
    toggleTranslation,
    translateEntry,
    clearEntries,
  };
}
