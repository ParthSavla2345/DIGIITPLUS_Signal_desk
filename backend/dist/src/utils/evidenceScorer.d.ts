import type { KnowledgeArticle, ResolvedIncidentKnowledge, EvidenceStrengthResult } from '../types';
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
export declare function calculateEvidenceStrength(resolvedIncidents: Array<ResolvedIncidentKnowledge & {
    similarity: number;
}>, knowledgeArticles: Array<KnowledgeArticle & {
    similarity: number;
}>): EvidenceStrengthResult;
//# sourceMappingURL=evidenceScorer.d.ts.map