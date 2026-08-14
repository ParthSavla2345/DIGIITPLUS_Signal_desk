import { supabase } from '../config/supabase';
import type {
  Incident,
  CreateIncidentInput,
  UpdateIncidentInput,
  IncidentActivity,
  AiTriage,
  AiAnalysis,
  AnomalyType,
} from '../types';

// ============================================================
// INCIDENT REPOSITORY
// ============================================================

export async function createIncident(
  input: CreateIncidentInput,
): Promise<Incident> {
  const { data, error } = await supabase
    .from('incidents')
    .insert({
      title: input.title,
      description: input.description,
      status: 'open',
      analysis_status: 'pending',
    })
    .select('*')
    .single();

  if (error) throw new Error(`Failed to create incident: ${error.message}`);
  return data as Incident;
}

export async function getIncidentById(id: string): Promise<Incident | null> {
  const { data, error } = await supabase
    .from('incidents')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw new Error(`Failed to fetch incident: ${error.message}`);
  }

  return data as Incident;
}

export async function listIncidents(filters: {
  status?: string;
  priority?: string;
  category?: string;
  limit?: number;
  offset?: number;
}): Promise<{ incidents: Incident[]; total: number }> {
  let query = supabase
    .from('incidents')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (filters.status) query = query.eq('status', filters.status);
  if (filters.priority) query = query.eq('priority', filters.priority);
  if (filters.category) query = query.ilike('category', `%${filters.category}%`);

  query = query.range(
    filters.offset ?? 0,
    (filters.offset ?? 0) + (filters.limit ?? 50) - 1,
  );

  const { data, error, count } = await query;

  if (error) throw new Error(`Failed to list incidents: ${error.message}`);

  return {
    incidents: (data ?? []) as Incident[],
    total: count ?? 0,
  };
}

export async function updateIncident(
  id: string,
  updates: UpdateIncidentInput,
): Promise<Incident> {
  const { data, error } = await supabase
    .from('incidents')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw new Error(`Failed to update incident: ${error.message}`);
  return data as Incident;
}

export async function updateIncidentWithTriage(
  id: string,
  triage: AiTriage,
): Promise<Incident> {
  const { data, error } = await supabase
    .from('incidents')
    .update({
      category: triage.category,
      priority: triage.priority,
      severity: triage.severity,
      affected_service: triage.affected_service,
      assigned_team: triage.assigned_team,
      sentiment: triage.sentiment,
      ai_summary: triage.summary,
      ai_confidence: triage.confidence,
      analysis_status: 'processing',
      ai_model: MODELS_GENERATION,
      ai_prompt_version: PROMPT_VERSION,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw new Error(`Failed to update incident with triage: ${error.message}`);
  return data as Incident;
}

const MODELS_GENERATION = 'gemini-2.0-flash';
const PROMPT_VERSION = 'v1.0.0';

export async function updateIncidentWithAnalysis(
  id: string,
  analysis: AiAnalysis,
  evidenceStrength: number,
  anomaly: {
    is_anomaly: boolean;
    anomaly_type: AnomalyType;
    anomaly_reason: string | null;
  },
  embedding: number[],
): Promise<Incident> {
  const { data, error } = await supabase
    .from('incidents')
    .update({
      ai_analysis: analysis,
      ai_confidence: analysis.confidence,
      evidence_strength: evidenceStrength,
      is_anomaly: anomaly.is_anomaly,
      anomaly_type: anomaly.anomaly_type,
      anomaly_reason: anomaly.anomaly_reason,
      embedding: `[${embedding.join(',')}]`,
      analysis_status: 'completed',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw new Error(`Failed to update incident with analysis: ${error.message}`);
  return data as Incident;
}

export async function setAnalysisStatus(
  id: string,
  status: 'pending' | 'processing' | 'completed' | 'failed',
): Promise<void> {
  const { error } = await supabase
    .from('incidents')
    .update({
      analysis_status: status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) throw new Error(`Failed to set analysis status: ${error.message}`);
}

export async function resolveIncident(
  id: string,
  resolution: string,
): Promise<Incident> {
  const { data, error } = await supabase
    .from('incidents')
    .update({
      status: 'resolved',
      resolution,
      resolved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw new Error(`Failed to resolve incident: ${error.message}`);
  return data as Incident;
}

// ============================================================
// INCIDENT ACTIVITY REPOSITORY
// ============================================================

export async function addActivity(
  incidentId: string,
  action: string,
  details: Record<string, unknown> = {},
): Promise<IncidentActivity> {
  const { data, error } = await supabase
    .from('incident_activity')
    .insert({ incident_id: incidentId, action, details })
    .select('*')
    .single();

  if (error) throw new Error(`Failed to add activity: ${error.message}`);
  return data as IncidentActivity;
}

export async function getIncidentActivity(
  incidentId: string,
): Promise<IncidentActivity[]> {
  const { data, error } = await supabase
    .from('incident_activity')
    .select('*')
    .eq('incident_id', incidentId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(`Failed to fetch activity: ${error.message}`);
  return (data ?? []) as IncidentActivity[];
}
