import type { KnowledgeArticle, ResolvedIncidentKnowledge, EvidenceStrengthResult } from '../types';

const THRESHOLDS = {
  STRONG: 0.85,
  USEFUL: 0.75,
  MODERATE: 0.60,
  WEAK: 0.50,
};

/**
 * Calculate evidence strength from a 0-100 score.
 * This is computed from retrieval quality — Gemini cannot invent this score.
 *
 * Factors:
 * 1. Max similarity score of top retrieved item (40 points max)
 * 2. Number of resolved incidents with similarity > USEFUL threshold (30 points max)
 * 3. Number of knowledge articles with similarity > MODERATE threshold (20 points max)
 * 4. Bonus for strong evidence items (10 points max)
 */
export function calculateEvidenceStrength(
  resolvedIncidents: Array<ResolvedIncidentKnowledge & { similarity: number }>,
  knowledgeArticles: Array<KnowledgeArticle & { similarity: number }>,
): EvidenceStrengthResult {
  const maxSimilarity = Math.max(
    ...resolvedIncidents.map((r) => r.similarity),
    ...knowledgeArticles.map((a) => a.similarity),
    0,
  );

  // Factor 1: Max similarity score (40 points)
  const maxSimilarityScore = Math.round(maxSimilarity * 40);

  // Factor 2: Useful resolved incidents (30 points max)
  const usefulResolved = resolvedIncidents.filter(
    (r) => r.similarity >= THRESHOLDS.USEFUL,
  ).length;
  const resolvedScore = Math.min(30, usefulResolved * 15);

  // Factor 3: Relevant knowledge articles (20 points max)
  const relevantArticles = knowledgeArticles.filter(
    (a) => a.similarity >= THRESHOLDS.MODERATE,
  ).length;
  const articleScore = Math.min(20, relevantArticles * 10);

  // Factor 4: Bonus for strong evidence (10 points max)
  const strongItems = [
    ...resolvedIncidents.filter((r) => r.similarity >= THRESHOLDS.STRONG),
    ...knowledgeArticles.filter((a) => a.similarity >= THRESHOLDS.STRONG),
  ].length;
  const bonusScore = Math.min(10, strongItems * 5);

  const score = Math.min(100, maxSimilarityScore + resolvedScore + articleScore + bonusScore);

  const label: 'high' | 'moderate' | 'low' =
    score >= 70 ? 'high' : score >= 40 ? 'moderate' : 'low';

  return {
    score,
    label,
    resolved_incident_count: resolvedIncidents.length,
    knowledge_article_count: knowledgeArticles.length,
    max_similarity: maxSimilarity,
  };
}
