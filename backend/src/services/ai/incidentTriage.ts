import { z } from 'zod';
import { getGeminiClient, MODELS, PROMPT_VERSION, withRetry } from './geminiClient';
import { buildTriagePrompt } from './prompts';
import { extractJSON } from '../../utils/extractJSON';
import type { AiTriage } from '../../types';


const triageResponseSchema = z.object({
  summary: z.string().min(1),
  category: z.string().min(1),
  priority: z.enum(['P1', 'P2', 'P3', 'P4']),
  severity: z.enum(['critical', 'high', 'medium', 'low']),
  affected_service: z.string().min(1),
  assigned_team: z.string().min(1),
  sentiment: z.string().min(1),
  confidence: z.number().min(0).max(1),
});

export async function triageIncident(
  title: string,
  description: string,
): Promise<AiTriage> {
  const client = getGeminiClient();
  const prompt = buildTriagePrompt(title, description);

  const response = await withRetry(() =>
    client.models.generateContent({
      model: MODELS.GENERATION,
      contents: prompt,
      config: {
        temperature: 0.2,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',
      },
    }),
  );

  const rawText = response.text?.trim() ?? '';
  const jsonText = extractJSON(rawText);


  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error(`Gemini triage returned invalid JSON: ${jsonText.substring(0, 200)}`);
  }

  const validated = triageResponseSchema.parse(parsed);

  return {
    ...validated,
    ai_model: MODELS.GENERATION,
    ai_prompt_version: PROMPT_VERSION,
  } as AiTriage & { ai_model: string; ai_prompt_version: string };
}
