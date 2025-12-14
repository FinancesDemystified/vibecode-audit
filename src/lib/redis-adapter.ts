/**
 * Redis adapter supporting both Upstash and standard Redis
 * Dependencies: @upstash/redis or ioredis
 * Purpose: Unified Redis interface for job state
 */
import IORedis from 'ioredis';

let redisClient: IORedis | any;

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
} else {
  throw new Error('REDIS_URL or UPSTASH_REDIS_URL must be set');
}

export const redis = redisClient;

