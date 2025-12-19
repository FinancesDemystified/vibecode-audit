/**
 * BullMQ queue configuration
 * Dependencies: bullmq, @upstash/redis
 * Purpose: Job queue for async scan processing
 */
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_URL;
const redisConnection = redisUrl ? new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    if (times > 10) {
      console.error('[Queue Redis] Max retries exceeded');
      return null;
    }
    return delay;
  },
  reconnectOnError(err) {
    return ['READONLY', 'ECONNREFUSED', 'ETIMEDOUT'].some(e => err.message.includes(e));
  },
}) : null;

if (redisConnection) {
  redisConnection.on('error', (err: Error) => {
    if (!err.message.includes('ENOTFOUND') && !err.message.includes('ECONNREFUSED')) {
      console.error('[Queue Redis] Error:', err.message);
    }
  });
}

export const scanQueue = redisConnection ? new Queue('scan-queue', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
}) : null;

