"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createIncident = createIncident;
exports.getIncidentById = getIncidentById;
exports.listIncidents = listIncidents;
exports.updateIncident = updateIncident;
exports.updateIncidentWithTriage = updateIncidentWithTriage;
exports.updateIncidentWithAnalysis = updateIncidentWithAnalysis;
exports.setAnalysisStatus = setAnalysisStatus;
exports.resolveIncident = resolveIncident;
exports.addActivity = addActivity;
exports.getIncidentActivity = getIncidentActivity;
const supabase_1 = require("../config/supabase");
// ============================================================
// INCIDENT REPOSITORY
// ============================================================
async function createIncident(input) {
    const { data, error } = await supabase_1.supabase
        .from('incidents')
        .insert({
        title: input.title,
        description: input.description,
        status: 'open',
        analysis_status: 'pending',
    })
        .select('*')
        .single();
    if (error)
        throw new Error(`Failed to create incident: ${error.message}`);
    return data;
}
async function getIncidentById(id) {
    const { data, error } = await supabase_1.supabase
        .from('incidents')
        .select('*')
        .eq('id', id)
        .single();
    if (error) {
        if (error.code === 'PGRST116')
            return null; // Not found
        throw new Error(`Failed to fetch incident: ${error.message}`);
    }
    return data;
}
async function listIncidents(filters) {
    let query = supabase_1.supabase
        .from('incidents')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });
    if (filters.status)
        query = query.eq('status', filters.status);
    if (filters.priority)
        query = query.eq('priority', filters.priority);
    if (filters.category)
        query = query.ilike('category', `%${filters.category}%`);
    query = query.range(filters.offset ?? 0, (filters.offset ?? 0) + (filters.limit ?? 50) - 1);
    const { data, error, count } = await query;
    if (error)
        throw new Error(`Failed to list incidents: ${error.message}`);
    return {
        incidents: (data ?? []),
        total: count ?? 0,
    };
}
async function updateIncident(id, updates) {
    const { data, error } = await supabase_1.supabase
        .from('incidents')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select('*')
        .single();
    if (error)
        throw new Error(`Failed to update incident: ${error.message}`);
    return data;
}
async function updateIncidentWithTriage(id, triage) {
    const { data, error } = await supabase_1.supabase
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
    if (error)
        throw new Error(`Failed to update incident with triage: ${error.message}`);
    return data;
}
const MODELS_GENERATION = 'gemini-2.0-flash';
const PROMPT_VERSION = 'v1.0.0';
async function updateIncidentWithAnalysis(id, analysis, evidenceStrength, anomaly, embedding) {
    const { data, error } = await supabase_1.supabase
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
    if (error)
        throw new Error(`Failed to update incident with analysis: ${error.message}`);
    return data;
}
async function setAnalysisStatus(id, status) {
    const { error } = await supabase_1.supabase
        .from('incidents')
        .update({
        analysis_status: status,
        updated_at: new Date().toISOString(),
    })
        .eq('id', id);
    if (error)
        throw new Error(`Failed to set analysis status: ${error.message}`);
}
async function resolveIncident(id, resolution) {
    const { data, error } = await supabase_1.supabase
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
    if (error)
        throw new Error(`Failed to resolve incident: ${error.message}`);
    return data;
}
// ============================================================
// INCIDENT ACTIVITY REPOSITORY
// ============================================================
async function addActivity(incidentId, action, details = {}) {
    const { data, error } = await supabase_1.supabase
        .from('incident_activity')
        .insert({ incident_id: incidentId, action, details })
        .select('*')
        .single();
    if (error)
        throw new Error(`Failed to add activity: ${error.message}`);
    return data;
}
async function getIncidentActivity(incidentId) {
    const { data, error } = await supabase_1.supabase
        .from('incident_activity')
        .select('*')
        .eq('incident_id', incidentId)
        .order('created_at', { ascending: true });
    if (error)
        throw new Error(`Failed to fetch activity: ${error.message}`);
    return (data ?? []);
}
//# sourceMappingURL=incidentRepository.js.map