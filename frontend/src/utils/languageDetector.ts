/**
 * Client-side language detection utility using character set analysis
 * and keyword pattern matching.
 */

// Unicode range checks
function hasCyrillicChars(text: string): boolean {
  return /[\u0400-\u04FF]/.test(text);
}

function hasArabicChars(text: string): boolean {
  return /[\u0600-\u06FF\u0750-\u077F]/.test(text);
}

function hasCJKChars(text: string): boolean {
  return /[\u4E00-\u9FFF\u3400-\u4DBF\u3040-\u309F\u30A0-\u30FF]/.test(text);
}

function hasDevanagariChars(text: string): boolean {
  return /[\u0900-\u097F]/.test(text);
}

// Common word patterns for Latin-script language disambiguation
const LANGUAGE_PATTERNS: Record<string, RegExp[]> = {
  es: [
    /\b(el|la|los|las|un|una|unos|unas|de|del|en|con|por|para|que|es|son|está|están|yo|tú|él|ella|nosotros|vosotros|ellos|ellas|me|te|se|nos|os|le|les|lo|las|muy|más|pero|si|no|sí|también|como|cuando|donde|quien|cual|este|esta|estos|estas|ese|esa|esos|esas|aquel|aquella|aquellos|aquellas|mi|tu|su|nuestro|vuestra|su|hola|gracias|por favor|buenos días|buenas tardes|buenas noches)\b/gi,
  ],
  fr: [
    /\b(le|la|les|un|une|des|de|du|en|avec|pour|que|est|sont|je|tu|il|elle|nous|vous|ils|elles|me|te|se|nous|vous|lui|leur|y|en|très|plus|mais|si|non|oui|aussi|comme|quand|où|qui|quel|quelle|ce|cet|cette|ces|mon|ton|son|notre|votre|leur|bonjour|merci|s'il vous plaît|bonsoir|bonne nuit)\b/gi,
  ],
  de: [
    /\b(der|die|das|ein|eine|einen|einem|einer|eines|und|oder|aber|nicht|ist|sind|ich|du|er|sie|es|wir|ihr|sie|mich|dich|sich|uns|euch|ihm|ihr|ihnen|sehr|mehr|auch|wenn|wo|wer|was|wie|dieser|diese|dieses|mein|dein|sein|unser|euer|ihr|hallo|danke|bitte|guten morgen|guten abend|gute nacht)\b/gi,
  ],
  pt: [
    /\b(o|a|os|as|um|uma|uns|umas|de|do|da|dos|das|em|no|na|nos|nas|com|por|para|que|é|são|eu|tu|ele|ela|nós|vós|eles|elas|me|te|se|nos|vos|lhe|lhes|muito|mais|mas|se|não|sim|também|como|quando|onde|quem|qual|este|esta|estes|estas|esse|essa|esses|essas|meu|teu|seu|nosso|vosso|olá|obrigado|por favor|bom dia|boa tarde|boa noite)\b/gi,
  ],
  it: [
    /\b(il|lo|la|i|gli|le|un|uno|una|di|del|della|dei|degli|delle|in|nel|nella|nei|negli|nelle|con|per|che|è|sono|io|tu|lui|lei|noi|voi|loro|mi|ti|si|ci|vi|gli|le|molto|più|ma|se|no|sì|anche|come|quando|dove|chi|quale|questo|questa|questi|queste|mio|tuo|suo|nostro|vostro|ciao|grazie|prego|buongiorno|buonasera|buonanotte)\b/gi,
  ],
  ru: [
    /\b(и|в|не|на|я|быть|он|с|что|а|по|это|она|этот|к|но|они|мы|как|из|у|который|то|за|свой|что|её|так|его|если|от|же|тогда|когда|уже|вы|из|за|бы|он|до|вас|нибудь|опять|уж|вам|ведь|там|потом|себя|ничего|ей|может|они|тут|где|есть|надо|ней|для|мы|тебя|их|чем|была|сам|чтоб|без|будто|человек|чего|раз|тоже|себе|под|будет|ж|тогда|кто|этого|того|потому|этом|один|почти|мой|тем|чтобы|нее|сейчас|были|куда|зачем|всех|никогда|можно|при|наконец|два|об|другой|хоть|после|над|больше|тот|через|эти|нас|про|всего|них|какая|много|разве|три|эту|моя|впрочем|хорошо|свою|этой|перед|иногда|лучше|чуть|том|нельзя|такой|им|более|всегда|конечно|всю|между)\b/gi,
  ],
  zh: [], // handled by CJK detection
  ar: [], // handled by Arabic detection
  en: [
    /\b(the|a|an|and|or|but|in|on|at|to|for|of|with|by|from|is|are|was|were|be|been|being|have|has|had|do|does|did|will|would|could|should|may|might|shall|can|need|dare|ought|used|i|you|he|she|it|we|they|me|him|her|us|them|my|your|his|its|our|their|this|that|these|those|what|which|who|whom|whose|when|where|why|how|all|each|every|both|few|more|most|other|some|such|no|not|only|same|so|than|too|very|just|hello|thank|please|good morning|good evening|good night)\b/gi,
  ],
};

function countMatches(text: string, patterns: RegExp[]): number {
  let count = 0;
  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches) count += matches.length;
  }
  return count;
}

/**
 * Detects the language of the given text.
 * Returns an ISO 639-1 language code (e.g., 'en', 'es', 'fr', 'de', 'ar', 'zh', 'pt', 'ru').
 * Returns 'unknown' when detection confidence is low.
 */
export function detectLanguage(text: string): string {
  if (!text || text.trim().length < 3) return 'unknown';

  const trimmed = text.trim();

  // Script-based detection (high confidence)
  if (hasCJKChars(trimmed)) return 'zh';
  if (hasArabicChars(trimmed)) return 'ar';
  if (hasDevanagariChars(trimmed)) return 'hi';

  // Cyrillic - could be Russian, Ukrainian, Bulgarian, etc.
  if (hasCyrillicChars(trimmed)) {
    const ruScore = countMatches(trimmed, LANGUAGE_PATTERNS.ru);
    return ruScore > 0 ? 'ru' : 'ru'; // Default to Russian for Cyrillic
  }

  // Latin-script disambiguation
  const scores: Record<string, number> = {};
  for (const [lang, patterns] of Object.entries(LANGUAGE_PATTERNS)) {
    if (patterns.length > 0) {
      scores[lang] = countMatches(trimmed, patterns);
    }
  }

  // Find the language with the highest score
  let bestLang = 'unknown';
  let bestScore = 0;

  for (const [lang, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      bestLang = lang;
    }
  }

  // Require a minimum confidence threshold
  if (bestScore < 1) return 'unknown';

  return bestLang;
}

/**
 * Returns the display name for a language code.
 */
export function getLanguageDisplayName(code: string): string {
  const names: Record<string, string> = {
    en: 'English',
    es: 'Spanish',
    fr: 'French',
    de: 'German',
    ar: 'Arabic',
    zh: 'Chinese',
    pt: 'Portuguese',
    ru: 'Russian',
    it: 'Italian',
    hi: 'Hindi',
    unknown: 'Unknown',
  };
  return names[code] || code.toUpperCase();
}
