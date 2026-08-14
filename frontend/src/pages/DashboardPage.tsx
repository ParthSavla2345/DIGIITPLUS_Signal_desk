import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { incidentsApi } from '../services/api';
import type { Incident } from '../types';
import {
  PriorityBadge,
  SkeletonCard,
  EmptyState,
} from '../components/ui/Badges';

interface Stats {
  total: number;
  open: number;
  in_progress: number;
  resolved: number;
  p1p2: number;
  anomalies: number;
}

export function DashboardPage() {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [anomalyIncident, setAnomalyIncident] = useState<Incident | null>(null);

  const fetchData = async () => {
    try {
      setError(null);
      const [allRes, recentRes] = await Promise.all([
        incidentsApi.list({ limit: 100 }),
        incidentsApi.list({ limit: 10 }),
      ]);

      const all = allRes.incidents;
      const anomaly = all.find((i) => i.is_anomaly) ?? null;
      setAnomalyIncident(anomaly);

      setStats({
        total: allRes.total,
        open: all.filter((i) => i.status === 'open').length,
        in_progress: all.filter((i) => i.status === 'in_progress').length,
        resolved: all.filter((i) => i.status === 'resolved' || i.status === 'closed').length,
        p1p2: all.filter((i) => i.priority === 'P1' || i.priority === 'P2').length,
        anomalies: all.filter((i) => i.is_anomaly).length,
      });

      setIncidents(recentRes.incidents);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load incidents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-stack-lg max-w-[1600px] mx-auto animate-fade-in">
      {/* Title & Subtitle */}
      <div className="flex flex-col gap-1">
        <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface font-bold">
          SignalDesk Dashboard
        </h2>
        <p className="font-body-md text-body-md text-on-surface-variant">
          AI-powered incident intelligence
        </p>
      </div>

      {/* Metrics Grid (6 Columns) */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-stack-md">
          {Array(6).fill(0).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-stack-md">
          {/* Total Incidents */}
          <div className="bg-surface metric-card-border rounded-lg p-stack-md flex flex-col gap-2">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Total Incidents</span>
            <span className="font-headline-md text-headline-md text-on-surface font-bold">
              {stats?.total ?? 0}
            </span>
            <div className="flex items-center gap-1 text-primary">
              <span className="material-symbols-outlined text-[16px]">trending_up</span>
              <span className="font-label-sm text-label-sm">+12%</span>
            </div>
          </div>

          {/* Open */}
          <div className="bg-surface metric-card-border rounded-lg p-stack-md flex flex-col gap-2">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Open</span>
            <span className="font-headline-md text-headline-md text-on-surface font-bold">
              {stats?.open ?? 0}
            </span>
            <div className="flex items-center gap-1 text-error">
              <span className="material-symbols-outlined text-[16px]">warning</span>
              <span className="font-label-sm text-label-sm">Active</span>
            </div>
          </div>

          {/* In Progress */}
          <div className="bg-surface metric-card-border rounded-lg p-stack-md flex flex-col gap-2">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">In Progress</span>
            <span className="font-headline-md text-headline-md text-on-surface font-bold">
              {stats?.in_progress ?? 0}
            </span>
            <div className="flex items-center gap-1 text-secondary">
              <span className="material-symbols-outlined text-[16px]">sync</span>
              <span className="font-label-sm text-label-sm">Triage</span>
            </div>
          </div>

          {/* Resolved */}
          <div className="bg-surface metric-card-border rounded-lg p-stack-md flex flex-col gap-2">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Resolved</span>
            <span className="font-headline-md text-headline-md text-on-surface font-bold">
              {stats?.resolved ?? 0}
            </span>
            <div className="flex items-center gap-1 text-primary">
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              <span className="font-label-sm text-label-sm">KB Grounded</span>
            </div>
          </div>

          {/* P1 / P2 */}
          <div className="bg-surface metric-card-border rounded-lg p-stack-md flex flex-col gap-2">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">P1/P2</span>
            <span className="font-headline-md text-headline-md text-error font-bold">
              {stats?.p1p2 ?? 0}
            </span>
            <div className="flex items-center gap-1 text-error">
              <span className="material-symbols-outlined text-[16px]">priority_high</span>
              <span className="font-label-sm text-label-sm">High Impact</span>
            </div>
          </div>

          {/* Anomalies */}
          <div className="bg-surface metric-card-border rounded-lg p-stack-md flex flex-col gap-2">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Anomalies</span>
            <span className="font-headline-md text-headline-md text-tertiary font-bold">
              {stats?.anomalies ?? 0}
            </span>
            <div className="flex items-center gap-1 text-tertiary">
              <span className="material-symbols-outlined text-[16px]">insights</span>
              <span className="font-label-sm text-label-sm">Detected</span>
            </div>
          </div>
        </div>
      )}

      {/* AI Intelligence Panel (Stitch Anomaly Banner) */}
      <div className="bg-surface metric-card-border rounded-lg p-stack-md lg:p-stack-lg ai-glow relative overflow-hidden flex flex-col md:flex-row gap-stack-md items-start md:items-center justify-between">
        <div className="flex flex-col gap-stack-sm z-10">
          <div className="flex items-center gap-2 text-primary">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
              auto_awesome
            </span>
            <h3 className="font-headline-md text-headline-md font-bold">
              {stats?.anomalies ? `${stats.anomalies} Potential Anomalies Detected` : 'AI Incident Intelligence Active'}
            </h3>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant">
            {anomalyIncident ? (
              <>Top concern: <strong className="text-on-surface">{anomalyIncident.title}</strong> ({anomalyIncident.anomaly_reason ?? 'Cluster detected'})</>
            ) : (
              <>Automated RAG triage is actively scanning for novel issues and systemic incident clusters.</>
            )}
          </p>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="bg-surface-container-high px-2 py-1 rounded font-label-sm text-label-sm text-on-surface-variant">
              pgvector similarity active
            </span>
            <span className="bg-surface-container-high px-2 py-1 rounded font-label-sm text-label-sm text-on-surface-variant">
              Hallucination Guard enabled
            </span>
          </div>
        </div>
        <button
          onClick={() => {
            if (anomalyIncident) {
              navigate(`/incidents/${anomalyIncident.id}`);
            } else {
              navigate('/incidents');
            }
          }}
          className="bg-primary-container text-white px-5 py-2.5 rounded-md font-label-md text-label-md hover:bg-inverse-primary transition-colors z-10 w-full md:w-auto shrink-0 shadow-sm"
        >
          Investigate
        </button>
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(circle at 100% 50%, rgba(79, 70, 229, 0.08) 0%, transparent 60%)' }}
        />
      </div>

      {/* Recent Incidents Table */}
      <div className="bg-surface metric-card-border rounded-lg overflow-hidden flex flex-col shadow-sm">
        <div className="p-stack-md border-b border-[#2D333B] flex justify-between items-center bg-surface-container-low">
          <h3 className="font-headline-md text-headline-md text-on-surface font-semibold">Recent Incidents</h3>
          <Link to="/incidents" className="text-primary font-label-md text-label-md hover:underline flex items-center gap-1">
            View All
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </div>

        {error ? (
          <div className="p-4 text-error font-body-sm">{error}</div>
        ) : incidents.length === 0 ? (
          <EmptyState
            icon="task"
            title="No Incidents Yet"
            description="Create your first incident to see AI triage and evidence-backed RAG analysis in action."
            action={
              <Link to="/incidents/new" className="px-4 py-2 bg-primary-container text-white rounded font-label-md text-label-md mt-4 inline-flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">add</span> Create Incident
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low font-label-sm text-label-sm text-on-surface-variant uppercase border-b border-[#2D333B]">
                  <th className="p-stack-sm pl-stack-md font-medium">ID</th>
                  <th className="p-stack-sm font-medium">Incident</th>
                  <th className="p-stack-sm font-medium">Priority</th>
                  <th className="p-stack-sm font-medium">AI Confidence</th>
                  <th className="p-stack-sm pr-stack-md font-medium">Evidence</th>
                </tr>
              </thead>
              <tbody className="font-body-sm text-body-sm divide-y divide-[#2D333B]">
                {incidents.map((incident) => (
                  <tr
                    key={incident.id}
                    onClick={() => navigate(`/incidents/${incident.id}`)}
                    className="hover:bg-surface-container-low transition-colors cursor-pointer group"
                  >
                    <td className="p-stack-sm pl-stack-md font-label-md text-on-surface-variant">
                      INC-{incident.id.slice(0, 4).toUpperCase()}
                    </td>
                    <td className="p-stack-sm font-medium text-on-surface group-hover:text-primary transition-colors">
                      <div className="flex items-center gap-2">
                        {incident.is_anomaly && (
                          <span className="material-symbols-outlined text-error text-[16px]">warning</span>
                        )}
                        <span>{incident.title}</span>
                      </div>
                    </td>
                    <td className="p-stack-sm">
                      <PriorityBadge priority={incident.priority} />
                    </td>
                    <td className="p-stack-sm text-primary font-label-md">
                      {incident.ai_confidence ? `${Math.round(incident.ai_confidence * 100)}%` : '—'}
                    </td>
                    <td className="p-stack-sm pr-stack-md text-on-surface-variant">
                      {incident.evidence_strength !== null ? (
                        incident.evidence_strength >= 70 ? (
                          <span className="text-primary font-medium">High Evidence</span>
                        ) : incident.evidence_strength >= 40 ? (
                          <span className="text-tertiary font-medium">Medium Evidence</span>
                        ) : (
                          <span className="text-error font-medium">Low Evidence</span>
                        )
                      ) : (
                        <span className="text-on-surface-variant/50">Processing...</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
