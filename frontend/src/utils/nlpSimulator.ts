export interface SemanticTag {
  type: 'topic' | 'entity' | 'sentiment' | 'keyword';
  value: string;
  confidence: number;
}

export interface SemanticAnalysis {
  topics: SemanticTag[];
  entities: SemanticTag[];
  sentiment: SemanticTag;
  keywords: SemanticTag[];
}

const TOPIC_KEYWORDS: Record<string, string[]> = {
  'Negotiation': ['negotiate', 'deal', 'offer', 'counter', 'terms', 'agreement', 'contract', 'price', 'value', 'worth'],
  'Conflict': ['disagree', 'dispute', 'conflict', 'problem', 'issue', 'concern', 'objection', 'reject', 'refuse'],
  'Collaboration': ['together', 'partner', 'collaborate', 'cooperate', 'mutual', 'share', 'joint', 'team', 'work with'],
  'Finance': ['money', 'cost', 'budget', 'payment', 'revenue', 'profit', 'invest', 'fund', 'capital', 'financial'],
  'Timeline': ['deadline', 'schedule', 'time', 'date', 'when', 'urgent', 'soon', 'delay', 'timeline', 'period'],
  'Strategy': ['plan', 'strategy', 'approach', 'method', 'solution', 'option', 'alternative', 'proposal', 'suggest'],
  'Trust': ['trust', 'reliable', 'honest', 'transparent', 'credible', 'verify', 'confirm', 'guarantee', 'promise'],
  'Risk': ['risk', 'danger', 'threat', 'uncertain', 'concern', 'worry', 'potential', 'liability', 'exposure'],
};

const ENTITY_PATTERNS: Array<{ pattern: RegExp; type: string }> = [
  { pattern: /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, type: 'Person' },
  { pattern: /\b[A-Z]{2,}\b/g, type: 'Organization' },
  { pattern: /\$[\d,]+(?:\.\d{2})?(?:M|K|B)?\b/g, type: 'Amount' },
  { pattern: /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2}(?:,? \d{4})?\b/g, type: 'Date' },
  { pattern: /\b\d+%\b/g, type: 'Percentage' },
];

const POSITIVE_WORDS = ['agree', 'accept', 'good', 'great', 'excellent', 'positive', 'benefit', 'advantage', 'opportunity', 'success', 'happy', 'pleased', 'satisfied', 'confident', 'support', 'approve', 'yes', 'absolutely', 'certainly', 'perfect'];
const NEGATIVE_WORDS = ['reject', 'refuse', 'bad', 'terrible', 'negative', 'problem', 'issue', 'concern', 'risk', 'fail', 'unhappy', 'dissatisfied', 'worried', 'doubt', 'oppose', 'no', 'never', 'impossible', 'unacceptable', 'wrong'];

export function analyzeSemantics(text: string): SemanticAnalysis {
  const lower = text.toLowerCase();
  const words = lower.split(/\s+/);

  // Topic detection
  const topicScores: Record<string, number> = {};
  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    let score = 0;
    for (const kw of keywords) {
      if (lower.includes(kw)) score += 1;
    }
    if (score > 0) topicScores[topic] = score;
  }

  const topics: SemanticTag[] = Object.entries(topicScores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([topic, score]) => ({
      type: 'topic' as const,
      value: topic,
      confidence: Math.min(0.95, 0.5 + score * 0.1),
    }));

  // Entity extraction
  const entities: SemanticTag[] = [];
  const seenEntities = new Set<string>();
  for (const { pattern, type } of ENTITY_PATTERNS) {
    const matches = text.match(pattern) || [];
    for (const match of matches.slice(0, 2)) {
      if (!seenEntities.has(match)) {
        seenEntities.add(match);
        entities.push({
          type: 'entity' as const,
          value: `${type}: ${match}`,
          confidence: 0.75 + Math.random() * 0.2,
        });
      }
    }
  }

  // Sentiment analysis
  let positiveCount = 0;
  let negativeCount = 0;
  for (const word of words) {
    if (POSITIVE_WORDS.some(pw => word.includes(pw))) positiveCount++;
    if (NEGATIVE_WORDS.some(nw => word.includes(nw))) negativeCount++;
  }

  let sentimentValue: string;
  let sentimentConf: number;
  if (positiveCount > negativeCount * 1.5) {
    sentimentValue = 'Positive';
    sentimentConf = 0.6 + Math.min(0.35, positiveCount * 0.05);
  } else if (negativeCount > positiveCount * 1.5) {
    sentimentValue = 'Negative';
    sentimentConf = 0.6 + Math.min(0.35, negativeCount * 0.05);
  } else if (positiveCount > 0 || negativeCount > 0) {
    sentimentValue = 'Mixed';
    sentimentConf = 0.55 + Math.random() * 0.2;
  } else {
    sentimentValue = 'Neutral';
    sentimentConf = 0.7 + Math.random() * 0.2;
  }

  const sentiment: SemanticTag = {
    type: 'sentiment',
    value: sentimentValue,
    confidence: sentimentConf,
  };

  // Keyword extraction (most significant words)
  const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'shall', 'can', 'need', 'dare', 'ought', 'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'out', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'and', 'but', 'or', 'nor', 'so', 'yet', 'both', 'either', 'neither', 'not', 'only', 'own', 'same', 'than', 'too', 'very', 'just', 'i', 'me', 'my', 'we', 'our', 'you', 'your', 'he', 'she', 'it', 'they', 'them', 'this', 'that', 'these', 'those', 'what', 'which', 'who', 'whom', 'how', 'when', 'where', 'why', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very']);

  const wordFreq: Record<string, number> = {};
  for (const word of words) {
    const clean = word.replace(/[^a-z]/g, '');
    if (clean.length > 3 && !stopWords.has(clean)) {
      wordFreq[clean] = (wordFreq[clean] || 0) + 1;
    }
  }

  const keywords: SemanticTag[] = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => ({
      type: 'keyword' as const,
      value: word,
      confidence: 0.6 + Math.random() * 0.3,
    }));

  return { topics, entities, sentiment, keywords };
}
