import dotenv from 'dotenv';
import path from 'path';
import axios from 'axios';

// Load env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';

// ============================================================
// Hugging Face Dataset Configuration
// ============================================================

const HF_DATASET = 'mindweave/help-desk-tickets';
const HF_API_BASE = 'https://datasets-server.huggingface.co';
const TARGET_RECORDS = 50; // High-quality records for fast seeding

interface HfTicket {
  ticket_id: number;
  summary: string;
  description: string;
  priority: string;
  status: string;
  affected_service: string;
  category_id?: number;
}

interface HfComment {
  ticket_id: number;
  body: string;
  team: string;
}

async function seedDataset() {
  console.log('\n🚀 SignalDesk Dataset Seeding (Hugging Face mindweave/help-desk-tickets)\n');
  console.log('='.repeat(60));

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY || !process.env.GEMINI_API_KEY) {
    console.error('❌ Missing environment variables in backend/.env');
    process.exit(1);
  }

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
  );
  const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

  // 1. Fetch tickets
  console.log('📦 Fetching resolved tickets...');
  const ticketsResp = await axios.get(`${HF_API_BASE}/rows`, {
    params: {
      dataset: HF_DATASET,
      config: 'tickets',
      split: 'train',
      offset: 0,
      length: 100,
    },
    timeout: 20000,
  });

  const rawTickets: HfTicket[] = (ticketsResp.data?.rows ?? []).map(
    (r: { row: HfTicket }) => r.row,
  );
  const resolvedTickets = rawTickets.filter(
    (t) => t.status === 'resolved' && t.summary && t.summary.length >= 5,
  );
  console.log(`✅ Found ${resolvedTickets.length} resolved tickets`);

  // 2. Fetch comments for resolutions
  console.log('💬 Fetching resolution comments...');
  const commentsResp = await axios.get(`${HF_API_BASE}/rows`, {
    params: {
      dataset: HF_DATASET,
      config: 'comments',
      split: 'train',
      offset: 0,
      length: 100,
    },
    timeout: 20000,
  });

  const rawComments: HfComment[] = (commentsResp.data?.rows ?? []).map(
    (r: { row: HfComment }) => r.row,
  );

  // Group comments by ticket_id (take the last comment as resolution)
  const commentMap = new Map<number, string>();
  for (const c of rawComments) {
    if (c.body && c.body.length >= 10) {
      commentMap.set(c.ticket_id, c.body);
    }
  }

  // 3. Generate embeddings & insert
  console.log('\n🧠 Generating embeddings and storing in Supabase...\n');

  let seeded = 0;
  let skipped = 0;

  for (let i = 0; i < Math.min(resolvedTickets.length, TARGET_RECORDS); i++) {
    const t = resolvedTickets[i];
    const sourceId = `hf-ticket-${t.ticket_id}`;
    const title = t.summary.trim();
    const description = (t.description || t.summary).trim();
    const resolution =
      commentMap.get(t.ticket_id) ||
      `Issue investigated and resolved by ${t.affected_service || 'IT'} support team. Root cause identified and remediation applied.`;

    process.stdout.write(`  [${i + 1}/${TARGET_RECORDS}] Embedding: ${title.substring(0, 45)}... `);

    try {
      const embResp = await genAI.models.embedContent({
        model: 'gemini-embedding-001',
        contents: `${title}\n\n${description}\n\nResolution: ${resolution}`,
        config: {
          taskType: 'RETRIEVAL_DOCUMENT',
          outputDimensionality: 768,
        },
      });

      const embedding = embResp.embeddings?.[0]?.values;
      if (!embedding || embedding.length !== 768) {
        console.log('⚠️ (dim error)');
        skipped++;
        continue;
      }

      // Upsert into resolved_incident_knowledge
      const { error } = await supabase.from('resolved_incident_knowledge').upsert(
        {
          source_id: sourceId,
          title,
          description,
          category: t.affected_service || 'General IT',
          priority: t.priority || 'P3',
          resolution,
          embedding: `[${embedding.join(',')}]`,
          source: 'huggingface',
        },
        { onConflict: 'source_id' },
      );

      if (error) {
        console.log(`❌ DB: ${error.message}`);
        skipped++;
      } else {
        console.log('✅');
        seeded++;
      }

      // 300ms rate limit buffer
      await new Promise((r) => setTimeout(r, 300));
    } catch (err) {
      console.log(`❌ ${err instanceof Error ? err.message : 'error'}`);
      skipped++;
    }
  }

  console.log(`\n🎉 Seeding complete! Seeded: ${seeded} | Skipped: ${skipped}\n`);
}

seedDataset().catch(console.error);
