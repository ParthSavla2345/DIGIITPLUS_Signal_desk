import { Request, Response } from 'express';
import {
  createIncident,
  getIncidentById,
  listIncidents,
  updateIncident,
  updateIncidentWithTriage,
  updateIncidentWithAnalysis,
  setAnalysisStatus,
  resolveIncident,
  addActivity,
  getIncidentActivity,
} from '../repositories/incidentRepository';
import { triageIncident } from '../services/ai/incidentTriage';
import { analyzeIncident } from '../services/ai/incidentAnalysis';
import { generateEmbedding } from '../services/ai/embeddings';
import { runRagPipeline } from '../services/rag/ragPipeline';
import { analyzeAnomaly } from '../services/anomaly/anomalyDetector';
import {
  executeSafeRunbook,
  findMatchingSafeAction,
  SAFE_REMEDIATION_REGISTRY,
} from '../services/remediation/remediationRegistry';
import { AppError } from '../middleware/errorHandler';
import {
  createIncidentSchema,
  updateIncidentSchema,
  addCommentSchema,
  escalateSchema,
  resolveSchema,
  listIncidentsQuerySchema,
} from '../schemas/incidents';

// ============================================================
// AI Analysis Pipeline (runs async after incident creation)
// ============================================================

async function runAnalysisPipeline(incidentId: string): Promise<void> {
  let incident = await getIncidentById(incidentId);
  if (!incident) return;

  try {
    // Step 1: AI Triage
    console.log(`[Analysis] Starting triage for incident ${incidentId}`);
    await setAnalysisStatus(incidentId, 'processing');

    const triage = await triageIncident(incident.title, incident.description);
    incident = await updateIncidentWithTriage(incidentId, triage);

    await addActivity(incidentId, '🤖 AI triage completed', {
      category: triage.category,
      priority: triage.priority,
      severity: triage.severity,
      assigned_team: triage.assigned_team,
      confidence: triage.confidence,
    });

    // Step 2: Generate embedding + RAG
    console.log(`[Analysis] Running RAG pipeline for incident ${incidentId}`);
    const embedding = await generateEmbedding(
      `${incident.title}\n\n${incident.description}`,
      'RETRIEVAL_QUERY',
    );

    const ragResult = await runRagPipeline(
      incident.title,
      incident.description,
      incident.category,
      incident.affected_service,
    );

    await addActivity(incidentId, '🔎 Similar incidents retrieved', {
      count: ragResult.similarIncidents.length,
      evidence_strength: ragResult.evidenceStrength.score,
      max_similarity: Math.round(ragResult.evidenceStrength.max_similarity * 100) + '%',
    });

    await addActivity(incidentId, '📚 Knowledge articles retrieved', {
      count: ragResult.knowledgeArticles.length,
    });

    // Step 3: AI Investigation + Hallucination Guard + Auto-Resolution Gate
    console.log(`[Analysis] Running investigation for incident ${incidentId}`);
    const analysis = await analyzeIncident(incident, ragResult);

    // Step 4: Multi-Signal Anomaly & Cluster Detection
    const anomaly = await analyzeAnomaly(
      incidentId,
      incident.title,
      ragResult,
      incident.category,
      incident.affected_service,
    );

    if (anomaly.cluster_info) {
      analysis.cluster_info = anomaly.cluster_info;
    }

    // Step 5: Store everything
    await updateIncidentWithAnalysis(
      incidentId,
      analysis,
      ragResult.evidenceStrength.score,
      anomaly,
      embedding,
    );

    await addActivity(incidentId, '🤖 AI investigation completed', {
      confidence: analysis.confidence,
      evidence_strength: ragResult.evidenceStrength.score,
      evidence_label: ragResult.evidenceStrength.label,
      probable_causes: analysis.probable_causes.length,
      hallucination_guard_status: analysis.hallucination_guard?.status ?? 'grounded',
    });

    // Step 6: Log Hallucination Guard & Auto-Resolution Events
    if (analysis.hallucination_guard) {
      if (analysis.hallucination_guard.status === 'grounded') {
        await addActivity(incidentId, '🛡️ Grounded AI: Claims verified', {
          supported_claims: analysis.hallucination_guard.supported_claims_count,
          explanation: analysis.hallucination_guard.explanation,
        });
      } else if (analysis.hallucination_guard.status === 'partially_grounded') {
        await addActivity(incidentId, '⚠️ Hallucination Guard: Partially grounded', {
          unsupported_claims: analysis.hallucination_guard.unsupported_claims,
          explanation: analysis.hallucination_guard.explanation,
        });
      } else {
        await addActivity(incidentId, '🛑 Low Evidence: Manual investigation required', {
          explanation: analysis.hallucination_guard.explanation,
        });
      }
    }

    if (analysis.auto_resolution?.is_eligible && analysis.remediation_plan) {
      await addActivity(incidentId, '⚡ Safe AI remediation proposed', {
        action: analysis.remediation_plan.name,
        action_id: analysis.remediation_plan.action_id,
        risk: analysis.remediation_plan.risk,
        decision: 'APPROVED_SAFE_REMEDIATION',
      });
    }

    if (anomaly.is_anomaly) {
      if (anomaly.anomaly_type === 'incident_cluster') {
        await addActivity(incidentId, '🚨 Incident cluster detected', {
          anomaly_type: anomaly.anomaly_type,
          cluster_score: anomaly.cluster_info?.cluster_score,
          incident_count: anomaly.cluster_info?.incident_count,
          reason: anomaly.anomaly_reason,
        });
      } else {
        await addActivity(incidentId, '🆕 Novel incident detected', {
          anomaly_type: anomaly.anomaly_type,
          reason: anomaly.anomaly_reason,
        });
      }
    }

    if (analysis.escalation.should_escalate) {
      await addActivity(incidentId, '🚨 Escalation recommended by AI', {
        target_team: analysis.escalation.target_team,
        reason: analysis.escalation.reason,
      });
    }

    console.log(`[Analysis] Completed for incident ${incidentId}`);
  } catch (err) {
    console.error(`[Analysis] Failed for incident ${incidentId}:`, err);
    await setAnalysisStatus(incidentId, 'failed');
    await addActivity(incidentId, '⚠️ AI analysis failed', {
      error: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}

// ============================================================
// POST /api/incidents
// ============================================================

export async function createIncidentHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const input = createIncidentSchema.parse(req.body);

  // Step 1: Persist incident IMMEDIATELY (before AI)
  const incident = await createIncident(input);

  // Step 2: Record creation in timeline
  await addActivity(incident.id, '🎫 Incident created', {
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

export async function listIncidentsHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const filters = listIncidentsQuerySchema.parse(req.query);
  const result = await listIncidents(filters);

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

export async function getIncidentHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const id = req.params['id'] as string;
  const incident = await getIncidentById(id);

  if (!incident) {
    throw new AppError(404, `Incident ${id} not found`);
  }

  const activity = await getIncidentActivity(id);

  res.json({ incident, activity });
}

// ============================================================
// PATCH /api/incidents/:id
// ============================================================

export async function updateIncidentHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const id = req.params['id'] as string;
  const updates = updateIncidentSchema.parse(req.body);

  const incident = await getIncidentById(id);
  if (!incident) throw new AppError(404, `Incident ${id} not found`);

  const updated = await updateIncident(id, updates);

  await addActivity(id, '🔄 Incident updated', { changes: updates });

  res.json({ incident: updated });
}

// ============================================================
// POST /api/incidents/:id/remediate
// Controlled Safe Auto-Remediation Execution
// ============================================================

export async function executeRemediationHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const id = req.params['id'] as string;
  const incident = await getIncidentById(id);

  if (!incident) {
    throw new AppError(404, `Incident ${id} not found`);
  }

  if (incident.status === 'resolved' || incident.status === 'closed') {
    throw new AppError(400, 'Incident is already resolved');
  }

  // Determine target action
  let actionId = req.body.action_id;
  if (!actionId && incident.ai_analysis?.remediation_plan?.action_id) {
    actionId = incident.ai_analysis.remediation_plan.action_id;
  }

  if (!actionId) {
    // Fallback: match from recommended actions
    const matched = findMatchingSafeAction(
      incident.title + ' ' + (incident.ai_analysis?.summary ?? ''),
      incident.affected_service,
    );
    actionId = matched?.action_id;
  }

  if (!actionId || !SAFE_REMEDIATION_REGISTRY[actionId]) {
    throw new AppError(
      400,
      'No approved safe remediation runbook found for this incident.',
    );
  }

  const safeAction = SAFE_REMEDIATION_REGISTRY[actionId];

  // Timeline: Remediation Started
  await addActivity(id, `⚡ AI safe remediation started: ${safeAction.name}`, {
    action_id: safeAction.action_id,
    target: incident.affected_service ?? 'General Service',
    risk: safeAction.risk,
  });

  // Execute safe runbook
  const result = await executeSafeRunbook(
    safeAction.action_id,
    incident.affected_service ?? 'production-service',
  );

  // Timeline: Remediation Executed
  await addActivity(id, `🔧 Remediation executed: ${safeAction.name}`, {
    logs: result.execution_log,
    executed_at: result.executed_at,
  });

  // Verification step
  if (result.verification.passed) {
    // Timeline: Verification Passed
    await addActivity(id, `🔍 Verification passed (${result.verification.latency_ms}ms latency)`, {
      details: result.verification.details,
      method: result.verification.method,
    });

    // Auto-resolve incident
    const resolutionText = `Automatically resolved by SignalDesk AI Remediation Engine.\nRunbook: ${safeAction.name}\nVerification: ${result.verification.details}\nTimestamp: ${result.executed_at}`;
    const resolvedIncident = await resolveIncident(id, resolutionText);

    await addActivity(id, '✅ Incident automatically resolved', {
      resolved_by: 'SignalDesk AI Auto-Remediation Engine',
      action: safeAction.name,
    });

    res.json({
      success: true,
      incident: resolvedIncident,
      remediation: result,
      message: `Remediation "${safeAction.name}" executed and verified successfully. Incident marked as resolved.`,
    });
  } else {
    // Verification Failed → Escalate
    await addActivity(id, '🚨 Post-remediation verification failed — Escalating to engineer', {
      details: result.verification.details,
    });

    const updated = await updateIncident(id, {
      status: 'in_progress',
      assigned_team: incident.assigned_team || 'Tier-2 Infrastructure Ops',
    });

    res.status(500).json({
      success: false,
      incident: updated,
      remediation: result,
      message: 'Remediation completed but verification failed. Incident escalated to human engineer.',
    });
  }
}

// ============================================================
// POST /api/incidents/:id/analyze
// ============================================================

export async function analyzeIncidentHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const id = req.params['id'] as string;

  const incident = await getIncidentById(id);
  if (!incident) throw new AppError(404, `Incident ${id} not found`);

  // Set to pending so UI shows loading
  await setAnalysisStatus(id, 'pending');
  await addActivity(id, '🔄 Re-analysis requested', {
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

export async function addCommentHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const id = req.params['id'] as string;
  const input = addCommentSchema.parse(req.body);

  const incident = await getIncidentById(id);
  if (!incident) throw new AppError(404, `Incident ${id} not found`);

  const activity = await addActivity(id, '👨‍💻 Engineer comment added', {
    comment: input.comment,
    engineer: input.engineer ?? 'Engineer',
  });

  res.status(201).json({ activity });
}

// ============================================================
// POST /api/incidents/:id/escalate
// ============================================================

export async function escalateIncidentHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const id = req.params['id'] as string;
  const input = escalateSchema.parse(req.body);

  const incident = await getIncidentById(id);
  if (!incident) throw new AppError(404, `Incident ${id} not found`);

  const updated = await updateIncident(id, {
    status: 'in_progress',
    assigned_team: input.target_team,
  });

  await addActivity(id, '🚨 Incident escalated', {
    target_team: input.target_team,
    reason: input.reason,
    engineer: input.engineer ?? 'Engineer',
  });

  res.json({ incident: updated });
}

// ============================================================
// POST /api/incidents/:id/resolve
// ============================================================

export async function resolveIncidentHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const id = req.params['id'] as string;
  const input = resolveSchema.parse(req.body);

  const incident = await getIncidentById(id);
  if (!incident) throw new AppError(404, `Incident ${id} not found`);

  const resolved = await resolveIncident(id, input.resolution);

  await addActivity(id, '✅ Incident resolved', {
    resolution: input.resolution,
    engineer: input.engineer ?? 'Engineer',
  });

  res.json({ incident: resolved });
}

// ============================================================
// GET /api/incidents/:id/activity
// ============================================================

export async function getActivityHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const id = req.params['id'] as string;

  const incident = await getIncidentById(id);
  if (!incident) throw new AppError(404, `Incident ${id} not found`);

  const activity = await getIncidentActivity(id);
  res.json({ activity });
}
