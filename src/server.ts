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
import { securityHeadersMiddleware } from './middleware/security';
import { createWorker } from './agents';
import { redis } from './lib/redis';

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration
const allowedOrigins = [
  'https://vibecodeaudit.app',
  'https://www.vibecodeaudit.app',
  'https://web-ai-demystified-projects.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001',
];

app.disable('x-powered-by');
app.use(securityHeadersMiddleware);
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);

    // Allow any Vercel preview deployment
    if (origin && origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-trpc-source'],
}));
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

