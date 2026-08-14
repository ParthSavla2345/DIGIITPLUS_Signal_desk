import type { IncidentStatus, IncidentPriority, IncidentSeverity, AnalysisStatus } from '../../types';

// ============================================================
// Status Badge (Subtle Fill + Dot Pattern)
// ============================================================

interface StatusBadgeProps {
  status: IncidentStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = {
    open: {
      label: 'Open',
      wrapper: 'bg-primary-container/10 text-primary border border-primary-container/20',
      dot: 'bg-primary-container',
    },
    in_progress: {
      label: 'In Progress',
      wrapper: 'bg-primary-container/10 text-primary border border-primary-container/20',
      dot: 'bg-primary-container',
    },
    resolved: {
      label: 'Resolved',
      wrapper: 'bg-secondary/10 text-secondary border border-secondary/20',
      dot: 'bg-secondary',
    },
    closed: {
      label: 'Closed',
      wrapper: 'bg-surface-container-highest text-on-surface-variant border border-outline-variant',
      dot: 'bg-outline',
    },
  };

  const { label, wrapper, dot } = config[status] ?? config.open;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-label-sm text-[11px] uppercase tracking-wider ${wrapper}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

// ============================================================
// Priority Badge (Stitch Exact Styling)
// ============================================================

interface PriorityBadgeProps {
  priority: IncidentPriority | null | undefined;
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  if (!priority) return <span className="font-label-sm text-on-surface-variant">—</span>;

  const config = {
    P1: {
      label: 'P1',
      wrapper: 'bg-error/20 text-error border border-error/30 font-bold',
      dot: 'bg-error',
    },
    P2: {
      label: 'P2',
      wrapper: 'bg-error/10 text-error border border-error/20',
      dot: 'bg-error',
    },
    P3: {
      label: 'P3',
      wrapper: 'bg-tertiary/10 text-tertiary border border-tertiary/20',
      dot: 'bg-tertiary',
    },
    P4: {
      label: 'P4',
      wrapper: 'bg-surface-container-highest text-on-surface-variant border border-outline-variant',
      dot: 'bg-outline',
    },
  };

  const { label, wrapper, dot } = config[priority] ?? config.P4;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-label-sm text-[11px] uppercase ${wrapper}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

// ============================================================
// Severity Badge
// ============================================================

interface SeverityBadgeProps {
  severity: IncidentSeverity | null | undefined;
}

export function SeverityBadge({ severity }: SeverityBadgeProps) {
  if (!severity) return null;

  const config = {
    critical: 'bg-error/20 text-error border border-error/30',
    high: 'bg-error/10 text-error border border-error/20',
    medium: 'bg-tertiary/10 text-tertiary border border-tertiary/20',
    low: 'bg-surface-container-highest text-on-surface-variant border border-outline-variant',
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-label-sm text-[11px] uppercase tracking-wider ${config[severity] ?? config.low}`}>
      {severity}
    </span>
  );
}

// ============================================================
// Analysis Status Badge
// ============================================================

interface AnalysisStatusBadgeProps {
  status: AnalysisStatus;
}

export function AnalysisStatusBadge({ status }: AnalysisStatusBadgeProps) {
  const config = {
    pending: {
      label: 'Pending',
      wrapper: 'bg-surface-container-high text-on-surface-variant border border-outline-variant',
      icon: 'hourglass_empty',
    },
    processing: {
      label: 'Analyzing...',
      wrapper: 'bg-primary-container/20 text-primary border border-primary/30 animate-pulse',
      icon: 'auto_awesome',
    },
    completed: {
      label: 'Analyzed',
      wrapper: 'bg-secondary/10 text-secondary border border-secondary/20',
      icon: 'check_circle',
    },
    failed: {
      label: 'Failed',
      wrapper: 'bg-error/10 text-error border border-error/20',
      icon: 'error',
    },
  };

  const { label, wrapper, icon } = config[status] ?? config.pending;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-label-sm text-[11px] ${wrapper}`}>
      <span className="material-symbols-outlined text-[13px]">{icon}</span>
      {label}
    </span>
  );
}

// ============================================================
// Confidence Indicator
// ============================================================

interface ConfidenceProps {
  value: number | null | undefined;
}

export function ConfidenceIndicator({ value }: ConfidenceProps) {
  if (value === null || value === undefined) return <span className="text-on-surface-variant font-label-md">—</span>;
  const pct = Math.round(value * 100);
  return (
    <span className="font-label-md text-primary font-medium">{pct}%</span>
  );
}

// ============================================================
// Evidence Strength Radial Gauge (Stitch Exact Component)
// ============================================================

interface EvidenceRadialGaugeProps {
  score: number | null | undefined;
  incidentCount?: number;
  articleCount?: number;
}

export function EvidenceRadialGauge({ score = 0, incidentCount = 0, articleCount = 0 }: EvidenceRadialGaugeProps) {
  const validScore = Math.max(0, Math.min(100, score ?? 0));
  const circumference = 2 * Math.PI * 42; // ~263.89
  const strokeDashoffset = circumference - (validScore / 100) * circumference;

  const level = validScore >= 70 ? 'high' : validScore >= 40 ? 'moderate' : 'low';

  const badgeConfig = {
    high: { text: 'HIGH EVIDENCE', wrapper: 'bg-primary/10 text-primary border border-primary/20', arcColor: 'text-primary-container' },
    moderate: { text: 'MODERATE EVIDENCE', wrapper: 'bg-tertiary/10 text-tertiary border border-tertiary/20', arcColor: 'text-tertiary' },
    low: { text: 'LOW EVIDENCE', wrapper: 'bg-error/10 text-error border border-error/20', arcColor: 'text-error' },
  };

  const { text, wrapper, arcColor } = badgeConfig[level];

  return (
    <div className="bg-surface border border-surface-variant rounded-xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
      {/* Radial Gauge */}
      <div className="relative w-40 h-40 mb-6">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          {/* Background Track */}
          <circle
            className="text-surface-variant"
            cx="50"
            cy="50"
            fill="none"
            r="42"
            stroke="currentColor"
            strokeWidth="6"
          />
          {/* Progress Arc */}
          <circle
            className={`${arcColor} drop-shadow-[0_0_8px_rgba(79,70,229,0.5)] transition-all duration-1000 ease-out`}
            cx="50"
            cy="50"
            fill="none"
            r="42"
            stroke="currentColor"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            strokeWidth="6"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display-lg text-[40px] text-on-surface leading-none tracking-tighter">
            {validScore}
          </span>
          <div className="w-8 h-px bg-surface-variant my-1" />
          <span className="font-label-sm text-label-sm text-on-surface-variant">100</span>
        </div>
      </div>

      <h3 className={`font-label-md text-label-md tracking-widest uppercase mb-2 px-3 py-1 rounded-full ${wrapper}`}>
        {text}
      </h3>

      <p className="font-body-sm text-body-sm text-on-surface-variant">
        Correlation engine found <span className="text-on-surface font-medium">{incidentCount} similar incidents</span> and{' '}
        <span className="text-on-surface font-medium">{articleCount} KB articles</span> matching the current log signature.
      </p>
    </div>
  );
}

// ============================================================
// AI Suggested Tag
// ============================================================

export function AiLabel() {
  return (
    <span className="px-2 py-1 rounded bg-surface-container border border-surface-variant font-label-sm text-label-sm text-primary flex items-center gap-1">
      <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
      AI Suggested
    </span>
  );
}

// ============================================================
// Hallucination Guard Badge
// ============================================================

interface HallucinationGuardBadgeProps {
  status?: 'grounded' | 'partially_grounded' | 'insufficient_evidence' | null;
  unsupportedCount?: number;
}

export function HallucinationGuardBadge({ status, unsupportedCount = 0 }: HallucinationGuardBadgeProps) {
  if (!status) return null;

  if (status === 'grounded') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-label-sm text-[11px] font-semibold bg-secondary/10 text-secondary border border-secondary/30">
        <span className="material-symbols-outlined text-[14px]">verified_user</span>
        🛡️ GROUNDED AI
      </span>
    );
  }

  if (status === 'partially_grounded') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-label-sm text-[11px] font-semibold bg-tertiary/10 text-tertiary border border-tertiary/30">
        <span className="material-symbols-outlined text-[14px]">gpp_maybe</span>
        ⚠️ PARTIALLY GROUNDED ({unsupportedCount} unverified)
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-label-sm text-[11px] font-semibold bg-error/10 text-error border border-error/30">
      <span className="material-symbols-outlined text-[14px]">shield</span>
      🛑 INSUFFICIENT EVIDENCE
    </span>
  );
}

// ============================================================
// Remediation Risk Badge
// ============================================================

export function RemediationRiskBadge({ risk }: { risk: 'low' | 'medium' | 'high' }) {
  const config = {
    low: 'bg-secondary/10 text-secondary border border-secondary/20',
    medium: 'bg-tertiary/10 text-tertiary border border-tertiary/20',
    high: 'bg-error/10 text-error border border-error/20',
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-label-sm text-[11px] uppercase tracking-wider ${config[risk]}`}>
      <span className="material-symbols-outlined text-[12px]">security</span>
      {risk} risk
    </span>
  );
}

// ============================================================
// Anomaly Alert Card
// ============================================================

interface AnomalyAlertProps {
  type: 'novel_incident' | 'incident_cluster';
  reason: string;
}

export function AnomalyAlert({ type, reason }: AnomalyAlertProps) {
  const isCluster = type === 'incident_cluster';

  return (
    <div className={`rounded-xl border p-4 metric-card-border ${isCluster ? 'border-error/40 bg-error/10' : 'border-tertiary/40 bg-tertiary/10'}`}>
      <div className="flex items-start gap-3">
        <span className="material-symbols-outlined text-error text-2xl">warning</span>
        <div>
          <h3 className={`font-headline-md text-sm font-semibold uppercase tracking-wider ${isCluster ? 'text-error' : 'text-tertiary'}`}>
            {isCluster ? 'POTENTIAL INCIDENT CLUSTER DETECTED' : 'NOVEL INCIDENT DETECTED'}
          </h3>
          <p className="font-body-sm text-body-sm text-on-surface mt-1">{reason}</p>
          {!isCluster && (
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-2">
              No strong historical match found. SignalDesk will not hallucinate or invent an unsupported resolution.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Loading Skeleton
// ============================================================

export function SkeletonCard() {
  return (
    <div className="bg-surface metric-card-border rounded-lg p-stack-md animate-pulse space-y-3">
      <div className="h-4 w-3/4 bg-surface-container-high rounded" />
      <div className="h-3 w-1/2 bg-surface-container-high rounded" />
      <div className="flex gap-2">
        <div className="h-5 w-16 bg-surface-container-high rounded" />
        <div className="h-5 w-20 bg-surface-container-high rounded" />
      </div>
    </div>
  );
}

export function SkeletonLine({ width = 'w-full' }: { width?: string }) {
  return <div className={`h-4 ${width} bg-surface-container-high rounded animate-pulse`} />;
}

// ============================================================
// Empty State
// ============================================================

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon = 'dashboard', title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center bg-surface metric-card-border rounded-lg p-8">
      <span className="material-symbols-outlined text-5xl text-on-surface-variant mb-4">{icon}</span>
      <h3 className="font-headline-md text-headline-md text-on-surface mb-2">{title}</h3>
      {description && <p className="font-body-sm text-body-sm text-on-surface-variant max-w-md mb-6">{description}</p>}
      {action}
    </div>
  );
}
