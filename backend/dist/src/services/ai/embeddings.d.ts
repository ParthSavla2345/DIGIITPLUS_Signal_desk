export type EmbeddingTaskType = 'RETRIEVAL_DOCUMENT' | 'RETRIEVAL_QUERY';
export declare function generateEmbedding(text: string, taskType?: EmbeddingTaskType): Promise<number[]>;
export declare function generateEmbeddingsBatch(texts: string[], taskType?: EmbeddingTaskType, delayMs?: number): Promise<number[][]>;
//# sourceMappingURL=embeddings.d.ts.map