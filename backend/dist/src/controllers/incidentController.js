"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createIncidentHandler = createIncidentHandler;
exports.listIncidentsHandler = listIncidentsHandler;
exports.getIncidentHandler = getIncidentHandler;
exports.updateIncidentHandler = updateIncidentHandler;
exports.analyzeIncidentHandler = analyzeIncidentHandler;
exports.addCommentHandler = addCommentHandler;
exports.escalateIncidentHandler = escalateIncidentHandler;
exports.resolveIncidentHandler = resolveIncidentHandler;
exports.getActivityHandler = getActivityHandler;
const incidentRepository_1 = require("../repositories/incidentRepository");
const incidentTriage_1 = require("../services/ai/incidentTriage");
const incidentAnalysis_1 = require("../services/ai/incidentAnalysis");
const embeddings_1 = require("../services/ai/embeddings");
const ragPipeline_1 = require("../services/rag/ragPipeline");
const anomalyDetector_1 = require("../services/anomaly/anomalyDetector");
const errorHandler_1 = require("../middleware/errorHandler");
const incidents_1 = require("../schemas/incidents");
// ============================================================
// AI Analysis Pipeline (runs async after incident creation)
// ============================================================
async function runAnalysisPipeline(incidentId) {
    let incident = await (0, incidentRepository_1.getIncidentById)(incidentId);
    if (!incident)
        return;
    try {
        // Step 1: AI Triage
        console.log(`[Analysis] Starting triage for incident ${incidentId}`);
        await (0, incidentRepository_1.setAnalysisStatus)(incidentId, 'processing');
        const triage = await (0, incidentTriage_1.triageIncident)(incident.title, incident.description);
        incident = await (0, incidentRepository_1.updateIncidentWithTriage)(incidentId, triage);
        await (0, incidentRepository_1.addActivity)(incidentId, '🤖 AI triage completed', {
            category: triage.category,
            priority: triage.priority,
            severity: triage.severity,
            assigned_team: triage.assigned_team,
            confidence: triage.confidence,
        });
        // Step 2: Generate embedding + RAG
        console.log(`[Analysis] Running RAG pipeline for incident ${incidentId}`);
        const embedding = await (0, embeddings_1.generateEmbedding)(`${incident.title}\n\n${incident.description}`, 'RETRIEVAL_QUERY');
        const ragResult = await (0, ragPipeline_1.runRagPipeline)(incident.title, incident.description, incident.category, incident.affected_service);
        await (0, incidentRepository_1.addActivity)(incidentId, '🔎 Similar incidents retrieved', {
            count: ragResult.similarIncidents.length,
            evidence_strength: ragResult.evidenceStrength.score,
        });
        await (0, incidentRepository_1.addActivity)(incidentId, '📚 Knowledge articles retrieved', {
            count: ragResult.knowledgeArticles.length,
        });
        // Step 3: AI Investigation
        console.log(`[Analysis] Running investigation for incident ${incidentId}`);
        const analysis = await (0, incidentAnalysis_1.analyzeIncident)(incident, ragResult);
        // Step 4: Anomaly detection (backend-computed, not Gemini)
        const anomaly = await (0, anomalyDetector_1.analyzeAnomaly)(ragResult, incident.category, incident.affected_service);
        // Step 5: Store everything
        await (0, incidentRepository_1.updateIncidentWithAnalysis)(incidentId, analysis, ragResult.evidenceStrength.score, anomaly, embedding);
        await (0, incidentRepository_1.addActivity)(incidentId, '🤖 AI investigation completed', {
            confidence: analysis.confidence,
            evidence_strength: ragResult.evidenceStrength.score,
            evidence_label: ragResult.evidenceStrength.label,
            probable_causes: analysis.probable_causes.length,
        });
        if (anomaly.is_anomaly) {
            await (0, incidentRepository_1.addActivity)(incidentId, '🚨 Anomaly detected', {
                anomaly_type: anomaly.anomaly_type,
                reason: anomaly.anomaly_reason,
            });
        }
        if (analysis.escalation.should_escalate) {
            await (0, incidentRepository_1.addActivity)(incidentId, '🚨 Escalation recommended by AI', {
                target_team: analysis.escalation.target_team,
                reason: analysis.escalation.reason,
            });
        }
        console.log(`[Analysis] Completed for incident ${incidentId}`);
    }
    catch (err) {
        console.error(`[Analysis] Failed for incident ${incidentId}:`, err);
        await (0, incidentRepository_1.setAnalysisStatus)(incidentId, 'failed');
        await (0, incidentRepository_1.addActivity)(incidentId, '⚠️ AI analysis failed', {
            error: err instanceof Error ? err.message : 'Unknown error',
        });
    }
}
// ============================================================
// POST /api/incidents
// ============================================================
async function createIncidentHandler(req, res) {
    const input = incidents_1.createIncidentSchema.parse(req.body);
    // Step 1: Persist incident IMMEDIATELY (before AI)
    const incident = await (0, incidentRepository_1.createIncident)(input);
    // Step 2: Record creation in timeline
    await (0, incidentRepository_1.addActivity)(incident.id, '🎫 Incident created', {
        title: incident.title,
    });
    // Step 3: Return the incident right away
    res.status(201).json({
        incident,
        message: 'Incident created. AI analysis is starting...',
    });
    // Step 4: Run AI analysis in background (don't await)
    runAnalysisPipeline(incident.id).catch((err) => {
        console.error('[Background Analysis] Uncaught error:', err);
    });
}
// ============================================================
// GET /api/incidents
// ============================================================
async function listIncidentsHandler(req, res) {
    const filters = incidents_1.listIncidentsQuerySchema.parse(req.query);
    const result = await (0, incidentRepository_1.listIncidents)(filters);
    res.json({
        incidents: result.incidents,
        total: result.total,
        limit: filters.limit,
        offset: filters.offset,
    });
}
// ============================================================
// GET /api/incidents/:id
// ============================================================
async function getIncidentHandler(req, res) {
    const id = req.params['id'];
    const incident = await (0, incidentRepository_1.getIncidentById)(id);
    if (!incident) {
        throw new errorHandler_1.AppError(404, `Incident ${id} not found`);
    }
    const activity = await (0, incidentRepository_1.getIncidentActivity)(id);
    res.json({ incident, activity });
}
// ============================================================
// PATCH /api/incidents/:id
// ============================================================
async function updateIncidentHandler(req, res) {
    const id = req.params['id'];
    const updates = incidents_1.updateIncidentSchema.parse(req.body);
    const incident = await (0, incidentRepository_1.getIncidentById)(id);
    if (!incident)
        throw new errorHandler_1.AppError(404, `Incident ${id} not found`);
    const updated = await (0, incidentRepository_1.updateIncident)(id, updates);
    await (0, incidentRepository_1.addActivity)(id, '🔄 Incident updated', { changes: updates });
    res.json({ incident: updated });
}
// ============================================================
// POST /api/incidents/:id/analyze
// ============================================================
async function analyzeIncidentHandler(req, res) {
    const id = req.params['id'];
    const incident = await (0, incidentRepository_1.getIncidentById)(id);
    if (!incident)
        throw new errorHandler_1.AppError(404, `Incident ${id} not found`);
    // Set to pending so UI shows loading
    await (0, incidentRepository_1.setAnalysisStatus)(id, 'pending');
    await (0, incidentRepository_1.addActivity)(id, '🔄 Re-analysis requested', {
        trigger: req.body.trigger ?? 'manual',
    });
    res.json({ message: 'Re-analysis started', incident_id: id });
    // Run analysis in background
    runAnalysisPipeline(id).catch((err) => {
        console.error('[Re-analysis] Error:', err);
    });
}
// ============================================================
// POST /api/incidents/:id/comments
// ============================================================
async function addCommentHandler(req, res) {
    const id = req.params['id'];
    const input = incidents_1.addCommentSchema.parse(req.body);
    const incident = await (0, incidentRepository_1.getIncidentById)(id);
    if (!incident)
        throw new errorHandler_1.AppError(404, `Incident ${id} not found`);
    const activity = await (0, incidentRepository_1.addActivity)(id, '👨‍💻 Engineer comment added', {
        comment: input.comment,
        engineer: input.engineer ?? 'Engineer',
    });
    res.status(201).json({ activity });
}
// ============================================================
// POST /api/incidents/:id/escalate
// ============================================================
async function escalateIncidentHandler(req, res) {
    const id = req.params['id'];
    const input = incidents_1.escalateSchema.parse(req.body);
    const incident = await (0, incidentRepository_1.getIncidentById)(id);
    if (!incident)
        throw new errorHandler_1.AppError(404, `Incident ${id} not found`);
    const updated = await (0, incidentRepository_1.updateIncident)(id, {
        status: 'in_progress',
        assigned_team: input.target_team,
    });
    await (0, incidentRepository_1.addActivity)(id, '🚨 Incident escalated', {
        target_team: input.target_team,
        reason: input.reason,
        engineer: input.engineer ?? 'Engineer',
    });
    res.json({ incident: updated });
}
// ============================================================
// POST /api/incidents/:id/resolve
// ============================================================
async function resolveIncidentHandler(req, res) {
    const id = req.params['id'];
    const input = incidents_1.resolveSchema.parse(req.body);
    const incident = await (0, incidentRepository_1.getIncidentById)(id);
    if (!incident)
        throw new errorHandler_1.AppError(404, `Incident ${id} not found`);
    const resolved = await (0, incidentRepository_1.resolveIncident)(id, input.resolution);
    await (0, incidentRepository_1.addActivity)(id, '✅ Incident resolved', {
        resolution: input.resolution,
        engineer: input.engineer ?? 'Engineer',
    });
    res.json({ incident: resolved });
}
// ============================================================
// GET /api/incidents/:id/activity
// ============================================================
async function getActivityHandler(req, res) {
    const id = req.params['id'];
    const incident = await (0, incidentRepository_1.getIncidentById)(id);
    if (!incident)
        throw new errorHandler_1.AppError(404, `Incident ${id} not found`);
    const activity = await (0, incidentRepository_1.getIncidentActivity)(id);
    res.json({ activity });
}
//# sourceMappingURL=incidentController.js.map