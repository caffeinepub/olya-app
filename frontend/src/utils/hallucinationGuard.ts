export interface SuspectPhrase {
  phrase: string;
  reason: string;
}

export interface HallucinationResult {
  flagged: boolean;
  confidence: number;
  suspectPhrases: SuspectPhrase[];
}

// Patterns that signal fabricated specificity
const HALLUCINATION_PATTERNS: Array<{
  pattern: RegExp;
  reason: string;
  weight: number;
}> = [
  {
    pattern: /\bstudies show\b/i,
    reason: 'Unsupported research claim without citation',
    weight: 0.25,
  },
  {
    pattern: /\bresearch (proves?|shows?|confirms?|demonstrates?)\b/i,
    reason: 'Unverified research reference',
    weight: 0.25,
  },
  {
    pattern: /\bscientists (say|found|discovered|proved?)\b/i,
    reason: 'Vague scientific authority claim',
    weight: 0.2,
  },
  {
    pattern: /\bexperts (agree|say|confirm|believe)\b/i,
    reason: 'Unspecified expert consensus claim',
    weight: 0.2,
  },
  {
    pattern: /\baccording to (experts?|scientists?|researchers?|studies)\b/i,
    reason: 'Unverifiable authority reference',
    weight: 0.2,
  },
  {
    pattern: /\b\d{1,3}(\.\d+)?%\s+of\s+(people|users|cases|patients|respondents)\b/i,
    reason: 'Specific statistic without source',
    weight: 0.3,
  },
  {
    pattern: /\b(exactly|precisely|specifically)\s+\d+\s+(times|cases|instances|people)\b/i,
    reason: 'Invented precise figure',
    weight: 0.3,
  },
  {
    pattern: /\bDr\.?\s+[A-Z][a-z]+\s+(said|found|proved?|showed?)\b/,
    reason: 'Unverifiable named authority',
    weight: 0.35,
  },
  {
    pattern: /\b(Professor|Prof\.)\s+[A-Z][a-z]+\b/,
    reason: 'Unverifiable named authority',
    weight: 0.3,
  },
  {
    pattern: /\bthe (study|research|report|survey) (from|by|at)\b/i,
    reason: 'Unverifiable specific study reference',
    weight: 0.25,
  },
  {
    pattern: /\bit (has been|is) (proven|established|confirmed) that\b/i,
    reason: 'Unverified established fact claim',
    weight: 0.2,
  },
  {
    pattern: /\bstatistics (show|indicate|prove|confirm)\b/i,
    reason: 'Unverified statistics claim',
    weight: 0.25,
  },
  {
    pattern: /\bdata (shows?|proves?|confirms?|indicates?)\b/i,
    reason: 'Unverified data claim',
    weight: 0.2,
  },
  {
    pattern: /\bin \d{4},?\s+(scientists?|researchers?|experts?)\b/i,
    reason: 'Specific year + authority without citation',
    weight: 0.3,
  },
];

// Check if text contradicts context
function checkContextContradictions(text: string, context: string[]): SuspectPhrase[] {
  const suspects: SuspectPhrase[] = [];
  if (context.length === 0) return suspects;

  // Look for definitive claims that contradict prior context
  const definitivePatterns = [
    /\b(always|never|everyone|nobody|all|none)\b/i,
    /\b(definitely|certainly|absolutely|without doubt)\b/i,
  ];

  for (const pattern of definitivePatterns) {
    const match = text.match(pattern);
    if (match) {
      // Check if context contains contradicting evidence
      const hasContradiction = context.some((ctx) => {
        const ctxLower = ctx.toLowerCase();
        const matchLower = match[0].toLowerCase();
        if (matchLower === 'always' && ctxLower.includes('sometimes')) return true;
        if (matchLower === 'never' && ctxLower.includes('sometimes')) return true;
        if (matchLower === 'everyone' && ctxLower.includes('some people')) return true;
        return false;
      });

      if (hasContradiction) {
        suspects.push({
          phrase: match[0],
          reason: 'Absolute claim contradicts prior context',
        });
      }
    }
  }

  return suspects;
}

export function checkForHallucination(text: string, context: string[]): HallucinationResult {
  const suspectPhrases: SuspectPhrase[] = [];
  let totalWeight = 0;

  for (const { pattern, reason, weight } of HALLUCINATION_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      suspectPhrases.push({
        phrase: match[0].slice(0, 60),
        reason,
      });
      totalWeight += weight;
    }
  }

  // Check context contradictions
  const contradictions = checkContextContradictions(text, context);
  for (const c of contradictions) {
    suspectPhrases.push(c);
    totalWeight += 0.2;
  }

  // Normalize confidence to 0-1
  const confidence = Math.min(1, totalWeight);
  const THRESHOLD = 0.3;

  return {
    flagged: confidence >= THRESHOLD,
    confidence,
    suspectPhrases,
  };
}
