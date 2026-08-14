# SignalDesk — AI-Powered Incident Intelligence

> *"SignalDesk doesn't just answer support tickets. It builds an evidence-backed investigation around every incident, detects potential systemic issues, tracks the investigation timeline, and knows when it does not have enough evidence to recommend a solution."*

---

## Problem

Traditional IT service desks create tickets and route them to teams — but they provide no intelligence. Engineers must manually investigate root causes, search historical tickets, and decide escalation paths. This is slow, inconsistent, and error-prone.

## Solution

SignalDesk turns every support ticket into an **AI-powered investigation**:

1. **Instant triage** — Gemini automatically classifies category, priority, severity, and team
2. **Evidence-backed RAG** — Retrieves similar resolved incidents and knowledge articles from a vector database
3. **Grounded investigation** — Gemini produces recommendations *only* when supporting evidence exists
4. **Hallucination guard** — Explicitly says "I don't know" when evidence is insufficient
5. **Anomaly detection** — Detects novel incidents and incident clusters automatically
6. **AI timeline** — Every action is recorded with full context
7. **Human-in-the-loop** — Engineers control escalation and resolution

---

## Architecture

```
React Frontend (Vite + Tailwind)
         ↓ REST API
Express Backend (TypeScript)
    ├── Gemini 2.0 Flash  (triage + investigation)
    ├── Gemini Embedding 001  (768-dim vectors)
    └── Supabase PostgreSQL + pgvector
             ├── incidents
             ├── resolved_incident_knowledge
             ├── knowledge_articles
             └── incident_activity
```

See [`/architecture`](./architecture/) for detailed diagrams.

---

## Features

| Feature | Description |
|---------|-------------|
| 🎫 Incident Management | Create, update, resolve, escalate incidents |
| 🤖 AI Triage | Auto-classify category, priority, severity, team |
| 🧠 Embeddings | 768-dim gemini-embedding-001 for semantic search |
| 🔎 RAG Retrieval | pgvector cosine similarity search |
| 🛡️ Evidence Scoring | Backend-computed 0-100 score |
| ⚠️ Hallucination Guard | No AI recommendations without supporting evidence |
| 🚨 Anomaly Detection | Novel incident + incident cluster detection |
| 🕐 AI Timeline | Full activity history for every incident |
| 👨‍💻 Engineer Actions | Comment, escalate, re-analyze, resolve |
| 🔄 Re-analysis | Re-run AI with latest state and new evidence |
| 📚 Knowledge Base | Searchable IT troubleshooting articles |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React, Vite, TypeScript, Tailwind CSS |
| Backend | Node.js, Express, TypeScript |
| Database | Supabase PostgreSQL |
| Vector DB | Supabase pgvector |
| AI | Google Gemini API (`@google/genai`) |
| Embeddings | `gemini-embedding-001` (768 dimensions) |
| Validation | Zod |
| Dataset | Hugging Face — `mindweave/help-desk-tickets` |

---

## AI Architecture

### AI Call #1 — Incident Triage
**Model**: `gemini-2.0-flash`  
**Input**: title + description  
**Output** (Zod-validated JSON):
```json
{
  "category": "Network & VPN",
  "priority": "P2",
  "severity": "high",
  "affected_service": "Corporate VPN",
  "assigned_team": "Network Operations",
  "sentiment": "frustrated",
  "confidence": 0.87
}
```

### AI Call #2 — Evidence-Grounded Investigation
**Model**: `gemini-2.0-flash`  
**Input**: incident + top retrieved evidence + evidence strength + hallucination guard  
**Output** (Zod-validated JSON):
```json
{
  "summary": "...",
  "probable_causes": [{ "cause": "...", "confidence": 0.80 }],
  "recommended_actions": [{ "step": "...", "risk": "low", "requires_human_approval": false }],
  "missing_information": [],
  "evidence_used": [...],
  "escalation": { "should_escalate": false, "target_team": null, "reason": null },
  "confidence": 0.86
}
```

---

## RAG Pipeline

```
Seed Time:
  Hugging Face resolved tickets → Embed (RETRIEVAL_DOCUMENT) → pgvector
  Knowledge articles → Embed (RETRIEVAL_DOCUMENT) → pgvector

Query Time:
  New incident → Embed (RETRIEVAL_QUERY)
  → Cosine similarity search (threshold 0.50)
  → Top 5 resolved incidents + Top 3 KB articles
  → Metadata boost (+0.05 for category/service match)
  → Evidence strength score (backend-computed, 0-100)
  → RAG prompt → Gemini → Zod validate → Store
```

---

## Dataset

- **Source**: [mindweave/help-desk-tickets](https://huggingface.co/datasets/mindweave/help-desk-tickets) on Hugging Face
- **Fetch**: Online via Hugging Face Dataset Viewer API — **never downloaded locally**
- **Schema detection**: Dynamic — column names are inspected at seed time
- **Filter**: Only resolved tickets with meaningful resolution text (≥ 20 chars)
- **Volume**: Up to 300 resolved incidents per seed run
- **Idempotent**: Safe to re-run; upserts by `source_id`

---

## Database Schema

| Table | Purpose | Has Embedding |
|-------|---------|---------------|
| `incidents` | Live incidents | ✅ `vector(768)` |
| `resolved_incident_knowledge` | Historical knowledge from Hugging Face | ✅ `vector(768)` |
| `knowledge_articles` | Curated IT troubleshooting guides | ✅ `vector(768)` |
| `incident_activity` | Timeline events for each incident | ❌ |

---

## Anomaly Detection

**Type A — Novel Incident**
- Condition: `max_similarity < 0.60` across all retrieved evidence
- Computed in TypeScript, not by Gemini
- UI: `🚨 NOVEL INCIDENT — No strong historical match found`

**Type B — Incident Cluster**
- Condition: ≥ 3 incidents in the same category/service within 60 minutes
- Detected via SQL time-window query
- UI: `🚨 POTENTIAL INCIDENT CLUSTER — Multiple related incidents reported`

---

## Evidence / Hallucination Guard

Evidence strength (0–100) is computed **entirely in backend code** from:
- Retrieval similarity scores
- Count of useful resolved incidents (similarity ≥ 0.75)
- Count of relevant KB articles (similarity ≥ 0.60)
- Strong evidence bonus (similarity ≥ 0.85)

When score < 40 (low evidence):
- Prompt explicitly instructs Gemini **not** to invent solutions
- UI shows `⚠️ LOW EVIDENCE WARNING`
- Recommended actions default to "Escalate to human engineer"
- AI confidence expected < 0.4

---

## Setup

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project with pgvector enabled
- A [Google AI Studio](https://aistudio.google.com) API key

### 1. Clone and install
```bash
git clone <repo>
cd signaldesk
npm run install:all
```

### 2. Configure environment variables
```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your real credentials

# Frontend  
cp frontend/.env.example frontend/.env
# Edit frontend/.env (VITE_API_BASE_URL is already correct for local dev)
```

### 3. Run Supabase migrations
Open your **Supabase SQL Editor** and run the contents of:
```
supabase/migrations/001_initial_schema.sql
```

### 4. Seed the knowledge base
```bash
npm run seed:kb
```

### 5. Seed historical incidents from Hugging Face (optional but recommended)
```bash
npm run seed
```

### 6. Start the application
```bash
# Terminal 1 — Backend
npm run dev:backend

# Terminal 2 — Frontend
npm run dev:frontend
```

Open [http://localhost:5173](http://localhost:5173)

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SECRET_KEY` | Supabase service role key (never expose to frontend) |
| `SUPABASE_PUBLISHABLE_KEY` | Supabase anon key |
| `GEMINI_API_KEY` | Google AI Studio API key |
| `PORT` | Backend port (default: 5000) |

### Frontend (`frontend/.env`)

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | Backend API URL (default: `http://localhost:5000/api`) |
| `VITE_SUPABASE_URL` | Your Supabase project URL (read-only operations) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon key only |

> ⚠️ **Never put `SUPABASE_SECRET_KEY` or `GEMINI_API_KEY` in frontend `.env`**

---

## Running Frontend

```bash
cd frontend
npm run dev
# → http://localhost:5173
```

## Running Backend

```bash
cd backend
npm run dev
# → http://localhost:5000
# → Health check: http://localhost:5000/api/health
```

## Seeding Dataset

```bash
# Seed knowledge base articles (required for RAG)
cd backend && npm run seed:kb

# Seed Hugging Face resolved incidents (recommended for RAG quality)
cd backend && npm run seed
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/incidents` | Create incident (triggers AI pipeline) |
| `GET` | `/api/incidents` | List incidents with filters |
| `GET` | `/api/incidents/:id` | Get incident + activity timeline |
| `PATCH` | `/api/incidents/:id` | Update incident fields |
| `POST` | `/api/incidents/:id/analyze` | Trigger re-analysis |
| `POST` | `/api/incidents/:id/comments` | Add engineer comment |
| `POST` | `/api/incidents/:id/escalate` | Escalate to team |
| `POST` | `/api/incidents/:id/resolve` | Mark as resolved |
| `GET` | `/api/knowledge` | List knowledge articles |

---

## Assumptions

1. Hugging Face dataset (`mindweave/help-desk-tickets`) is accessible via their public API
2. Supabase project has pgvector extension enabled
3. Gemini API key has access to `gemini-2.0-flash` and `gemini-embedding-001`
4. Engineers are identified as "Engineer" (no authentication implemented in MVP)

---

## Limitations

1. No authentication/RBAC — all engineers share one session
2. Seed script rate-limited by Gemini embedding API (~300ms delay between items)
3. Background AI processing is in-process (not a job queue) — backend restart would abort in-flight analysis
4. No real-time WebSocket updates — frontend polls every 5 seconds
5. Cluster detection is approximate — counts by category OR service, not AND

---

## Future Improvements

1. **Authentication** — Supabase Auth + RBAC for engineer roles
2. **Real-time updates** — Supabase Realtime WebSocket subscriptions
3. **Job queue** — Bull/BullMQ for resilient background AI processing
4. **Incident AI chat** — Per-incident conversational investigation
5. **Natural language search** — Semantic search across incidents
6. **Analytics dashboard** — MTTR, category trends, anomaly frequency
7. **Notification system** — Email/Slack alerts for P1/P2 and anomalies
8. **Feedback loop** — Engineer resolution feedback improves RAG quality
