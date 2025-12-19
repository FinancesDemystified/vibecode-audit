/**
 * Event bus using Redis pub/sub
 * Dependencies: @upstash/redis or ioredis
 * Purpose: Decoupled agent communication via events
 */
import type { AgentEvent } from '../../types';
import type { EventBus, EventHandler, Subscription } from './types';

let redis: any;

if (process.env.REDIS_URL) {
  const IORedis = require('ioredis');
  redis = new IORedis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      return times > 10 ? null : delay;
    },
    reconnectOnError(err) {
      return ['READONLY', 'ECONNREFUSED', 'ETIMEDOUT'].some(e => err.message.includes(e));
    },
  });

  redis.on('error', (err: Error) => {
    if (!err.message.includes('ENOTFOUND') && !err.message.includes('ECONNREFUSED')) {
      console.error('[EventBus Redis] Error:', err.message);
    }
  });
} else if (process.env.UPSTASH_REDIS_URL) {
  const { Redis } = require('@upstash/redis');
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_URL,
    token: process.env.UPSTASH_REDIS_TOKEN!,
  });
} else {
  // Create dummy client for dev
  redis = {
    publish: async () => {},
  };
}

export class RedisEventBus implements EventBus {
  private subscribers = new Map<string, Set<EventHandler>>();

  async publish(jobId: string, event: AgentEvent): Promise<void> {
    const channel = `job:${jobId}:events`;
    await redis.publish(channel, JSON.stringify(event));
  }

  async subscribe(jobId: string, handler: EventHandler): Promise<Subscription> {
    const channel = `job:${jobId}:events`;
    
    if (!this.subscribers.has(channel)) {
      this.subscribers.set(channel, new Set());
    }
    
    this.subscribers.get(channel)!.add(handler);

    const subscription: Subscription = {
      unsubscribe: async () => {
        const handlers = this.subscribers.get(channel);
        if (handlers) {
          handlers.delete(handler);
          if (handlers.size === 0) {
            this.subscribers.delete(channel);
          }
        }
      },
    };

    return subscription;
  }

  async handleMessage(channel: string, message: string): Promise<void> {
    const handlers = this.subscribers.get(channel);
    if (!handlers) return;

    try {
      const event = JSON.parse(message) as AgentEvent;
      await Promise.all(Array.from(handlers).map((handler) => handler(event)));
    } catch (error) {
      console.error(`Error handling event on ${channel}:`, error);
    }
  }
}

export const eventBus = new RedisEventBus();

