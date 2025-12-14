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
});

