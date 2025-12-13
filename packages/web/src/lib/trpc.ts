import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@vibecode-audit/api';

export const trpc = createTRPCReact<AppRouter>();

