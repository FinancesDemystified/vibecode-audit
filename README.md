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

**Quick Deploy:**
```bash
railway up --service vibecode-audit --detach
```

**Set Variables** (Railway Dashboard):
1. Go to: https://railway.com/project/805acb24-68a8-4047-83de-6e12a4d0e66a/service/7ec240fb-6275-464f-bee7-aa1075bb3cb6
2. Variables tab → Add:
   - `REDIS_URL` - Reference from Redis service
   - `GROQ_API_KEY` - Your Groq API key
   - `RATE_LIMIT_WHITELIST` - Comma-separated IPs (optional, for dev)

**Check Status:**
```bash
railway logs --service vibecode-audit --tail 20
railway domain --service vibecode-audit
```

**Verify:**
```bash
curl https://vibecode-audit-production.up.railway.app/api/health
```

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

## Lessons Learned & Infrastructure Patterns

### Build Failures & Solutions

**Issue 1: Package Lock File Mismatch**
- **Problem**: `package-lock.json` had `tailwindcss@4.1.18` while `package.json` specified `^3.4.1`
- **Root Cause**: Lock file out of sync with package.json; `npm ci` requires exact version match
- **Solution**: Regenerate lock file: `cd web && rm package-lock.json && npm install`
- **Prevention**: Always commit `package-lock.json` and regenerate when dependencies change

**Issue 2: Missing Public Directory**
- **Problem**: Dockerfile `COPY --from=builder /app/public ./public` failed - directory doesn't exist
- **Root Cause**: Next.js `public/` directory is optional but Dockerfile assumed it exists
- **Solution**: Use conditional copy: `RUN mkdir -p ./public && (cp -r /app/public/* ./public/ 2>/dev/null || true)`
- **Prevention**: Create empty `public/.gitkeep` or make Dockerfile handle missing directories gracefully

### Templatable Architecture Pattern

**Monorepo Structure:**
```
/
├── src/              # Backend (Express + tRPC)
│   ├── agents/      # AI agents (scanner, analyzer, reporter)
│   ├── router/      # tRPC endpoints
│   └── lib/         # Redis, queue, rate limiting
├── web/             # Frontend (Next.js)
│   ├── app/         # Next.js App Router
│   ├── components/ # React components
│   └── lib/         # tRPC client
├── railway.json     # Backend Railway config (DOCKERFILE)
└── web/railway.json # Frontend Railway config (NIXPACKS)
```

**Deployment Pattern:**

1. **Backend (Railway + Dockerfile)**:
   - Root `railway.json` → `builder: DOCKERFILE`
   - Root `Dockerfile` → Multi-stage build for TypeScript backend
   - Separate service for backend API

2. **Frontend (Railway + NIXPACKS/Dockerfile)**:
   - `web/railway.json` → `builder: NIXPACKS` (auto-detects Next.js)
   - `web/Dockerfile` → Multi-stage build for Next.js (optional, if NIXPACKS fails)
   - Separate service for frontend

**Key Dockerfile Patterns:**

```dockerfile
# Backend Dockerfile (root)
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY src ./src
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
RUN npm install --production
CMD ["node", "dist/server.js"]

# Frontend Dockerfile (web/)
FROM node:20-alpine AS base
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next ./.next
RUN mkdir -p ./public && (cp -r /app/public/* ./public/ 2>/dev/null || true)
COPY --from=builder /app/next.config.js ./next.config.js
COPY --from=deps /app/node_modules ./node_modules
CMD ["npm", "start"]
```

**Best Practices:**

1. **Lock Files**: Always commit `package-lock.json`; regenerate when dependencies change
2. **Public Directory**: Create empty `public/.gitkeep` or handle missing directories in Dockerfile
3. **Separate Services**: Deploy frontend/backend as separate Railway services
4. **Build Context**: Use `railway.json` to specify build context (root vs `web/`)
5. **Environment Variables**: Set per-service in Railway dashboard
6. **Health Checks**: Include `/api/health` endpoint for monitoring

**Railway Configuration:**

```json
// Root railway.json (Backend)
{
  "build": { "builder": "DOCKERFILE", "dockerfilePath": "Dockerfile" },
  "deploy": { "startCommand": "node dist/server.js" }
}

// web/railway.json (Frontend)
{
  "build": { "builder": "NIXPACKS" },
  "deploy": { "startCommand": "npm start" }
}
```

**Troubleshooting Checklist:**

- [ ] `package-lock.json` matches `package.json` versions
- [ ] `public/` directory exists or Dockerfile handles missing gracefully
- [ ] Railway service uses correct build context (root vs `web/`)
- [ ] Environment variables set in Railway dashboard
- [ ] Health endpoint responds: `curl $DEPLOY_URL/api/health`
