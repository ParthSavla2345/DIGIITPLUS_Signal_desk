"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listKnowledgeArticles = listKnowledgeArticles;
exports.getKnowledgeArticleById = getKnowledgeArticleById;
exports.upsertKnowledgeArticle = upsertKnowledgeArticle;
exports.upsertResolvedIncident = upsertResolvedIncident;
const supabase_1 = require("../config/supabase");
async function listKnowledgeArticles(filters) {
    let query = supabase_1.supabase
        .from('knowledge_articles')
        .select('id, title, content, category, tags, created_at')
        .order('category', { ascending: true });
    if (filters.category) {
        query = query.ilike('category', `%${filters.category}%`);
    }
    if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,content.ilike.%${filters.search}%`);
    }
    if (filters.limit) {
        query = query.limit(filters.limit);
    }
    const { data, error } = await query;
    if (error)
        throw new Error(`Failed to list knowledge articles: ${error.message}`);
    return (data ?? []);
}
async function getKnowledgeArticleById(id) {
    const { data, error } = await supabase_1.supabase
        .from('knowledge_articles')
        .select('*')
        .eq('id', id)
        .single();
    if (error) {
        if (error.code === 'PGRST116')
            return null;
        throw new Error(`Failed to fetch knowledge article: ${error.message}`);
    }
    return data;
}
async function upsertKnowledgeArticle(article) {
    const { error } = await supabase_1.supabase.from('knowledge_articles').upsert({
        title: article.title,
        content: article.content,
        category: article.category,
        tags: article.tags,
        embedding: `[${article.embedding.join(',')}]`,
    }, { onConflict: 'title' });
    if (error)
        throw new Error(`Failed to upsert knowledge article: ${error.message}`);
}
async function upsertResolvedIncident(incident) {
    const { error } = await supabase_1.supabase.from('resolved_incident_knowledge').upsert({
        source_id: incident.source_id,
        title: incident.title,
        description: incident.description,
        category: incident.category,
        priority: incident.priority,
        resolution: incident.resolution,
        embedding: `[${incident.embedding.join(',')}]`,
        source: incident.source ?? 'huggingface',
    }, { onConflict: 'source_id' });
    if (error)
        throw new Error(`Failed to upsert resolved incident: ${error.message}`);
}
//# sourceMappingURL=knowledgeRepository.js.map