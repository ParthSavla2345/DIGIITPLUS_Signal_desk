"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateEmbedding = generateEmbedding;
exports.generateEmbeddingsBatch = generateEmbeddingsBatch;
const geminiClient_1 = require("./geminiClient");
async function generateEmbedding(text, taskType = 'RETRIEVAL_QUERY') {
    const client = (0, geminiClient_1.getGeminiClient)();
    const response = await client.models.embedContent({
        model: geminiClient_1.MODELS.EMBEDDING,
        contents: text,
        config: {
            taskType,
            outputDimensionality: 768,
        },
    });
    const embedding = response.embeddings?.[0]?.values;
    if (!embedding || embedding.length !== 768) {
        throw new Error(`Embedding dimension mismatch: expected 768, got ${embedding?.length ?? 0}`);
    }
    return embedding;
}
async function generateEmbeddingsBatch(texts, taskType = 'RETRIEVAL_DOCUMENT', delayMs = 200) {
    const embeddings = [];
    for (const text of texts) {
        const embedding = await generateEmbedding(text, taskType);
        embeddings.push(embedding);
        if (delayMs > 0) {
            await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
    }
    return embeddings;
}
//# sourceMappingURL=embeddings.js.map