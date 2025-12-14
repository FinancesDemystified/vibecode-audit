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
  // Get IP from various sources (Railway proxy, direct, forwarded)
  const forwardedFor = req.headers['x-forwarded-for'] as string;
  const realIp = req.headers['x-real-ip'] as string;
  const ip = forwardedFor?.split(',')[0]?.trim() || realIp || req.ip || req.socket.remoteAddress || 'unknown';
  
  // Check if IP is whitelisted (comma-separated list)
  const whitelist = process.env.RATE_LIMIT_WHITELIST?.split(',').map(ip => ip.trim()) || [];
  const isWhitelisted = whitelist.includes(ip) || whitelist.some(w => ip.startsWith(w));
  
  if (isWhitelisted) {
    res.setHeader('X-RateLimit-Limit', 'unlimited');
    res.setHeader('X-RateLimit-Remaining', 'unlimited');
    res.setHeader('X-RateLimit-Whitelisted', 'true');
    next();
    return;
  }

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

