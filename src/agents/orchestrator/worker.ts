/**
 * BullMQ worker orchestrator
 * Dependencies: bullmq, @vibecode-audit/shared, @vibecode-audit/agents
 * Purpose: Orchestrate agent pipeline via event-driven pub/sub
 */
import { Worker, type Job as BullJob } from 'bullmq';
import IORedis from 'ioredis';
import { crawlUrl } from '../scanner/crawler';
import { extractSecurityData } from '../scanner/extractor';
import { discoverPostAuth } from '../scanner/post-auth-discoverer';
import { performAuthenticatedScan } from '../scanner/authenticated-crawler';
import { scanVulnerabilities } from '../analyzer/vulnerability';
import { analyzeSEO } from '../analyzer/seo';
import { copyAnalyzer } from '../analyzer/copy';
import { performDeepSecurityAnalysis } from '../analyzer/deep-security';
import { scanVibeCodingVulnerabilities } from '../analyzer/vibe-coding-vulnerabilities';
import { analyzeWithAI, generatePreviewSummary } from '../ai/groq';
import { generateReport } from '../reporter/generator';
import { eventBus } from '../communication';
import type { Job, JobStatus } from '../../types';
import { db } from '../../lib/db';
import { reports } from '../../lib/db/schema';
import { decryptCredentials } from '../../lib/encryption';

let redis: any;
if (process.env.REDIS_URL) {
  redis = new IORedis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      if (times > 10) {
        console.error('[Worker Redis] Max retries exceeded');
        return null;
      }
      return delay;
    },
    reconnectOnError(err) {
      return ['READONLY', 'ECONNREFUSED', 'ETIMEDOUT'].some(e => err.message.includes(e));
    },
  });

  redis.on('error', (err: Error) => {
    if (!err.message.includes('ENOTFOUND') && !err.message.includes('ECONNREFUSED')) {
      console.error('[Worker Redis] Error:', err.message);
    }
  });
} else if (process.env.UPSTASH_REDIS_URL) {
  const { Redis } = require('@upstash/redis');
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_URL,
    token: process.env.UPSTASH_REDIS_TOKEN!,
  });
} else if (process.env.NODE_ENV !== 'production') {
  // In-memory fallback for local dev
  const store = new Map<string, string>();
  redis = {
    get: async (k: string) => store.get(k) ?? null,
    set: async (k: string, v: string) => { store.set(k, v); return 'OK'; },
    setex: async (k: string, _ttl: number, v: string) => { store.set(k, v); return 'OK'; },
    del: async (k: string) => { store.delete(k); return 1; },
    exists: async (k: string) => store.has(k) ? 1 : 0,
    keys: async (p: string) => [...store.keys()].filter(k => k.startsWith(p.replace('*', ''))),
  };
  console.warn('[DEV] Worker using in-memory Redis fallback');
} else {
  throw new Error('REDIS_URL or UPSTASH_REDIS_URL must be set');
}

async function updateJobStatus(jobId: string, status: JobStatus, data?: Partial<Job>): Promise<void> {
  const key = `job:${jobId}`;
  const existing = await redis.get(key);
  const updated: Job = {
    ...(existing ? JSON.parse(existing) : {}),
    ...data,
    status,
  };
  if (process.env.REDIS_URL) {
    await redis.setex(key, 2592000, JSON.stringify(updated));
  } else {
    await redis.setex(key, 2592000, updated);
  }
}

const redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_URL;
const redisConnection = redisUrl
  ? new IORedis(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        if (times > 10) {
          console.error('[BullMQ Redis] Max retries exceeded');
          return null;
        }
        return delay;
      },
      reconnectOnError(err) {
        return ['READONLY', 'ECONNREFUSED', 'ETIMEDOUT'].some(e => err.message.includes(e));
      },
    })
  : null;

if (redisConnection) {
  redisConnection.on('error', (err: Error) => {
    if (!err.message.includes('ENOTFOUND') && !err.message.includes('ECONNREFUSED')) {
      console.error('[BullMQ Redis] Error:', err.message);
    }
  });
}

export function createWorker(queueName: string = 'scan-queue') {
  if (!redisConnection) {
    console.warn('[DEV] BullMQ worker disabled - no Redis connection');
    return null;
  }
  return new Worker(
    queueName,
    async (job: BullJob<{ url: string; email?: string; jobId: string; credentials?: { username?: string; password?: string; email?: string } | any }>) => {
      const { url, email, jobId, credentials: rawCredentials } = job.data;
      
      // Decrypt credentials if encrypted (backward compatible with plaintext)
      let credentials: { username?: string; password?: string; email?: string } | undefined = undefined;
      if (rawCredentials) {
        const decrypted = decryptCredentials(rawCredentials);
        if (decrypted) {
          credentials = decrypted;
        } else {
          // If decryption failed, try using raw credentials as-is (backward compat)
          credentials = typeof rawCredentials === 'string' ? JSON.parse(rawCredentials) : rawCredentials;
        }
      }

      try {
        // Stage 1: Discovery
        await updateJobStatus(jobId, 'scanning', { 
          progress: 3, 
          currentStage: 'Discovery', 
          stageMessage: 'Connecting to target...' 
        });

        const crawlResult = await crawlUrl(url, eventBus, jobId);
        
        await updateJobStatus(jobId, 'scanning', { 
          progress: 8, 
          currentStage: 'Discovery', 
          stageMessage: 'Mapping site architecture...' 
        });
        
        const securityData = await extractSecurityData(crawlResult, eventBus, jobId);
        
        await updateJobStatus(jobId, 'scanning', { 
          progress: 12, 
          currentStage: 'Discovery', 
          stageMessage: 'Detecting tech stack & frameworks...' 
        });
        
        await updateJobStatus(jobId, 'scanning', { 
          progress: 16, 
          currentStage: 'Discovery', 
          stageMessage: 'Finding login & auth endpoints...' 
        });
        
        const postAuthData = await discoverPostAuth(url, securityData, crawlResult.html, eventBus, jobId);
        
        // Stage 2: Content Analysis
        await updateJobStatus(jobId, 'scanning', { 
          progress: 22, 
          currentStage: 'Content Analysis', 
          stageMessage: 'Analyzing SEO & meta tags...' 
        });
        
        const seoData = await analyzeSEO(crawlResult, eventBus, jobId);
        
        await updateJobStatus(jobId, 'scanning', { 
          progress: 28, 
          currentStage: 'Content Analysis', 
          stageMessage: 'Auditing web copy & messaging...' 
        });
        
        await updateJobStatus(jobId, 'scanning', { 
          progress: 32, 
          currentStage: 'Content Analysis', 
          stageMessage: 'Checking trust signals & social proof...' 
        });
        const copyAnalysis = await copyAnalyzer.analyzeCopy(crawlResult.html, url);

        // If credentials provided, perform authenticated scan
        let authenticatedScan = null;
        if (credentials && (credentials.password || credentials.username || credentials.email)) {
          await updateJobStatus(jobId, 'authenticating', { 
            progress: 38, 
            currentStage: 'Auth Testing', 
            stageMessage: 'Testing login flow security...' 
          });
          authenticatedScan = await performAuthenticatedScan(
            url,
            credentials,
            securityData,
            eventBus,
            jobId
          );
        }

        // Stage 3: Security Scan
        await updateJobStatus(jobId, 'analyzing', { 
          progress: 42, 
          currentStage: 'Security Scan', 
          stageMessage: 'Testing for XSS vulnerabilities...' 
        });

        const findings = await scanVulnerabilities(securityData, eventBus, jobId);
        
        await updateJobStatus(jobId, 'analyzing', { 
          progress: 48, 
          currentStage: 'Security Scan', 
          stageMessage: 'Checking CORS & headers...' 
        });
        
        await updateJobStatus(jobId, 'analyzing', { 
          progress: 54, 
          currentStage: 'Security Scan', 
          stageMessage: 'Analyzing cookie security...' 
        });
        
        await updateJobStatus(jobId, 'analyzing', { 
          progress: 58, 
          currentStage: 'Deep Security', 
          stageMessage: 'Testing authentication bypass...' 
        });
        const deepSecurityAnalysis = await performDeepSecurityAnalysis(
          url,
          crawlResult,
          securityData,
          eventBus,
          jobId,
          credentials
        );
        
        // Vibe-coding vulnerability scan
        await updateJobStatus(jobId, 'analyzing', { 
          progress: 64, 
          currentStage: 'Vibe-Code Scan', 
          stageMessage: 'Scanning for hardcoded secrets...' 
        });
        
        await updateJobStatus(jobId, 'analyzing', { 
          progress: 68, 
          currentStage: 'Vibe-Code Scan', 
          stageMessage: 'Detecting exposed API keys...' 
        });
        
        await updateJobStatus(jobId, 'analyzing', { 
          progress: 72, 
          currentStage: 'Vibe-Code Scan', 
          stageMessage: 'Finding unprotected endpoints...' 
        });
        const vibeCodingVulns = await scanVibeCodingVulnerabilities(
          url,
          crawlResult,
          securityData,
          eventBus,
          jobId
        );
        
        // AI Analysis - real breach news
        const { getBreachNews } = await import('../../lib/news-fetcher');
        const news = await getBreachNews();
        const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)] || 'Analyzing patterns...';
        
        await updateJobStatus(jobId, 'analyzing', { 
          progress: 78, 
          currentStage: 'AI Analysis', 
          stageMessage: news.length ? `Recent breach: ${pick(news)}` : 'Analyzing vulnerability patterns...'
        });
        
        await updateJobStatus(jobId, 'analyzing', { 
          progress: 82, 
          currentStage: 'AI Analysis', 
          stageMessage: `Scoring against ${news.length || 'known'} vibe-code risks...`
        });
        const analysis = await analyzeWithAI(findings, securityData, eventBus, jobId);

        // Stage 4: Report Generation
        await updateJobStatus(jobId, 'generating', { 
          progress: 88, 
          currentStage: 'Generating Report', 
          stageMessage: 'Building remediation steps...' 
        });

        const { html, pdf } = await generateReport(analysis, findings, url, jobId, eventBus, vibeCodingVulns);

        const reportUrl = `/api/report/${jobId}`;
        const jobData = await redis.get(`job:${jobId}`);
        const job = jobData ? (process.env.REDIS_URL ? JSON.parse(jobData) : jobData) : null;
        
        // Format tech stack with inferences instead of null/undefined
        const formatTechStack = (ts: typeof securityData.techStack) => ({
          framework: ts.framework || 'Likely static site or SSG (framework not identified)',
          hosting: ts.hosting || (ts.server ? `Unknown hosting (server: ${ts.server})` : 'Hosting platform not identified'),
          platform: ts.platform || 'No-code platform not detected',
          server: ts.server || 'Server not identified',
        });

        // Format auth flow - add login attempt tracking
        // Note: has2FA indicates mentions found in UI/scripts, NOT actual enforcement requirement
        const formatAuthFlow = (af: typeof securityData.authFlow) => ({
          ...af,
          loginAttempted: credentials && (credentials.password || credentials.username || credentials.email) ? true : false,
        });

        // Merge findings explanations with findings
        const findingsWithExplanations = findings.map(finding => {
          const explanation = analysis.findingsExplained?.find(e => e.type === finding.type);
          return {
            ...finding,
            explanation: explanation || undefined,
          };
        });

        const report: any = {
          jobId,
          url,
          timestamp: Date.now(),
          score: analysis.score,
          summary: analysis.summary,
          findings: findingsWithExplanations,
          recommendations: analysis.recommendations,
          confidence: analysis.confidence,
          limitations: 'External-only scan. Upgrade for codebase review.',
          techStack: formatTechStack(securityData.techStack),
          authFlow: formatAuthFlow(securityData.authFlow),
          postAuth: {
            authMechanism: postAuthData.authMechanism,
            loginEndpoint: postAuthData.loginEndpoint || 'Login endpoint not found in public pages',
            protectedRoutes: postAuthData.protectedRoutes.length > 0 ? postAuthData.protectedRoutes : ['No protected routes detected'],
            dashboardDetected: postAuthData.dashboardIndicators.found,
            likelyFeatures: postAuthData.dashboardIndicators.features.length > 0 ? postAuthData.dashboardIndicators.features : ['No dashboard features detected'],
            securityIssues: postAuthData.securityIssues,
            recommendations: postAuthData.recommendations,
          },
          authenticatedScan: authenticatedScan ? {
            success: authenticatedScan.success,
            pagesScanned: authenticatedScan.authenticatedPages.length,
            authenticatedPages: authenticatedScan.authenticatedPages,
            apiEndpoints: authenticatedScan.apiEndpoints,
            errors: authenticatedScan.errors,
          } : null,
          seo: {
            metaTags: seoData.metaTags,
            openGraph: seoData.openGraph,
            twitterCard: seoData.twitterCard,
            structuredData: {
              hasJsonLd: seoData.structuredData.jsonLd.length > 0,
              hasMicrodata: seoData.structuredData.microdata,
              schemaTypes: seoData.structuredData.schemaTypes,
            },
            aiOptimization: seoData.aiOptimization,
            issues: seoData.issues,
          },
          copyAnalysis,
          deepSecurity: {
            securityCopyAnalysis: deepSecurityAnalysis.securityCopyAnalysis,
            authenticationTesting: deepSecurityAnalysis.authenticationTesting,
            behavioralTests: deepSecurityAnalysis.behavioralTests,
            claimVerification: deepSecurityAnalysis.claimVerification,
            recommendations: deepSecurityAnalysis.recommendations,
            overallScore: deepSecurityAnalysis.overallScore,
          },
          vibeCodingVulnerabilities: {
            hardCodedSecrets: vibeCodingVulns.hardCodedSecrets,
            clientSideAuth: vibeCodingVulns.clientSideAuth,
            unauthenticatedApiAccess: vibeCodingVulns.unauthenticatedApiAccess,
            backendMisconfigurations: vibeCodingVulns.backendMisconfigurations,
            fileUploadVulnerabilities: vibeCodingVulns.fileUploadVulnerabilities,
            backendLessPatterns: vibeCodingVulns.backendLessPatterns,
            recommendations: vibeCodingVulns.recommendations,
            overallRisk: vibeCodingVulns.overallRisk,
            score: vibeCodingVulns.score,
          },
          breachNews: news.slice(0, 5),
          metadata: {
            version: '1.0.0',
            scanDuration: Date.now() - (job?.createdAt || Date.now()),
          },
        };

        // Generate compelling preview summary
        await updateJobStatus(jobId, 'generating', { 
          progress: 92, 
          currentStage: 'Generating Report', 
          stageMessage: 'Creating summary...' 
        });
        try {
          const previewSummary = await generatePreviewSummary(report, eventBus, jobId);
          report.previewSummary = previewSummary;
        } catch (error) {
          console.error('[Worker] Failed to generate preview summary:', error);
        }

        if (process.env.REDIS_URL) {
          await redis.setex(`report:${jobId}`, 2592000, JSON.stringify(report));
        } else {
          await redis.setex(`report:${jobId}`, 2592000, report);
        }

        // Dual-write: Save to PostgreSQL for long-term persistence
        try {
          await db.insert(reports).values({
            jobId,
            url: job.url,
            reportData: report,
          }).onConflictDoUpdate({
            target: reports.jobId,
            set: {
              reportData: report,
              url: job.url,
            },
          });
        } catch (dbError) {
          console.error('[Worker] Failed to save report to DB:', dbError);
          // Continue even if DB fails - Redis is primary cache
        }

        await updateJobStatus(jobId, 'completed', {
          completedAt: Date.now(),
          progress: 100,
          currentStage: 'Complete',
          stageMessage: 'Scan complete!',
          reportUrl,
        });

        await eventBus.publish(jobId, {
          type: 'agent.completed',
          agent: 'orchestrator',
          jobId,
          timestamp: Date.now(),
          data: { status: 'completed', reportUrl },
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        await updateJobStatus(jobId, 'failed', {
          completedAt: Date.now(),
          error: errorMessage,
        });

        await eventBus.publish(jobId, {
          type: 'agent.failed',
          agent: 'orchestrator',
          jobId,
          timestamp: Date.now(),
          error: errorMessage,
        });

        throw error;
      }
    },
    {
      connection: redisConnection,
    }
  );
}

