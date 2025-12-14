/**
 * Express server with tRPC
 * Dependencies: express, @trpc/server
 * Purpose: Main API server
 */
import express from 'express';
import cors from 'cors';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { appRouter } from './router';
import { rateLimitMiddleware } from './middleware/ratelimit';
import { createWorker } from './agents';
import { redis } from './lib/redis';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use(
  '/api/trpc',
  rateLimitMiddleware,
  createExpressMiddleware({
    router: appRouter,
    createContext: ({ req, res }) => ({ req, res }),
  })
);

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', version: '1.0.0' });
});

app.get('/api/report/:jobId', async (req, res) => {
  const { jobId } = req.params;
  const reportData = await redis.get(`report:${jobId}`);
  if (!reportData) {
    return res.status(404).json({ error: 'REPORT_NOT_FOUND' });
  }
  const report = process.env.REDIS_URL ? JSON.parse(reportData) : reportData;
  res.json(report);
});

const worker = createWorker('scan-queue');

app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});

