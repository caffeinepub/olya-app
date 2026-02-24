export type EmotionType = 'Neutral' | 'Frustrated' | 'Confident' | 'Curious' | 'Hostile' | 'Anxious' | 'Optimistic';
export type IntentType = 'Negotiating' | 'Demanding' | 'Conceding' | 'Probing' | 'Agreeing' | 'Deflecting' | 'Asserting';

export interface EmotionResult {
  emotion: EmotionType;
  confidence: number;
}

export interface IntentResult {
  intent: IntentType;
  confidence: number;
}

export interface EmotionIntentAnalysis {
  emotion: EmotionResult;
  intent: IntentResult;
}

const EMOTION_PATTERNS: Record<EmotionType, string[]> = {
  Frustrated: ['frustrated', 'annoyed', 'tired', 'sick of', 'fed up', 'unacceptable', 'ridiculous', 'absurd', 'impossible', 'keep saying', 'again and again', 'not listening', 'waste', 'pointless'],
  Hostile: ['threat', 'warn', 'demand', 'ultimatum', 'or else', 'consequences', 'legal action', 'lawsuit', 'force', 'compel', 'insist', 'refuse', 'never', 'absolutely not', 'out of question'],
  Confident: ['certain', 'confident', 'sure', 'guarantee', 'proven', 'track record', 'expertise', 'experience', 'clearly', 'obviously', 'without doubt', 'definitely', 'absolutely', 'strong position'],
  Curious: ['wonder', 'curious', 'interested', 'tell me', 'explain', 'how does', 'what if', 'could you', 'would you', 'can you', 'question', 'understand', 'clarify', 'elaborate', 'more about'],
  Anxious: ['worried', 'concern', 'afraid', 'fear', 'uncertain', 'unsure', 'risk', 'might', 'could go wrong', 'not sure', 'hesitant', 'nervous', 'doubt', 'maybe', 'perhaps'],
  Optimistic: ['hope', 'opportunity', 'potential', 'exciting', 'promising', 'forward', 'progress', 'improve', 'better', 'positive', 'benefit', 'advantage', 'great', 'excellent', 'wonderful'],
  Neutral: [],
};

const INTENT_PATTERNS: Record<IntentType, string[]> = {
  Demanding: ['must', 'require', 'need', 'demand', 'expect', 'insist', 'non-negotiable', 'bottom line', 'minimum', 'at least', 'no less than', 'final offer', 'take it or leave'],
  Conceding: ['agree', 'accept', 'okay', 'fine', 'alright', 'willing', 'can do', 'possible', 'consider', 'flexible', 'compromise', 'meet halfway', 'adjust', 'accommodate', 'understand your point'],
  Probing: ['what about', 'how about', 'what if', 'suppose', 'hypothetically', 'scenario', 'option', 'alternative', 'possibility', 'explore', 'consider', 'think about', 'what would', 'how would'],
  Agreeing: ['yes', 'agreed', 'deal', 'perfect', 'exactly', 'precisely', 'that works', 'sounds good', 'great', 'excellent', 'we have a deal', 'let\'s proceed', 'move forward', 'finalize'],
  Deflecting: ['however', 'but', 'on the other hand', 'actually', 'in fact', 'let me clarify', 'what I meant', 'misunderstanding', 'not exactly', 'that\'s not', 'redirect', 'different angle'],
  Asserting: ['believe', 'position', 'stance', 'view', 'perspective', 'argument', 'point', 'case', 'evidence', 'data', 'fact', 'research', 'study', 'proven', 'demonstrate'],
  Negotiating: ['offer', 'propose', 'suggest', 'counter', 'terms', 'conditions', 'deal', 'arrangement', 'structure', 'package', 'bundle', 'include', 'exclude', 'modify'],
};

function scorePatterns(text: string, patterns: Record<string, string[]>): Record<string, number> {
  const lower = text.toLowerCase();
  const scores: Record<string, number> = {};
  for (const [key, keywords] of Object.entries(patterns)) {
    let score = 0;
    for (const kw of keywords) {
      if (lower.includes(kw)) score += 1;
    }
    scores[key] = score;
  }
  return scores;
}

export function analyzeEmotionIntent(text: string): EmotionIntentAnalysis {
  const emotionScores = scorePatterns(text, EMOTION_PATTERNS);
  const intentScores = scorePatterns(text, INTENT_PATTERNS);

  // Find dominant emotion
  let topEmotion: EmotionType = 'Neutral';
  let topEmotionScore = 0;
  for (const [emotion, score] of Object.entries(emotionScores)) {
    if (score > topEmotionScore) {
      topEmotionScore = score;
      topEmotion = emotion as EmotionType;
    }
  }

  // Find dominant intent
  let topIntent: IntentType = 'Negotiating';
  let topIntentScore = 0;
  for (const [intent, score] of Object.entries(intentScores)) {
    if (score > topIntentScore) {
      topIntentScore = score;
      topIntent = intent as IntentType;
    }
  }

  // Calculate confidence based on score magnitude
  const emotionConf = topEmotionScore === 0 ? 0.65 : Math.min(0.97, 0.55 + topEmotionScore * 0.12);
  const intentConf = topIntentScore === 0 ? 0.60 : Math.min(0.97, 0.55 + topIntentScore * 0.12);

  return {
    emotion: { emotion: topEmotion, confidence: emotionConf },
    intent: { intent: topIntent, confidence: intentConf },
  };
}

export const EMOTION_COLORS: Record<EmotionType, string> = {
  Neutral: 'oklch(0.55 0.04 200)',
  Frustrated: 'oklch(0.65 0.18 35)',
  Confident: 'oklch(0.72 0.18 185)',
  Curious: 'oklch(0.65 0.15 280)',
  Hostile: 'oklch(0.62 0.22 25)',
  Anxious: 'oklch(0.75 0.18 55)',
  Optimistic: 'oklch(0.65 0.18 145)',
};

export const INTENT_COLORS: Record<IntentType, string> = {
  Negotiating: 'oklch(0.72 0.18 185)',
  Demanding: 'oklch(0.62 0.22 25)',
  Conceding: 'oklch(0.65 0.18 145)',
  Probing: 'oklch(0.65 0.15 280)',
  Agreeing: 'oklch(0.65 0.18 145)',
  Deflecting: 'oklch(0.75 0.18 55)',
  Asserting: 'oklch(0.72 0.18 185)',
};

export const EMOTION_BG_CLASSES: Record<EmotionType, string> = {
  Neutral: 'bg-muted/40 text-muted-foreground border-border',
  Frustrated: 'bg-orange-950/40 text-orange-300 border-orange-800/50',
  Confident: 'bg-teal-subtle border-teal/30 text-teal',
  Curious: 'bg-purple-950/40 text-purple-300 border-purple-800/50',
  Hostile: 'bg-red-950/40 text-red-300 border-red-800/50',
  Anxious: 'bg-amber-subtle border-amber/30 text-amber',
  Optimistic: 'bg-green-950/40 text-green-300 border-green-800/50',
};

export const INTENT_BG_CLASSES: Record<IntentType, string> = {
  Negotiating: 'bg-teal-subtle border-teal/30 text-teal',
  Demanding: 'bg-red-950/40 text-red-300 border-red-800/50',
  Conceding: 'bg-green-950/40 text-green-300 border-green-800/50',
  Probing: 'bg-purple-950/40 text-purple-300 border-purple-800/50',
  Agreeing: 'bg-green-950/40 text-green-300 border-green-800/50',
  Deflecting: 'bg-amber-subtle border-amber/30 text-amber',
  Asserting: 'bg-teal-subtle border-teal/30 text-teal',
};
