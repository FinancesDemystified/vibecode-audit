import { router } from '../trpc';
import { healthRouter } from './health';
import { scanRouter } from './scan';

export const appRouter = router({
  health: healthRouter,
  scan: scanRouter,
});

export type AppRouter = typeof appRouter;

