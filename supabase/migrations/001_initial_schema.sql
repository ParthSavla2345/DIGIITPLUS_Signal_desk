-- ============================================================
-- SignalDesk Database Migration 001 — Initial Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- TABLE: incidents
-- ============================================================

CREATE TABLE IF NOT EXISTS incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL CHECK (char_length(title) >= 5),
  description TEXT NOT NULL CHECK (char_length(description) >= 10),
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  category TEXT,
  priority TEXT CHECK (priority IN ('P1', 'P2', 'P3', 'P4')),
  severity TEXT CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  affected_service TEXT,
  assigned_team TEXT,
  sentiment TEXT,
  ai_summary TEXT,
  ai_analysis JSONB,
  ai_confidence NUMERIC(4, 3) CHECK (ai_confidence >= 0 AND ai_confidence <= 1),
  evidence_strength INTEGER CHECK (evidence_strength >= 0 AND evidence_strength <= 100),
  embedding vector(768),
  is_anomaly BOOLEAN NOT NULL DEFAULT FALSE,
  anomaly_type TEXT CHECK (anomaly_type IN ('novel_incident', 'incident_cluster')),
  anomaly_reason TEXT,
  resolution TEXT,
  resolved_at TIMESTAMPTZ,
  analysis_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (analysis_status IN ('pending', 'processing', 'completed', 'failed')),
  ai_model TEXT,
  ai_prompt_version TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: resolved_incident_knowledge
-- ============================================================

CREATE TABLE IF NOT EXISTS resolved_incident_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT,
  priority TEXT,
  resolution TEXT NOT NULL,
  embedding vector(768),
  source TEXT NOT NULL DEFAULT 'huggingface',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: knowledge_articles
-- ============================================================

CREATE TABLE IF NOT EXISTS knowledge_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  embedding vector(768),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: incident_activity
-- ============================================================

CREATE TABLE IF NOT EXISTS incident_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Incident status/priority indexes for filtering
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_priority ON incidents(priority);
CREATE INDEX IF NOT EXISTS idx_incidents_category ON incidents(category);
CREATE INDEX IF NOT EXISTS idx_incidents_created_at ON incidents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_is_anomaly ON incidents(is_anomaly);

-- Activity timeline index
CREATE INDEX IF NOT EXISTS idx_incident_activity_incident_id ON incident_activity(incident_id);
CREATE INDEX IF NOT EXISTS idx_incident_activity_created_at ON incident_activity(created_at ASC);

-- Resolved knowledge index
CREATE INDEX IF NOT EXISTS idx_resolved_source_id ON resolved_incident_knowledge(source_id);

-- ============================================================
-- VECTOR INDEXES (HNSW for fast approximate nearest neighbor)
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_incidents_embedding
  ON incidents USING hnsw (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS idx_resolved_embedding
  ON resolved_incident_knowledge USING hnsw (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS idx_knowledge_embedding
  ON knowledge_articles USING hnsw (embedding vector_cosine_ops);

-- ============================================================
-- AUTO-UPDATE updated_at TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_incidents_updated_at ON incidents;
CREATE TRIGGER set_incidents_updated_at
  BEFORE UPDATE ON incidents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- RPC FUNCTION: match_resolved_incidents
-- Cosine similarity search for resolved incident knowledge
-- ============================================================

CREATE OR REPLACE FUNCTION match_resolved_incidents(
  query_embedding vector(768),
  match_threshold FLOAT DEFAULT 0.5,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  source_id TEXT,
  title TEXT,
  description TEXT,
  category TEXT,
  priority TEXT,
  resolution TEXT,
  source TEXT,
  created_at TIMESTAMPTZ,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    r.source_id,
    r.title,
    r.description,
    r.category,
    r.priority,
    r.resolution,
    r.source,
    r.created_at,
    1 - (r.embedding <=> query_embedding) AS similarity
  FROM resolved_incident_knowledge r
  WHERE r.embedding IS NOT NULL
    AND 1 - (r.embedding <=> query_embedding) >= match_threshold
  ORDER BY r.embedding <=> query_embedding ASC
  LIMIT match_count;
END;
$$;

-- ============================================================
-- RPC FUNCTION: match_knowledge_articles
-- Cosine similarity search for knowledge base articles
-- ============================================================

CREATE OR REPLACE FUNCTION match_knowledge_articles(
  query_embedding vector(768),
  match_threshold FLOAT DEFAULT 0.5,
  match_count INT DEFAULT 3
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  category TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    k.id,
    k.title,
    k.content,
    k.category,
    k.tags,
    k.created_at,
    1 - (k.embedding <=> query_embedding) AS similarity
  FROM knowledge_articles k
  WHERE k.embedding IS NOT NULL
    AND 1 - (k.embedding <=> query_embedding) >= match_threshold
  ORDER BY k.embedding <=> query_embedding ASC
  LIMIT match_count;
END;
$$;

-- ============================================================
-- RPC FUNCTION: detect_incident_cluster
-- Find recent incidents in the same category/service within a time window
-- ============================================================

CREATE OR REPLACE FUNCTION detect_incident_cluster(
  p_category TEXT,
  p_affected_service TEXT,
  p_window_minutes INT DEFAULT 60,
  p_threshold INT DEFAULT 3
)
RETURNS TABLE (
  cluster_detected BOOLEAN,
  incident_count INT,
  category TEXT,
  affected_service TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_count INT;
  v_category TEXT;
  v_service TEXT;
BEGIN
  v_category := p_category;
  v_service := p_affected_service;

  -- Count recent incidents matching category or service
  SELECT COUNT(*)
  INTO v_count
  FROM incidents i
  WHERE i.created_at >= NOW() - (p_window_minutes || ' minutes')::INTERVAL
    AND i.status != 'closed'
    AND (
      (p_category IS NOT NULL AND i.category = p_category)
      OR
      (p_affected_service IS NOT NULL AND i.affected_service = p_affected_service)
    );

  RETURN QUERY
  SELECT
    v_count >= p_threshold AS cluster_detected,
    v_count::INT AS incident_count,
    v_category AS category,
    v_service AS affected_service;
END;
$$;

-- ============================================================
-- Grant permissions (adjust as needed for your Supabase setup)
-- ============================================================

GRANT ALL ON incidents TO authenticated;
GRANT ALL ON resolved_incident_knowledge TO authenticated;
GRANT ALL ON knowledge_articles TO authenticated;
GRANT ALL ON incident_activity TO authenticated;

GRANT ALL ON incidents TO service_role;
GRANT ALL ON resolved_incident_knowledge TO service_role;
GRANT ALL ON knowledge_articles TO service_role;
GRANT ALL ON incident_activity TO service_role;

GRANT EXECUTE ON FUNCTION match_resolved_incidents TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION match_knowledge_articles TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION detect_incident_cluster TO authenticated, service_role;
