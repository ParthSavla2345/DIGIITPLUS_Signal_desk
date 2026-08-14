import type { AiAnalysis, EvidenceItem, RagResult } from '../../types';

// ============================================================
// PROMPT TEMPLATES
// ============================================================

export const PROMPT_VERSION = 'v1.0.0';

export function buildTriagePrompt(title: string, description: string): string {
  return `You are an expert IT incident triage specialist for SignalDesk.

Analyze the following support incident and return a structured JSON response ONLY.
Do not include any markdown, code fences, or explanatory text — just pure JSON.

INCIDENT TITLE: ${title}
INCIDENT DESCRIPTION: ${description}

Return this exact JSON structure:
{
  "summary": "Brief 1-2 sentence summary of the incident",
  "category": "One of: Network & VPN, Email & Communication, Security, Hardware & Endpoint, Software & Applications, Authentication & Access, Database, Cloud Infrastructure, Other",
  "priority": "One of: P1, P2, P3, P4 based on business impact (P1=critical/outage, P2=high/major, P3=medium/degraded, P4=low/minor)",
  "severity": "One of: critical, high, medium, low",
  "affected_service": "The specific service, application, or infrastructure component affected",
  "assigned_team": "The most appropriate team: Network Operations, Security Operations, IT Helpdesk, Infrastructure, DevOps, Database Team, Email Team, Hardware Support",
  "sentiment": "User sentiment: frustrated, neutral, urgent, panicked, calm",
  "confidence": 0.85
}`;
}

export function buildInvestigationPrompt(
  incident: { title: string; description: string; category: string | null; priority: string | null; affected_service: string | null },
  ragResult: RagResult,
): string {
  const { similarIncidents, knowledgeArticles, evidenceStrength } = ragResult;

  const resolvedIncidentsSection =
    similarIncidents.length > 0
      ? similarIncidents
          .map(
            (inc, i) => `
--- Resolved Incident ${i + 1} ---
Title: ${inc.title}
Description: ${inc.description}
Category: ${inc.category || 'Unknown'}
Priority: ${inc.priority || 'Unknown'}
Resolution: ${inc.resolution}
Similarity Score: ${(inc.similarity * 100).toFixed(1)}%`,
          )
          .join('\n')
      : 'No similar resolved incidents found.';

  const knowledgeSection =
    knowledgeArticles.length > 0
      ? knowledgeArticles
          .map(
            (art, i) => `
--- Knowledge Article ${i + 1} ---
Title: ${art.title}
Category: ${art.category}
Content: ${art.content}
Relevance Score: ${(art.similarity * 100).toFixed(1)}%`,
          )
          .join('\n')
      : 'No relevant knowledge articles found.';

  const evidenceContext = `
Evidence Summary:
- Evidence Strength Score: ${evidenceStrength.score}/100
- Evidence Level: ${evidenceStrength.label.toUpperCase()}
- Similar Resolved Incidents: ${evidenceStrength.resolved_incident_count}
- Relevant Knowledge Articles: ${evidenceStrength.knowledge_article_count}
- Maximum Similarity: ${(evidenceStrength.max_similarity * 100).toFixed(1)}%`;

  const hallucGuard =
    evidenceStrength.label === 'low'
      ? `
IMPORTANT HALLUCINATION GUARD:
Evidence is LOW. You MUST NOT invent or speculate on resolutions that are not supported by the evidence above.
If you cannot make an evidence-backed recommendation, explicitly state that evidence is insufficient and recommend human investigation.
Your confidence score must reflect this uncertainty and should be below 0.4.`
      : '';

  return `You are SignalDesk's AI investigation engine — an expert IT incident analyst.

Your job is to produce an evidence-grounded investigation based ONLY on the provided evidence.
Do not invent information not present in the evidence. If evidence is insufficient, say so explicitly.

${hallucGuard}

CURRENT INCIDENT:
Title: ${incident.title}
Description: ${incident.description}
Category: ${incident.category || 'Unknown'}
Priority: ${incident.priority || 'Unknown'}
Affected Service: ${incident.affected_service || 'Unknown'}

${evidenceContext}

SIMILAR RESOLVED INCIDENTS (from historical knowledge base):
${resolvedIncidentsSection}

RELEVANT KNOWLEDGE ARTICLES:
${knowledgeSection}

Based on this evidence, return ONLY a JSON object with this exact structure (no markdown, no code fences):
{
  "summary": "Brief evidence-grounded summary of the investigation",
  "probable_causes": [
    {
      "cause": "Specific probable cause based on evidence",
      "confidence": 0.80
    }
  ],
  "recommended_actions": [
    {
      "step": "Specific action step",
      "risk": "low",
      "requires_human_approval": false
    }
  ],
  "missing_information": ["What additional information would help investigation"],
  "evidence_used": [
    {
      "id": "source-id",
      "title": "Evidence title",
      "type": "resolved_incident",
      "similarity": 0.85,
      "resolution": "How it was resolved"
    }
  ],
  "escalation": {
    "should_escalate": false,
    "target_team": null,
    "reason": null
  },
  "confidence": 0.86
}

Rules:
- probable_causes: List 1-3 causes. If evidence is weak, list only what you can reasonably infer.
- recommended_actions: Only recommend actions backed by the evidence. If unsupported, say "Escalate to human engineer for investigation."
- missing_information: List what information would help resolve the incident.
- evidence_used: Reference only the evidence provided above (resolved incidents and knowledge articles).
- escalation: Set should_escalate to true if: P1 incident, confidence < 0.5, security incident, or multiple affected services.
- confidence: Reflect actual evidence quality. Low evidence = low confidence (< 0.4).`;
}

export function formatEvidenceForDisplay(analysis: AiAnalysis, ragResult: RagResult): AiAnalysis {
  // Enrich evidence_used with actual retrieval data
  const enrichedEvidence: EvidenceItem[] = [];

  ragResult.similarIncidents.forEach((inc) => {
    enrichedEvidence.push({
      id: inc.source_id,
      title: inc.title,
      type: 'resolved_incident',
      similarity: inc.similarity,
      resolution: inc.resolution,
    });
  });

  ragResult.knowledgeArticles.forEach((art) => {
    enrichedEvidence.push({
      id: art.id,
      title: art.title,
      type: 'knowledge_article',
      similarity: art.similarity,
      content: art.content.substring(0, 200) + '...',
    });
  });

  return {
    ...analysis,
    evidence_used: enrichedEvidence,
  };
}
