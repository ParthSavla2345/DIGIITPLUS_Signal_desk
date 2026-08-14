# SignalDesk Architecture — README

## Overview

SignalDesk is a full-stack AI incident intelligence platform. This directory contains architecture documentation for the system as actually implemented.

## Documents

| File | Description |
|------|-------------|
| [system-architecture.md](./system-architecture.md) | Full system diagram — all components, data flows, AI services |
| [rag-architecture.md](./rag-architecture.md) | RAG pipeline — embedding, retrieval, evidence scoring, hallucination guard |
| [incident-lifecycle.md](./incident-lifecycle.md) | Sequence diagram — full incident lifecycle including Gemini failure path |
| [database-er.md](./database-er.md) | ER diagram — 4 tables with vector(768) columns, constraints, RPC functions |

---

## System Architecture Summary

```
User
 └─→ React + Vite Frontend (port 5173)
      └─→ Node.js + Express Backend (port 5000)
           ├─→ Gemini 2.0 Flash (triage + investigation)
           ├─→ Gemini Embedding 001 (768-dim vectors)
           └─→ Supabase PostgreSQL + pgvector
                ├── incidents (incidents + embeddings)
                ├── resolved_incident_knowledge (RAG source)
                ├── knowledge_articles (RAG source)
                └── incident_activity (timeline)
```

---

## Frontend / Backend Separation

- **Frontend**: React + Vite + TypeScript + Tailwind CSS on port 5173
- **Backend**: Node.js + Express + TypeScript on port 5000
- All AI calls (Gemini) happen server-side only
- No secrets (`GEMINI_API_KEY`, `SUPABASE_SECRET_KEY`) ever reach the browser

---

## Supabase Role

Supabase serves as:
1. Primary PostgreSQL database for all incident data
2. pgvector store for 768-dimension embeddings
3. RPC function host for vector similarity search
4. Activity timeline store

---

## pgvector Role

pgvector enables semantic similarity search without an external vector database:
- HNSW indexes for fast approximate nearest-neighbor
- Cosine similarity (`<=>` operator)
- `match_resolved_incidents()` and `match_knowledge_articles()` RPC functions
- `detect_incident_cluster()` for time-window incident counting

---

## Gemini Role

| Model | Task | Location |
|-------|------|----------|
| `gemini-2.0-flash` | Incident triage (category, priority, team) | `services/ai/incidentTriage.ts` |
| `gemini-2.0-flash` | Evidence-grounded investigation | `services/ai/incidentAnalysis.ts` |
| `gemini-embedding-001` | 768-dim embeddings for incidents + docs | `services/ai/embeddings.ts` |

---

## Hugging Face Role

- Dataset: `mindweave/help-desk-tickets`
- Fetched **online** via Hugging Face Dataset Viewer API
- Schema is inspected dynamically (no hardcoded column names)
- Resolved tickets are embedded and stored as `resolved_incident_knowledge`
- Never stored locally; seed script is safe to re-run (upsert by `source_id`)

---

## RAG Flow

```
New Incident → Generate query embedding → Cosine similarity search
→ Top 5 resolved incidents + Top 3 KB articles
→ Apply metadata boost for category/service matches
→ Calculate evidence strength (backend-computed, 0-100)
→ Build investigation prompt with evidence + hallucination guard
→ Gemini investigation → Zod validation
→ Store analysis + evidence strength in Supabase
→ Display to engineer with supporting citations
```

---

## Anomaly Detection

**Type A — Novel Incident**
- Triggered when: `max_similarity < 0.60` across all retrieved evidence
- Backend computation — not Gemini judgment
- Action: Mark `is_anomaly=true`, `anomaly_type=novel_incident`

**Type B — Incident Cluster**
- Triggered when: ≥ 3 incidents with same category/service within 60 minutes
- Uses `detect_incident_cluster()` SQL function with time window
- Action: Mark `is_anomaly=true`, `anomaly_type=incident_cluster`, recommend escalation

---

## Hallucination Guard

The hallucination guard is implemented at multiple layers:

1. **Evidence scorer**: Backend computes score, Gemini cannot inflate it
2. **Prompt engineering**: When score < 40, prompt explicitly forbids unsupported recommendations
3. **UI warning**: `⚠️ LOW EVIDENCE WARNING` displayed to engineer
4. **Confidence tracking**: Gemini confidence expected to be low (< 0.4) when evidence is weak

---

## Human-in-the-Loop Escalation

AI may **recommend** escalation but cannot perform it. The engineer sees:
- Escalation recommendation with reason and target team
- Button to confirm or continue investigating
- All decisions recorded in `incident_activity` timeline
