/**
 * Report structure schema
 * Dependencies: zod
 * Purpose: Define security report structure and validation
 */
import { z } from 'zod';

export const CopyAnalysisSchema = z.object({
  overallScore: z.number(),
  clarity: z.object({
    score: z.number(),
    fleschKincaid: z.number(),
    averageSentenceLength: z.number(),
    jargonLevel: z.enum(['low', 'medium', 'high']),
    issues: z.array(z.string()),
  }),
  persuasion: z.object({
    score: z.number(),
    framework: z.object({
      aida: z.object({ score: z.number(), present: z.boolean(), gaps: z.array(z.string()) }),
      pas: z.object({ score: z.number(), present: z.boolean(), gaps: z.array(z.string()) }),
      valueProposition: z.object({ score: z.number(), present: z.boolean(), gaps: z.array(z.string()) }),
    }),
    emotionalTriggers: z.array(z.string()),
    socialProof: z.object({ present: z.boolean(), quality: z.enum(['weak', 'moderate', 'strong']) }),
    urgency: z.object({ present: z.boolean(), type: z.array(z.string()) }),
  }),
  conversion: z.object({
    score: z.number(),
    cta: z.object({
      count: z.number(),
      clarity: z.number(),
      actionOriented: z.number(),
      examples: z.array(z.string()),
      issues: z.array(z.string()),
    }),
    trustSignals: z.array(z.object({
      type: z.enum(['testimonial', 'social-proof', 'guarantee', 'certification', 'security']),
      strength: z.enum(['weak', 'moderate', 'strong']),
      description: z.string(),
    })),
    frictionPoints: z.array(z.object({
      type: z.string(),
      severity: z.enum(['low', 'medium', 'high']),
      description: z.string(),
      fix: z.string(),
    })),
    benefitsVsFeatures: z.object({ benefits: z.number(), features: z.number(), ratio: z.number() }),
  }),
  brandVoice: z.object({
    score: z.number(),
    tone: z.array(z.string()),
    consistency: z.number(),
    personality: z.string(),
    authenticity: z.number(),
  }),
  seoReadiness: z.object({
    score: z.number(),
    keywordDensity: z.number(),
    headlineOptimization: z.number(),
    metaDescription: z.object({ present: z.boolean(), quality: z.number() }),
  }),
  recommendations: z.array(z.object({
    category: z.string(),
    priority: z.enum(['critical', 'high', 'medium', 'low']),
    issue: z.string(),
    fix: z.string(),
    impact: z.string(),
    effort: z.enum(['low', 'medium', 'high']),
    example: z.string().optional(),
  })),
  detailedFindings: z.array(z.object({
    section: z.string(),
    current: z.string(),
    issues: z.array(z.string()),
    suggestion: z.string(),
    rationale: z.string(),
  })),
});

export const findingExplanationSchema = z.object({
  type: z.string(),
  whatItMeans: z.string(),
  whyItsAProblem: z.string(),
  whoItAffects: z.string(),
  whenItMatters: z.string(),
});

export const findingSchema = z.object({
  type: z.string(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  evidence: z.string(),
  cwe: z.string().optional(),
  recommendation: z.string(),
  explanation: findingExplanationSchema.optional(),
});

export const recommendationSchema = z.object({
  priority: z.enum(['low', 'medium', 'high']),
  action: z.string(),
  effort: z.enum(['low', 'medium', 'high']),
});

export const analysisSchema = z.object({
  score: z.number().min(1).max(10),
  summary: z.string(),
  findingsExplained: z.array(findingExplanationSchema).optional(),
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
  copyAnalysis: CopyAnalysisSchema.optional(),
  metadata: z.object({
    version: z.string(),
    scanDuration: z.number(),
  }),
});

export type CopyAnalysis = z.infer<typeof CopyAnalysisSchema>;
export type Finding = z.infer<typeof findingSchema>;
export type Recommendation = z.infer<typeof recommendationSchema>;
export type Analysis = z.infer<typeof analysisSchema>;
export type Report = z.infer<typeof reportSchema>;

