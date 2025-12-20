/**
 * Scan procedures
 * Dependencies: @trpc/server, @vibecode-audit/shared
 * Purpose: Scan submission, status, and report endpoints
 */
import { z } from 'zod';
import { publicProcedure, router } from '../trpc';
import { urlSchema } from '../types';
import type { Job } from '../types';
import { scanQueue } from '../lib/queue';
import { redis } from '../lib/redis';
import { randomUUID } from 'crypto';
import { sendAccessEmail } from '../lib/email';
import { db } from '../lib/db';
import { emailCaptures, scanMetrics, reports } from '../lib/db/schema';
import { eq } from 'drizzle-orm';
import { encryptCredentials } from '../lib/encryption';
import { processInlineScan } from '../agents/orchestrator/inline-processor';

export const scanRouter = router({
  submit: publicProcedure
    .input(
      z.object({
        url: urlSchema,
        email: z.string().email().optional(),
        credentials: z.object({
          username: z.string().optional(),
          password: z.string().optional(),
          email: z.string().email().optional(),
        }).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const jobId = randomUUID();
      
      // Encrypt credentials if provided
      let encryptedCredentials = null;
      if (input.credentials) {
        encryptedCredentials = encryptCredentials(input.credentials);
      }
      
      const job = {
        id: jobId,
        url: input.url,
        status: 'pending' as const,
        createdAt: Date.now(),
        email: input.email,
        credentials: encryptedCredentials || input.credentials, // Store encrypted or plaintext
      };

      if (process.env.REDIS_URL) {
        await redis.setex(`job:${jobId}`, 2592000, JSON.stringify(job));
      } else {
        await redis.setex(`job:${jobId}`, 2592000, job);
      }
      
      if (scanQueue) {
        // Production: Use BullMQ queue
        await scanQueue.add('scan', { 
          url: input.url, 
          email: input.email, 
          jobId,
          credentials: input.credentials,
        });
      } else {
        // Dev: Process inline (no Redis/BullMQ)
        processInlineScan(jobId, input.url, input.credentials).catch(err => {
          console.error('[Inline Scan] Failed:', err);
        });
      }

      return { jobId, status: 'pending' };
    }),

  status: publicProcedure
    .input(z.object({ jobId: z.string().uuid() }))
    .query(async ({ input }) => {
      const jobData = await redis.get(`job:${input.jobId}`);
      if (!jobData) {
        throw new Error('JOB_NOT_FOUND');
      }
      const job = process.env.REDIS_URL ? JSON.parse(jobData) : jobData;
      return {
        status: job.status,
        progress: job.progress || 0,
        currentStage: job.currentStage || '',
        stageMessage: job.stageMessage || '',
        reportUrl: job.reportUrl,
        error: job.error,
      };
    }),

  report: publicProcedure
    .input(z.object({ jobId: z.string().uuid() }))
    .query(async ({ input }) => {
      // Check DB first for long-term persistence
      try {
        const dbReport = await db.select().from(reports).where(eq(reports.jobId, input.jobId)).limit(1);
        if (dbReport.length > 0) {
          return dbReport[0].reportData;
        }
      } catch (dbError) {
        console.error('[Scan Router] DB query failed, falling back to Redis:', dbError);
      }

      // Fallback to Redis cache
      const reportData = await redis.get(`report:${input.jobId}`);
      if (!reportData) {
        throw new Error('REPORT_NOT_FOUND');
      }
      return process.env.REDIS_URL ? JSON.parse(reportData) : reportData;
    }),

  // Preview endpoint - shows limited info without email
  preview: publicProcedure
    .input(z.object({ jobId: z.string().uuid() }))
    .query(async ({ input }) => {
      // Check DB first for long-term persistence
      let fullReport: any;
      try {
        const dbReport = await db.select().from(reports).where(eq(reports.jobId, input.jobId)).limit(1);
        if (dbReport.length > 0) {
          fullReport = dbReport[0].reportData;
        }
      } catch (dbError) {
        console.error('[Scan Router] DB query failed, falling back to Redis:', dbError);
      }

      // Fallback to Redis cache
      if (!fullReport) {
        const reportData = await redis.get(`report:${input.jobId}`);
        if (!reportData) {
          throw new Error('REPORT_NOT_FOUND');
        }
        fullReport = process.env.REDIS_URL ? JSON.parse(reportData) : reportData;
      }
      
      // Return only preview data
      return {
        jobId: fullReport.jobId,
        url: fullReport.url,
        score: fullReport.score,
        timestamp: fullReport.timestamp,
        previewSummary: fullReport.previewSummary || null,
        techStack: fullReport.techStack,
        findingsSummary: {
          total: fullReport.findings?.length || 0,
          critical: fullReport.findings?.filter((f: any) => f.severity === 'critical').length || 0,
          high: fullReport.findings?.filter((f: any) => f.severity === 'high').length || 0,
          medium: fullReport.findings?.filter((f: any) => f.severity === 'medium').length || 0,
          low: fullReport.findings?.filter((f: any) => f.severity === 'low').length || 0,
          // Vague descriptions without evidence
          preview: fullReport.findings?.slice(0, 3).map((f: any) => ({
            type: f.type,
            severity: f.severity,
            // Remove evidence and recommendations
          })) || [],
        },
        vibeCodingSummary: fullReport.vibeCodingVulnerabilities ? {
          overallRisk: fullReport.vibeCodingVulnerabilities.overallRisk || null,
          score: fullReport.vibeCodingVulnerabilities.score || null,
          secretsCount: fullReport.vibeCodingVulnerabilities.hardCodedSecrets?.length || 0,
          clientSideAuthDetected: fullReport.vibeCodingVulnerabilities.clientSideAuth?.detected || false,
          unauthenticatedApisCount: fullReport.vibeCodingVulnerabilities.unauthenticatedApiAccess?.length || 0,
          misconfigurationsCount: fullReport.vibeCodingVulnerabilities.backendMisconfigurations?.length || 0,
        } : null,
        deepSecuritySummary: {
          overallScore: fullReport.deepSecurity?.overallScore,
          hasPrivacyPolicy: fullReport.deepSecurity?.securityCopyAnalysis?.privacyPolicy?.found || false,
          hasSecurityPage: fullReport.deepSecurity?.securityCopyAnalysis?.securityPage?.found || false,
          hasSecureCookies: fullReport.deepSecurity?.authenticationTesting?.sessionManagement?.secureCookies || false,
        },
      };
    }),

  // Send 6-digit verification code via email
  requestAccess: publicProcedure
    .input(z.object({ 
      jobId: z.string().uuid(),
      email: z.string().email(),
      name: z.string().optional(),
      phone: z.string().optional(),
      company: z.string().optional(),
      marketingOptIn: z.boolean().default(false),
      productOptIn: z.boolean().default(false),
    }))
    .mutation(async ({ input }) => {
      // Verify report exists
      const reportData = await redis.get(`report:${input.jobId}`);
      if (!reportData) {
        throw new Error('REPORT_NOT_FOUND');
      }

      const report = process.env.REDIS_URL ? JSON.parse(reportData) : reportData;

      // Generate 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Store code in Redis (5 min TTL)
      await redis.setex(`verify:${input.email}:${input.jobId}`, 300, code);
      
      // Generate access token for later
      const accessToken = randomUUID();
      
      
      // Save lead to database (before email sends)
      const issuesFound = report.findings?.length || 0;
      const criticalCount = report.findings?.filter((f: any) => f.severity === 'critical').length || 0;
      
      try {
        await db.insert(emailCaptures).values({
          email: input.email,
          jobId: input.jobId,
          accessToken,
          name: input.name,
          phone: input.phone,
          company: input.company,
          marketingOptIn: input.marketingOptIn,
          productOptIn: input.productOptIn,
          scannedUrl: report.url,
          issuesFound,
          criticalCount,
          securityScore: report.score,
          techStack: report.techStack,
          emailSentAt: new Date(),
        });
      } catch (dbError) {
        console.error('Database save failed:', dbError);
      }

      // Send verification code email
      try {
        const { sendVerificationEmail } = await import('../lib/email');
        await sendVerificationEmail({
          email: input.email,
          name: input.name,
          code,
          url: report.url,
        });
      } catch (error) {
        console.error('Failed to send email:', error);
        throw new Error('Failed to send email. Please try again.');
      }

      return { 
        success: true,
        message: 'Verification code sent to your email',
        // Return code in dev mode for testing
        ...(process.env.NODE_ENV === 'development' && { code })
      };
    }),

  // Verify code and unlock report
  verifyCode: publicProcedure
    .input(z.object({ 
      jobId: z.string().uuid(),
      email: z.string().email(),
      code: z.string().length(6),
    }))
    .mutation(async ({ input }) => {
      const storedCode = await redis.get(`verify:${input.email}:${input.jobId}`);
      
      if (!storedCode || storedCode !== input.code) {
        throw new Error('Invalid or expired code');
      }

      // Delete used code
      await redis.del(`verify:${input.email}:${input.jobId}`);

      // Generate access token (30 day expiry)
      const accessToken = randomUUID();
      await redis.setex(
        `access:${accessToken}`,
        2592000,
        JSON.stringify({ 
          jobId: input.jobId, 
          email: input.email,
          createdAt: Date.now() 
        })
      );

      // Update database
      try {
        await db.update(emailCaptures)
          .set({ 
            emailDelivered: true,
            reportAccessed: true,
            accessedAt: new Date(),
          })
          .where(eq(emailCaptures.jobId, input.jobId));
      } catch (error) {
        console.error('Failed to update access tracking:', error);
      }

      // Return full report
      const reportData = await redis.get(`report:${input.jobId}`);
      if (!reportData) {
        throw new Error('REPORT_NOT_FOUND');
      }

      const report = process.env.REDIS_URL ? JSON.parse(reportData) : reportData;

      return { 
        success: true,
        accessToken,
        report,
      };
    }),

  // Resend verification code
  resendCode: publicProcedure
    .input(z.object({ 
      jobId: z.string().uuid(),
      email: z.string().email(),
    }))
    .mutation(async ({ input }) => {
      const reportData = await redis.get(`report:${input.jobId}`);
      if (!reportData) {
        throw new Error('REPORT_NOT_FOUND');
      }

      const report = process.env.REDIS_URL ? JSON.parse(reportData) : reportData;
      
      // Generate new code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      await redis.setex(`verify:${input.email}:${input.jobId}`, 300, code);

      // Resend email with error handling
      try {
        const { sendVerificationEmail } = await import('../lib/email');
        await sendVerificationEmail({
          email: input.email,
          code,
          url: report.url,
        });
        console.log(`[ResendCode] Email sent to ${input.email}`);
      } catch (error) {
        console.error('[ResendCode] Failed to send email:', error);
        throw new Error('Failed to send email. Please try again.');
      }

      return { 
        success: true,
        message: 'New verification code sent',
        ...(process.env.NODE_ENV === 'development' && { code })
      };
    }),

  // Verify access token and return full report
  verifyAccess: publicProcedure
    .input(z.object({ 
      jobId: z.string().uuid(),
      token: z.string().uuid(),
    }))
    .query(async ({ input }) => {
      const tokenData = await redis.get(`access:${input.token}`);
      if (!tokenData) {
        throw new Error('INVALID_TOKEN');
      }

      const { jobId } = process.env.REDIS_URL ? JSON.parse(tokenData) : tokenData;
      if (jobId !== input.jobId) {
        throw new Error('TOKEN_MISMATCH');
      }

      // Update access tracking in database
      try {
        await db.update(emailCaptures)
          .set({ 
            reportAccessed: true,
            accessedAt: new Date(),
          })
          .where(eq(emailCaptures.accessToken, input.token));
      } catch (error) {
        console.error('Failed to update access tracking:', error);
        // Continue even if tracking fails
      }

      // Return full report
      const reportData = await redis.get(`report:${input.jobId}`);
      if (!reportData) {
        throw new Error('REPORT_NOT_FOUND');
      }

      return process.env.REDIS_URL ? JSON.parse(reportData) : reportData;
    }),
});

