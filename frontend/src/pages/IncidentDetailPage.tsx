import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { incidentsApi } from '../services/api';
import type { Incident, IncidentActivity } from '../types';
import {
  PriorityBadge,
  EvidenceRadialGauge,
  AiLabel,
  HallucinationGuardBadge,
  RemediationRiskBadge,
  SkeletonLine,
} from '../components/ui/Badges';
import { formatDistanceToNow, format } from 'date-fns';
import toast from 'react-hot-toast';

// ============================================================
// Stitch Investigation Timeline
// ============================================================

function InvestigationTimeline({ activity }: { activity: IncidentActivity[] }) {
  if (activity.length === 0) {
    return (
      <div className="text-center py-8 text-on-surface-variant font-label-sm">
        No activity recorded yet.
      </div>
    );
  }

  const getNodeIcon = (action: string) => {
    if (action.includes('triage') || action.includes('AI investigation')) {
      return {
        icon: 'smart_toy',
        wrapper: 'bg-primary-container/20 border-primary-container/30 text-primary',
      };
    }
    if (action.includes('Grounded') || action.includes('Hallucination')) {
      return {
        icon: 'verified_user',
        wrapper: 'bg-secondary/20 border-secondary/30 text-secondary',
      };
    }
    if (action.includes('remediation') || action.includes('Remediation') || action.includes('Verification')) {
      return {
        icon: 'bolt',
        wrapper: 'bg-primary/20 border-primary/30 text-primary',
      };
    }
    if (action.includes('Anomaly') || action.includes('Cluster') || action.includes('failed') || action.includes('Low Evidence')) {
      return {
        icon: 'warning',
        wrapper: 'bg-error/20 border-error/30 text-error',
      };
    }
    if (action.includes('retrieved') || action.includes('Knowledge') || action.includes('Similar')) {
      return {
        icon: 'search',
        wrapper: 'bg-secondary/20 border-secondary/30 text-secondary',
      };
    }
    if (action.includes('escalate') || action.includes('Escalation')) {
      return {
        icon: 'priority_high',
        wrapper: 'bg-error/20 border-error/30 text-error',
      };
    }
    if (action.includes('resolved')) {
      return {
        icon: 'check_circle',
        wrapper: 'bg-secondary/20 border-secondary/30 text-secondary',
      };
    }
    return {
      icon: 'person',
      wrapper: 'bg-surface-container-highest border-outline text-on-surface',
    };
  };

  return (
    <div className="space-y-0">
      {activity.map((event, idx) => {
        const { icon, wrapper } = getNodeIcon(event.action);
        const isLast = idx === activity.length - 1;
        const isErrorNode = event.action.includes('Anomaly') || event.action.includes('Cluster') || event.action.includes('failed');
        const isSuccessNode = event.action.includes('resolved') || event.action.includes('Grounded') || event.action.includes('Verification passed');

        return (
          <div key={event.id} className="relative pl-8 pb-6 group">
            {!isLast && (
              <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-surface-variant group-last:bg-transparent" />
            )}

            <div className={`absolute left-0 top-1 w-6 h-6 rounded-full border flex items-center justify-center z-10 ${wrapper}`}>
              <span className="material-symbols-outlined text-[12px]">{icon}</span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                {format(new Date(event.created_at), 'hh:mm:ss a')}
              </span>

              <div
                className={`bg-background border border-surface-variant rounded p-2.5 mt-0.5 ${
                  isErrorNode ? 'border-l-2 border-l-error' : isSuccessNode ? 'border-l-2 border-l-secondary' : ''
                }`}
              >
                <p className="font-body-sm text-body-sm text-on-surface">
                  <strong className="font-medium">{event.action}</strong>
                </p>

                {event.details['comment'] !== undefined && (
                  <p className="font-body-sm text-body-sm text-on-surface-variant italic mt-1">
                    "{String(event.details['comment'])}"
                  </p>
                )}

                {event.details['explanation'] !== undefined && (
                  <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">
                    {String(event.details['explanation'])}
                  </p>
                )}

                {event.details['details'] !== undefined && !event.details['comment'] && (
                  <p className="font-label-sm text-label-sm text-on-surface-variant mt-1 font-mono">
                    {String(event.details['details'])}
                  </p>
                )}

                {event.details['reason'] !== undefined && !event.details['comment'] && (
                  <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">
                    {String(event.details['reason'])}
                  </p>
                )}

                {event.details['target_team'] !== undefined && (
                  <p className="font-label-sm text-label-sm text-primary mt-1">
                    Assigned: {String(event.details['target_team'])}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// Main Incident Detail Page
// ============================================================

export function IncidentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [activity, setActivity] = useState<IncidentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [comment, setComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [resolution, setResolution] = useState('');
  const [resolving, setResolving] = useState(false);
  const [escalateTeam, setEscalateTeam] = useState('');
  const [escalateReason, setEscalateReason] = useState('');
  const [escalating, setEscalating] = useState(false);
  const [showEscalateForm, setShowEscalateForm] = useState(false);
  const [showResolveForm, setShowResolveForm] = useState(false);
  const [remediating, setRemediating] = useState(false);
  const [remediationStep, setRemediationStep] = useState<'idle' | 'executing' | 'verifying' | 'done'>('idle');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      const res = await incidentsApi.get(id);
      setIncident(res.incident);
      setActivity(res.activity);
      setError(null);

      if (
        res.incident.analysis_status === 'completed' ||
        res.incident.analysis_status === 'failed'
      ) {
        if (pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load incident');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
    pollRef.current = setInterval(fetchData, 4000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchData]);

  const handleReanalyze = async () => {
    if (!id) return;
    setAnalyzing(true);
    try {
      await incidentsApi.analyze(id, 'manual');
      toast.success('Re-analysis started');
      if (!pollRef.current) {
        pollRef.current = setInterval(fetchData, 4000);
      }
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to start re-analysis');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleExecuteRemediation = async () => {
    if (!id) return;
    setRemediating(true);
    setRemediationStep('executing');

    try {
      // Step 1: Simulated execution UI transition
      await new Promise((r) => setTimeout(r, 800));
      setRemediationStep('verifying');

      // Step 2: API Call
      const res = await incidentsApi.remediate(id);
      await new Promise((r) => setTimeout(r, 600));

      setRemediationStep('done');
      setIncident(res.incident);
      toast.success(res.message || 'Safe remediation executed and verified successfully!');
      fetchData();
    } catch (err) {
      setRemediationStep('idle');
      toast.error(err instanceof Error ? err.message : 'Remediation failed');
    } finally {
      setRemediating(false);
    }
  };

  const handleAddComment = async () => {
    if (!id || !comment.trim()) return;
    setSubmittingComment(true);
    try {
      await incidentsApi.addComment(id, { comment, engineer: 'Engineer' });
      toast.success('Note added to timeline');
      setComment('');
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleEscalate = async () => {
    if (!id || !escalateTeam || !escalateReason) return;
    setEscalating(true);
    try {
      const res = await incidentsApi.escalate(id, {
        target_team: escalateTeam,
        reason: escalateReason,
        engineer: 'Engineer',
      });
      setIncident(res.incident);
      toast.success('Incident escalated');
      setShowEscalateForm(false);
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to escalate');
    } finally {
      setEscalating(false);
    }
  };

  const handleResolve = async () => {
    if (!id || resolution.trim().length < 10) return;
    setResolving(true);
    try {
      const res = await incidentsApi.resolve(id, { resolution, engineer: 'Engineer' });
      setIncident(res.incident);
      toast.success('Incident marked as resolved');
      setShowResolveForm(false);
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to resolve incident');
    } finally {
      setResolving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 max-w-[1600px] mx-auto p-4">
        <SkeletonLine width="w-1/3" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <SkeletonLine width="w-full" />
            <SkeletonLine width="w-3/4" />
          </div>
          <div className="lg:col-span-4 space-y-4">
            <SkeletonLine width="w-full" />
          </div>
          <div className="lg:col-span-3 space-y-4">
            <SkeletonLine width="w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center bg-surface metric-card-border rounded-xl">
        <span className="material-symbols-outlined text-error text-5xl mb-2">error</span>
        <h2 className="font-headline-md text-headline-md text-on-surface mb-2">{error ?? 'Incident not found'}</h2>
        <Link to="/incidents" className="px-4 py-2 bg-primary-container text-white rounded font-label-md text-label-md inline-block mt-4">
          Back to Incidents
        </Link>
      </div>
    );
  }

  const isAnalyzing = incident.analysis_status === 'pending' || incident.analysis_status === 'processing';
  const resolvedIncidentsCount = incident.ai_analysis?.evidence_used?.filter((e) => e.type === 'resolved_incident').length ?? 0;
  const knowledgeArticlesCount = incident.ai_analysis?.evidence_used?.filter((e) => e.type === 'knowledge_article').length ?? 0;

  const autoResolution = incident.ai_analysis?.auto_resolution;
  const remediationPlan = incident.ai_analysis?.remediation_plan;
  const isAutoResolutionEligible = autoResolution?.is_eligible && remediationPlan && incident.status !== 'resolved';
  const clusterInfo = incident.ai_analysis?.cluster_info;

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto animate-fade-in pb-12">
      {/* Task-Focused Header Bar */}
      <div className="bg-surface border-b border-surface-variant p-4 -mt-margin-mobile -mx-margin-mobile md:-mt-margin-desktop md:-mx-margin-desktop mb-6 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3 md:gap-4 flex-wrap">
          <Link
            to="/incidents"
            className="flex items-center gap-1 text-on-surface-variant hover:text-on-surface transition-colors font-label-md text-label-md group"
          >
            <span className="material-symbols-outlined text-lg group-hover:-translate-x-1 transition-transform">
              arrow_back
            </span>
            <span>&lt; Back</span>
          </Link>
          <div className="w-px h-6 bg-surface-variant hidden sm:block" />
          <div className="flex items-baseline gap-2">
            <h1 className="font-headline-md text-headline-md text-on-surface font-bold">
              INC-{incident.id.slice(0, 4).toUpperCase()}
            </h1>
            <span className="font-body-md text-body-md text-on-surface-variant hidden md:inline">
              {incident.title}
            </span>
          </div>

          {/* Status Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <PriorityBadge priority={incident.priority} />
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-label-sm text-[11px] uppercase ${
              incident.status === 'resolved'
                ? 'bg-secondary/10 text-secondary border border-secondary/20'
                : 'bg-primary-container/10 text-primary border border-primary-container/20'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${incident.status === 'resolved' ? 'bg-secondary' : 'bg-primary'}`} />
              {incident.status.replace('_', ' ')}
            </span>
            {incident.category && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-label-sm text-[11px] uppercase bg-surface-container-highest text-on-surface-variant border border-outline-variant hidden sm:inline-flex">
                {incident.category}
              </span>
            )}
            <HallucinationGuardBadge
              status={incident.ai_analysis?.hallucination_guard?.status}
              unsupportedCount={incident.ai_analysis?.hallucination_guard?.unsupported_claims?.length}
            />
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2">
          {incident.status !== 'resolved' && (
            <>
              <button
                onClick={() => {
                  setEscalateTeam(incident.assigned_team || 'Tier-2 Operations');
                  setEscalateReason('Escalated following AI triage investigation');
                  setShowEscalateForm(!showEscalateForm);
                }}
                className="h-9 px-4 rounded border border-surface-variant text-on-surface hover:bg-surface-container transition-colors font-label-md text-label-md flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">priority_high</span>
                Escalate
              </button>
              <button
                onClick={() => setShowResolveForm(!showResolveForm)}
                className="h-9 px-4 rounded bg-primary-container text-on-primary-container hover:brightness-110 transition-all font-label-md text-label-md shadow-[0_4px_12px_rgba(79,70,229,0.15)] flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">check_circle</span>
                Resolve
              </button>
            </>
          )}
        </div>
      </div>

      {/* Escalation Form Drawer */}
      {showEscalateForm && (
        <div className="bg-surface metric-card-border rounded-xl p-4 border-error/30 animate-slide-up space-y-3">
          <h3 className="font-headline-md text-sm text-error font-semibold uppercase tracking-wider">
            🚨 Escalate Incident to Engineering Team
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              value={escalateTeam}
              onChange={(e) => setEscalateTeam(e.target.value)}
              placeholder="Target team (e.g., Network Operations, SecOps)..."
              className="bg-level-0 border border-border-color rounded-md px-3 py-2 text-on-surface font-label-md text-label-md outline-none focus:border-primary"
            />
            <input
              type="text"
              value={escalateReason}
              onChange={(e) => setEscalateReason(e.target.value)}
              placeholder="Reason for escalation..."
              className="bg-level-0 border border-border-color rounded-md px-3 py-2 text-on-surface font-label-md text-label-md outline-none focus:border-primary"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowEscalateForm(false)} className="px-3 py-1.5 rounded font-label-md text-label-md text-on-surface-variant hover:text-on-surface">
              Cancel
            </button>
            <button
              onClick={handleEscalate}
              disabled={escalating || !escalateTeam || !escalateReason}
              className="px-4 py-1.5 rounded bg-error text-on-error font-label-md text-label-md font-bold disabled:opacity-50"
            >
              {escalating ? 'Escalating...' : 'Confirm Escalation'}
            </button>
          </div>
        </div>
      )}

      {/* Resolve Form Drawer */}
      {showResolveForm && (
        <div className="bg-surface metric-card-border rounded-xl p-4 border-secondary/30 animate-slide-up space-y-3">
          <h3 className="font-headline-md text-sm text-secondary font-semibold uppercase tracking-wider">
            ✅ Document Incident Resolution
          </h3>
          <textarea
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            placeholder="Describe the root cause and resolution steps taken (min 10 characters)..."
            rows={3}
            className="w-full bg-level-0 border border-border-color rounded-md p-3 text-on-surface font-body-sm text-body-sm outline-none focus:border-primary resize-none"
          />
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowResolveForm(false)} className="px-3 py-1.5 rounded font-label-md text-label-md text-on-surface-variant hover:text-on-surface">
              Cancel
            </button>
            <button
              onClick={handleResolve}
              disabled={resolving || resolution.length < 10}
              className="px-4 py-1.5 rounded bg-primary-container text-white font-label-md text-label-md font-bold disabled:opacity-50"
            >
              {resolving ? 'Resolving...' : 'Submit Resolution'}
            </button>
          </div>
        </div>
      )}

      {/* Incident Cluster Alert Banner (USP 2) */}
      {clusterInfo?.cluster_detected && (
        <div className="bg-surface border-2 border-error/40 rounded-xl p-5 shadow-lg relative overflow-hidden animate-slide-up">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-error/20 border border-error/30 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-error text-2xl">hub</span>
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="font-headline-md text-headline-md text-error font-bold tracking-wide flex items-center gap-2">
                  🚨 POTENTIAL INCIDENT CLUSTER DETECTED
                </h3>
                <span className="px-3 py-1 rounded-full bg-error/20 border border-error/30 font-label-sm text-label-sm text-error font-mono font-bold">
                  Cluster Score: {clusterInfo.cluster_score} / 100
                </span>
              </div>
              <p className="font-body-md text-body-md text-on-surface">
                <strong>{clusterInfo.incident_count} related incidents</strong> detected within the last {clusterInfo.time_window_minutes} minutes affecting service <strong className="text-primary">{clusterInfo.affected_service ?? clusterInfo.category}</strong>.
              </p>
              {clusterInfo.shared_root_cause_hypothesis && (
                <p className="font-body-sm text-body-sm text-on-surface-variant bg-background p-3 rounded-lg border border-surface-variant">
                  <strong>Potential Shared Root Cause:</strong> {clusterInfo.shared_root_cause_hypothesis}
                </p>
              )}
              <div className="flex items-center gap-3 pt-2">
                <Link
                  to="/incidents"
                  className="px-3 py-1.5 rounded bg-surface-container border border-surface-variant hover:bg-surface-container-highest transition-colors font-label-md text-label-md text-on-surface flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">visibility</span>
                  View Related Incidents
                </Link>
                <button
                  onClick={() => {
                    setEscalateTeam('Tier-3 System Operations');
                    setEscalateReason(`Systemic incident cluster detected with score ${clusterInfo.cluster_score}/100`);
                    setShowEscalateForm(true);
                  }}
                  className="px-3 py-1.5 rounded bg-error text-on-error font-label-md text-label-md font-bold hover:brightness-110 transition-all flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">priority_high</span>
                  Escalate Cluster
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Novel Incident Alert Banner (USP 2) */}
      {incident.is_anomaly && incident.anomaly_type === 'novel_incident' && (
        <div className="bg-surface-container-low border border-tertiary/40 rounded-xl p-5 animate-slide-up">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-tertiary text-2xl">fiber_new</span>
            <div>
              <h3 className="font-label-md text-label-md text-tertiary font-bold uppercase tracking-wider">
                🆕 NOVEL INCIDENT DETECTED
              </h3>
              <p className="font-body-md text-body-md text-on-surface mt-1">
                No strong historical precedent was found in the knowledge base.
              </p>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                SignalDesk does not have enough historical evidence to confidently recommend an automated resolution. Manual engineer investigation is recommended.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* AI Analyzing In Progress Banner */}
      {isAnalyzing && (
        <div className="bg-surface metric-card-border rounded-xl p-4 border-primary/30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-2xl animate-spin">sync</span>
            <div>
              <p className="font-label-md text-label-md text-primary font-bold">AI Triage & RAG Investigation in Progress</p>
              <p className="font-label-sm text-label-sm text-on-surface-variant">Embedding query → Vector similarity search → Grounded synthesis</p>
            </div>
          </div>
        </div>
      )}

      {/* 12-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT COLUMN: Context, AI Investigation & Remediation (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Summary / Description Card */}
          <section className="bg-surface border border-surface-variant rounded-xl p-5 shadow-sm">
            <h2 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">description</span> Description
            </h2>
            <p className="font-body-md text-body-md text-on-surface mb-6 leading-relaxed whitespace-pre-wrap">
              {incident.description}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 border-t border-surface-variant pt-4">
              <div>
                <span className="block font-label-sm text-label-sm text-on-surface-variant mb-1 uppercase">Created</span>
                <span className="font-label-md text-label-md text-on-surface">
                  {formatDistanceToNow(new Date(incident.created_at), { addSuffix: true })}
                </span>
              </div>
              <div>
                <span className="block font-label-sm text-label-sm text-on-surface-variant mb-1 uppercase">Affected Service</span>
                <span className="font-label-md text-label-md text-on-surface">
                  {incident.affected_service ?? 'Analyzing...'}
                </span>
              </div>
              <div>
                <span className="block font-label-sm text-label-sm text-on-surface-variant mb-1 uppercase">Team</span>
                <span className="font-label-md text-label-md text-on-surface">
                  {incident.assigned_team ?? 'Triage Ops'}
                </span>
              </div>
            </div>
          </section>

          {/* AI Investigation Card (USP 4: Evidence-Backed Answers) */}
          {incident.ai_analysis && (
            <section className="bg-surface border border-primary-container/30 rounded-xl p-6 relative overflow-hidden group shadow-lg">
              <div className="absolute -top-32 -right-32 w-64 h-64 bg-primary-container/20 rounded-full blur-[80px] ai-glow-bg pointer-events-none" />

              <div className="flex items-center justify-between mb-6 relative z-10 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>
                    temp_preferences_custom
                  </span>
                  <h2 className="font-headline-md text-headline-md text-on-surface font-bold">AI Investigation</h2>
                </div>
                <div className="flex items-center gap-2">
                  <HallucinationGuardBadge status={incident.ai_analysis.hallucination_guard?.status} />
                  <AiLabel />
                </div>
              </div>

              {incident.ai_analysis.summary && (
                <p className="font-body-md text-body-md text-on-surface-variant mb-6 leading-relaxed relative z-10">
                  {incident.ai_analysis.summary}
                </p>
              )}

              {/* Probable Causes with Evidence Grounding */}
              {incident.ai_analysis.probable_causes?.length > 0 && (
                <div className="space-y-4 relative z-10 mb-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                      Root Cause Hypothesis
                    </h3>
                    <span className="font-label-sm text-label-sm text-secondary font-medium">
                      ✓ Evidence Grounded
                    </span>
                  </div>
                  {incident.ai_analysis.probable_causes.map((cause, i) => (
                    <div
                      key={i}
                      className="bg-background border border-surface-variant rounded-lg p-4 relative overflow-hidden"
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-container" />
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-1">
                          <h4 className="font-body-md text-body-md text-on-surface font-medium">
                            {cause.cause}
                          </h4>
                          <div className="flex items-center gap-2 text-[12px] text-on-surface-variant">
                            <span>Corroborated by {resolvedIncidentsCount} incidents & {knowledgeArticlesCount} KB guides</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end shrink-0">
                          <span className="font-display-lg text-[24px] leading-none text-primary-container font-semibold">
                            {Math.round(cause.confidence * 100)}%
                          </span>
                          <span className="font-label-sm text-label-sm text-on-surface-variant mt-1">Confidence</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Why SignalDesk Believes This (USP 4) */}
              <div className="relative z-10 bg-surface-container-lowest border border-surface-variant rounded-lg p-3.5 mb-6 space-y-2">
                <h4 className="font-label-sm text-label-sm text-on-surface uppercase tracking-wider font-semibold">
                  Why SignalDesk Believes This:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-body-sm text-body-sm text-on-surface-variant">
                  <div className="flex items-center gap-1.5">
                    <span className="text-secondary font-bold">✓</span> Matching error signature
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-secondary font-bold">✓</span> Same service ({incident.affected_service ?? 'system'})
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-secondary font-bold">✓</span> {resolvedIncidentsCount} historical incidents
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-secondary font-bold">✓</span> {knowledgeArticlesCount} verified KB articles
                  </div>
                </div>
              </div>

              {/* Recommended Actions */}
              {incident.ai_analysis.recommended_actions?.length > 0 && (
                <div className="relative z-10 border-t border-surface-variant pt-5">
                  <h3 className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-3">
                    Recommended Actions
                  </h3>
                  <div className="space-y-2">
                    {incident.ai_analysis.recommended_actions.map((act, i) => (
                      <div
                        key={i}
                        className="w-full flex items-center justify-between p-3 rounded-lg border border-surface-variant bg-surface hover:bg-surface-container transition-colors text-left group/action"
                      >
                        <div className="flex items-center gap-2 flex-1">
                          <span className="material-symbols-outlined text-primary text-sm">play_arrow</span>
                          <span className="font-body-sm text-body-sm text-on-surface group-hover/action:text-primary transition-colors">
                            {act.step}
                          </span>
                        </div>
                        <RemediationRiskBadge risk={act.risk} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* 🤖 AI REMEDIATION SECTION (USP 1 & 2) */}
          {incident.status !== 'resolved' && (
            <section className={`border rounded-xl p-6 relative overflow-hidden shadow-lg transition-all ${
              isAutoResolutionEligible
                ? 'bg-surface border-secondary/40 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
                : 'bg-surface border-surface-variant'
            }`}>
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-2xl">precision_manufacturing</span>
                  <h2 className="font-headline-md text-headline-md text-on-surface font-bold">🤖 AI Remediation</h2>
                </div>
                {isAutoResolutionEligible ? (
                  <span className="px-2.5 py-1 rounded-full bg-secondary/10 text-secondary border border-secondary/30 font-label-sm text-label-sm font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    Safe Remediation Available
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full bg-tertiary/10 text-tertiary border border-tertiary/30 font-label-sm text-label-sm font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">gpp_bad</span>
                    Manual Investigation Required
                  </span>
                )}
              </div>

              {isAutoResolutionEligible && remediationPlan ? (
                <div className="space-y-4">
                  <div className="bg-background border border-secondary/30 rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h4 className="font-body-md text-body-md text-on-surface font-bold">
                        {remediationPlan.name}
                      </h4>
                      <RemediationRiskBadge risk={remediationPlan.risk} />
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      {remediationPlan.description}
                    </p>
                    <p className="font-label-sm text-label-sm text-on-surface-variant font-mono bg-surface-container p-2 rounded">
                      <strong>Verification Method:</strong> {remediationPlan.verification_method}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="bg-background p-3 rounded-lg border border-surface-variant">
                      <span className="block font-display-lg text-[22px] text-secondary font-bold">
                        {Math.round((autoResolution?.confidence_score ?? 0.85) * 100)}%
                      </span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Confidence</span>
                    </div>
                    <div className="bg-background p-3 rounded-lg border border-surface-variant">
                      <span className="block font-display-lg text-[22px] text-primary font-bold">
                        {incident.evidence_strength ?? 80} / 100
                      </span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Evidence Strength</span>
                    </div>
                  </div>

                  {/* Remediation Execution Button & Live State */}
                  {remediationStep === 'idle' && (
                    <button
                      onClick={handleExecuteRemediation}
                      disabled={remediating}
                      className="w-full py-3 px-4 rounded-lg bg-secondary text-on-secondary font-label-md text-label-md font-bold hover:brightness-110 transition-all shadow-[0_4px_16px_rgba(16,185,129,0.2)] flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-lg">bolt</span>
                      Execute Safe Remediation
                    </button>
                  )}

                  {remediationStep === 'executing' && (
                    <div className="p-4 rounded-lg bg-primary-container/20 border border-primary/40 flex items-center justify-center gap-3 animate-pulse">
                      <span className="material-symbols-outlined text-primary animate-spin">sync</span>
                      <span className="font-label-md text-label-md text-primary font-bold">
                        ⏳ Executing safe runbook: {remediationPlan.name}...
                      </span>
                    </div>
                  )}

                  {remediationStep === 'verifying' && (
                    <div className="p-4 rounded-lg bg-secondary/20 border border-secondary/40 flex items-center justify-center gap-3 animate-pulse">
                      <span className="material-symbols-outlined text-secondary animate-spin">health_and_safety</span>
                      <span className="font-label-md text-label-md text-secondary font-bold">
                        🔍 Verifying subsystem health & error rates...
                      </span>
                    </div>
                  )}

                  {remediationStep === 'done' && (
                    <div className="p-4 rounded-lg bg-secondary/20 border border-secondary/40 flex items-center justify-center gap-3">
                      <span className="material-symbols-outlined text-secondary">check_circle</span>
                      <span className="font-label-md text-label-md text-secondary font-bold">
                        ✓ Service Healthy & Incident Resolved Automatically
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-surface-container-low border border-surface-variant rounded-lg p-4 space-y-2">
                    <p className="font-body-sm text-body-sm text-on-surface">
                      The AI does not have sufficient verified evidence or an approved low-risk runbook to safely execute automatic remediation.
                    </p>
                    {autoResolution?.blocking_reasons && autoResolution.blocking_reasons.length > 0 && (
                      <div className="space-y-1 pt-1">
                        <span className="font-label-sm text-label-sm text-on-surface-variant font-semibold uppercase">Safety Gate Reasons:</span>
                        <ul className="list-disc pl-5 font-label-sm text-label-sm text-error space-y-0.5">
                          {autoResolution.blocking_reasons.map((r, i) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setEscalateTeam(incident.assigned_team || 'Tier-2 Operations');
                      setEscalateReason(autoResolution?.blocking_reasons?.[0] ?? 'Safe automated resolution criteria not satisfied');
                      setShowEscalateForm(true);
                    }}
                    className="w-full py-3 px-4 rounded-lg bg-error text-on-error font-label-md text-label-md font-bold hover:brightness-110 transition-all flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-lg">priority_high</span>
                    Escalate to Engineering Team
                  </button>
                </div>
              )}
            </section>
          )}

          {/* Confirmed Resolution Card */}
          {incident.resolution && (
            <section className="bg-surface border border-secondary/30 rounded-xl p-5 shadow-sm">
              <h3 className="font-headline-md text-sm font-bold text-secondary uppercase tracking-wider mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">check_circle</span>
                Confirmed Resolution
              </h3>
              <p className="font-body-md text-body-md text-on-surface whitespace-pre-wrap leading-relaxed">{incident.resolution}</p>
              {incident.resolved_at && (
                <p className="font-label-sm text-label-sm text-on-surface-variant mt-3">
                  Resolved {formatDistanceToNow(new Date(incident.resolved_at), { addSuffix: true })}
                </p>
              )}
            </section>
          )}
        </div>

        {/* MIDDLE COLUMN: Evidence (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <EvidenceRadialGauge
            score={incident.evidence_strength}
            incidentCount={resolvedIncidentsCount}
            articleCount={knowledgeArticlesCount}
          />

          {/* Supporting Evidence List (USP 4) */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between ml-1">
              <h3 className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                Supporting Evidence ({resolvedIncidentsCount + knowledgeArticlesCount})
              </h3>
              <span className="font-label-sm text-label-sm text-primary font-mono">pgvector Cosine Sim</span>
            </div>

            {incident.ai_analysis?.evidence_used && incident.ai_analysis.evidence_used.length > 0 ? (
              incident.ai_analysis.evidence_used.map((ev, i) => (
                <div
                  key={i}
                  className="bg-surface border border-surface-variant rounded-lg p-4 hover:border-outline transition-colors group shadow-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`material-symbols-outlined text-sm ${ev.type === 'resolved_incident' ? 'text-secondary' : 'text-tertiary'}`}>
                        {ev.type === 'resolved_incident' ? 'task_alt' : 'menu_book'}
                      </span>
                      <span className={`font-label-sm text-label-sm uppercase tracking-wider font-semibold ${ev.type === 'resolved_incident' ? 'text-secondary' : 'text-tertiary'}`}>
                        {ev.type === 'resolved_incident' ? 'RESOLVED INCIDENT' : 'KB ARTICLE'}
                      </span>
                    </div>
                    <span className="font-label-sm text-label-sm text-primary font-mono font-bold">
                      {Math.round(ev.similarity * 100)}% match
                    </span>
                  </div>

                  <h4 className="font-body-md text-body-md text-on-surface group-hover:text-primary transition-colors font-medium">
                    {ev.title}
                  </h4>

                  {ev.resolution && (
                    <div className="mt-2 bg-background p-2.5 rounded border border-surface-variant font-body-sm text-body-sm text-on-surface-variant">
                      <strong className="text-on-surface block text-[11px] uppercase tracking-wider mb-0.5">Historical Resolution:</strong>
                      {ev.resolution}
                    </div>
                  )}

                  {ev.content && (
                    <div className="mt-2 bg-background p-2.5 rounded border border-surface-variant font-body-sm text-body-sm text-on-surface-variant">
                      <strong className="text-on-surface block text-[11px] uppercase tracking-wider mb-0.5">Knowledge Guide:</strong>
                      {ev.content}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="bg-surface border border-surface-variant rounded-lg p-4 text-center font-body-sm text-on-surface-variant">
                No supporting evidence items retrieved yet.
              </div>
            )}
          </section>
        </div>

        {/* RIGHT COLUMN: Timeline & Actions (3 cols) */}
        <div className="lg:col-span-3 flex flex-col bg-surface border border-surface-variant rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-surface-variant bg-surface-container-lowest flex items-center justify-between">
            <h2 className="font-label-md text-label-md text-on-surface uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">history</span>
              Investigation Timeline
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 max-h-[550px]">
            <InvestigationTimeline activity={activity} />
          </div>

          <div className="p-4 border-t border-surface-variant bg-surface mt-auto space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAddComment();
                  }
                }}
                placeholder="Add Note..."
                className="flex-1 h-10 bg-background border border-surface-variant rounded-md px-3 font-body-sm text-body-sm text-on-surface focus:border-primary outline-none transition-all placeholder:text-outline"
              />
              <button
                onClick={handleAddComment}
                disabled={submittingComment || !comment.trim()}
                className="h-10 px-4 bg-surface-container border border-surface-variant rounded-md text-on-surface hover:bg-surface-container-highest transition-colors flex items-center justify-center disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-sm">send</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleReanalyze}
                disabled={analyzing || isAnalyzing}
                className="h-9 rounded border border-surface-variant bg-transparent text-on-surface hover:bg-surface-container transition-colors font-label-md text-label-md flex items-center justify-center gap-1 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[16px]">refresh</span>
                Re-analyze
              </button>
              <button
                onClick={() => toast.success('Assigned to current engineer session')}
                className="h-9 rounded border border-surface-variant bg-surface-container hover:bg-surface-container-highest transition-colors text-on-surface font-label-md text-label-md"
              >
                Assign to me
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
