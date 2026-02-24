export type EthicsStatus = 'Clean' | 'Potential Bias' | 'Toxic Language Detected' | 'Bias';
export type EthicsSeverity = 'Low' | 'Medium' | 'High';

export interface BiasCategory {
  category: string;
  severity: EthicsSeverity;
  fragment: string;
}

export interface EthicsResult {
  status: EthicsStatus;
  severity: EthicsSeverity;
  explanation: string;
  flags: string[];
  biasCategories: BiasCategory[];
}

const TOXICITY_PATTERNS: Array<{ pattern: RegExp | string; label: string; severity: EthicsSeverity }> = [
  { pattern: /\b(idiot|stupid|moron|fool|dumb|incompetent)\b/i, label: 'Personal insult detected', severity: 'High' },
  { pattern: /\b(threat|threaten|destroy|crush|eliminate|annihilate)\b/i, label: 'Threatening language', severity: 'High' },
  { pattern: /\b(lie|liar|dishonest|fraud|cheat|deceive|manipulate)\b/i, label: 'Accusatory language', severity: 'Medium' },
  { pattern: /\b(hate|despise|loathe|detest)\b/i, label: 'Hostile sentiment', severity: 'Medium' },
  { pattern: /\b(worthless|useless|pathetic|ridiculous|absurd)\b/i, label: 'Dismissive language', severity: 'Low' },
];

const BIAS_PATTERNS: Array<{ pattern: RegExp | string; label: string; severity: EthicsSeverity }> = [
  { pattern: /\b(always|never|everyone|nobody|all of them|none of them)\b/i, label: 'Absolute generalization', severity: 'Low' },
  { pattern: /\b(obviously|clearly|of course|everyone knows|it's obvious)\b/i, label: 'Assumption of shared knowledge', severity: 'Low' },
  { pattern: /\b(typical|as expected|predictably|naturally they)\b/i, label: 'Stereotyping language', severity: 'Medium' },
  { pattern: /\b(inferior|superior|better than|worse than|beneath)\b/i, label: 'Comparative bias', severity: 'Medium' },
  { pattern: /\b(those people|their kind|people like them)\b/i, label: 'Othering language', severity: 'High' },
];

// Extended bias category patterns
const GENDER_BIAS_PATTERNS: Array<{ pattern: RegExp; fragment: string; severity: EthicsSeverity }> = [
  { pattern: /\bmen are\b/i, fragment: 'men are', severity: 'Medium' },
  { pattern: /\bwomen should\b/i, fragment: 'women should', severity: 'Medium' },
  { pattern: /\bwomen are (too|just|only|always|never)\b/i, fragment: 'women are [qualifier]', severity: 'High' },
  { pattern: /\bmen (can't|cannot|don't|never)\b/i, fragment: 'men [negative]', severity: 'Medium' },
  { pattern: /\b(girls|boys) (can't|shouldn't|don't)\b/i, fragment: 'gendered capability denial', severity: 'Medium' },
  { pattern: /\b(hysterical|bossy|aggressive for a woman|weak for a man)\b/i, fragment: 'gendered stereotype', severity: 'High' },
  { pattern: /\b(man up|like a girl|throw like a girl)\b/i, fragment: 'gendered expression', severity: 'Medium' },
];

const RACIAL_BIAS_PATTERNS: Array<{ pattern: RegExp; fragment: string; severity: EthicsSeverity }> = [
  { pattern: /\b(racial|racist|racism|racially)\b/i, fragment: 'racial reference', severity: 'Medium' },
  { pattern: /\bethnic (slur|stereotype|group)\b/i, fragment: 'ethnic reference', severity: 'High' },
  { pattern: /\b(skin color|skin colour)\b/i, fragment: 'skin color reference', severity: 'Medium' },
  { pattern: /\b(those (people|immigrants|foreigners))\b/i, fragment: 'othering by origin', severity: 'High' },
  { pattern: /\b(they all|they always|they never) (steal|lie|cheat|are lazy)\b/i, fragment: 'group stereotype', severity: 'High' },
  { pattern: /\b(minority|minorities) (are|always|never|can't)\b/i, fragment: 'minority generalization', severity: 'High' },
];

const SOCIOECONOMIC_BIAS_PATTERNS: Array<{ pattern: RegExp; fragment: string; severity: EthicsSeverity }> = [
  { pattern: /\bpoor people (are|always|never|just|only)\b/i, fragment: 'poor people generalization', severity: 'High' },
  { pattern: /\bwelfare (queen|cheat|fraud|abuse)\b/i, fragment: 'welfare stereotype', severity: 'High' },
  { pattern: /\b(homeless|poor) (are|deserve|should)\b/i, fragment: 'class-based judgment', severity: 'High' },
  { pattern: /\b(rich people|wealthy) (are|always|never|just)\b/i, fragment: 'wealth generalization', severity: 'Medium' },
  { pattern: /\b(lower class|working class) (can't|don't|never)\b/i, fragment: 'class capability denial', severity: 'High' },
  { pattern: /\b(born poor|stay poor|poverty mentality)\b/i, fragment: 'poverty determinism', severity: 'Medium' },
];

const CONFIRMATION_BIAS_PATTERNS: Array<{ pattern: RegExp; fragment: string; severity: EthicsSeverity }> = [
  { pattern: /\bonly my (view|opinion|perspective|side)\b/i, fragment: 'only my view', severity: 'Medium' },
  { pattern: /\beveryone knows\b/i, fragment: 'everyone knows', severity: 'Low' },
  { pattern: /\bobviously (everyone|all|no one)\b/i, fragment: 'obvious generalization', severity: 'Low' },
  { pattern: /\b(I'm|we're|they're) (always|never) (right|wrong)\b/i, fragment: 'absolute certainty', severity: 'Medium' },
  { pattern: /\b(the facts|the truth|the evidence) (clearly|obviously|definitely) (show|prove|confirm)\b/i, fragment: 'certainty framing', severity: 'Low' },
  { pattern: /\b(anyone who disagrees|those who disagree) (is|are) (wrong|stupid|ignorant)\b/i, fragment: 'dismissing disagreement', severity: 'High' },
  { pattern: /\b(it's common sense|it's obvious|it goes without saying)\b/i, fragment: 'assumed consensus', severity: 'Low' },
];

function extractFragment(text: string, pattern: RegExp): string {
  const match = text.match(pattern);
  return match ? match[0].slice(0, 40) : '';
}

export function analyzeEthics(text: string): EthicsResult {
  const flags: string[] = [];
  const biasCategories: BiasCategory[] = [];
  let maxSeverity: EthicsSeverity = 'Low';
  let isToxic = false;
  let isBiased = false;

  const severityOrder: Record<EthicsSeverity, number> = { Low: 1, Medium: 2, High: 3 };

  // Check toxicity
  for (const { pattern, label, severity } of TOXICITY_PATTERNS) {
    const regex = typeof pattern === 'string' ? new RegExp(pattern, 'i') : pattern;
    if (regex.test(text)) {
      flags.push(label);
      isToxic = true;
      if (severityOrder[severity] > severityOrder[maxSeverity]) {
        maxSeverity = severity;
      }
    }
  }

  // Check general bias
  for (const { pattern, label, severity } of BIAS_PATTERNS) {
    const regex = typeof pattern === 'string' ? new RegExp(pattern, 'i') : pattern;
    if (regex.test(text)) {
      flags.push(label);
      isBiased = true;
      if (severityOrder[severity] > severityOrder[maxSeverity]) {
        maxSeverity = severity;
      }
    }
  }

  // Check gender bias
  for (const { pattern, fragment, severity } of GENDER_BIAS_PATTERNS) {
    if (pattern.test(text)) {
      const actualFragment = extractFragment(text, pattern) || fragment;
      biasCategories.push({ category: 'gender', severity, fragment: actualFragment });
      isBiased = true;
      if (severityOrder[severity] > severityOrder[maxSeverity]) {
        maxSeverity = severity;
      }
    }
  }

  // Check racial bias
  for (const { pattern, fragment, severity } of RACIAL_BIAS_PATTERNS) {
    if (pattern.test(text)) {
      const actualFragment = extractFragment(text, pattern) || fragment;
      biasCategories.push({ category: 'racial', severity, fragment: actualFragment });
      isBiased = true;
      if (severityOrder[severity] > severityOrder[maxSeverity]) {
        maxSeverity = severity;
      }
    }
  }

  // Check socioeconomic bias
  for (const { pattern, fragment, severity } of SOCIOECONOMIC_BIAS_PATTERNS) {
    if (pattern.test(text)) {
      const actualFragment = extractFragment(text, pattern) || fragment;
      biasCategories.push({ category: 'socioeconomic', severity, fragment: actualFragment });
      isBiased = true;
      if (severityOrder[severity] > severityOrder[maxSeverity]) {
        maxSeverity = severity;
      }
    }
  }

  // Check confirmation bias
  for (const { pattern, fragment, severity } of CONFIRMATION_BIAS_PATTERNS) {
    if (pattern.test(text)) {
      const actualFragment = extractFragment(text, pattern) || fragment;
      biasCategories.push({ category: 'confirmation', severity, fragment: actualFragment });
      isBiased = true;
      if (severityOrder[severity] > severityOrder[maxSeverity]) {
        maxSeverity = severity;
      }
    }
  }

  if (isToxic) {
    return {
      status: 'Toxic Language Detected',
      severity: maxSeverity,
      explanation: `Detected: ${flags.slice(0, 2).join(', ')}. Consider rephrasing to maintain constructive dialogue.`,
      flags,
      biasCategories,
    };
  }

  if (isBiased) {
    const categoryLabels = [...new Set(biasCategories.map((b) => b.category))];
    const allFlags = [...flags, ...categoryLabels.map((c) => `${c} bias`)];
    return {
      status: biasCategories.length > 0 ? 'Bias' : 'Potential Bias',
      severity: maxSeverity,
      explanation: `Detected: ${allFlags.slice(0, 3).join(', ')}. Review for unintended bias or assumptions.`,
      flags: allFlags,
      biasCategories,
    };
  }

  return {
    status: 'Clean',
    severity: 'Low',
    explanation: 'No bias or toxicity indicators detected.',
    flags: [],
    biasCategories: [],
  };
}
