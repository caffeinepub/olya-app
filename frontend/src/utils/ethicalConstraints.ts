export type ViolationType =
  | 'personal-attack'
  | 'manipulative-framing'
  | 'dehumanizing-language'
  | 'coercive-pressure'
  | null;

export interface EnforcementResult {
  isViolation: boolean;
  violationType: ViolationType;
  sanitizedText: string;
}

interface EthicalRule {
  type: Exclude<ViolationType, null>;
  patterns: RegExp[];
  redactPatterns: RegExp[];
}

const ETHICAL_RULES: EthicalRule[] = [
  {
    type: 'personal-attack',
    patterns: [
      /\b(you('re| are) (an? )?(idiot|moron|fool|stupid|dumb|worthless|pathetic|loser|trash|garbage|scum))\b/i,
      /\b(shut up|go to hell|drop dead|get lost|you suck)\b/i,
      /\b(I (hate|despise|loathe) you)\b/i,
      /\b(you (disgust|repulse) me)\b/i,
      /\b(nobody (likes|wants|cares about) you)\b/i,
      /\b(you('re| are) (a )?(failure|nothing|nobody|worthless))\b/i,
    ],
    redactPatterns: [
      /\b(idiot|moron|fool|stupid|dumb|worthless|pathetic|loser|trash|garbage|scum)\b/gi,
      /\b(shut up|go to hell|drop dead|get lost)\b/gi,
      /\b(hate|despise|loathe) you\b/gi,
      /\b(disgust|repulse) me\b/gi,
    ],
  },
  {
    type: 'manipulative-framing',
    patterns: [
      /\b(you('re| are) (just )?(imagining|making it up|being paranoid|overreacting|too sensitive))\b/i,
      /\b(that never happened|you('re| are) crazy|you('re| are) losing your mind)\b/i,
      /\b(everyone (thinks|knows|agrees) you('re| are) wrong)\b/i,
      /\b(you('re| are) (always|never) (wrong|right|lying|making things up))\b/i,
      /\b(I('m| am) doing this for your own good)\b/i,
      /\b(you (made|forced) me (do|say) this)\b/i,
    ],
    redactPatterns: [
      /\b(imagining|making it up|being paranoid)\b/gi,
      /\b(you('re| are) crazy|losing your mind)\b/gi,
    ],
  },
  {
    type: 'dehumanizing-language',
    patterns: [
      /\b(subhuman|less than human|not (fully |even )?human)\b/i,
      /\b(animals?|beasts?|vermin|parasites?|cockroaches?|rats?) (like you|like them|like those)\b/i,
      /\b(you('re| are) (just |only |merely )?(an? )?(object|thing|tool|instrument))\b/i,
      /\b(those (people|creatures|things) (are|aren't|don't|can't))\b/i,
      /\b(they('re| are) (not|less than) (real |true |actual )?people)\b/i,
    ],
    redactPatterns: [
      /\b(subhuman|less than human)\b/gi,
      /\b(animals?|beasts?|vermin|parasites?|cockroaches?|rats?) (like you|like them)\b/gi,
    ],
  },
  {
    type: 'coercive-pressure',
    patterns: [
      /\b(do (it|this|that) or (else|I will|you will|there will be))\b/i,
      /\b(you (have|must|need to) (do|comply|agree|accept) (or|otherwise))\b/i,
      /\b(I('ll| will) (destroy|ruin|end|hurt|harm) (you|your|them))\b/i,
      /\b(you('ll| will) (regret|pay for|suffer for) (this|that))\b/i,
      /\b(no (choice|option|alternative) (but|except|other than))\b/i,
      /\b(comply or (face|suffer|experience) (consequences|punishment|retaliation))\b/i,
    ],
    redactPatterns: [
      /\b(destroy|ruin|end|hurt|harm) (you|your|them)\b/gi,
      /\b(regret|pay for|suffer for) (this|that)\b/gi,
    ],
  },
];

export function enforceEthics(text: string): EnforcementResult {
  for (const rule of ETHICAL_RULES) {
    for (const pattern of rule.patterns) {
      if (pattern.test(text)) {
        // Sanitize the text by redacting offending phrases
        let sanitizedText = text;
        for (const redactPattern of rule.redactPatterns) {
          sanitizedText = sanitizedText.replace(redactPattern, '[REDACTED]');
        }

        return {
          isViolation: true,
          violationType: rule.type,
          sanitizedText,
        };
      }
    }
  }

  return {
    isViolation: false,
    violationType: null,
    sanitizedText: text,
  };
}

export function formatViolationType(violationType: ViolationType): string {
  if (!violationType) return '';
  const labels: Record<Exclude<ViolationType, null>, string> = {
    'personal-attack': 'Personal Attack',
    'manipulative-framing': 'Manipulative Framing',
    'dehumanizing-language': 'Dehumanizing Language',
    'coercive-pressure': 'Coercive Pressure',
  };
  return labels[violationType] ?? violationType;
}
