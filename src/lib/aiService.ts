// ─────────────────────────────────────────────────────────────
// GreenPrint – AI Analysis Service
// All Claude calls go through /api/ai-analyze (server-side proxy)
// so the API key is NEVER exposed in the browser bundle.
// ─────────────────────────────────────────────────────────────

import type { FootprintResult } from '../types';

export interface AIAnalysisResponse {
  analysis: string;
  fallback?: string;
}

export async function fetchAIAnalysis(
  result: FootprintResult
): Promise<AIAnalysisResponse> {
  const response = await fetch('/api/ai-analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      total_kg:    result.total_kg,
      label:       result.label,
      breakdown:   result.breakdown,
      comparisons: result.comparisons,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    // Return fallback text instead of crashing the UI
    return {
      analysis: err.fallback ?? `Your ${result.label} score of ${result.total_kg.toLocaleString()} kg CO₂e has been calculated. Focus on your top category for the biggest gains.`,
    };
  }

  return response.json();
}
