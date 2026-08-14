# SignalDesk — Database ER Diagram

## Entity Relationship Diagram

```mermaid
erDiagram
    incidents {
        uuid id PK
        text title
        text description
        text status "open | in_progress | resolved | closed"
        text category
        text priority "P1 | P2 | P3 | P4"
        text severity "critical | high | medium | low"
        text affected_service
        text assigned_team
        text sentiment
        text ai_summary
        jsonb ai_analysis
        numeric ai_confidence
        integer evidence_strength
        vector_768 embedding "pgvector(768)"
        boolean is_anomaly
        text anomaly_type "novel_incident | incident_cluster"
        text anomaly_reason
        text resolution
        timestamptz resolved_at
        text analysis_status "pending | processing | completed | failed"
        text ai_model
        text ai_prompt_version
        timestamptz created_at
        timestamptz updated_at
    }

    incident_activity {
        uuid id PK
        uuid incident_id FK
        text action
        jsonb details
        timestamptz created_at
    }

    resolved_incident_knowledge {
        uuid id PK
        text source_id UK "Unique — prevents duplicate seeding"
        text title
        text description
        text category
        text priority
        text resolution
        vector_768 embedding "pgvector(768)"
        text source "huggingface"
        timestamptz created_at
    }

    knowledge_articles {
        uuid id PK
        text title UK
        text content
        text category
        text_array tags
        vector_768 embedding "pgvector(768)"
        timestamptz created_at
    }

    incidents ||--o{ incident_activity : "has many (ON DELETE CASCADE)"
```

---

## Vector Columns

All three tables with embeddings use `vector(768)` from pgvector:

| Table | Column | Dimensions | Task Type |
|-------|---------|------------|-----------|
| `incidents` | `embedding` | 768 | RETRIEVAL_QUERY |
| `resolved_incident_knowledge` | `embedding` | 768 | RETRIEVAL_DOCUMENT |
| `knowledge_articles` | `embedding` | 768 | RETRIEVAL_DOCUMENT |

All vector indexes use **HNSW** (Hierarchical Navigable Small World) with cosine similarity (`vector_cosine_ops`) for fast approximate nearest-neighbor search.

---

## RPC Functions

| Function | Purpose |
|----------|---------|
| `match_resolved_incidents(embedding, threshold, count)` | Cosine similarity search on resolved tickets |
| `match_knowledge_articles(embedding, threshold, count)` | Cosine similarity search on KB articles |
| `detect_incident_cluster(category, service, window_minutes, threshold)` | Count recent incidents by category/service |

---

## Key Constraints

- `incidents.status` — enum check constraint
- `incidents.priority` — enum check constraint  
- `incidents.analysis_status` — enum check constraint
- `incidents.ai_confidence` — CHECK (0 ≤ value ≤ 1)
- `incidents.evidence_strength` — CHECK (0 ≤ value ≤ 100)
- `resolved_incident_knowledge.source_id` — UNIQUE (prevents duplicate seeding)
- `incident_activity.incident_id` — FK with ON DELETE CASCADE
