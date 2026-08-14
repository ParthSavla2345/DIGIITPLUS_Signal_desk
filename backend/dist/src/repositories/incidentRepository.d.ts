import type { Incident, CreateIncidentInput, UpdateIncidentInput, IncidentActivity, AiTriage, AiAnalysis, AnomalyType } from '../types';
export declare function createIncident(input: CreateIncidentInput): Promise<Incident>;
export declare function getIncidentById(id: string): Promise<Incident | null>;
export declare function listIncidents(filters: {
    status?: string;
    priority?: string;
    category?: string;
    limit?: number;
    offset?: number;
}): Promise<{
    incidents: Incident[];
    total: number;
}>;
export declare function updateIncident(id: string, updates: UpdateIncidentInput): Promise<Incident>;
export declare function updateIncidentWithTriage(id: string, triage: AiTriage): Promise<Incident>;
export declare function updateIncidentWithAnalysis(id: string, analysis: AiAnalysis, evidenceStrength: number, anomaly: {
    is_anomaly: boolean;
    anomaly_type: AnomalyType;
    anomaly_reason: string | null;
}, embedding: number[]): Promise<Incident>;
export declare function setAnalysisStatus(id: string, status: 'pending' | 'processing' | 'completed' | 'failed'): Promise<void>;
export declare function resolveIncident(id: string, resolution: string): Promise<Incident>;
export declare function addActivity(incidentId: string, action: string, details?: Record<string, unknown>): Promise<IncidentActivity>;
export declare function getIncidentActivity(incidentId: string): Promise<IncidentActivity[]>;
//# sourceMappingURL=incidentRepository.d.ts.map