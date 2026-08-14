import { useEffect, useState } from 'react';
import { knowledgeApi } from '../services/api';
import type { KnowledgeArticle } from '../types';
import { SkeletonCard, EmptyState } from '../components/ui/Badges';

const CATEGORIES = [
  'All',
  'Network & VPN',
  'Email & Communication',
  'Authentication & Access',
  'Hardware & Endpoint',
  'Security',
];

export function KnowledgeBasePage() {
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      try {
        const res = await knowledgeApi.list({
          category: category !== 'All' ? category : undefined,
          search: search || undefined,
        });
        setArticles(res.articles);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load articles');
      } finally {
        setLoading(false);
      }
    };
    fetchArticles();
  }, [search, category]);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface font-bold">
          Knowledge Base
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          IT troubleshooting articles embedded with pgvector and referenced by RAG investigation
        </p>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="bg-level-1 border border-border-color rounded-lg p-stack-sm flex flex-col md:flex-row gap-stack-sm items-center shadow-lg">
        <div className="relative flex-1 w-full">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search knowledge articles..."
            className="w-full bg-level-0 border border-border-color rounded-md py-2 pl-9 pr-4 text-on-surface font-label-md text-label-md focus:border-primary outline-none transition-all placeholder:text-outline"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`shrink-0 px-3 py-1.5 rounded-md font-label-sm text-label-sm border transition-colors ${
                category === cat
                  ? 'bg-level-2 border-primary text-primary font-bold'
                  : 'bg-level-0 border-border-color text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {error ? (
        <div className="p-4 bg-error/10 border border-error/20 text-error rounded-lg font-body-sm">{error}</div>
      ) : loading ? (
        <div className="space-y-3">
          {Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : articles.length === 0 ? (
        <EmptyState
          icon="menu_book"
          title="No Articles Found"
          description={
            search || category !== 'All'
              ? 'Try changing search terms or category filters'
              : 'Run "npm run seed:kb" in backend to seed curated articles'
          }
        />
      ) : (
        <div className="space-y-3">
          {articles.map((article) => {
            const isExpanded = expandedId === article.id;

            return (
              <div
                key={article.id}
                onClick={() => setExpandedId(isExpanded ? null : article.id)}
                className="bg-surface border border-surface-variant hover:border-outline rounded-lg p-5 cursor-pointer transition-all duration-200 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="material-symbols-outlined text-tertiary text-sm">menu_book</span>
                      <span className="font-label-sm text-label-sm uppercase tracking-wider text-tertiary">
                        {article.category}
                      </span>
                    </div>

                    <h3 className="font-headline-md text-lg text-on-surface font-semibold hover:text-primary transition-colors">
                      {article.title}
                    </h3>

                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {article.tags?.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-label-sm text-[11px]"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <span className="material-symbols-outlined text-on-surface-variant text-xl">
                    {isExpanded ? 'expand_less' : 'expand_more'}
                  </span>
                </div>

                {/* Expanded Article Body */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-surface-variant animate-fade-in">
                    <pre className="whitespace-pre-wrap font-body-sm text-body-sm text-on-surface-variant leading-relaxed bg-background p-4 rounded-md border border-border-color">
                      {article.content}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* RAG Note Card */}
      <div className="bg-surface border border-primary-container/20 rounded-xl p-5 ai-glow relative overflow-hidden">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            auto_awesome
          </span>
          <div>
            <h4 className="font-headline-md text-sm text-primary font-semibold mb-1">
              RAG Vector Retrieval Integration
            </h4>
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              Every knowledge article above is indexed with 768-dimensional embeddings via <code className="text-on-surface font-mono">gemini-embedding-001</code> in Supabase pgvector. When a technician or user submits an incident, the RAG engine retrieves the most relevant articles via cosine distance to ground Gemini's recommendations in verified organizational procedures.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
