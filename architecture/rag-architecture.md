# SignalDesk — RAG Architecture

## RAG Pipeline Overview

SignalDesk uses Retrieval-Augmented Generation (RAG) to ground AI investigation in historical evidence rather than relying on Gemini's parametric knowledge alone.

---

## RAG Architecture Diagram

```mermaid
flowchart TD
    subgraph Offline["Offline: Seed Pipeline"]
        HF["Hugging Face Resolved Tickets\nmindweave/help-desk-tickets"]
        KB["Curated Knowledge Articles\n7 IT Troubleshooting Guides"]
        EmbDoc["gemini-embedding-001\nRETRIEVAL_DOCUMENT\n768 dimensions"]
        PGVector1[("Supabase pgvector\nresolved_incident_knowledge")]
        PGVector2[("Supabase pgvector\nknowledge_articles")]
        HF --> EmbDoc --> PGVector1
        KB --> EmbDoc --> PGVector2
    end

    subgraph Online["Online: Incident Processing"]
        NewInc["New Incident\n(title + description)"]
        EmbQuery["gemini-embedding-001\nRETRIEVAL_QUERY\n768 dimensions"]
        VecSearch["Cosine Similarity Search\nmatch_resolved_incidents()\nmatch_knowledge_articles()"]
        MetaBoost["Metadata Boost\n+0.05 for category/service match"]
        Rank["Rank by Similarity\nTop 5 incidents, Top 3 articles"]
        EvidScore["Evidence Strength Scorer\nBackend-computed 0-100"]
        AnomalyCheck["Anomaly Detection\nNovel: max_sim < 0.60\nCluster: count in window"]

        subgraph Gemini["Gemini Investigation"]
            Prompt["RAG Prompt\nIncident + Evidence + Hallucination Guard"]
            GeminiCall["gemini-2.0-flash"]
            Validate["Zod Schema Validation"]
            Response["Structured JSON Response\nCauses + Actions + Escalation"]
        end

        NewInc --> EmbQuery
        EmbQuery --> VecSearch
        PGVector1 --> VecSearch
        PGVector2 --> VecSearch
        VecSearch --> MetaBoost --> Rank
        Rank --> EvidScore
        Rank --> AnomalyCheck
        Rank --> Prompt
        EvidScore --> Prompt
        Prompt --> GeminiCall --> Validate --> Response
    end

    subgraph HallucinationGuard["Hallucination Guard"]
        LowEvid["Evidence Strength < 40"]
        NoRec["⚠️ No Unsupported Recommendation"]
        ManualInv["Manual Investigation Recommended"]
        LowEvid --> NoRec --> ManualInv
    end

    EvidScore --> HallucinationGuard
    Response --> Engineer["👨‍💻 Human Engineer"]
```

---

## Similarity Thresholds

| Threshold | Value | Meaning |
|-----------|-------|---------|
| Weak | < 0.50 | Below retrieval cutoff |
| Moderate | 0.50 – 0.60 | Low-quality evidence |
| Useful | 0.60 – 0.75 | Acceptable evidence |
| Good | 0.75 – 0.85 | Good evidence |
| Strong | > 0.85 | Strong evidence |

## Evidence Score Factors

| Factor | Max Points | Description |
|--------|------------|-------------|
| Max similarity | 40 | Top retrieved item similarity × 40 |
| Useful resolved incidents | 30 | Count with similarity ≥ 0.75, capped at 2 |
| Relevant KB articles | 20 | Count with similarity ≥ 0.60, capped at 2 |
| Strong evidence bonus | 10 | Items with similarity ≥ 0.85 |

## Task Types

- **Seed time**: `RETRIEVAL_DOCUMENT` — optimizes embeddings for storage/retrieval
- **Query time**: `RETRIEVAL_QUERY` — optimizes embeddings for searching

## Hallucination Guard

The system explicitly prevents AI from generating unsupported resolutions:

1. Evidence strength is computed **entirely in TypeScript** from retrieval scores
2. When score < 40 (low), the investigation prompt includes explicit instructions to **not invent solutions**
3. The UI displays a **⚠️ LOW EVIDENCE WARNING** to the engineer
4. Gemini is instructed to recommend **human investigation** instead of speculating
5. The recommended_actions list will contain: "Escalate to human engineer for investigation"
