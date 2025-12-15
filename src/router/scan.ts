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
import { emailCaptures, scanMetrics } from '../lib/db/schema';
import { eq } from 'drizzle-orm';

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
      const job = {
        id: jobId,
        url: input.url,
        status: 'pending' as const,
        createdAt: Date.now(),
        email: input.email,
        credentials: input.credentials,
      };

      if (process.env.REDIS_URL) {
        await redis.setex(`job:${jobId}`, 2592000, JSON.stringify(job));
      } else {
        await redis.setex(`job:${jobId}`, 2592000, job);
      }
      await scanQueue.add('scan', { 
        url: input.url, 
        email: input.email, 
        jobId,
        credentials: input.credentials,
      });

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
        progress: job.progress,
        reportUrl: job.reportUrl,
        error: job.error,
      };
    }),

  report: publicProcedure
    .input(z.object({ jobId: z.string().uuid() }))
    .query(async ({ input }) => {
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
      const reportData = await redis.get(`report:${input.jobId}`);
      if (!reportData) {
        throw new Error('REPORT_NOT_FOUND');
      }
      
      const fullReport = process.env.REDIS_URL ? JSON.parse(reportData) : reportData;
      
      // Return only preview data
      return {
        jobId: fullReport.jobId,
        url: fullReport.url,
        score: fullReport.score,
        timestamp: fullReport.timestamp,
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
        vibeCodingSummary: {
          overallRisk: fullReport.vibeCodingVulnerabilities?.overallRisk,
          score: fullReport.vibeCodingVulnerabilities?.score,
          secretsCount: fullReport.vibeCodingVulnerabilities?.hardCodedSecrets?.length || 0,
          clientSideAuthDetected: fullReport.vibeCodingVulnerabilities?.clientSideAuth?.detected || false,
          unauthenticatedApisCount: fullReport.vibeCodingVulnerabilities?.unauthenticatedApiAccess?.length || 0,
          misconfigurationsCount: fullReport.vibeCodingVulnerabilities?.backendMisconfigurations?.length || 0,
        },
        deepSecuritySummary: {
          overallScore: fullReport.deepSecurity?.overallScore,
          hasPrivacyPolicy: fullReport.deepSecurity?.securityCopyAnalysis?.privacyPolicy?.found || false,
          hasSecurityPage: fullReport.deepSecurity?.securityCopyAnalysis?.securityPage?.found || false,
          hasSecureCookies: fullReport.deepSecurity?.authenticationTesting?.sessionManagement?.secureCookies || false,
        },
      };
    }),

  // Generate and send access token via email
  requestAccess: publicProcedure
    .input(z.object({ 
      jobId: z.string().uuid(),
      email: z.string().email(),
    }))
    .mutation(async ({ input }) => {
      // Verify report exists
      const reportData = await redis.get(`report:${input.jobId}`);
      if (!reportData) {
        throw new Error('REPORT_NOT_FOUND');
      }

      const report = process.env.REDIS_URL ? JSON.parse(reportData) : reportData;

      // Generate access token
      const accessToken = randomUUID();
      
      // Store token mapping in Redis (expires in 30 days)
      await redis.setex(
        `access:${accessToken}`,
        2592000,
        JSON.stringify({ jobId: input.jobId, email: input.email, createdAt: Date.now() })
      );

      // Save to database
      const issuesFound = report.findings?.length || 0;
      const criticalCount = report.findings?.filter((f: any) => f.severity === 'critical').length || 0;
      
      try {
        await db.insert(emailCaptures).values({
          email: input.email,
          jobId: input.jobId,
          accessToken,
          scannedUrl: report.url,
          issuesFound,
          criticalCount,
          securityScore: report.score,
          techStack: report.techStack,
          emailSentAt: new Date(),
        });

        // Also save scan metrics if not already saved
        await db.insert(scanMetrics).values({
          jobId: input.jobId,
          url: report.url,
          status: 'completed',
          securityScore: report.score,
          totalIssues: issuesFound,
          criticalIssues: criticalCount,
          highIssues: report.findings?.filter((f: any) => f.severity === 'high').length || 0,
          mediumIssues: report.findings?.filter((f: any) => f.severity === 'medium').length || 0,
          lowIssues: report.findings?.filter((f: any) => f.severity === 'low').length || 0,
          techStack: report.techStack,
          scanDuration: report.metadata?.scanDuration,
          completedAt: new Date(),
        }).onConflictDoNothing();
      } catch (dbError) {
        console.error('Database save failed:', dbError);
        // Continue even if DB fails - don't block email
      }

      // Send email with access link
      try {
        await sendAccessEmail({
          email: input.email,
          jobId: input.jobId,
          accessToken,
          url: report.url,
          issuesFound,
          criticalCount,
        });

        // Update email delivery status
        await db.update(emailCaptures)
          .set({ emailDelivered: true })
          .where(eq(emailCaptures.accessToken, accessToken));
      } catch (error) {
        console.error('Failed to send email:', error);
        throw new Error('Failed to send email. Please try again.');
      }

      return { 
        success: true,
        message: 'Access link sent to your email. Check your inbox!',
        // Return token in dev mode for testing
        ...(process.env.NODE_ENV === 'development' && { 
          accessToken,
          accessUrl: `${process.env.WEB_URL || 'http://localhost:3000'}/?jobId=${input.jobId}&token=${accessToken}`
        })
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

