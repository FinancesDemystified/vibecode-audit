/**
 * Health check endpoint
 * Dependencies: @trpc/server
 * Purpose: Health check for monitoring
 */
import { z } from 'zod';
import { publicProcedure, router } from '../trpc';

export const healthRouter = router({
  check: publicProcedure.query(() => ({
    status: 'healthy',
    version: '1.0.0',
    timestamp: Date.now(),
  })),
});

