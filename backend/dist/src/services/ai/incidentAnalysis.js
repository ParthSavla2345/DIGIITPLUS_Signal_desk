"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeIncident = analyzeIncident;
const zod_1 = require("zod");
const geminiClient_1 = require("./geminiClient");
const prompts_1 = require("./prompts");
const probableCauseSchema = zod_1.z.object({
    cause: zod_1.z.string().min(1),
    confidence: zod_1.z.number().min(0).max(1),
});
const recommendedActionSchema = zod_1.z.object({
    step: zod_1.z.string().min(1),
    risk: zod_1.z.enum(['low', 'medium', 'high']),
    requires_human_approval: zod_1.z.boolean(),
});
const escalationSchema = zod_1.z.object({
    should_escalate: zod_1.z.boolean(),
    target_team: zod_1.z.string().nullable(),
    reason: zod_1.z.string().nullable(),
});
const analysisResponseSchema = zod_1.z.object({
    summary: zod_1.z.string().min(1),
    probable_causes: zod_1.z.array(probableCauseSchema).min(0),
    recommended_actions: zod_1.z.array(recommendedActionSchema).min(0),
    missing_information: zod_1.z.array(zod_1.z.string()),
    evidence_used: zod_1.z.array(zod_1.z.any()),
    escalation: escalationSchema,
    confidence: zod_1.z.number().min(0).max(1),
});
async function analyzeIncident(incident, ragResult) {
    const client = (0, geminiClient_1.getGeminiClient)();
    const prompt = (0, prompts_1.buildInvestigationPrompt)({
        title: incident.title,
        description: incident.description,
        category: incident.category,
        priority: incident.priority,
        affected_service: incident.affected_service,
    }, ragResult);
    const response = await client.models.generateContent({
        model: geminiClient_1.MODELS.GENERATION,
        contents: prompt,
        config: {
            temperature: 0.1,
            maxOutputTokens: 2048,
        },
    });
    const rawText = response.text?.trim() ?? '';
    // Strip markdown code fences
    const jsonText = rawText
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```\s*$/, '')
        .trim();
    let parsed;
    try {
        parsed = JSON.parse(jsonText);
    }
    catch {
        throw new Error(`Gemini analysis returned invalid JSON: ${jsonText.substring(0, 200)}`);
    }
    const validated = analysisResponseSchema.parse(parsed);
    // Enrich evidence_used with actual retrieval data
    const analysis = {
        summary: validated.summary,
        probable_causes: validated.probable_causes,
        recommended_actions: validated.recommended_actions,
        missing_information: validated.missing_information,
        evidence_used: validated.evidence_used,
        escalation: validated.escalation,
        confidence: validated.confidence,
    };
    return (0, prompts_1.formatEvidenceForDisplay)(analysis, ragResult);
}
//# sourceMappingURL=incidentAnalysis.js.map