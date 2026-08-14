export type IncidentStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type IncidentPriority = 'P1' | 'P2' | 'P3' | 'P4';
export type IncidentSeverity = 'critical' | 'high' | 'medium' | 'low';
export type AnalysisStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type AnomalyType = 'novel_incident' | 'incident_cluster' | null;
export type EvidenceLabel = 'high' | 'moderate' | 'low';

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

export interface RemediationPlan {
  action_id: string;
  name: string;
  description: string;
  risk: 'low' | 'medium' | 'high';
  verification_method: string;
  is_safe_runbook: boolean;
}

export interface HallucinationGuardInfo {
  status: 'grounded' | 'partially_grounded' | 'insufficient_evidence';
  supported_claims_count: number;
  unsupported_claims: string[];
  explanation: string;
  is_safe_for_remediation: boolean;
}

export interface AutoResolutionInfo {
  is_eligible: boolean;
  decision: 'APPROVED_SAFE_REMEDIATION' | 'BLOCKED_MANUAL_INVESTIGATION_REQUIRED';
  confidence_score: number;
  evidence_score: number;
  matched_runbook: RemediationPlan | null;
  supporting_reasons: string[];
  blocking_reasons: string[];
  recommended_escalation_team: string | null;
  why_safe_summary: string;
}

export interface ClusterDetails {
  cluster_detected: boolean;
  cluster_score: number;
  incident_count: number;
  time_window_minutes: number;
  affected_service: string | null;
  category: string | null;
  shared_root_cause_hypothesis: string;
  related_incident_ids: string[];
}

export interface AiAnalysis {
  summary: string;
  probable_causes: ProbableCause[];
  recommended_actions: RecommendedAction[];
  missing_information: string[];
  evidence_used: EvidenceItem[];
  escalation: EscalationInfo;
  confidence: number;
  remediation_plan?: RemediationPlan | null;
  hallucination_guard?: HallucinationGuardInfo;
  auto_resolution?: AutoResolutionInfo;
  cluster_info?: ClusterDetails;
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

export interface IncidentActivity {
  id: string;
  incident_id: string;
  action: string;
  details: Record<string, unknown>;
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

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface ListIncidentsResponse {
  incidents: Incident[];
  total: number;
  limit: number;
  offset: number;
}

export interface IncidentDetailResponse {
  incident: Incident;
  activity: IncidentActivity[];
}
