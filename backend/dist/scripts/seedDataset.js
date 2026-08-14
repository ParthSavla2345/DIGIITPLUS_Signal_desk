"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const axios_1 = __importDefault(require("axios"));
// Load env
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../.env') });
const supabase_js_1 = require("@supabase/supabase-js");
const genai_1 = require("@google/genai");
// ============================================================
// Hugging Face Dataset Configuration
// ============================================================
const HF_DATASET = 'mindweave/help-desk-tickets';
const HF_API_BASE = 'https://datasets-server.huggingface.co';
const BATCH_SIZE = 100; // Rows per API call
const MAX_RECORDS = 300; // Max records to seed for MVP
const MIN_RESOLUTION_LENGTH = 20; // Minimum resolution text length
// ============================================================
// Dynamic Column Detection
// ============================================================
function detectColumns(features) {
    const names = features.map((f) => f.name.toLowerCase());
    const original = features.map((f) => f.name);
    const findColumn = (keywords) => {
        for (const keyword of keywords) {
            const idx = names.findIndex((n) => n.includes(keyword));
            if (idx >= 0)
                return original[idx];
        }
        return null;
    };
    return {
        title: findColumn(['subject', 'title', 'issue_title', 'issue', 'summary', 'problem']),
        description: findColumn(['description', 'body', 'details', 'content', 'message', 'text']),
        category: findColumn(['category', 'type', 'department', 'class', 'group']),
        priority: findColumn(['priority', 'urgency', 'severity', 'impact']),
        resolution: findColumn(['resolution', 'solution', 'resolved', 'answer', 'response', 'close_notes', 'close_code']),
        status: findColumn(['status', 'state', 'ticket_status']),
    };
}
// ============================================================
// Main Seed Function
// ============================================================
async function seedDataset() {
    console.log('\n🚀 SignalDesk Dataset Seeding\n');
    console.log('='.repeat(50));
    // Validate env
    if (!process.env.SUPABASE_URL || process.env.SUPABASE_URL.includes('YOUR_PROJECT')) {
        console.error('❌ SUPABASE_URL not configured. Please update backend/.env');
        process.exit(1);
    }
    if (!process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SECRET_KEY.includes('YOUR_')) {
        console.error('❌ SUPABASE_SECRET_KEY not configured. Please update backend/.env');
        process.exit(1);
    }
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.includes('YOUR_')) {
        console.error('❌ GEMINI_API_KEY not configured. Please update backend/.env');
        process.exit(1);
    }
    const supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);
    const genAI = new genai_1.GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    // ============================================================
    // STEP 1: Inspect the dataset online
    // ============================================================
    console.log('\n🔎 Inspecting Hugging Face dataset...');
    console.log(`   Dataset: ${HF_DATASET}`);
    let config = 'default';
    let split = 'train';
    let schema = null;
    // Get configurations
    try {
        const configResp = await axios_1.default.get(`${HF_API_BASE}/info`, {
            params: { dataset: HF_DATASET },
            timeout: 15000,
        });
        const configs = configResp.data?.dataset_info;
        if (configs) {
            const configKeys = Object.keys(configs);
            if (configKeys.length > 0) {
                config = configKeys[0];
                const splits = Object.keys(configs[config]?.splits ?? {});
                if (splits.length > 0) {
                    // Prefer 'train' split, otherwise first available
                    split = splits.includes('train') ? 'train' : splits[0];
                }
                schema = configs[config];
                console.log(`✅ Configuration detected: ${config}`);
                console.log(`✅ Split detected: ${split}`);
            }
        }
    }
    catch (err) {
        console.log(`⚠️  Could not fetch dataset info, using defaults (${err instanceof Error ? err.message : 'network error'})`);
    }
    // Get schema / column names from first rows
    console.log('\n🔎 Inspecting dataset schema...');
    let columns = {
        title: null,
        description: null,
        category: null,
        priority: null,
        resolution: null,
        status: null,
    };
    try {
        const firstRowResp = await axios_1.default.get(`${HF_API_BASE}/rows`, {
            params: {
                dataset: HF_DATASET,
                config,
                split,
                offset: 0,
                length: 5,
            },
            timeout: 15000,
        });
        const features = firstRowResp.data?.features;
        if (features && features.length > 0) {
            console.log(`✅ Schema detected: ${features.map((f) => f.name).join(', ')}`);
            columns = detectColumns(features);
            console.log('\n📊 Column mapping:');
            Object.entries(columns).forEach(([key, val]) => {
                console.log(`   ${key}: ${val ?? '(not found)'}`);
            });
        }
    }
    catch (err) {
        console.error(`❌ Failed to fetch schema: ${err instanceof Error ? err.message : 'unknown'}`);
        console.log('⚠️  Proceeding with fallback column names...');
        // Fallback to common names
        columns = {
            title: 'subject',
            description: 'description',
            category: 'category',
            priority: 'priority',
            resolution: 'resolution',
            status: 'status',
        };
    }
    // ============================================================
    // STEP 2: Fetch resolved incidents
    // ============================================================
    console.log('\n📦 Fetching resolved incidents from Hugging Face...');
    const usableIncidents = [];
    let offset = 0;
    const pageSize = BATCH_SIZE;
    let attempts = 0;
    const maxAttempts = 20;
    while (usableIncidents.length < MAX_RECORDS && attempts < maxAttempts) {
        attempts++;
        try {
            const resp = await axios_1.default.get(`${HF_API_BASE}/rows`, {
                params: {
                    dataset: HF_DATASET,
                    config,
                    split,
                    offset,
                    length: pageSize,
                },
                timeout: 20000,
            });
            const rows = resp.data?.rows ?? [];
            if (rows.length === 0)
                break;
            for (const { row } of rows) {
                // Check if this record has a meaningful resolution
                const resolutionField = columns.resolution;
                const titleField = columns.title || columns.description;
                if (!resolutionField || !titleField)
                    continue;
                const resolution = String(row[resolutionField] ?? '').trim();
                const title = String(row[titleField] ?? '').trim();
                if (resolution.length >= MIN_RESOLUTION_LENGTH && title.length >= 5) {
                    usableIncidents.push(row);
                    if (usableIncidents.length >= MAX_RECORDS)
                        break;
                }
            }
            process.stdout.write(`\r   Found ${usableIncidents.length}/${MAX_RECORDS} usable incidents...`);
            offset += pageSize;
            // Small delay to be polite to HF API
            await new Promise((r) => setTimeout(r, 200));
        }
        catch (err) {
            console.error(`\n⚠️  Error fetching page at offset ${offset}:`, err instanceof Error ? err.message : err);
            if (attempts >= 3)
                break;
            await new Promise((r) => setTimeout(r, 2000));
        }
    }
    console.log(`\n✅ ${usableIncidents.length} usable incidents found\n`);
    if (usableIncidents.length === 0) {
        console.error('❌ No usable incidents found. The dataset may have changed structure.');
        process.exit(1);
    }
    // ============================================================
    // STEP 3: Generate embeddings and save
    // ============================================================
    console.log('🧠 Generating embeddings and saving to Supabase...\n');
    let seeded = 0;
    let skipped = 0;
    let errors = 0;
    for (let i = 0; i < usableIncidents.length; i++) {
        const row = usableIncidents[i];
        const sourceId = `hf-${HF_DATASET.replace('/', '-')}-${i + offset}`;
        const title = String(row[columns.title ?? ''] ?? row[columns.description ?? ''] ?? `Incident ${i + 1}`).trim().substring(0, 255);
        const description = String(row[columns.description ?? ''] ?? row[columns.title ?? ''] ?? '').trim().substring(0, 2000);
        const resolution = String(row[columns.resolution ?? ''] ?? '').trim().substring(0, 2000);
        const category = columns.category ? String(row[columns.category] ?? '').trim() || null : null;
        const priority = columns.priority ? String(row[columns.priority] ?? '').trim() || null : null;
        if (!title || !resolution) {
            skipped++;
            continue;
        }
        process.stdout.write(`\r  [${i + 1}/${usableIncidents.length}] ${title.substring(0, 50)}...`);
        try {
            // Generate embedding
            const embResp = await genAI.models.embedContent({
                model: 'gemini-embedding-001',
                contents: `${title}\n\n${description}`,
                config: {
                    taskType: 'RETRIEVAL_DOCUMENT',
                    outputDimensionality: 768,
                },
            });
            const embedding = embResp.embeddings?.[0]?.values;
            if (!embedding || embedding.length !== 768) {
                skipped++;
                continue;
            }
            // Upsert to Supabase
            const { error } = await supabase.from('resolved_incident_knowledge').upsert({
                source_id: sourceId,
                title,
                description: description || title,
                category,
                priority,
                resolution,
                embedding: `[${embedding.join(',')}]`,
                source: 'huggingface',
            }, { onConflict: 'source_id' });
            if (error) {
                errors++;
                console.error(`\n  ❌ DB error for ${sourceId}: ${error.message}`);
            }
            else {
                seeded++;
            }
            // Rate limiting
            await new Promise((r) => setTimeout(r, 300));
        }
        catch (err) {
            errors++;
            const msg = err instanceof Error ? err.message : String(err);
            if (msg.includes('429') || msg.toLowerCase().includes('rate')) {
                console.log('\n  ⏳ Rate limited — waiting 10s...');
                await new Promise((r) => setTimeout(r, 10000));
            }
        }
    }
    console.log(`\n\n✅ Dataset seeding complete!`);
    console.log(`   ✅ Seeded: ${seeded}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   ❌ Errors: ${errors}\n`);
    console.log('💡 Run this script again any time — duplicate records are prevented.\n');
}
seedDataset().catch((err) => {
    console.error('\n❌ Fatal seed error:', err);
    process.exit(1);
});
//# sourceMappingURL=seedDataset.js.map