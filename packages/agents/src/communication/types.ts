/**
 * Event bus type definitions
 * Dependencies: @vibecode-audit/shared
 * Purpose: Type definitions for event bus communication
 */
import type { AgentEvent } from '@vibecode-audit/shared';

export type EventHandler = (event: AgentEvent) => void | Promise<void>;

export interface Subscription {
  unsubscribe: () => Promise<void>;
}

export interface EventBus {
  publish: (jobId: string, event: AgentEvent) => Promise<void>;
  subscribe: (jobId: string, handler: EventHandler) => Promise<Subscription>;
}

