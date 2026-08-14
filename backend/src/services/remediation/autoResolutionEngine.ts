/**
 * SignalDesk — Auto-Resolution Decision Engine
 *
 * Implements strict decision gate:
 * AUTO-RESOLVE ONLY WHEN:
 * - AI confidence >= 0.80 (80%)
 * - Evidence strength >= 70 (or >= 80 for auto-execution)
 * - Supporting historical incident / KB article similarity >= 0.65
 * - Recommended action is in approved safe registry
 * - Remediation risk is LOW
 * - Hallucination guard is GROUNDED
 *
 * Otherwise: BLOCKS auto-resolution and recommends engineer escalation.
 */

import type { Incident, RagResult, AiAnalysis, RemediationPlan } from '../../types';
import { findMatchingSafeAction } from './remediationRegistry';
import { type HallucinationGuardResult } from '../ai/hallucinationGuard';

export interface AutoResolutionDecision {
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

export function evaluateAutoResolution(
  incident: Partial<Incident>,
  analysis: AiAnalysis,
  ragResult: RagResult,
  guardResult: HallucinationGuardResult,
): AutoResolutionDecision {
  const confidenceScore = analysis.confidence ?? incident.ai_confidence ?? 0;
  const evidenceScore = ragResult.evidenceStrength.score;
  const maxSimilarity = ragResult.evidenceStrength.max_similarity;

  const supportingReasons: string[] = [];
  const blockingReasons: string[] = [];

  // Check 1: AI Confidence
  if (confidenceScore >= 0.80) {
    supportingReasons.push(`High AI confidence score (${Math.round(confidenceScore * 100)}% >= 80% threshold)`);
  } else {
    blockingReasons.push(`AI confidence score (${Math.round(confidenceScore * 100)}%) is below the 80% safety threshold`);
  }

  // Check 2: Evidence Strength
  if (evidenceScore >= 70) {
    supportingReasons.push(`Strong retrieval grounding score (${evidenceScore}/100 >= 70 threshold)`);
  } else {
    blockingReasons.push(`Evidence strength score (${evidenceScore}/100) is insufficient for automated action`);
  }

  // Check 3: Supporting Historical Match
  if (maxSimilarity >= 0.65) {
    supportingReasons.push(`Strong historical precedent found (${Math.round(maxSimilarity * 100)}% max similarity)`);
  } else {
    blockingReasons.push(`No historical incident or KB article exceeds the 65% similarity threshold`);
  }

  // Check 4: Hallucination Guard
  if (guardResult.status === 'grounded') {
    supportingReasons.push('Hallucination guard verified: all AI claims strictly substantiated by evidence');
  } else {
    blockingReasons.push(`Hallucination guard status is '${guardResult.status.toUpperCase()}': ${guardResult.explanation}`);
  }

  // Check 5: Approved Runbook in Safe Registry
  const firstAction = analysis.recommended_actions?.[0]?.step ?? '';
  const matchedRunbook = findMatchingSafeAction(
    firstAction + ' ' + (incident.title ?? ''),
    incident.affected_service ?? null,
  );

  let plan: RemediationPlan | null = null;
  if (matchedRunbook) {
    plan = {
      action_id: matchedRunbook.action_id,
      name: matchedRunbook.name,
      description: matchedRunbook.description,
      risk: matchedRunbook.risk,
      verification_method: matchedRunbook.verification_method,
      is_safe_runbook: true,
    };
    if (matchedRunbook.risk === 'low') {
      supportingReasons.push(`Approved safe runbook available: "${matchedRunbook.name}" (Risk: LOW)`);
    } else {
      blockingReasons.push(`Runbook "${matchedRunbook.name}" has ${matchedRunbook.risk.toUpperCase()} risk — requires human approval`);
    }
  } else {
    blockingReasons.push('No safe automated runbook found in registry matching the proposed action');
  }

  const isEligible = blockingReasons.length === 0;

  let whySummary = '';
  if (isEligible && matchedRunbook) {
    whySummary = `Safe automated remediation is available. SignalDesk identified runbook "${matchedRunbook.name}" with ${Math.round(confidenceScore * 100)}% confidence backed by ${evidenceScore}/100 evidence strength and ${ragResult.similarIncidents.length} matching resolved incidents.`;
  } else {
    whySummary = `Automated remediation is blocked to guarantee system safety. Reason: ${blockingReasons[0] ?? 'Criteria not met'}. Engineer escalation is recommended.`;
  }

  return {
    is_eligible: isEligible,
    decision: isEligible ? 'APPROVED_SAFE_REMEDIATION' : 'BLOCKED_MANUAL_INVESTIGATION_REQUIRED',
    confidence_score: confidenceScore,
    evidence_score: evidenceScore,
    matched_runbook: plan,
    supporting_reasons: supportingReasons,
    blocking_reasons: blockingReasons,
    recommended_escalation_team: incident.assigned_team || 'Infrastructure / Tier-2',
    why_safe_summary: whySummary,
  };
}
