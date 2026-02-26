import { translateToEnglish } from './translationSimulator';

export interface EmotionIntentResult {
  emotions: string[];
  intents: string[];
  confidence: Record<string, number>;
}

const EMOTION_PATTERNS: Record<string, RegExp[]> = {
  anger: [
    /\b(angry|furious|rage|mad|upset|frustrated|irritated|annoyed|hostile|aggressive|outraged|livid)\b/gi,
    /\b(hate|despise|loathe|resent|detest)\b/gi,
  ],
  fear: [
    /\b(afraid|scared|fearful|terrified|anxious|worried|nervous|panic|dread|apprehensive|threatened)\b/gi,
    /\b(danger|risk|threat|unsafe|vulnerable|exposed)\b/gi,
  ],
  sadness: [
    /\b(sad|unhappy|depressed|miserable|sorrowful|grief|heartbroken|disappointed|dejected|melancholy)\b/gi,
    /\b(loss|regret|sorry|unfortunate|tragic|painful)\b/gi,
  ],
  joy: [
    /\b(happy|joyful|excited|pleased|delighted|thrilled|elated|cheerful|content|satisfied|glad)\b/gi,
    /\b(wonderful|fantastic|amazing|great|excellent|perfect|love|enjoy)\b/gi,
  ],
  surprise: [
    /\b(surprised|shocked|astonished|amazed|stunned|unexpected|sudden|unbelievable|incredible)\b/gi,
  ],
  disgust: [
    /\b(disgusted|revolted|repulsed|nauseated|appalled|horrified|offensive|repugnant)\b/gi,
  ],
  neutral: [
    /\b(okay|fine|alright|normal|standard|regular|typical|usual|common)\b/gi,
  ],
  trust: [
    /\b(trust|believe|confident|reliable|honest|sincere|genuine|authentic|credible)\b/gi,
  ],
  anticipation: [
    /\b(expect|anticipate|hope|look forward|await|plan|prepare|ready|upcoming)\b/gi,
  ],
};

const INTENT_PATTERNS: Record<string, RegExp[]> = {
  'information-seeking': [
    /\b(what|how|why|when|where|who|which|explain|tell me|describe|clarify|elaborate)\b/gi,
    /\b(question|ask|inquire|wonder|curious|understand)\b/gi,
  ],
  'negotiating': [
    /\b(negotiate|deal|offer|counter|propose|compromise|agree|disagree|terms|conditions|price|cost)\b/gi,
    /\b(accept|reject|consider|review|discuss|settle|resolve)\b/gi,
  ],
  'persuading': [
    /\b(convince|persuade|argue|reason|justify|support|advocate|recommend|suggest|urge)\b/gi,
    /\b(should|must|need to|have to|important|critical|essential|necessary)\b/gi,
  ],
  'threatening': [
    /\b(threaten|warn|ultimatum|consequence|punish|force|coerce|demand|insist)\b/gi,
    /\b(or else|otherwise|unless|if not|better|had better)\b/gi,
  ],
  'cooperating': [
    /\b(cooperate|collaborate|work together|partner|join|help|assist|support|together|mutual)\b/gi,
    /\b(we can|let us|shall we|together|team|alliance|partnership)\b/gi,
  ],
  'deflecting': [
    /\b(avoid|evade|deflect|redirect|change subject|not relevant|beside the point|off topic)\b/gi,
    /\b(anyway|regardless|moving on|let us focus|back to)\b/gi,
  ],
  'acknowledging': [
    /\b(acknowledge|recognize|admit|accept|understand|appreciate|respect|value|agree)\b/gi,
    /\b(yes|indeed|certainly|absolutely|of course|right|correct|true)\b/gi,
  ],
  'clarifying': [
    /\b(clarify|specify|elaborate|detail|explain|mean|refer to|talking about|point out)\b/gi,
    /\b(in other words|that is|namely|specifically|particularly|especially)\b/gi,
  ],
};

function countPatternMatches(text: string, patterns: RegExp[]): number {
  let count = 0;
  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches) count += matches.length;
  }
  return count;
}

/**
 * Analyzes emotion and intent from text.
 * Accepts an optional detectedLanguage parameter; if non-English, translates to English first.
 */
export function analyzeEmotionIntent(text: string, detectedLanguage?: string): EmotionIntentResult {
  if (!text || !text.trim()) {
    return { emotions: ['neutral'], intents: ['acknowledging'], confidence: { neutral: 0.5, acknowledging: 0.5 } };
  }

  // Translate to English for analysis if needed
  let analysisText = text;
  if (detectedLanguage && detectedLanguage !== 'en' && detectedLanguage !== 'unknown') {
    const translated = translateToEnglish(text, detectedLanguage);
    if (translated && !translated.startsWith('[Translated from')) {
      analysisText = translated;
    }
  }

  const emotionScores: Record<string, number> = {};
  for (const [emotion, patterns] of Object.entries(EMOTION_PATTERNS)) {
    const count = countPatternMatches(analysisText, patterns);
    if (count > 0) {
      emotionScores[emotion] = count;
    }
  }

  const intentScores: Record<string, number> = {};
  for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
    const count = countPatternMatches(analysisText, patterns);
    if (count > 0) {
      intentScores[intent] = count;
    }
  }

  if (Object.keys(emotionScores).length === 0) {
    emotionScores['neutral'] = 1;
  }
  if (Object.keys(intentScores).length === 0) {
    intentScores['acknowledging'] = 1;
  }

  const sortedEmotions = Object.entries(emotionScores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([emotion]) => emotion);

  const sortedIntents = Object.entries(intentScores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([intent]) => intent);

  const allScores = { ...emotionScores, ...intentScores };
  const maxScore = Math.max(...Object.values(allScores), 1);
  const confidence: Record<string, number> = {};
  for (const [key, score] of Object.entries(allScores)) {
    confidence[key] = Math.min(0.95, 0.3 + (score / maxScore) * 0.65);
  }

  return {
    emotions: sortedEmotions,
    intents: sortedIntents,
    confidence,
  };
}
