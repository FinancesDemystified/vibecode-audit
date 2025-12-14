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
import { analyzeWithAI } from '../ai/groq';
import { generateReport } from '../reporter/generator';
import { eventBus } from '../communication';
import type { Job, JobStatus } from '../../types';

let redis: any;
if (process.env.REDIS_URL) {
  redis = new IORedis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
} else if (process.env.UPSTASH_REDIS_URL) {
  const { Redis } = require('@upstash/redis');
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_URL,
    token: process.env.UPSTASH_REDIS_TOKEN!,
  });
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

const redisConnection = new IORedis(process.env.REDIS_URL || process.env.UPSTASH_REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

export function createWorker(queueName: string = 'scan-queue') {
  return new Worker(
    queueName,
    async (job: BullJob<{ url: string; email?: string; jobId: string; credentials?: { username?: string; password?: string; email?: string } }>) => {
      const { url, email, jobId, credentials } = job.data;

      try {
        await updateJobStatus(jobId, 'scanning');

        const crawlResult = await crawlUrl(url, eventBus, jobId);
        const securityData = await extractSecurityData(crawlResult, eventBus, jobId);
        const postAuthData = await discoverPostAuth(url, securityData, crawlResult.html, eventBus, jobId);
        const seoData = await analyzeSEO(crawlResult, eventBus, jobId);

        // If credentials provided, perform authenticated scan
        let authenticatedScan = null;
        if (credentials && (credentials.password || credentials.username || credentials.email)) {
          await updateJobStatus(jobId, 'authenticating');
          authenticatedScan = await performAuthenticatedScan(
            url,
            credentials,
            securityData,
            eventBus,
            jobId
          );
        }

        await updateJobStatus(jobId, 'analyzing');

        const findings = await scanVulnerabilities(securityData, eventBus, jobId);
        const analysis = await analyzeWithAI(findings, securityData, eventBus, jobId);

        await updateJobStatus(jobId, 'generating');

        const { html, pdf } = await generateReport(analysis, findings, url, jobId, eventBus);

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

        const report = {
          jobId,
          url,
          timestamp: Date.now(),
          score: analysis.score,
          summary: analysis.summary,
          findings,
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
          metadata: {
            version: '1.0.0',
            scanDuration: Date.now() - (job?.createdAt || Date.now()),
          },
        };
        if (process.env.REDIS_URL) {
          await redis.setex(`report:${jobId}`, 2592000, JSON.stringify(report));
        } else {
          await redis.setex(`report:${jobId}`, 2592000, report);
        }

        await updateJobStatus(jobId, 'completed', {
          completedAt: Date.now(),
          progress: 100,
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

