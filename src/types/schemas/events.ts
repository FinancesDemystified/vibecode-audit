/**
 * Agent event schemas
 * Dependencies: zod
 * Purpose: Type-safe event definitions for agent communication
 */
import { z } from 'zod';

export const agentEventTypeSchema = z.enum([
  'agent.started',
  'agent.progress',
  'agent.completed',
  'agent.failed',
]);

export const agentEventSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('agent.started'),
    agent: z.string(),
    jobId: z.string().uuid(),
    timestamp: z.number(),
    data: z.record(z.unknown()).optional(),
  }),
  z.object({
    type: z.literal('agent.progress'),
    agent: z.string(),
    jobId: z.string().uuid(),
    timestamp: z.number(),
    progress: z.number().min(0).max(100),
    message: z.string().optional(),
    data: z.record(z.unknown()).optional(),
  }),
  z.object({
    type: z.literal('agent.completed'),
    agent: z.string(),
    jobId: z.string().uuid(),
    timestamp: z.number(),
    data: z.record(z.unknown()),
  }),
  z.object({
    type: z.literal('agent.failed'),
    agent: z.string(),
    jobId: z.string().uuid(),
    timestamp: z.number(),
    error: z.string(),
    data: z.record(z.unknown()).optional(),
  }),
]);

export type AgentEventType = z.infer<typeof agentEventTypeSchema>;
export type AgentEvent = z.infer<typeof agentEventSchema>;

