/**
 * Utility for estimating token usage and cost for Qwen 3.6 models.
 * Rates as of April 2026.
 */

// Pricing configuration for Qwen 3.6-Plus (estimated)
// Prices are in USD per 1,000,000 tokens
export const QWEN_PRICING = {
  INPUT_COST_PER_1M: 0.61,
  OUTPUT_COST_PER_1M: 1.98,
};

/**
 * Estimates the number of tokens in a string.
 * Hackathon-fast heuristic: ~4 characters per token.
 */
export function estimateTokens(text: string | null | undefined): number {
  if (!text) return 0;
  // Approximation: text length / 4, rounded up
  return Math.ceil(text.length / 4);
}

/**
 * Calculates the estimated cost in USD based on token counts.
 */
export function calculateCost(inputTokens: number, outputTokens: number): number {
  const inputCost = (inputTokens / 1_000_000) * QWEN_PRICING.INPUT_COST_PER_1M;
  const outputCost = (outputTokens / 1_000_000) * QWEN_PRICING.OUTPUT_COST_PER_1M;
  return inputCost + outputCost;
}

export interface UsageStats {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCost: number;
}

/**
 * Helper to get full usage stats from query and response parts.
 */
export function getUsageStats(
  question: string,
  contextText: string,
  shortAnswer: string | null | undefined,
  detailedAnswer: string | null | undefined
): UsageStats {
  const inputTokens = estimateTokens(question + ' ' + contextText);
  const outputTokens = estimateTokens((shortAnswer ?? '') + ' ' + (detailedAnswer ?? ''));
  
  return {
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
    estimatedCost: calculateCost(inputTokens, outputTokens),
  };
}
