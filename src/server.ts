/**
 * Express server with tRPC
 * Dependencies: express, @trpc/server
 * Purpose: Main API server
 */
import 'dotenv/config';
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

// SSE endpoint for real-time scan status updates
app.get('/api/scan/:jobId/stream', async (req, res) => {
  const { jobId } = req.params;
  
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
  
  const interval = setInterval(async () => {
    try {
      const jobData = await redis.get(`job:${jobId}`);
      if (!jobData) {
        clearInterval(interval);
        res.write(`data: ${JSON.stringify({ status: 'not_found', error: 'Job not found' })}\n\n`);
        res.end();
        return;
      }
      
      const job = process.env.REDIS_URL ? JSON.parse(jobData) : jobData;
      const status = {
        status: job.status,
        progress: job.progress,
        currentStage: job.currentStage,
        stageMessage: job.stageMessage,
        error: job.error,
      };
      
      res.write(`data: ${JSON.stringify(status)}\n\n`);
      
      if (job.status === 'completed' || job.status === 'failed') {
        clearInterval(interval);
        res.end();
      }
    } catch (err) {
      console.error('[SSE] Error streaming status:', err);
      clearInterval(interval);
      res.write(`data: ${JSON.stringify({ status: 'error', error: 'Failed to get status' })}\n\n`);
      res.end();
    }
  }, 1000);
  
  req.on('close', () => {
    clearInterval(interval);
    res.end();
  });
});

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

const server = app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Kill process: lsof -ti:${PORT} | xargs kill`);
    process.exit(1);
  }
  throw err;
});

