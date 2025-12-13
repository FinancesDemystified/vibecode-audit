/**
 * tRPC setup
 * Dependencies: @trpc/server
 * Purpose: tRPC router and procedure setup
 */
import { initTRPC } from '@trpc/server';
import { z } from 'zod';

const t = initTRPC.context<{ req?: any; res?: any }>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

