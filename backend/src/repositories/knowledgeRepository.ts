import { supabase } from '../config/supabase';
import type { KnowledgeArticle } from '../types';

export async function listKnowledgeArticles(filters: {
  category?: string;
  search?: string;
  limit?: number;
}): Promise<KnowledgeArticle[]> {
  let query = supabase
    .from('knowledge_articles')
    .select('id, title, content, category, tags, created_at')
    .order('category', { ascending: true });

  if (filters.category) {
    query = query.ilike('category', `%${filters.category}%`);
  }

  if (filters.search) {
    query = query.or(
      `title.ilike.%${filters.search}%,content.ilike.%${filters.search}%`,
    );
  }

  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) throw new Error(`Failed to list knowledge articles: ${error.message}`);
  return (data ?? []) as KnowledgeArticle[];
}

export async function getKnowledgeArticleById(
  id: string,
): Promise<KnowledgeArticle | null> {
  const { data, error } = await supabase
    .from('knowledge_articles')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Failed to fetch knowledge article: ${error.message}`);
  }

  return data as KnowledgeArticle;
}

export async function upsertKnowledgeArticle(article: {
  title: string;
  content: string;
  category: string;
  tags: string[];
  embedding: number[];
}): Promise<void> {
  const { error } = await supabase.from('knowledge_articles').upsert(
    {
      title: article.title,
      content: article.content,
      category: article.category,
      tags: article.tags,
      embedding: `[${article.embedding.join(',')}]`,
    },
    { onConflict: 'title' },
  );

  if (error) throw new Error(`Failed to upsert knowledge article: ${error.message}`);
}

export async function upsertResolvedIncident(incident: {
  source_id: string;
  title: string;
  description: string;
  category: string | null;
  priority: string | null;
  resolution: string;
  embedding: number[];
  source?: string;
}): Promise<void> {
  const { error } = await supabase.from('resolved_incident_knowledge').upsert(
    {
      source_id: incident.source_id,
      title: incident.title,
      description: incident.description,
      category: incident.category,
      priority: incident.priority,
      resolution: incident.resolution,
      embedding: `[${incident.embedding.join(',')}]`,
      source: incident.source ?? 'huggingface',
    },
    { onConflict: 'source_id' },
  );

  if (error) throw new Error(`Failed to upsert resolved incident: ${error.message}`);
}
