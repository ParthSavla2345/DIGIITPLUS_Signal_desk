/**
 * SignalDesk — Multi-Signal Anomaly & Incident Cluster Detector
 *
 * Combines multiple independent signals into a normalized cluster score (0-100):
 * - Service match (30%)
 * - Category match (20%)
 * - Frequency spike in time window (30%)
 * - Semantic / keyword overlap (20%)
 *
 * Also detects Novel Incidents when historical precedent is missing.
 */

import { supabase } from '../../config/supabase';
import type { RagResult } from '../../types';

export interface ClusterInfo {
  cluster_detected: boolean;
  cluster_score: number; // 0-100 normalized
  incident_count: number;
  time_window_minutes: number;
  affected_service: string | null;
  category: string | null;
  shared_root_cause_hypothesis: string;
  related_incident_ids: string[];
}

export interface AnomalyResult {
  is_anomaly: boolean;
  anomaly_type: 'novel_incident' | 'incident_cluster' | null;
  anomaly_reason: string | null;
  cluster_info?: ClusterInfo;
}

const ANOMALY_CONFIG = {
  NOVEL_INCIDENT_MAX_SIMILARITY: 0.50, // Below 50% max similarity = novel
  NOVEL_INCIDENT_MAX_SCORE: 35,        // Below 35 evidence score = novel
  CLUSTER_TIME_WINDOW_MINUTES: 60,
  CLUSTER_THRESHOLD_COUNT: 2,          // >= 2 recent related incidents triggers cluster analysis
  CLUSTER_ALERT_SCORE: 65,             // >= 65/100 triggers anomaly alert
};

/**
 * Type A: Novel Incident Detection
 */
export function detectNovelIncident(ragResult: RagResult): { isNovel: boolean; reason: string } {
  const isNovel =
    ragResult.evidenceStrength.max_similarity < ANOMALY_CONFIG.NOVEL_INCIDENT_MAX_SIMILARITY ||
    ragResult.evidenceStrength.score < ANOMALY_CONFIG.NOVEL_INCIDENT_MAX_SCORE;

  return {
    isNovel,
    reason: isNovel
      ? `🆕 NOVEL INCIDENT: No strong historical precedent found (max similarity: ${(ragResult.evidenceStrength.max_similarity * 100).toFixed(1)}%, evidence score: ${ragResult.evidenceStrength.score}/100). SignalDesk does not have enough historical evidence to confidently recommend an automated resolution. Manual investigation required.`
      : '',
  };
}

/**
 * Type B: Multi-Signal Incident Cluster Detection
 */
export async function detectIncidentClusterMultiSignal(
  currentIncidentId: string,
  title: string,
  category: string | null,
  affectedService: string | null,
): Promise<ClusterInfo> {
  const windowTime = new Date(Date.now() - ANOMALY_CONFIG.CLUSTER_TIME_WINDOW_MINUTES * 60 * 1000).toISOString();

  // Query recent open/in-progress incidents in same window
  let query = supabase
    .from('incidents')
    .select('id, title, category, affected_service, created_at')
    .gte('created_at', windowTime)
    .neq('status', 'closed');

  if (currentIncidentId) {
    query = query.neq('id', currentIncidentId);
  }

  const { data: recentIncidents, error } = await query;

  if (error || !recentIncidents || recentIncidents.length === 0) {
    return {
      cluster_detected: false,
      cluster_score: 0,
      incident_count: 1,
      time_window_minutes: ANOMALY_CONFIG.CLUSTER_TIME_WINDOW_MINUTES,
      affected_service: affectedService,
      category,
      shared_root_cause_hypothesis: '',
      related_incident_ids: [],
    };
  }

  // Calculate multi-signal scores
  let serviceMatches = 0;
  let categoryMatches = 0;
  let keywordMatches = 0;
  const relatedIds: string[] = [];

  const currentKeywords = title
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .split(' ')
    .filter((w) => w.length > 3);

  for (const inc of recentIncidents) {
    let isRelated = false;

    if (affectedService && inc.affected_service && inc.affected_service.toLowerCase() === affectedService.toLowerCase()) {
      serviceMatches++;
      isRelated = true;
    }
    if (category && inc.category && inc.category.toLowerCase() === category.toLowerCase()) {
      categoryMatches++;
      isRelated = true;
    }

    const incKeywords = inc.title
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, '')
      .split(' ')
      .filter((w: string) => w.length > 3);

    const overlap = currentKeywords.filter((k) => incKeywords.includes(k));
    if (overlap.length >= 1) {
      keywordMatches++;
      isRelated = true;
    }

    if (isRelated) {
      relatedIds.push(inc.id);
    }
  }

  const totalRecent = recentIncidents.length;
  const serviceScore = Math.min(1, serviceMatches / Math.max(1, totalRecent)) * 35;
  const categoryScore = Math.min(1, categoryMatches / Math.max(1, totalRecent)) * 25;
  const frequencyScore = Math.min(1, relatedIds.length / ANOMALY_CONFIG.CLUSTER_THRESHOLD_COUNT) * 25;
  const keywordScore = Math.min(1, keywordMatches / Math.max(1, totalRecent)) * 15;

  const normalizedScore = Math.round(serviceScore + categoryScore + frequencyScore + keywordScore);
  const clusterDetected = relatedIds.length >= ANOMALY_CONFIG.CLUSTER_THRESHOLD_COUNT && normalizedScore >= ANOMALY_CONFIG.CLUSTER_ALERT_SCORE;

  let rootCauseHypothesis = '';
  if (clusterDetected) {
    rootCauseHypothesis = `Systemic incident cluster affecting ${affectedService ?? category ?? 'shared infrastructure'}. ${relatedIds.length + 1} related incidents detected within the last ${ANOMALY_CONFIG.CLUSTER_TIME_WINDOW_MINUTES} minutes, suggesting a cascading failure or shared dependency issue.`;
  }

  return {
    cluster_detected: clusterDetected,
    cluster_score: normalizedScore,
    incident_count: relatedIds.length + 1,
    time_window_minutes: ANOMALY_CONFIG.CLUSTER_TIME_WINDOW_MINUTES,
    affected_service: affectedService,
    category,
    shared_root_cause_hypothesis: rootCauseHypothesis,
    related_incident_ids: relatedIds,
  };
}

/**
 * Combined anomaly analysis
 */
export async function analyzeAnomaly(
  incidentId: string,
  title: string,
  ragResult: RagResult,
  category: string | null,
  affectedService: string | null,
): Promise<AnomalyResult> {
  // Check cluster first (systemic risk)
  const cluster = await detectIncidentClusterMultiSignal(
    incidentId,
    title,
    category,
    affectedService,
  );

  if (cluster.cluster_detected) {
    return {
      is_anomaly: true,
      anomaly_type: 'incident_cluster',
      anomaly_reason: `🚨 POTENTIAL INCIDENT CLUSTER: ${cluster.incident_count} related incidents detected within ${cluster.time_window_minutes} minutes affecting "${affectedService ?? category}". Cluster score: ${cluster.cluster_score}/100. Potential shared root cause: ${cluster.shared_root_cause_hypothesis}`,
      cluster_info: cluster,
    };
  }

  // Check novel incident
  const novel = detectNovelIncident(ragResult);
  if (novel.isNovel) {
    return {
      is_anomaly: true,
      anomaly_type: 'novel_incident',
      anomaly_reason: novel.reason,
    };
  }

  return {
    is_anomaly: false,
    anomaly_type: null,
    anomaly_reason: null,
  };
}
