# VibeCode Audit

AI-powered URL security scanner with async processing, Groq AI analysis, and HTML/PDF reports.

## Quick Start

```bash
pnpm install && pnpm build && pnpm dev
```

## Environment Variables

`.env.local`:
```bash
REDIS_URL=redis://default:password@redis.railway.internal:6379
GROQ_API_KEY=your_groq_key
```

## Railway Deployment

**Project**: `vibecode-audit` (805acb24-68a8-4047-83de-6e12a4d0e66a)

**Status**: ✅ Redis service online

### Deploy API
**Via Dashboard:**
1. New → GitHub Repo → Connect repo → Root: `.`
2. Railway auto-detects Dockerfile
3. After deploy: API service → Variables → "+ New Variable" → Reference `REDIS_URL` from Redis service
4. Set: `GROQ_API_KEY` (from .env.local) and `NODE_ENV=production`
5. Verify: `curl https://your-api.railway.app/api/health`

**Via CLI:**
```bash
railway up
railway variables --set "GROQ_API_KEY=your_key"
railway variables --set "NODE_ENV=production"
```

### Redis Options
- **Railway**: Included with Hobby plan ($5/mo, 0.5GB)
- **Upstash**: Free tier (500K commands/mo, 256MB) - use `UPSTASH_REDIS_URL` + `UPSTASH_REDIS_TOKEN`

Code auto-detects: `REDIS_URL` → Railway, `UPSTASH_REDIS_URL` → Upstash

## Structure

- `packages/shared` - Zod schemas/types
- `packages/agents` - Scanner agents (crawler, analyzer, AI, reporter)
- `packages/api` - tRPC Express server
- `packages/web` - Next.js frontend

## Commands

```bash
pnpm dev        # Start all
pnpm build      # Build all
pnpm lint       # Lint
pnpm test       # Test
pnpm type-check # Type check
```
