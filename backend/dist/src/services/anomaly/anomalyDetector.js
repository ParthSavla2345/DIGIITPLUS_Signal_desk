"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectNovelIncident = detectNovelIncident;
exports.detectIncidentCluster = detectIncidentCluster;
exports.analyzeAnomaly = analyzeAnomaly;
const supabase_1 = require("../../config/supabase");
// Configurable thresholds for anomaly detection
const ANOMALY_CONFIG = {
    NOVEL_INCIDENT_SIMILARITY_THRESHOLD: 0.60, // Below this = novel incident
    CLUSTER_TIME_WINDOW_MINUTES: 60, // Time window for cluster detection
    CLUSTER_THRESHOLD: 3, // Min incidents to form a cluster
};
/**
 * TYPE A — Novel Incident Detection
 *
 * If max similarity across all retrieved evidence is below threshold,
 * this incident has no strong historical match → novel incident.
 */
function detectNovelIncident(ragResult) {
    return ragResult.evidenceStrength.max_similarity < ANOMALY_CONFIG.NOVEL_INCIDENT_SIMILARITY_THRESHOLD;
}
/**
 * TYPE B — Incident Cluster Detection
 *
 * Check if multiple incidents in the same category/service
 * have been reported within a recent time window.
 */
async function detectIncidentCluster(category, affectedService) {
    if (!category && !affectedService) {
        return { detected: false, count: 0 };
    }
    const { data, error } = await supabase_1.supabase.rpc('detect_incident_cluster', {
        p_category: category,
        p_affected_service: affectedService,
        p_window_minutes: ANOMALY_CONFIG.CLUSTER_TIME_WINDOW_MINUTES,
        p_threshold: ANOMALY_CONFIG.CLUSTER_THRESHOLD,
    });
    if (error || !data || data.length === 0) {
        console.error('[Anomaly] Cluster detection error:', error);
        return { detected: false, count: 0 };
    }
    const result = data[0];
    return { detected: result.cluster_detected, count: result.incident_count };
}
/**
 * Combined anomaly analysis
 * Returns the most severe anomaly type detected.
 */
async function analyzeAnomaly(ragResult, category, affectedService) {
    // Check cluster first (more actionable)
    const cluster = await detectIncidentCluster(category, affectedService);
    if (cluster.detected) {
        return {
            is_anomaly: true,
            anomaly_type: 'incident_cluster',
            anomaly_reason: `🚨 ${cluster.count} similar incidents reported in the last ${ANOMALY_CONFIG.CLUSTER_TIME_WINDOW_MINUTES} minutes affecting ${category ?? affectedService}. This may indicate a systemic issue.`,
        };
    }
    // Check novel incident
    if (detectNovelIncident(ragResult)) {
        return {
            is_anomaly: true,
            anomaly_type: 'novel_incident',
            anomaly_reason: `No strong historical match found (max similarity: ${(ragResult.evidenceStrength.max_similarity * 100).toFixed(1)}%). This appears to be a novel incident type requiring manual investigation.`,
        };
    }
    return {
        is_anomaly: false,
        anomaly_type: null,
        anomaly_reason: null,
    };
}
//# sourceMappingURL=anomalyDetector.js.map