import dotenv from 'dotenv';
import path from 'path';

// Load env from backend/.env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';

// ============================================================
// Knowledge Base Articles
// ============================================================

const KNOWLEDGE_ARTICLES = [
  {
    title: 'VPN Troubleshooting Guide',
    category: 'Network & VPN',
    tags: ['vpn', 'network', 'connectivity', 'remote-access'],
    content: `# VPN Troubleshooting Guide

## Common VPN Issues and Resolutions

### Issue: Cannot Connect to VPN
**Symptoms:** Connection times out, authentication fails, or VPN client shows "disconnected"

**Resolution Steps:**
1. Verify VPN credentials are correct and not expired
2. Check if your account is locked — reset password if needed
3. Delete and recreate the VPN profile from scratch
4. Clear VPN client cache and configuration files
5. Try connecting to a different VPN server endpoint
6. Disable and re-enable the network adapter
7. Flush DNS cache: Run "ipconfig /flushdns" (Windows) or "sudo dscacheutil -flushcache" (Mac)
8. Temporarily disable firewall/antivirus to test
9. Try on a different network (mobile hotspot) to rule out ISP blocking

### Issue: VPN Connects But Cannot Access Internal Resources
**Symptoms:** VPN shows "connected" but cannot reach internal servers/websites

**Resolution Steps:**
1. Check split tunneling configuration
2. Verify DNS settings are set to use internal DNS server
3. Test with IP address instead of hostname to rule out DNS issue
4. Contact network team to verify your account has correct VPN group permissions

### Issue: VPN Disconnects Frequently
**Resolution Steps:**
1. Check internet connection stability
2. Increase VPN keepalive interval
3. Update VPN client to latest version
4. Check for network adapter driver updates

**Escalation:** If none of the above resolve the issue, escalate to Network Operations team.`,
  },
  {
    title: 'Email & Outlook Troubleshooting',
    category: 'Email & Communication',
    tags: ['email', 'outlook', 'exchange', 'smtp', 'calendar'],
    content: `# Email Troubleshooting Guide

## Common Email Issues

### Issue: Cannot Send/Receive Emails
**Resolution Steps:**
1. Check internet and network connectivity first
2. Verify Outlook is connected to Exchange server (bottom status bar)
3. Clear Outlook cache: Delete OST file and let it rebuild
4. Run Outlook in Safe Mode: outlook.exe /safe
5. Remove and re-add email account in Outlook
6. Check mailbox size — if full, archive or delete old emails
7. Verify Exchange server status with IT team

### Issue: Cannot Access Webmail
**Resolution Steps:**
1. Clear browser cache and cookies
2. Try incognito/private browsing mode
3. Verify you're using the correct webmail URL
4. Check if VPN is required for webmail access

### Issue: Email Sync Issues on Mobile
**Resolution Steps:**
1. Remove and re-add corporate email account
2. Ensure Intune/MDM enrollment is complete
3. Update Outlook mobile app

**Escalation:** Exchange server issues escalate to Email Team.`,
  },
  {
    title: 'Password Reset & Account Lockout Guide',
    category: 'Authentication & Access',
    tags: ['password', 'account', 'lockout', 'active-directory', 'sso', 'mfa'],
    content: `# Password Reset & Account Management

## Self-Service Password Reset
1. Navigate to password reset portal: https://passwordreset.company.com
2. Enter your employee email address
3. Complete MFA verification (authenticator app or SMS)
4. Follow prompts to set new password

## Account Lockout Resolution
**Cause:** Accounts lock after 5 failed login attempts (configurable)

**Resolution Steps:**
1. Wait 15 minutes for automatic unlock (if auto-unlock is enabled)
2. Contact IT Helpdesk for immediate unlock
3. Helpdesk will verify identity and unlock account in Active Directory
4. Check for saved incorrect passwords on devices (phones, laptops) that may be causing repeated failures

## MFA Issues
1. Resync authenticator app time settings
2. Use backup codes if available
3. Contact IT Helpdesk to reset MFA enrollment

## SSO / Single Sign-On Issues
1. Clear browser cookies and cache
2. Try different browser
3. Ensure Okta/Azure AD session is fresh
4. Check if account has required app permissions

**Escalation:** Active Directory issues → IT Helpdesk → Windows/AD Team.`,
  },
  {
    title: 'Network Connectivity Troubleshooting',
    category: 'Network & VPN',
    tags: ['network', 'wifi', 'ethernet', 'connectivity', 'dns', 'dhcp'],
    content: `# Network Connectivity Guide

## Basic Connectivity Checks
1. Check physical connections (Ethernet cable, WiFi enabled)
2. Run ipconfig /all to verify IP assignment
3. Ping default gateway: ping 192.168.1.1 (or your gateway)
4. Ping DNS server: ping 8.8.8.8
5. Run tracert to identify where packets drop

## WiFi Issues
1. Forget and reconnect to WiFi network
2. Check if you're on the correct SSID (corporate vs guest)
3. Move closer to access point
4. Check for IP conflicts
5. Renew DHCP: ipconfig /release then ipconfig /renew

## DNS Issues
**Symptoms:** Can ping IPs but not hostnames
1. Check DNS server settings
2. Flush DNS cache: ipconfig /flushdns
3. Try changing to alternate DNS server temporarily

## Slow Network
1. Run speed test to verify bandwidth
2. Check for large file transfers consuming bandwidth
3. Contact Network Operations for bandwidth analysis

**Escalation:** Infrastructure or outage issues → Network Operations.`,
  },
  {
    title: 'Laptop & Endpoint Troubleshooting',
    category: 'Hardware & Endpoint',
    tags: ['laptop', 'hardware', 'performance', 'blue-screen', 'bsod', 'drivers'],
    content: `# Laptop & Endpoint Troubleshooting

## Performance Issues
1. Check Task Manager for CPU/Memory usage
2. End unnecessary background processes
3. Run disk cleanup
4. Check for pending Windows updates (can cause slowness)
5. Verify sufficient free disk space (minimum 15% free)

## Blue Screen / BSOD
1. Note the error code displayed
2. Restart and check Event Viewer for crash details
3. Run Windows Memory Diagnostic
4. Check for recent driver or Windows updates
5. Run sfc /scannow to check system files

## Application Crashes
1. Update the application to latest version
2. Run as Administrator
3. Clear application cache/temp files
4. Reinstall the application
5. Check Event Viewer > Application logs

## Hardware Issues
- Keyboard/Mouse not working: Try USB reset, check Device Manager
- Screen flickering: Update display drivers
- Battery not charging: Check power adapter, run battery diagnostics

**Escalation:** Hardware failure → Hardware Support team for physical inspection/replacement.`,
  },
  {
    title: 'Printer & Printing Troubleshooting',
    category: 'Hardware & Endpoint',
    tags: ['printer', 'printing', 'driver', 'print-queue', 'network-printer'],
    content: `# Printer Troubleshooting Guide

## Printer Not Found
1. Verify printer is powered on and online
2. Check network connection on printer display
3. Try adding printer manually by IP address
4. Download and install latest printer driver

## Print Jobs Stuck in Queue
1. Open Print Queue and cancel all pending jobs
2. Stop Print Spooler service: net stop spooler
3. Delete files in C:\\Windows\\System32\\spool\\PRINTERS
4. Start Print Spooler: net start spooler
5. Retry printing

## Poor Print Quality
1. Run printer self-test/nozzle check
2. Clean print heads
3. Replace low ink/toner cartridges
4. Check paper type matches printer settings

**Escalation:** Network printer issues → Hardware Support.`,
  },
  {
    title: 'Security Incident Response Basics',
    category: 'Security',
    tags: ['security', 'phishing', 'malware', 'ransomware', 'data-breach', 'incident-response'],
    content: `# Security Incident Response Guide

## Suspected Phishing Email
1. Do NOT click any links or download attachments
2. Report via "Report Phishing" button in Outlook
3. Forward email to security@company.com
4. Delete the email from inbox
5. If you DID click a link, immediately contact Security Operations

## Suspected Malware/Ransomware
**IMMEDIATE ACTIONS:**
1. Disconnect from network IMMEDIATELY (unplug ethernet, disable WiFi)
2. Do NOT shut down the computer (preserves forensic evidence)
3. Call Security Operations hotline immediately
4. Document what you were doing when symptoms appeared

## Unauthorized Access
1. Immediately change passwords for compromised accounts
2. Report to Security Operations team
3. Do not delete any evidence
4. Preserve logs and screenshots

## Data Breach
1. Stop any data transfer immediately
2. Report to Security Operations and Legal team
3. Document what data may have been exposed

**CRITICAL:** All security incidents are P1/Critical priority.
Security Operations team: security-ops@company.com | Emergency: +1-800-SEC-HELP`,
  },
];

// ============================================================
// MAIN SEED FUNCTION
// ============================================================

async function seedKnowledgeBase() {
  console.log('\n🚀 SignalDesk Knowledge Base Seeding\n');

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

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
  );

  const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

  console.log(`📚 Seeding ${KNOWLEDGE_ARTICLES.length} knowledge articles...\n`);

  let seeded = 0;
  let skipped = 0;

  for (const article of KNOWLEDGE_ARTICLES) {
    process.stdout.write(`  Embedding: ${article.title}... `);

    try {
      // Generate embedding
      const response = await genAI.models.embedContent({
        model: 'gemini-embedding-001',
        contents: `${article.title}\n\n${article.content}`,
        config: {
          taskType: 'RETRIEVAL_DOCUMENT',
          outputDimensionality: 768,
        },
      });

      const embedding = response.embeddings?.[0]?.values;
      if (!embedding || embedding.length !== 768) {
        console.log('⚠️ Embedding failed — skipping');
        skipped++;
        continue;
      }

      // Check if article already exists
      const { data: existing } = await supabase
        .from('knowledge_articles')
        .select('id')
        .eq('title', article.title)
        .limit(1);

      let error;
      if (existing && existing.length > 0) {
        const res = await supabase
          .from('knowledge_articles')
          .update({
            content: article.content,
            category: article.category,
            tags: article.tags,
            embedding: `[${embedding.join(',')}]`,
          })
          .eq('id', existing[0].id);
        error = res.error;
      } else {
        const res = await supabase
          .from('knowledge_articles')
          .insert({
            title: article.title,
            content: article.content,
            category: article.category,
            tags: article.tags,
            embedding: `[${embedding.join(',')}]`,
          });
        error = res.error;
      }

      if (error) {
        console.log(`❌ Error: ${error.message}`);
        skipped++;
      } else {
        console.log('✅');
        seeded++;
      }

      // Rate limit delay
      await new Promise((r) => setTimeout(r, 500));
    } catch (err) {
      console.log(`❌ ${err instanceof Error ? err.message : 'Unknown error'}`);
      skipped++;
    }
  }

  console.log(`\n✅ Knowledge base seeding complete`);
  console.log(`   Seeded: ${seeded}`);
  console.log(`   Skipped: ${skipped}\n`);
}

seedKnowledgeBase().catch(console.error);
