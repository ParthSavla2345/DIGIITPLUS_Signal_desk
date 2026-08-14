/**
 * SignalDesk — Apply Database Migration
 * Runs 001_initial_schema.sql against the Supabase project via the
 * Supabase Management REST API.
 *
 * Usage: tsx scripts/applyMigration.ts
 */
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

// Load env
import 'dotenv/config';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY!;

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SECRET_KEY in .env');
  process.exit(1);
}

// Extract project ref from URL: https://<ref>.supabase.co
const projectRef = SUPABASE_URL.replace('https://', '').replace('.supabase.co', '');
console.log(`🔗 Project ref: ${projectRef}`);

// Read migration SQL
const migrationPath = path.join(__dirname, '..', '..', 'supabase', 'migrations', '001_initial_schema.sql');
const sql = fs.readFileSync(migrationPath, 'utf8');
console.log(`📄 Loaded migration: ${sql.length} chars`);

/**
 * Run SQL via Supabase Management API
 * POST https://api.supabase.com/v1/projects/{ref}/database/query
 */
async function runManagementAPI(): Promise<void> {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query: sql });
    const options = {
      hostname: 'api.supabase.com',
      path: `/v1/projects/${projectRef}/database/query`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SECRET_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          console.log('✅ Management API migration applied successfully.');
          resolve();
        } else {
          console.warn(`⚠️  Management API returned ${res.statusCode}: ${data}`);
          reject(new Error(`Status ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

/**
 * Fallback: run via PostgREST query endpoint (service_role)
 * Supabase newer versions expose /pg/query
 */
async function runPostgRESTQuery(): Promise<void> {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query: sql });
    const hostname = SUPABASE_URL.replace('https://', '');
    const options = {
      hostname,
      path: '/pg/query',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SECRET_KEY}`,
        'apikey': SUPABASE_SECRET_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          console.log('✅ PostgREST /pg/query migration applied successfully.');
          resolve();
        } else {
          console.warn(`⚠️  /pg/query returned ${res.statusCode}: ${data.slice(0, 300)}`);
          reject(new Error(`Status ${res.statusCode}`));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

(async () => {
  console.log('\n🚀 SignalDesk — Applying Database Migration\n');

  // Try Management API first
  try {
    await runManagementAPI();
    process.exit(0);
  } catch (e1) {
    console.log('ℹ️  Management API failed, trying PostgREST /pg/query...');
  }

  // Try PostgREST fallback
  try {
    await runPostgRESTQuery();
    process.exit(0);
  } catch (e2) {
    console.error('\n❌ Both migration methods failed.');
    console.error('\n📋 MANUAL STEPS REQUIRED:');
    console.error('1. Go to: https://supabase.com/dashboard/project/' + projectRef + '/sql/new');
    console.error('2. Paste the contents of: supabase/migrations/001_initial_schema.sql');
    console.error('3. Click "Run"\n');
    process.exit(1);
  }
})();
