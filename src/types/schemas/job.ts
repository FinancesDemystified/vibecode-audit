/**
 * Job state schema
 * Dependencies: zod
 * Purpose: Define job lifecycle states and validation
 */
import { z } from 'zod';

export const jobStatusSchema = z.enum([
  'pending',
  'scanning',
  'authenticating',
  'analyzing',
  'generating',
  'completed',
  'failed',
]);

export const jobSchema = z.object({
  id: z.string().uuid(),
  url: z.string().url(),
  status: jobStatusSchema,
  createdAt: z.number(),
  completedAt: z.number().optional(),
  progress: z.number().min(0).max(100).optional(),
  reportUrl: z.string().url().optional(),
  error: z.string().optional(),
  email: z.string().email().optional(),
});

export type JobStatus = z.infer<typeof jobStatusSchema>;
export type Job = z.infer<typeof jobSchema>;

