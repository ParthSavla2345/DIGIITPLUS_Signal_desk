"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runRagPipeline = runRagPipeline;
const supabase_1 = require("../../config/supabase");
const embeddings_1 = require("../ai/embeddings");
const evidenceScorer_1 = require("../../utils/evidenceScorer");
// Configurable similarity thresholds
const THRESHOLDS = {
    WEAK: 0.50, // Below this = weak evidence
    MODERATE: 0.60, // 0.60-0.75 = moderate
    USEFUL: 0.75, // 0.75-0.85 = useful
    STRONG: 0.85, // Above = strong
};
const RETRIEVAL_LIMITS = {
    RESOLVED_INCIDENTS: 5,
    KNOWLEDGE_ARTICLES: 3,
};
async function runRagPipeline(title, description, category, affectedService) {
    // Step 1: Generate query embedding
    const queryText = `${title}\n\n${description}`;
    const queryEmbedding = await (0, embeddings_1.generateEmbedding)(queryText, 'RETRIEVAL_QUERY');
    // Step 2: Retrieve similar resolved incidents via vector search
    const { data: resolvedData, error: resolvedError } = await supabase_1.supabase.rpc('match_resolved_incidents', {
        query_embedding: `[${queryEmbedding.join(',')}]`,
        match_threshold: THRESHOLDS.WEAK,
        match_count: RETRIEVAL_LIMITS.RESOLVED_INCIDENTS,
    });
    if (resolvedError) {
        console.error('[RAG] Error retrieving resolved incidents:', resolvedError);
    }
    // Step 3: Retrieve relevant knowledge articles
    const { data: articleData, error: articleError } = await supabase_1.supabase.rpc('match_knowledge_articles', {
        query_embedding: `[${queryEmbedding.join(',')}]`,
        match_threshold: THRESHOLDS.WEAK,
        match_count: RETRIEVAL_LIMITS.KNOWLEDGE_ARTICLES,
    });
    if (articleError) {
        console.error('[RAG] Error retrieving knowledge articles:', articleError);
    }
    // Step 4: Apply metadata boost for category/service exact matches
    let similarIncidents = (resolvedData ?? []).map((r) => ({
        ...r,
        similarity: applyMetadataBoost(r, category, affectedService),
    }));
    const knowledgeArticles = (articleData ?? []).map((a) => ({
        ...a,
        similarity: applyArticleBoost(a, category),
    }));
    // Sort after boost
    similarIncidents.sort((a, b) => b.similarity - a.similarity);
    // Step 5: Calculate evidence strength
    const evidenceStrength = (0, evidenceScorer_1.calculateEvidenceStrength)(similarIncidents, knowledgeArticles);
    return {
        similarIncidents,
        knowledgeArticles,
        evidenceStrength,
    };
}
function applyMetadataBoost(incident, category, affectedService) {
    let similarity = incident.similarity;
    // Boost by 0.05 if category matches
    if (category &&
        incident.category &&
        incident.category.toLowerCase() === category.toLowerCase()) {
        similarity = Math.min(1.0, similarity + 0.05);
    }
    return similarity;
}
function applyArticleBoost(article, category) {
    let similarity = article.similarity;
    if (category &&
        article.category.toLowerCase().includes(category.toLowerCase())) {
        similarity = Math.min(1.0, similarity + 0.05);
    }
    return similarity;
}
//# sourceMappingURL=ragPipeline.js.map