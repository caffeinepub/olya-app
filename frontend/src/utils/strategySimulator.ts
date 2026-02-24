import type { EmotionType, IntentType } from './emotionIntentSimulator';

export interface StrategyRecommendation {
  strategy: string;
  confidence: number;
  rationale: string;
  category: 'de-escalate' | 'advance' | 'probe' | 'anchor' | 'reframe' | 'build-trust';
}

const STRATEGY_MATRIX: Record<string, StrategyRecommendation[]> = {
  'Hostile_Demanding': [
    { strategy: 'De-escalate Tension', confidence: 0.91, rationale: 'Hostile tone with demands requires immediate emotional de-escalation before substantive progress.', category: 'de-escalate' },
    { strategy: 'Acknowledge Concerns', confidence: 0.85, rationale: 'Validating the other party\'s position reduces defensiveness and opens dialogue.', category: 'build-trust' },
    { strategy: 'Introduce Neutral Anchor', confidence: 0.72, rationale: 'Shifting focus to objective criteria removes personal tension from the negotiation.', category: 'anchor' },
  ],
  'Frustrated_Demanding': [
    { strategy: 'Empathetic Reframe', confidence: 0.88, rationale: 'Frustration signals unmet needs; reframing around shared goals can reset the dynamic.', category: 'reframe' },
    { strategy: 'Offer Partial Concession', confidence: 0.79, rationale: 'A small concession demonstrates good faith and can break the impasse.', category: 'advance' },
    { strategy: 'Request Clarification', confidence: 0.74, rationale: 'Probing for underlying interests behind demands reveals negotiable positions.', category: 'probe' },
  ],
  'Confident_Asserting': [
    { strategy: 'Counter-Anchor', confidence: 0.87, rationale: 'Confident assertions require a strong counter-position to establish negotiation range.', category: 'anchor' },
    { strategy: 'Probe for Flexibility', confidence: 0.81, rationale: 'Testing the boundaries of confident positions often reveals hidden flexibility.', category: 'probe' },
    { strategy: 'Build on Common Ground', confidence: 0.76, rationale: 'Identifying shared interests with a confident counterpart accelerates agreement.', category: 'build-trust' },
  ],
  'Curious_Probing': [
    { strategy: 'Expand Information Sharing', confidence: 0.89, rationale: 'Curiosity signals openness; sharing strategic information builds reciprocal trust.', category: 'build-trust' },
    { strategy: 'Introduce New Options', confidence: 0.83, rationale: 'A curious counterpart is receptive to creative solutions and package deals.', category: 'advance' },
    { strategy: 'Reframe Value Proposition', confidence: 0.77, rationale: 'Probing questions indicate evaluation; reframing value can shift the decision calculus.', category: 'reframe' },
  ],
  'Neutral_Negotiating': [
    { strategy: 'Establish Anchor Point', confidence: 0.84, rationale: 'Neutral negotiating stance is ideal for setting a strong initial anchor position.', category: 'anchor' },
    { strategy: 'Map Interests', confidence: 0.80, rationale: 'Neutral tone allows for systematic exploration of underlying interests and priorities.', category: 'probe' },
    { strategy: 'Propose Package Deal', confidence: 0.75, rationale: 'Bundling multiple issues creates value-creating trade-offs in neutral negotiations.', category: 'advance' },
    { strategy: 'Build Rapport', confidence: 0.70, rationale: 'Investing in relationship quality during neutral phases pays dividends in difficult moments.', category: 'build-trust' },
  ],
  'Anxious_Deflecting': [
    { strategy: 'Reduce Uncertainty', confidence: 0.90, rationale: 'Anxiety-driven deflection responds to clear, structured proposals that minimize ambiguity.', category: 'advance' },
    { strategy: 'Provide Reassurance', confidence: 0.85, rationale: 'Addressing specific concerns directly reduces anxiety and enables forward progress.', category: 'build-trust' },
    { strategy: 'Simplify the Ask', confidence: 0.78, rationale: 'Breaking complex demands into smaller steps reduces cognitive load and resistance.', category: 'reframe' },
  ],
  'Optimistic_Agreeing': [
    { strategy: 'Advance to Close', confidence: 0.92, rationale: 'Optimistic agreement signals readiness; move decisively toward commitment.', category: 'advance' },
    { strategy: 'Lock in Key Terms', confidence: 0.87, rationale: 'Secure specific agreements while positive momentum is high.', category: 'anchor' },
    { strategy: 'Expand Scope', confidence: 0.75, rationale: 'Positive disposition creates opportunity to introduce additional value-adding elements.', category: 'advance' },
  ],
};

const DEFAULT_STRATEGIES: StrategyRecommendation[] = [
  { strategy: 'Active Listening', confidence: 0.78, rationale: 'Demonstrating attentive listening builds trust and surfaces hidden information.', category: 'build-trust' },
  { strategy: 'Clarify Positions', confidence: 0.74, rationale: 'Ensuring mutual understanding of stated positions prevents costly misalignments.', category: 'probe' },
  { strategy: 'Identify BATNA', confidence: 0.71, rationale: 'Understanding best alternatives strengthens your negotiating position and walk-away point.', category: 'anchor' },
];

export function generateStrategies(
  emotion: EmotionType,
  intent: IntentType,
  trustLevel: number,
  persuasionLevel: number
): StrategyRecommendation[] {
  const key = `${emotion}_${intent}`;
  let strategies = STRATEGY_MATRIX[key] || DEFAULT_STRATEGIES;

  // Adjust confidence based on trust and persuasion levels
  strategies = strategies.map(s => ({
    ...s,
    confidence: Math.min(0.97, s.confidence * (0.85 + trustLevel * 0.15 + persuasionLevel * 0.05)),
  }));

  // Add trust-building strategy if trust is low
  if (trustLevel < 0.4 && !strategies.find(s => s.category === 'build-trust')) {
    strategies = [
      ...strategies.slice(0, 2),
      {
        strategy: 'Rebuild Trust Foundation',
        confidence: 0.88,
        rationale: 'Low trust levels require explicit trust-building actions before substantive progress.',
        category: 'build-trust',
      },
    ];
  }

  return strategies.slice(0, 4);
}
