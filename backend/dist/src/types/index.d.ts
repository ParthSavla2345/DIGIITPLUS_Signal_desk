export type IncidentStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type IncidentPriority = 'P1' | 'P2' | 'P3' | 'P4';
export type IncidentSeverity = 'critical' | 'high' | 'medium' | 'low';
export type AnalysisStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type AnomalyType = 'novel_incident' | 'incident_cluster' | null;
export interface ProbableCause {
    cause: string;
    confidence: number;
}
export interface RecommendedAction {
    step: string;
    risk: 'low' | 'medium' | 'high';
    requires_human_approval: boolean;
}
export interface EscalationInfo {
    should_escalate: boolean;
    target_team: string | null;
    reason: string | null;
}
export interface EvidenceItem {
    id: string;
    title: string;
    type: 'resolved_incident' | 'knowledge_article';
    similarity: number;
    resolution?: string;
    content?: string;
}
export interface AiAnalysis {
    summary: string;
    probable_causes: ProbableCause[];
    recommended_actions: RecommendedAction[];
    missing_information: string[];
    evidence_used: EvidenceItem[];
    escalation: EscalationInfo;
    confidence: number;
}
export interface AiTriage {
    summary: string;
    category: string;
    priority: IncidentPriority;
    severity: IncidentSeverity;
    affected_service: string;
    assigned_team: string;
    sentiment: string;
    confidence: number;
}
export interface Incident {
    id: string;
    title: string;
    description: string;
    status: IncidentStatus;
    category: string | null;
    priority: IncidentPriority | null;
    severity: IncidentSeverity | null;
    affected_service: string | null;
    assigned_team: string | null;
    sentiment: string | null;
    ai_summary: string | null;
    ai_analysis: AiAnalysis | null;
    ai_confidence: number | null;
    evidence_strength: number | null;
    is_anomaly: boolean;
    anomaly_type: AnomalyType;
    anomaly_reason: string | null;
    resolution: string | null;
    resolved_at: string | null;
    analysis_status: AnalysisStatus;
    ai_model: string | null;
    ai_prompt_version: string | null;
    created_at: string;
    updated_at: string;
}
export interface ResolvedIncidentKnowledge {
    id: string;
    source_id: string;
    title: string;
    description: string;
    category: string | null;
    priority: string | null;
    resolution: string;
    source: string;
    created_at: string;
}
export interface KnowledgeArticle {
    id: string;
    title: string;
    content: string;
    category: string;
    tags: string[];
    created_at: string;
}
export interface IncidentActivity {
    id: string;
    incident_id: string;
    action: string;
    details: Record<string, unknown>;
    created_at: string;
}
export interface CreateIncidentInput {
    title: string;
    description: string;
}
export interface UpdateIncidentInput {
    status?: IncidentStatus;
    priority?: IncidentPriority;
    severity?: IncidentSeverity;
    category?: string;
    affected_service?: string;
    assigned_team?: string;
    resolution?: string;
}
export interface AddCommentInput {
    comment: string;
    engineer?: string;
}
export interface EscalateInput {
    target_team: string;
    reason: string;
    engineer?: string;
}
export interface EvidenceStrengthResult {
    score: number;
    label: 'high' | 'moderate' | 'low';
    resolved_incident_count: number;
    knowledge_article_count: number;
    max_similarity: number;
}
export interface RagResult {
    similarIncidents: Array<ResolvedIncidentKnowledge & {
        similarity: number;
    }>;
    knowledgeArticles: Array<KnowledgeArticle & {
        similarity: number;
    }>;
    evidenceStrength: EvidenceStrengthResult;
}
//# sourceMappingURL=index.d.ts.map