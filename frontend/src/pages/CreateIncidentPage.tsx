import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { incidentsApi } from '../services/api';
import toast from 'react-hot-toast';

const EXAMPLE_INCIDENTS = [
  {
    title: 'VPN connection failure',
    description: 'My company VPN has stopped working and I cannot access internal applications. I restarted my laptop but the problem continues. I need access to our internal systems urgently.',
  },
  {
    title: 'Cannot login to Outlook — password reset loop',
    description: 'I am unable to log into my Outlook email. When I try to log in, it keeps asking me to reset my password, but the reset emails are not arriving. I have tried 3 times already this morning.',
  },
  {
    title: 'Production database connection timeout',
    description: 'Our main application is throwing database connection timeout errors in production since 2:00 AM. Multiple users are affected and we are seeing 500 errors on the dashboard. The issue started after last night deployment.',
  },
];

export function CreateIncidentPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [createdIncidentId, setCreatedIncidentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title.length < 5 || description.length < 20) return;

    setError(null);
    setSubmitting(true);

    try {
      const { incident } = await incidentsApi.create({ title, description });
      setCreatedIncidentId(incident.id);
      toast.success('Incident saved. AI Triage in progress...');

      // Let user see the stepped progress screen for 2.5s before redirecting
      setTimeout(() => {
        navigate(`/incidents/${incident.id}`);
      }, 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create incident');
      setSubmitting(false);
    }
  };

  const fillExample = (example: typeof EXAMPLE_INCIDENTS[0]) => {
    setTitle(example.title);
    setDescription(example.description);
    setError(null);
  };

  // If submitting, render Stitch Screen 2 (AI Triage in Progress)
  if (submitting) {
    return (
      <div className="flex-grow flex items-center justify-center p-gutter md:p-margin-desktop relative overflow-hidden min-h-[70vh]">
        {/* Subtle background glow element */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-20 flex items-center justify-center">
          <div className="w-96 h-96 bg-primary-container rounded-full mix-blend-screen filter blur-[100px]" />
        </div>

        <div className="relative z-10 w-full max-w-2xl bg-surface border border-outline-variant rounded-xl shadow-lg p-stack-lg flex flex-col items-center animate-fade-in">
          {/* Header Area */}
          <div className="text-center mb-stack-lg w-full flex flex-col items-center">
            <div className="relative w-24 h-24 mb-stack-sm flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-primary/30 pulse-ring" />
              <div className="absolute inset-2 rounded-full border border-primary/50 pulse-ring" style={{ animationDelay: '0.5s' }} />
              <div className="bg-primary-container/20 p-4 rounded-full border border-primary-container z-10">
                <span className="material-symbols-outlined text-primary text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  model_training
                </span>
              </div>
            </div>
            <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-unit shimmer-text font-bold">
              AI Analysis in Progress
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Triage engine is processing incident data & retrieving evidence.
            </p>
          </div>

          {/* Stepped Progress List */}
          <div className="w-full bg-surface-container-low border border-outline-variant rounded-lg p-stack-md mb-stack-lg space-y-stack-sm">
            {/* Step 1 */}
            <div className="flex items-center gap-stack-sm">
              <div className="w-6 h-6 rounded-full bg-primary-container/20 flex items-center justify-center border border-primary-container text-primary">
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
              </div>
              <span className="font-label-md text-label-md text-on-surface">Analyzing incident text & intent</span>
            </div>

            {/* Step 2 */}
            <div className="flex items-center gap-stack-sm">
              <div className="w-6 h-6 rounded-full bg-primary-container/20 flex items-center justify-center border border-primary-container text-primary">
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
              </div>
              <span className="font-label-md text-label-md text-on-surface flex items-center gap-2">
                Classifying category & priority
                <span className="px-2 py-0.5 rounded bg-error/10 text-error border border-error/20 text-[10px]">P2</span>
              </span>
            </div>

            {/* Step 3 */}
            <div className="flex items-center gap-stack-sm">
              <div className="w-6 h-6 rounded-full flex items-center justify-center border border-primary text-primary relative">
                <span className="material-symbols-outlined text-sm progress-dot-pulse">hourglass_top</span>
                <div className="absolute inset-[-4px] border border-primary/30 rounded-full animate-spin border-t-transparent" style={{ animationDuration: '2s' }} />
              </div>
              <span className="font-label-md text-label-md text-primary font-bold">Searching knowledge base (RAG)</span>
            </div>

            {/* Step 4 */}
            <div className="flex items-center gap-stack-sm opacity-60">
              <div className="w-6 h-6 rounded-full border border-outline-variant flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-outline-variant" />
              </div>
              <span className="font-label-md text-label-md text-on-surface-variant">Retrieving similar resolved incidents</span>
            </div>

            {/* Step 5 */}
            <div className="flex items-center gap-stack-sm opacity-60">
              <div className="w-6 h-6 rounded-full border border-outline-variant flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-outline-variant" />
              </div>
              <span className="font-label-md text-label-md text-on-surface-variant">Calculating evidence strength & anomaly checks</span>
            </div>
          </div>

          {/* AI Insights Snippet */}
          <div className="w-full relative overflow-hidden rounded-lg border border-[#2D333B] bg-[#0B0E14] p-stack-md">
            <div className="relative z-10 flex items-start gap-stack-sm">
              <span className="material-symbols-outlined text-primary mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>
                temp_preferences_custom
              </span>
              <div>
                <h3 className="font-label-md text-label-md text-primary mb-1 font-semibold">Real-time AI Insights</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant font-mono">
                  &gt; Embedding generated via gemini-embedding-001 (768d)...<br />
                  &gt; <span className="text-secondary">Running cosine similarity query...</span>
                </p>
              </div>
            </div>
          </div>

          {createdIncidentId && (
            <div className="mt-4 text-center">
              <button
                onClick={() => navigate(`/incidents/${createdIncidentId}`)}
                className="text-primary hover:underline font-label-md text-label-md"
              >
                Go directly to incident &rarr;
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const titleValid = title.length >= 5;
  const descValid = description.length >= 20;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface font-bold">
          Create Support Incident
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant mt-1">
          Describe the problem in natural language. SignalDesk AI will automatically triage, retrieve evidence, and build an investigation timeline.
        </p>
      </div>

      {/* Quick Examples */}
      <div className="space-y-2">
        <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
          Quick test examples:
        </span>
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_INCIDENTS.map((ex) => (
            <button
              key={ex.title}
              type="button"
              onClick={() => fillExample(ex)}
              className="px-3 py-1.5 rounded-md bg-surface border border-surface-variant hover:border-primary text-on-surface-variant hover:text-on-surface font-label-sm text-label-sm transition-all"
            >
              {ex.title}
            </button>
          ))}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-surface metric-card-border rounded-xl p-6 space-y-5 shadow-lg">
        <div>
          <label className="block font-label-md text-label-md text-on-surface mb-2">
            Incident Title <span className="text-error">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. VPN connection failure across US-East..."
            className="w-full bg-level-0 border border-border-color rounded-md px-4 py-2.5 text-on-surface font-body-md text-body-md outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-outline"
            maxLength={255}
          />
          {title.length > 0 && !titleValid && (
            <p className="font-label-sm text-label-sm text-error mt-1">Title must be at least 5 characters</p>
          )}
        </div>

        <div>
          <label className="block font-label-md text-label-md text-on-surface mb-2">
            Describe the Issue <span className="text-error">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the symptoms, affected users, when it started, error codes, and what you have already tried..."
            rows={7}
            className="w-full bg-level-0 border border-border-color rounded-md p-4 text-on-surface font-body-sm text-body-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-outline resize-none"
            maxLength={10000}
          />
          {description.length > 0 && !descValid && (
            <p className="font-label-sm text-label-sm text-error mt-1">Description must be at least 20 characters</p>
          )}
        </div>

        {error && (
          <div className="p-3 rounded bg-error/10 border border-error/30 text-error font-body-sm text-body-sm">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-surface-variant flex-wrap gap-4">
          <p className="font-label-sm text-label-sm text-on-surface-variant">
            Incident is persisted immediately before AI execution starts.
          </p>
          <button
            type="submit"
            disabled={!titleValid || !descValid}
            className="px-6 py-2.5 rounded-md bg-primary-container text-white font-label-md text-label-md hover:bg-inverse-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_12px_rgba(79,70,229,0.15)] flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">auto_awesome</span>
            Create Incident
          </button>
        </div>
      </form>
    </div>
  );
}
