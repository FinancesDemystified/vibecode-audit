# VibeCode Audit

AI-powered security scanner: landing page → auth discovery → post-auth mapping → authenticated scanning.

## Features

- **Tech Stack Detection**: React/Next.js, hosting (Vercel/Netlify), platforms (Bubble/Replit/Lovable)
- **Auth Flow Analysis**: Login forms, OAuth providers, endpoints
- **Post-Auth Discovery**: Protected routes, dashboard detection, auth bypass testing
- **Authenticated Scanning**: Login with credentials, crawl protected pages, test APIs
- **AI Analysis**: Groq-powered narrative reports with prioritized recommendations

## Quick Start

```bash
npm install && npm run build && npm start
```

## API Usage

**Basic Scan:**
```bash
curl -X POST https://vibecode-audit-production.up.railway.app/api/trpc/scan.submit \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}'
```

**Authenticated Scan:**
```bash
curl -X POST https://vibecode-audit-production.up.railway.app/api/trpc/scan.submit \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://app.com",
    "credentials": {"email": "test@example.com", "password": "pass"}
  }'
```

**Get Report:**
```bash
curl https://vibecode-audit-production.up.railway.app/api/report/{jobId}
```

## Environment Variables

```bash
REDIS_URL=redis://default:password@redis.railway.internal:6379
GROQ_API_KEY=your_groq_key
```

## Deployment

**Live**: https://vibecode-audit-production.up.railway.app

**Deploy:**
```bash
railway up --service vibecode-audit
```

**Variables** (Railway Dashboard):
- `REDIS_URL` - Reference from Redis service
- `GROQ_API_KEY` - Your Groq API key

## Report Structure

```json
{
  "score": 6,
  "summary": "AI-generated narrative",
  "findings": [...],
  "techStack": {"framework": "React", "hosting": "Vercel"},
  "authFlow": {"hasLoginForm": true, "oauthProviders": ["Google"]},
  "postAuth": {"protectedRoutes": ["/dashboard"], "dashboardDetected": true},
  "authenticatedScan": {"success": true, "pagesScanned": 3, "authenticatedPages": [...]}
}
```

## Structure

- `src/agents/scanner` - Crawler, extractor, post-auth discoverer, authenticated crawler
- `src/agents/analyzer` - Vulnerability scanner
- `src/agents/ai` - Groq LLM analysis
- `src/agents/reporter` - Report generation
- `src/router` - tRPC endpoints
- `src/lib` - Redis, queue, rate limiting

## Commands

```bash
npm run build      # Build
npm start          # Start server
npm run type-check # Type check
```
