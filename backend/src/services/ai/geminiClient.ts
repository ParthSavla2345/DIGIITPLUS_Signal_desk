import { GoogleGenAI } from '@google/genai';
import { env } from '../../config/env';

let _client: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!_client) {
    _client = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  }
  return _client;
}

export const MODELS = {
  // gemini-3.6-flash: confirmed working (200 OK) for this AQ. API key
  GENERATION: 'gemini-3.6-flash',
  // gemini-embedding-001: confirmed available via ListModels
  EMBEDDING: 'gemini-embedding-001',
} as const;



export const PROMPT_VERSION = 'v1.0.0';

/**
 * Retries an async function with exponential backoff.
 * Handles Gemini 429 (rate limit) and 503/overloaded errors gracefully.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  baseDelayMs = 1500,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastError = err;
      const status = (err as { status?: number })?.status;
      const isRetryable =
        status === 429 ||
        status === 503 ||
        (err instanceof Error &&
          (err.message.includes('overloaded') ||
            err.message.includes('rate limit') ||
            err.message.includes('quota')));

      if (!isRetryable || attempt === maxAttempts) throw err;

      const delay = baseDelayMs * Math.pow(2, attempt - 1); // 1.5s, 3s, 6s
      console.warn(
        `[Gemini] Attempt ${attempt}/${maxAttempts} failed (${status ?? 'err'}). Retrying in ${delay}ms…`,
      );
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastError;
}
