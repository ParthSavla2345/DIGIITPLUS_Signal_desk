import type { RagResult } from '../../types';
export interface AnomalyResult {
    is_anomaly: boolean;
    anomaly_type: 'novel_incident' | 'incident_cluster' | null;
    anomaly_reason: string | null;
}
/**
 * TYPE A — Novel Incident Detection
 *
 * If max similarity across all retrieved evidence is below threshold,
 * this incident has no strong historical match → novel incident.
 */
export declare function detectNovelIncident(ragResult: RagResult): boolean;
/**
 * TYPE B — Incident Cluster Detection
 *
 * Check if multiple incidents in the same category/service
 * have been reported within a recent time window.
 */
export declare function detectIncidentCluster(category: string | null, affectedService: string | null): Promise<{
    detected: boolean;
    count: number;
}>;
/**
 * Combined anomaly analysis
 * Returns the most severe anomaly type detected.
 */
export declare function analyzeAnomaly(ragResult: RagResult, category: string | null, affectedService: string | null): Promise<AnomalyResult>;
//# sourceMappingURL=anomalyDetector.d.ts.map