/**
 * Rate limit middleware
 * Dependencies: @vibecode-audit/api/lib/ratelimit
 * Purpose: Middleware to enforce rate limits
 */
import { ratelimit } from '../lib/ratelimit';
import type { Request, Response, NextFunction } from 'express';

export async function rateLimitMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const { success, limit, remaining } = await ratelimit.limit(ip);

  res.setHeader('X-RateLimit-Limit', limit.toString());
  res.setHeader('X-RateLimit-Remaining', remaining.toString());

  if (!success) {
    res.status(429).json({
      error: 'RATE_LIMIT',
      message: 'Maximum 3 scans per day per IP address',
    });
    return;
  }

  next();
}

