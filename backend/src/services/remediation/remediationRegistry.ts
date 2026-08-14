/**
 * SignalDesk — Safe Remediation Runbook Registry
 *
 * CRITICAL SECURITY CONSTRAINT:
 * Gemini and AI agents must NEVER execute arbitrary shell commands,
 * raw SQL queries, infrastructure scripts, or destructive operations.
 *
 * All automated remediations MUST be mapped to one of these strictly
 * predefined, audited, and deterministic safe handlers.
 */

export interface SafeAction {
  action_id: string;
  name: string;
  description: string;
  category: string;
  risk: 'low' | 'medium' | 'high';
  required_evidence_type: string;
  target_service_pattern: string[];
  verification_method: string;
}

export interface RemediationExecutionResult {
  success: boolean;
  action_id: string;
  action_name: string;
  executed_at: string;
  execution_log: string[];
  verification: {
    passed: boolean;
    method: string;
    details: string;
    latency_ms: number;
  };
}

export const SAFE_REMEDIATION_REGISTRY: Record<string, SafeAction> = {
  restart_service: {
    action_id: 'restart_service',
    name: 'Graceful Service Restart',
    description: 'Triggers a zero-downtime rolling restart of the affected service container.',
    category: 'Cloud Infrastructure / Service',
    risk: 'low',
    required_evidence_type: 'High-confidence recurring service crash or memory leak',
    target_service_pattern: ['api', 'gateway', 'checkout', 'auth', 'web', 'worker', 'service'],
    verification_method: 'HTTP GET /health endpoint returns 200 OK within 5000ms with error rate 0%',
  },
  clear_application_cache: {
    action_id: 'clear_application_cache',
    name: 'Clear Application & Redis Cache',
    description: 'Flushes stale cache keys and re-warms cache clusters for the affected subsystem.',
    category: 'Database / Caching',
    risk: 'low',
    required_evidence_type: 'Cache invalidation failure or stale key deadlock',
    target_service_pattern: ['redis', 'cache', 'session', 'api', 'products', 'catalog'],
    verification_method: 'Redis PING responds PONG with latency < 5ms and cache hit rate recovery',
  },
  refresh_connection_pool: {
    action_id: 'refresh_connection_pool',
    name: 'Refresh Database Connection Pool',
    description: 'Recycles idle and hanging client connections in the PostgreSQL connection pool.',
    category: 'Database',
    risk: 'low',
    required_evidence_type: 'PostgreSQL connection pool exhaustion (too many clients / pool timeout)',
    target_service_pattern: ['database', 'postgres', 'db', 'sql', 'pool', 'checkout', 'api'],
    verification_method: 'Database connection test succeeds with pool active connections < 40% and latency < 15ms',
  },
  retry_failed_operation: {
    action_id: 'retry_failed_operation',
    name: 'Replay Failed Idempotent Operation',
    description: 'Safely re-submits a failed idempotent transaction with exponential backoff.',
    category: 'Payment / Transaction',
    risk: 'low',
    required_evidence_type: 'Transient network glitch or timeout on idempotent API call',
    target_service_pattern: ['payment', 'stripe', 'webhook', 'sync', 'billing'],
    verification_method: 'Transaction state transitions to confirmed with no duplicate side-effects',
  },
  rotate_expired_test_certificate: {
    action_id: 'rotate_expired_test_certificate',
    name: 'Rotate SSL/TLS Certificate from ACME',
    description: 'Requests and binds an updated TLS certificate from the automated certificate authority.',
    category: 'Security / Networking',
    risk: 'low',
    required_evidence_type: 'Expired SSL certificate with ACME renewal profile available',
    target_service_pattern: ['ssl', 'cert', 'payment', 'gateway', 'domain', 'api'],
    verification_method: 'TLS handshake completes successfully; certificate expiry is >= 90 days',
  },
  reprocess_failed_queue_items: {
    action_id: 'reprocess_failed_queue_items',
    name: 'Reprocess Dead Letter Queue (DLQ)',
    description: 'Re-queues unhandled DLQ messages following transient backend recovery.',
    category: 'Messaging / Queue',
    risk: 'low',
    required_evidence_type: 'DLQ accumulation due to resolved downstream outage',
    target_service_pattern: ['queue', 'rabbitmq', 'kafka', 'worker', 'email', 'notifications'],
    verification_method: 'DLQ message count reaches 0 and consumer processing error rate remains 0%',
  },
};

/**
 * Finds matching safe runbook for an AI recommended action and affected service
 */
export function findMatchingSafeAction(
  actionString: string,
  affectedService: string | null,
): SafeAction | null {
  const normalized = (actionString + ' ' + (affectedService || '')).toLowerCase();

  if (normalized.includes('pool') || normalized.includes('connection') || normalized.includes('exhaust')) {
    return SAFE_REMEDIATION_REGISTRY['refresh_connection_pool'];
  }
  if (normalized.includes('cache') || normalized.includes('redis') || normalized.includes('miss rate')) {
    return SAFE_REMEDIATION_REGISTRY['clear_application_cache'];
  }
  if (normalized.includes('ssl') || normalized.includes('certificate') || normalized.includes('cert')) {
    return SAFE_REMEDIATION_REGISTRY['rotate_expired_test_certificate'];
  }
  if (normalized.includes('queue') || normalized.includes('dlq') || normalized.includes('reprocess')) {
    return SAFE_REMEDIATION_REGISTRY['reprocess_failed_queue_items'];
  }
  if (normalized.includes('restart') || normalized.includes('reboot') || normalized.includes('service down')) {
    return SAFE_REMEDIATION_REGISTRY['restart_service'];
  }
  if (normalized.includes('retry') || normalized.includes('replay') || normalized.includes('idempotent')) {
    return SAFE_REMEDIATION_REGISTRY['retry_failed_operation'];
  }

  return null;
}

/**
 * Safely executes a predefined runbook handler with simulated verification
 */
export async function executeSafeRunbook(
  actionId: string,
  targetService: string,
): Promise<RemediationExecutionResult> {
  const action = SAFE_REMEDIATION_REGISTRY[actionId];
  if (!action) {
    throw new Error(`Unauthorized or unknown remediation action: ${actionId}`);
  }

  const logs: string[] = [
    `[Remediation Engine] Initializing safe runbook: ${action.name} (ID: ${action.action_id})`,
    `[Security Guard] Action validated against approved safe registry (Risk: ${action.risk.toUpperCase()})`,
    `[Target] Service target: ${targetService || 'General System'}`,
  ];

  // Realistic simulation step
  await new Promise((r) => setTimeout(r, 600));

  switch (action.action_id) {
    case 'refresh_connection_pool':
      logs.push('[Execution] Sending pool drain signal to PostgreSQL pool manager...');
      logs.push('[Execution] Terminated 14 idle connections in state idle-in-transaction.');
      logs.push('[Execution] Connection pool reset to min size 10 (Capacity 100).');
      break;
    case 'clear_application_cache':
      logs.push('[Execution] Flushing key pattern app:cache:* on primary Redis cluster...');
      logs.push('[Execution] Re-warmed top 50 active cached items from primary DB.');
      break;
    case 'rotate_expired_test_certificate':
      logs.push('[Execution] Requesting new TLS certificate via ACME automated protocol...');
      logs.push('[Execution] Installing certificate into load balancer TLS termination proxy.');
      logs.push('[Execution] Certificate installed. Expiry: 90 days from today.');
      break;
    case 'restart_service':
      logs.push(`[Execution] Sending SIGTERM to container pod ${targetService}-prod-01...`);
      logs.push('[Execution] Standby container pod ready. Traffic shifted cleanly.');
      break;
    case 'reprocess_failed_queue_items':
      logs.push('[Execution] Inspecting Dead Letter Queue (DLQ)... Found 18 pending messages.');
      logs.push('[Execution] Replaying messages to main processing queue with rate limit.');
      break;
    case 'retry_failed_operation':
      logs.push('[Execution] Replaying failed idempotent transactions with correlation IDs...');
      logs.push('[Execution] 12 transactions successfully confirmed.');
      break;
    default:
      logs.push('[Execution] Safe handler completed.');
  }

  // Verification step
  logs.push(`[Verification] Running post-remediation check: ${action.verification_method}`);
  await new Promise((r) => setTimeout(r, 500));

  const latency = Math.floor(Math.random() * 8) + 4; // 4-12ms
  logs.push(`[Verification Passed] Health probe HTTP 200 OK (Latency: ${latency}ms, Error rate: 0.00%)`);

  return {
    success: true,
    action_id: action.action_id,
    action_name: action.name,
    executed_at: new Date().toISOString(),
    execution_log: logs,
    verification: {
      passed: true,
      method: action.verification_method,
      details: `Health check passed with 0% error rate (Latency: ${latency}ms). Subsystem status: HEALTHY.`,
      latency_ms: latency,
    },
  };
}
