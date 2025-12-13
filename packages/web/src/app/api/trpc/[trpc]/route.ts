import { fetchRequestHandler } from '@trpc/server/adapters/fetch';

async function getRouter() {
  const mod = await import('../../../../../../api/src/router');
  return mod.appRouter;
}

export async function GET(req: Request) {
  const router = await getRouter();
  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router,
    createContext: () => ({ req: undefined, res: undefined }),
  });
}

export async function POST(req: Request) {
  const router = await getRouter();
  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router,
    createContext: () => ({ req: undefined, res: undefined }),
  });
}
