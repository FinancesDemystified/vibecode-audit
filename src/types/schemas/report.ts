/**
 * Report structure schema
 * Dependencies: zod
 * Purpose: Define security report structure and validation
 */
import { z } from 'zod';

export const findingSchema = z.object({
  type: z.string(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  evidence: z.string(),
  cwe: z.string().optional(),
  recommendation: z.string(),
});

export const recommendationSchema = z.object({
  priority: z.enum(['low', 'medium', 'high']),
  action: z.string(),
  effort: z.enum(['low', 'medium', 'high']),
});

export const analysisSchema = z.object({
  score: z.number().min(1).max(10),
  summary: z.string(),
  recommendations: z.array(recommendationSchema),
  confidence: z.number().min(0).max(1),
});

export const reportSchema = z.object({
  jobId: z.string().uuid(),
  url: z.string().url(),
  timestamp: z.number(),
  score: z.number().min(1).max(10),
  summary: z.string(),
  findings: z.array(findingSchema),
  recommendations: z.array(recommendationSchema),
  confidence: z.number().min(0).max(1),
  limitations: z.string(),
  metadata: z.object({
    version: z.string(),
    scanDuration: z.number(),
  }),
});

export type Finding = z.infer<typeof findingSchema>;
export type Recommendation = z.infer<typeof recommendationSchema>;
export type Analysis = z.infer<typeof analysisSchema>;
export type Report = z.infer<typeof reportSchema>;

