import { getGeminiClient, MODELS, withRetry } from './geminiClient';

export type EmbeddingTaskType = 'RETRIEVAL_DOCUMENT' | 'RETRIEVAL_QUERY';

export async function generateEmbedding(
  text: string,
  taskType: EmbeddingTaskType = 'RETRIEVAL_QUERY',
): Promise<number[]> {
  const client = getGeminiClient();

  const response = await withRetry(() =>
    client.models.embedContent({
      model: MODELS.EMBEDDING,
      contents: text,
      config: {
        taskType,
        outputDimensionality: 768,
      },
    }),
  );

  const embedding = response.embeddings?.[0]?.values;
  if (!embedding || embedding.length === 0) {
    throw new Error(
      `Embedding returned empty values (got ${embedding?.length ?? 0} dims)`,
    );
  }

  return embedding;
}


export async function generateEmbeddingsBatch(
  texts: string[],
  taskType: EmbeddingTaskType = 'RETRIEVAL_DOCUMENT',
  delayMs = 200,
): Promise<number[][]> {
  const embeddings: number[][] = [];

  for (const text of texts) {
    const embedding = await generateEmbedding(text, taskType);
    embeddings.push(embedding);

    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return embeddings;
}
