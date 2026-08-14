import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { incidentsApi } from '../services/api';
import type { Incident } from '../types';
import {
  PriorityBadge,
  SkeletonCard,
  EmptyState,
} from '../components/ui/Badges';

export function IncidentsPage() {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [page, setPage] = useState(0);
  const LIMIT = 15;

  const fetchIncidents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await incidentsApi.list({
        status: status || undefined,
        priority: priority || undefined,
        limit: LIMIT,
        offset: page * LIMIT,
      });
      setIncidents(res.incidents);
      setTotal(res.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load incidents');
    } finally {
      setLoading(false);
    }
  }, [status, priority, page]);

  useEffect(() => {
    fetchIncidents();
    const interval = setInterval(fetchIncidents, 10000);
    return () => clearInterval(interval);
  }, [fetchIncidents]);

  const filtered = search
    ? incidents.filter(
        (i) =>
          i.title.toLowerCase().includes(search.toLowerCase()) ||
          i.category?.toLowerCase().includes(search.toLowerCase()) ||
          i.affected_service?.toLowerCase().includes(search.toLowerCase()),
      )
    : incidents;

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface font-bold">
            Incidents
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Manage, triage, and investigate technical incidents
          </p>
        </div>
        <Link
          to="/incidents/new"
          className="px-4 py-2 bg-primary-container text-white rounded font-label-md text-label-md hover:bg-inverse-primary transition-colors inline-flex items-center gap-1.5 shadow-sm"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          New Incident
        </Link>
      </div>

      {/* Search & Filter Bar (Stitch Log Explorer Style) */}
      <div className="bg-level-1 border border-border-color rounded-lg p-stack-sm flex flex-col md:flex-row gap-stack-sm items-center shadow-lg">
        <div className="relative flex-1 w-full">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search incidents (e.g., VPN, Database, P1)..."
            className="w-full bg-level-0 border border-border-color rounded-md py-2 pl-9 pr-4 text-on-surface font-label-md text-label-md focus:border-primary outline-none transition-all placeholder:text-outline"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {/* Status Filter */}
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(0); }}
            className="bg-level-0 border border-border-color rounded-md px-3 py-2 text-on-surface-variant font-label-md text-label-md outline-none focus:border-primary"
          >
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priority}
            onChange={(e) => { setPriority(e.target.value); setPage(0); }}
            className="bg-level-0 border border-border-color rounded-md px-3 py-2 text-on-surface-variant font-label-md text-label-md outline-none focus:border-primary"
          >
            <option value="">All Priorities</option>
            <option value="P1">P1 Critical</option>
            <option value="P2">P2 High</option>
            <option value="P3">P3 Medium</option>
            <option value="P4">P4 Low</option>
          </select>

          {(status || priority || search) && (
            <button
              onClick={() => { setStatus(''); setPriority(''); setSearch(''); setPage(0); }}
              className="px-3 py-2 text-primary hover:underline font-label-sm text-label-sm shrink-0"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Incidents Table */}
      <div className="bg-surface metric-card-border rounded-lg overflow-hidden flex flex-col shadow-sm">
        {error ? (
          <div className="p-4 text-error font-body-sm">{error}</div>
        ) : loading ? (
          <div className="p-4 space-y-3">
            {Array(5).fill(0).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="h_mobiledata_badge"
            title={search ? 'No Matching Incidents' : 'No Incidents Yet'}
            description={search ? 'Try adjusting your search or filter criteria' : 'Create an incident to test AI triage'}
            action={!search && (
              <Link to="/incidents/new" className="px-4 py-2 bg-primary-container text-white rounded font-label-md text-label-md mt-4 inline-block">
                Create Incident
              </Link>
            )}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low font-label-sm text-label-sm text-on-surface-variant uppercase border-b border-[#2D333B]">
                  <th className="p-stack-sm pl-stack-md font-medium">ID</th>
                  <th className="p-stack-sm font-medium">Incident</th>
                  <th className="p-stack-sm font-medium">Priority</th>
                  <th className="p-stack-sm font-medium">Category</th>
                  <th className="p-stack-sm font-medium">AI Confidence</th>
                  <th className="p-stack-sm pr-stack-md font-medium">Evidence</th>
                </tr>
              </thead>
              <tbody className="font-body-sm text-body-sm divide-y divide-[#2D333B]">
                {filtered.map((incident) => (
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
                    <td className="p-stack-sm text-on-surface-variant font-label-sm">
                      {incident.category ?? '—'}
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-[#2D333B] bg-surface-container-low flex justify-between items-center text-on-surface-variant font-label-sm">
            <span>Page {page + 1} of {totalPages} ({total} total)</span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="px-3 py-1 bg-surface border border-border-color rounded disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1 bg-surface border border-border-color rounded disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
