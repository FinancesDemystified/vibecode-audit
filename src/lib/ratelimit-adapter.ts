/**
 * Rate limiter supporting both Upstash and standard Redis
 * Dependencies: ioredis or @upstash/ratelimit
 * Purpose: Rate limit scans to 3 per IP per day
 */
import IORedis from 'ioredis';

let ratelimitInstance: any | null = null;

function getRatelimit() {
  if (ratelimitInstance) return ratelimitInstance;
  
  if (process.env.REDIS_URL) {
    const redis = new IORedis(process.env.REDIS_URL, {
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
        console.error('[RateLimit Redis] Error:', err.message);
      }
    });

    ratelimitInstance = {
      limit: async (identifier: string) => {
        const key = `ratelimit:${identifier}`;
        const now = Date.now();
        const windowMs = 24 * 60 * 60 * 1000;
        const limit = 3;

        const pipeline = redis.pipeline();
        pipeline.zremrangebyscore(key, 0, now - windowMs);
        pipeline.zcard(key);
        pipeline.zadd(key, now, `${now}-${Math.random()}`);
        pipeline.expire(key, Math.ceil(windowMs / 1000));
        const results = await pipeline.exec();

        const count = (results?.[1]?.[1] as number) || 0;
        const success = count < limit;

        if (success && results?.[2]) {
          await results[2][1];
        }

        return {
          success,
          limit,
          remaining: Math.max(0, limit - count - 1),
          reset: now + windowMs,
        };
      },
    };
  } else if (process.env.UPSTASH_REDIS_URL) {
    const { Ratelimit } = require('@upstash/ratelimit');
    const { Redis } = require('@upstash/redis');

    const redisClient = new Redis({
      url: process.env.UPSTASH_REDIS_URL,
      token: process.env.UPSTASH_REDIS_TOKEN!,
    });

    ratelimitInstance = new Ratelimit({
      redis: redisClient,
      limiter: Ratelimit.slidingWindow(parseInt(process.env.RATE_LIMIT_MAX || '10', 10), '1 d'),
      analytics: true,
    });
  } else {
    throw new Error('REDIS_URL or UPSTASH_REDIS_URL must be set');
  }
  
  return ratelimitInstance;
}

export const ratelimit = new Proxy({} as any, {
  get(_target, prop) {
    const instance = getRatelimit();
    const value = instance[prop];
    return typeof value === 'function' ? value.bind(instance) : value;
  }
});

