import { supabase } from '../../config/supabase';
import { generateEmbedding } from '../ai/embeddings';
import { calculateEvidenceStrength } from '../../utils/evidenceScorer';
import type { RagResult, KnowledgeArticle, ResolvedIncidentKnowledge } from '../../types';

// Configurable similarity thresholds
const THRESHOLDS = {
  WEAK: 0.50,      // Below this = weak evidence
  MODERATE: 0.60,  // 0.60-0.75 = moderate
  USEFUL: 0.75,    // 0.75-0.85 = useful
  STRONG: 0.85,    // Above = strong
} as const;

const RETRIEVAL_LIMITS = {
  RESOLVED_INCIDENTS: 5,
  KNOWLEDGE_ARTICLES: 3,
} as const;

export async function runRagPipeline(
  title: string,
  description: string,
  category?: string | null,
  affectedService?: string | null,
): Promise<RagResult> {
  // Step 1: Generate query embedding
  const queryText = `${title}\n\n${description}`;
  const queryEmbedding = await generateEmbedding(queryText, 'RETRIEVAL_QUERY');

  // Step 2: Retrieve similar resolved incidents via vector search
  const { data: resolvedData, error: resolvedError } = await supabase.rpc(
    'match_resolved_incidents',
    {
      query_embedding: `[${queryEmbedding.join(',')}]`,
      match_threshold: THRESHOLDS.WEAK,
      match_count: RETRIEVAL_LIMITS.RESOLVED_INCIDENTS,
    },
  );

  if (resolvedError) {
    console.error('[RAG] Error retrieving resolved incidents:', resolvedError);
  }

  // Step 3: Retrieve relevant knowledge articles
  const { data: articleData, error: articleError } = await supabase.rpc(
    'match_knowledge_articles',
    {
      query_embedding: `[${queryEmbedding.join(',')}]`,
      match_threshold: THRESHOLDS.WEAK,
      match_count: RETRIEVAL_LIMITS.KNOWLEDGE_ARTICLES,
    },
  );

  if (articleError) {
    console.error('[RAG] Error retrieving knowledge articles:', articleError);
  }

  // Step 4: Apply metadata boost for category/service exact matches
  let similarIncidents: Array<ResolvedIncidentKnowledge & { similarity: number }> =
    (resolvedData ?? []).map((r: ResolvedIncidentKnowledge & { similarity: number }) => ({
      ...r,
      similarity: applyMetadataBoost(r, category, affectedService),
    }));

  const knowledgeArticles: Array<KnowledgeArticle & { similarity: number }> =
    (articleData ?? []).map((a: KnowledgeArticle & { similarity: number }) => ({
      ...a,
      similarity: applyArticleBoost(a, category),
    }));

  // Sort after boost
  similarIncidents.sort((a, b) => b.similarity - a.similarity);

  // Step 5: Calculate evidence strength
  const evidenceStrength = calculateEvidenceStrength(similarIncidents, knowledgeArticles);

  return {
    similarIncidents,
    knowledgeArticles,
    evidenceStrength,
  };
}

function applyMetadataBoost(
  incident: ResolvedIncidentKnowledge & { similarity: number },
  category?: string | null,
  affectedService?: string | null,
): number {
  let similarity = incident.similarity;

  // Boost by 0.05 if category matches
  if (
    category &&
    incident.category &&
    incident.category.toLowerCase() === category.toLowerCase()
  ) {
    similarity = Math.min(1.0, similarity + 0.05);
  }

  return similarity;
}

function applyArticleBoost(
  article: KnowledgeArticle & { similarity: number },
  category?: string | null,
): number {
  let similarity = article.similarity;

  if (
    category &&
    article.category.toLowerCase().includes(category.toLowerCase())
  ) {
    similarity = Math.min(1.0, similarity + 0.05);
  }

  return similarity;
}
