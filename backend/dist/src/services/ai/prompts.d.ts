import type { AiAnalysis, RagResult } from '../../types';
export declare const PROMPT_VERSION = "v1.0.0";
export declare function buildTriagePrompt(title: string, description: string): string;
export declare function buildInvestigationPrompt(incident: {
    title: string;
    description: string;
    category: string | null;
    priority: string | null;
    affected_service: string | null;
}, ragResult: RagResult): string;
export declare function formatEvidenceForDisplay(analysis: AiAnalysis, ragResult: RagResult): AiAnalysis;
//# sourceMappingURL=prompts.d.ts.map