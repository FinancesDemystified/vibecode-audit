/**
 * Redis adapter supporting both Upstash and standard Redis
 * Dependencies: @upstash/redis or ioredis
 * Purpose: Unified Redis interface for job state
 */
import IORedis from 'ioredis';

let redisClient: IORedis | any | null = null;

function getRedis() {
  if (redisClient) return redisClient;
  
  if (process.env.REDIS_URL) {
    redisClient = new IORedis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
  } else if (process.env.UPSTASH_REDIS_URL) {
    const { Redis } = require('@upstash/redis');
    redisClient = new Redis({
      url: process.env.UPSTASH_REDIS_URL,
      token: process.env.UPSTASH_REDIS_TOKEN!,
    });
  } else if (process.env.NODE_ENV !== 'production') {
    // In-memory fallback for local dev
    const store = new Map<string, string>();
    redisClient = {
      get: async (k: string) => store.get(k) ?? null,
      set: async (k: string, v: string) => { store.set(k, v); return 'OK'; },
      del: async (k: string) => { store.delete(k); return 1; },
      exists: async (k: string) => store.has(k) ? 1 : 0,
      keys: async (p: string) => [...store.keys()].filter(k => k.startsWith(p.replace('*', ''))),
    };
    console.warn('[DEV] Using in-memory Redis fallback');
  } else {
    throw new Error('REDIS_URL or UPSTASH_REDIS_URL must be set');
  }
  
  return redisClient;
}

export const redis = new Proxy({} as any, {
  get(_target, prop) {
    const client = getRedis();
    const value = client[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  }
});

