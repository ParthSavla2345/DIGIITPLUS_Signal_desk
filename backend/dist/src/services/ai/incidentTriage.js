"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.triageIncident = triageIncident;
const zod_1 = require("zod");
const geminiClient_1 = require("./geminiClient");
const prompts_1 = require("./prompts");
const triageResponseSchema = zod_1.z.object({
    summary: zod_1.z.string().min(1),
    category: zod_1.z.string().min(1),
    priority: zod_1.z.enum(['P1', 'P2', 'P3', 'P4']),
    severity: zod_1.z.enum(['critical', 'high', 'medium', 'low']),
    affected_service: zod_1.z.string().min(1),
    assigned_team: zod_1.z.string().min(1),
    sentiment: zod_1.z.string().min(1),
    confidence: zod_1.z.number().min(0).max(1),
});
async function triageIncident(title, description) {
    const client = (0, geminiClient_1.getGeminiClient)();
    const prompt = (0, prompts_1.buildTriagePrompt)(title, description);
    const response = await client.models.generateContent({
        model: geminiClient_1.MODELS.GENERATION,
        contents: prompt,
        config: {
            temperature: 0.2,
            maxOutputTokens: 1024,
        },
    });
    const rawText = response.text?.trim() ?? '';
    // Strip any markdown code fences if Gemini wraps the JSON
    const jsonText = rawText
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```\s*$/, '')
        .trim();
    let parsed;
    try {
        parsed = JSON.parse(jsonText);
    }
    catch {
        throw new Error(`Gemini triage returned invalid JSON: ${jsonText.substring(0, 200)}`);
    }
    const validated = triageResponseSchema.parse(parsed);
    return {
        ...validated,
        ai_model: geminiClient_1.MODELS.GENERATION,
        ai_prompt_version: geminiClient_1.PROMPT_VERSION,
    };
}
//# sourceMappingURL=incidentTriage.js.map