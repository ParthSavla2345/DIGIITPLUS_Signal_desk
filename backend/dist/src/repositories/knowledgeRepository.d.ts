import type { KnowledgeArticle } from '../types';
export declare function listKnowledgeArticles(filters: {
    category?: string;
    search?: string;
    limit?: number;
}): Promise<KnowledgeArticle[]>;
export declare function getKnowledgeArticleById(id: string): Promise<KnowledgeArticle | null>;
export declare function upsertKnowledgeArticle(article: {
    title: string;
    content: string;
    category: string;
    tags: string[];
    embedding: number[];
}): Promise<void>;
export declare function upsertResolvedIncident(incident: {
    source_id: string;
    title: string;
    description: string;
    category: string | null;
    priority: string | null;
    resolution: string;
    embedding: number[];
    source?: string;
}): Promise<void>;
//# sourceMappingURL=knowledgeRepository.d.ts.map