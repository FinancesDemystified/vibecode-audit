/**
 * Redis adapter supporting both Upstash and standard Redis
 * Dependencies: @upstash/redis or ioredis
 * Purpose: Unified Redis interface for job state
 */
import IORedis from 'ioredis';

let redisClient: IORedis | any | null = null;

function getRedis() {
  if (redisClient) return redisClient;
  
  // Skip production Redis URLs when running locally
  const redisUrl = process.env.REDIS_URL;
  const isLocalDev = process.env.NODE_ENV !== 'production';
  const isProductionRedis = redisUrl?.includes('railway.internal') || redisUrl?.includes('.upstash.io');
  
  if (redisUrl && !(isLocalDev && isProductionRedis)) {
    redisClient = new IORedis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        if (times > 10) {
          console.error('[Redis] Max retries exceeded, stopping reconnection attempts');
          return null;
        }
        return delay;
      },
      reconnectOnError(err) {
        const targetErrors = ['READONLY', 'ECONNREFUSED', 'ETIMEDOUT'];
        if (targetErrors.some(e => err.message.includes(e))) {
          return true;
        }
        return false;
      },
    });

    redisClient.on('error', (err: Error) => {
      if (err.message.includes('ENOTFOUND') || err.message.includes('ECONNREFUSED')) {
        console.warn('[Redis] Connection error (non-fatal):', err.message);
      } else {
        console.error('[Redis] Error:', err.message);
      }
    });

    redisClient.on('connect', () => {
      console.log('[Redis] Connected');
    });

    redisClient.on('ready', () => {
      console.log('[Redis] Ready');
    });

    redisClient.on('close', () => {
      console.warn('[Redis] Connection closed');
    });
  } else if (process.env.UPSTASH_REDIS_URL) {
    const { Redis } = require('@upstash/redis');
    redisClient = new Redis({
      url: process.env.UPSTASH_REDIS_URL,
      token: process.env.UPSTASH_REDIS_TOKEN!,
    });
  } else if (process.env.NODE_ENV !== 'production') {
    // In-memory fallback for local dev
    const store = new Map<string, any>();
    redisClient = {
      get: async (k: string) => store.get(k) ?? null,
      set: async (k: string, v: any) => { store.set(k, v); return 'OK'; },
      setex: async (k: string, _ttl: number, v: any) => { store.set(k, v); return 'OK'; },
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

