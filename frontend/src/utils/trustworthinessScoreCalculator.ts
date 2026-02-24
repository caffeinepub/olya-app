export interface TrustworthinessMetrics {
  biasCount: number;
  hallucinationFlagRate: number;
  ethicalViolationCount: number;
  trustworthinessScore: number;
}

/**
 * Calculate a trustworthiness score (0-100) based on safety metrics.
 * Penalties:
 *   - Each bias incident: -5 points
 *   - Each ethical violation: -10 points
 *   - Each hallucination flag (as % rate): -0.3 points per 1% rate
 */
export function calculateTrustworthinessScore(
  biasCount: number,
  hallucinationFlagRate: number,
  ethicalViolationCount: number,
  _totalEntries: number
): number {
  let score = 100;

  // Bias penalty: -5 per incident, capped at -30
  score -= Math.min(30, biasCount * 5);

  // Ethical violation penalty: -10 per violation, capped at -40
  score -= Math.min(40, ethicalViolationCount * 10);

  // Hallucination penalty: -0.3 per 1% flag rate, capped at -20
  score -= Math.min(20, hallucinationFlagRate * 0.3);

  return Math.max(0, Math.round(score));
}
