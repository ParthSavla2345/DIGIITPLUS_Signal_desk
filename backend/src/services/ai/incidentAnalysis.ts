import { z } from 'zod';
import { getGeminiClient, MODELS, withRetry } from './geminiClient';
import { buildInvestigationPrompt, formatEvidenceForDisplay } from './prompts';
import { extractJSON } from '../../utils/extractJSON';
import { validateHallucinationGuard } from './hallucinationGuard';
import { evaluateAutoResolution } from '../remediation/autoResolutionEngine';
import type { AiAnalysis, Incident, RagResult } from '../../types';

const probableCauseSchema = z.object({
  cause: z.string().min(1),
  confidence: z.number().min(0).max(1),
});

const recommendedActionSchema = z.object({
  step: z.string().min(1),
  risk: z.enum(['low', 'medium', 'high']),
  requires_human_approval: z.boolean(),
});

const escalationSchema = z.object({
  should_escalate: z.boolean(),
  target_team: z.string().nullable(),
  reason: z.string().nullable(),
});

const analysisResponseSchema = z.object({
  summary: z.string().min(1),
  probable_causes: z.array(probableCauseSchema).min(0),
  recommended_actions: z.array(recommendedActionSchema).min(0),
  missing_information: z.array(z.string()),
  evidence_used: z.array(z.any()),
  escalation: escalationSchema,
  confidence: z.number().min(0).max(1),
});

export async function analyzeIncident(
  incident: Incident,
  ragResult: RagResult,
): Promise<AiAnalysis> {
  const client = getGeminiClient();

  const prompt = buildInvestigationPrompt(
    {
      title: incident.title,
      description: incident.description,
      category: incident.category,
      priority: incident.priority,
      affected_service: incident.affected_service,
    },
    ragResult,
  );

  const response = await withRetry(() =>
    client.models.generateContent({
      model: MODELS.GENERATION,
      contents: prompt,
      config: {
        temperature: 0.1,
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
    throw new Error(`Gemini analysis returned invalid JSON: ${jsonText.substring(0, 200)}`);
  }

  const validated = analysisResponseSchema.parse(parsed);

  const rawAnalysis: AiAnalysis = {
    summary: validated.summary,
    probable_causes: validated.probable_causes,
    recommended_actions: validated.recommended_actions,
    missing_information: validated.missing_information,
    evidence_used: validated.evidence_used,
    escalation: validated.escalation,
    confidence: validated.confidence,
  };

  const enrichedAnalysis = formatEvidenceForDisplay(rawAnalysis, ragResult);

  // 1. Run AI Hallucination Guard
  const guardResult = validateHallucinationGuard(enrichedAnalysis, ragResult);

  // 2. Evaluate Auto-Resolution Gate
  const autoResolution = evaluateAutoResolution(
    incident,
    enrichedAnalysis,
    ragResult,
    guardResult,
  );

  // 3. Attach Remediation Plan if available
  const remediationPlan = autoResolution.matched_runbook;

  return {
    ...enrichedAnalysis,
    hallucination_guard: guardResult,
    auto_resolution: autoResolution,
    remediation_plan: remediationPlan,
  };
}
