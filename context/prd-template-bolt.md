# VibeCode Audit - One-Shot Build Prompt

## First Principles Context
**Goal**: Build a functional, deployable security audit tool from scratch using irreducible truths
**Scope**: Full-stack MVP with URL scanning, AI analysis, report generation, async processing
**Constraints**: <500 lines per file, serverless-first, type-safe, 90% test coverage, <10min scans
**Method**: Strip assumptions → Build minimal working system → Validate → Iterate

### Fundamental Truths for This Build
1. **Security scanning requires**: URL input → HTTP analysis → Vulnerability detection → Actionable output
2. **Speed requires**: Async processing (queue) → Fast AI inference → Cached results
3. **Scale requires**: Stateless design → Redis for state → Rate limiting → Monitoring
4. **Trust requires**: Accurate detection (85%+) → Clear confidence scores → Transparency about limitations
5. **Viability requires**: Free tier for acquisition → Paid tier for revenue → Clear upgrade path

---

```json
{
  "meta": {
    "productName": "VibeCode Audit",
    "version": "1.0.0",
    "status": "MVP",
    "targetLaunch": "2025-Q2",
    "buildApproach": "First principles: minimal viable implementation, no unnecessary abstractions"
  },
  "vision": {
    "oneLiner": "AI-powered URL-based security audit tool for solo founders",
    "target": "Solo founders, indie hackers building web apps",
    "value": "5-10 min security reports vs $5K-$20K audits taking weeks",
    "model": "Freemium: Free URL scan → Paid codebase review"
  },
  "problem": {
    "pain": [
      "Audits cost $5K-$20K, take 2-4 weeks",
      "No quick feedback during MVP dev",
      "Hidden vulnerabilities → $200K+ breach costs"
    ],
    "impact": {
      "financial": "$200K avg breach cost, $5K-$20K audit fees",
      "operational": "40-60hrs debugging preventable issues",
      "strategic": "Delayed launches block revenue"
    }
  },
  "users": {
    "primary": {
      "name": "Alex, Solo Founder",
      "pain": ["Can't afford audits", "No quick security validation"],
      "goal": "Instant security feedback before launch",
      "usage": "1-3 scans/month during MVP dev"
    }
  },
  "mvp": {
    "features": [
      {
        "id": "F-1",
        "name": "URL Submission",
        "desc": "Form validates URL, rate limits 3/day (free)"
      },
      {
        "id": "F-2",
        "name": "Security Agent",
        "desc": "Groq LLM + OWASP ZAP scans headers, TLS, vulnerabilities, light stress test"
      },
      {
        "id": "F-3",
        "name": "Report Generation",
        "desc": "HTML/PDF with scores (1-10), findings, recommendations, limitations CTA"
      },
      {
        "id": "F-4",
        "name": "Email Delivery",
        "desc": "Optional email with report link"
      },
      {
        "id": "F-5",
        "name": "Job Queue",
        "desc": "BullMQ + Redis async processing, status polling"
      }
    ],
    "outOfScope": [
      "Multi-agent (Phase 2)",
      "User accounts (Phase 2)",
      "Codebase integration (Phase 2)"
    ]
  },
  "architecture": {
    "principle": "Simplicity scales. Choose tools that eliminate classes of problems.",
    "decisions": {
      "monorepo": {
        "choice": "Turborepo + pnpm workspaces",
        "why": "Shared types without publish/version overhead. Single install, consistent deps."
      },
      "frontend": {
        "choice": "Next.js 14 App Router + Tailwind + shadcn/ui",
        "why": "RSC reduces client JS. shadcn = copy-paste components (no runtime dependency). Vercel deploy = zero config."
      },
      "backend": {
        "choice": "tRPC + TypeScript",
        "why": "End-to-end type safety eliminates API contract bugs. No codegen. No OpenAPI overhead."
      },
      "queue": {
        "choice": "BullMQ + Upstash Redis",
        "why": "Async processing mandatory for long scans. BullMQ = battle-tested. Upstash = serverless Redis (no ops)."
      },
      "ai": {
        "choice": "Groq llama-3.3-70b-versatile",
        "why": "300+ tokens/sec (10x OpenAI). $0.59/1M tokens. Structured output for report generation."
      },
      "database": {
        "choice": "MVP: Redis only. Phase 2: Neon PostgreSQL + Drizzle ORM",
        "why": "Redis sufficient for 30-day report storage. Postgres only when persistent user accounts needed."
      },
      "tools": {
        "playwright": "Headless browser for URL crawling + JS rendering",
        "owaspZap": "OWASP Top 10 vulnerability detection",
        "resend": "Transactional email (no SMTP config)"
      }
    },
    "fileStructure": {
      "principle": "Feature-sliced for <500 lines/file. Related code stays together.",
      "structure": {
        "packages/web/src": {
          "app": "Next.js routes (page.tsx, layout.tsx)",
          "components": "shadcn UI + custom components",
          "lib": "Utils (cn, constants)",
          "hooks": "React hooks (useJobStatus, useScanMutation)"
        },
        "packages/api/src": {
          "router": "tRPC procedures (scan, status, report)",
          "middleware": "Rate limiting, error handling",
          "lib": "Redis client, job queue setup"
        },
        "packages/agents/src": {
          "scanner": "Playwright crawling logic",
          "analyzer": "OWASP ZAP + TLS checks",
          "ai": "Groq analysis + scoring",
          "reporter": "PDF/HTML generation",
          "orchestrator": "BullMQ worker (chains above steps)"
        },
        "packages/shared/src": {
          "schemas": "Zod schemas (url, report, job)",
          "types": "TypeScript interfaces",
          "constants": "Shared config (rate limits, timeouts)"
        }
      }
    }
  },
  "api": {
    "endpoints": [
      {
        "id": "API-1",
        "method": "POST",
        "path": "/api/scan",
        "req": { "url": "string", "email": "string?" },
        "res": { "200": { "jobId": "string", "status": "pending" }, "400": "INVALID_URL", "429": "RATE_LIMIT" }
      },
      {
        "id": "API-2",
        "method": "GET",
        "path": "/api/scan/[jobId]/status",
        "res": { "200": { "status": "pending|processing|completed", "progress": "number", "reportUrl": "string?" } }
      },
      {
        "id": "API-3",
        "method": "GET",
        "path": "/api/scan/[jobId]/report",
        "res": { "200": "ScanReport object" }
      },
      {
        "id": "API-4",
        "method": "GET",
        "path": "/api/health",
        "res": { "200": { "status": "healthy", "version": "1.0.0" } }
      }
    ]
  },
  "agentLogic": {
    "principle": "Pure functions + explicit error handling. No hidden state. No magic.",
    "securityAgent": {
      "pipeline": [
        {
          "step": "1. Crawl",
          "function": "crawlUrl(url: string): Promise<CrawlResult>",
          "tools": "Playwright",
          "output": "{ html, headers, statusCode, redirects, jsErrors }",
          "errors": "Timeout (30s) → partial results. Unreachable → fail fast."
        },
        {
          "step": "2. Extract",
          "function": "extractSecurityData(crawl: CrawlResult): SecurityData",
          "logic": "Parse security headers (HSTS, CSP, X-Frame, etc). Detect technologies (Wappalyzer). Extract forms/inputs.",
          "output": "{ headers, technologies, forms, cookies }",
          "errors": "Parse failures → log warning, continue with partial data"
        },
        {
          "step": "3. Scan",
          "function": "scanVulnerabilities(data: SecurityData): Promise<Finding[]>",
          "tools": "OWASP ZAP passive scan + TLS check",
          "output": "{ findings: [{ type, severity, evidence, cwe }] }",
          "errors": "ZAP timeout (2min) → return found issues + timeout flag"
        },
        {
          "step": "4. Analyze",
          "function": "analyzeWithAI(findings: Finding[], data: SecurityData): Promise<Analysis>",
          "tools": "Groq llama-3.3-70b",
          "prompt": "System: Security expert. User: Score 1-10, explain findings, prioritize for solo founders.",
          "output": "{ score, summary, recommendations: [{ priority, action, effort }], confidence }",
          "errors": "Groq fail → retry 3x with exponential backoff → fallback to rule-based scoring"
        },
        {
          "step": "5. Report",
          "function": "generateReport(analysis: Analysis): Promise<Report>",
          "logic": "HTML template + Puppeteer PDF. Include limitations disclaimer + upgrade CTA.",
          "output": "{ html, pdf, metadata: { timestamp, version } }",
          "errors": "PDF gen fail → serve HTML only with warning"
        }
      ],
      "errorPhilosophy": "Fail explicitly. Never silent errors. Partial results > no results."
    },
    "groq": {
      "model": "llama-3.3-70b-versatile",
      "fallback": "mixtral-8x7b-32768",
      "config": {
        "temperature": 0.3,
        "maxTokens": 2000,
        "timeout": 30000,
        "retries": 3,
        "backoff": "exponential"
      },
      "structuredOutput": {
        "enabled": true,
        "schema": "Zod schema enforces { score: number, summary: string, recommendations: array }"
      }
    }
  },
  "dataFlow": {
    "principle": "Explicit state transitions. Every step logged. No black boxes.",
    "flow": [
      {
        "stage": "1. Submission",
        "client": "User enters URL → react-hook-form validates → Zod schema checks format",
        "server": "tRPC mutation receives URL + optional email",
        "rateLimit": "@upstash/ratelimit checks IP → 3/day limit for free tier",
        "queue": "BullMQ.add({ url, email }) → returns jobId",
        "response": "{ jobId, status: 'pending' }",
        "state": "Redis: job:{jobId} = { status: 'pending', url, createdAt }"
      },
      {
        "stage": "2. Processing",
        "trigger": "BullMQ worker picks job from queue",
        "stateUpdate": "Redis: job:{jobId}.status = 'scanning'",
        "execution": "orchestrator.run(url) → crawl → scan → analyze → report",
        "progress": "Worker emits progress events → Redis pubsub → client polls",
        "duration": "Target <5min. Max 10min timeout.",
        "logging": "Every step logs: { jobId, step, duration, success, error? }"
      },
      {
        "stage": "3. Completion",
        "success": "Redis: job:{jobId} = { status: 'completed', reportUrl, result, completedAt }",
        "failure": "Redis: job:{jobId} = { status: 'failed', error, completedAt }",
        "email": "If email provided: Resend.send({ to, subject: 'Report Ready', link: reportUrl })",
        "ttl": "Redis key expires in 30 days (2592000s)"
      },
      {
        "stage": "4. Retrieval",
        "polling": "Client polls GET /api/scan/[jobId]/status every 2s",
        "response": "{ status, progress?, reportUrl?, error? }",
        "report": "When status='completed': GET /api/scan/[jobId]/report → full report JSON",
        "display": "Frontend renders findings + score + recommendations + upgrade CTA"
      }
    ],
    "stateTransitions": "pending → scanning → analyzing → generating → completed|failed (no rollbacks, forward-only)"
  },
  "implementation": {
    "philosophy": "Build only what's necessary. Every file must serve the core function: URL in → Security report out.",
    "step1": {
      "goal": "Foundation: Monorepo + Type Safety",
      "principle": "Shared types prevent runtime errors. Monorepo enables code reuse without duplication.",
      "tasks": [
        "Turborepo + pnpm: Single source of truth for dependencies",
        "Root configs (TS/ESLint/Prettier/Husky): Enforce consistency from day 1",
        "packages/shared: Zod schemas for URL validation, report types, API contracts",
        "packages/web: Next.js 14 App Router (RSC for speed)",
        "packages/api: tRPC router (type-safe, no OpenAPI overhead)",
        "packages/agents: Groq + security tools orchestration"
      ],
      "validation": "pnpm build succeeds, types flow across packages"
    },
    "step2": {
      "goal": "Core Logic: Scan → Analyze → Report",
      "principle": "Minimize dependencies between steps. Each stage must work independently for debugging.",
      "tasks": [
        "Scanner module: Playwright crawl + header extraction (pure function: URL → RawData)",
        "Analyzer module: OWASP ZAP + TLS check (pure function: RawData → Findings[])",
        "AI module: Groq scoring + recommendations (pure function: Findings[] → Analysis)",
        "Reporter module: HTML/PDF generation (pure function: Analysis → Report)",
        "Queue module: BullMQ worker orchestrates above functions"
      ],
      "validation": "Each module testable in isolation with mock data"
    },
    "step3": {
      "goal": "State Management: Redis-First",
      "principle": "Stateless workers scale. Redis is single source of truth for job state.",
      "tasks": [
        "Upstash Redis: Job queue (BullMQ) + rate limiting + result caching",
        "Job states: pending → scanning → analyzing → generating → completed/failed",
        "TTL: 30 days auto-expiry (no manual cleanup needed)",
        "Rate limit: @upstash/ratelimit (3/day per IP for free tier)"
      ],
      "validation": "Workers can die/restart without losing jobs. Rate limits block excess requests."
    },
    "step4": {
      "goal": "User Interface: Submit → Poll → View",
      "principle": "UI reflects backend state. No optimistic updates—show truth.",
      "tasks": [
        "Landing page: Value prop + URL form (shadcn/ui + react-hook-form)",
        "Submit: Client-side Zod validation → tRPC mutation → jobId",
        "Status page: Poll /api/scan/[jobId]/status every 2s → progress bar",
        "Report page: Fetch completed report → display findings + CTA for paid tier",
        "Email (optional): Resend with report link"
      ],
      "validation": "Flow works end-to-end with real URL. Error states display correctly."
    },
    "step5": {
      "goal": "Production Readiness",
      "principle": "Deploy early. Real traffic reveals issues tests miss.",
      "tasks": [
        "Testing: Vitest unit tests (90% coverage) + Playwright E2E (critical paths)",
        "Deploy: Vercel (web) + Railway (api + Redis + workers)",
        "Monitoring: Railway logs + Vercel analytics (add Sentry Phase 2)",
        "CI/CD: GitHub Actions (lint/test/build on PR, deploy on main)",
        "Docs: README with setup, architecture diagram, API examples"
      ],
      "validation": "Staging deployment handles 10 concurrent scans. Logs show no silent failures."
    }
  },
  "requirements": {
    "principle": "Measure what matters. Optimize for user trust and speed.",
    "performance": {
      "target": "<10min report generation (p90)",
      "why": "Longer = user leaves. Groq's 300 tok/s enables 5min scans.",
      "measurement": "Log scan duration per job. Alert if p90 > 10min."
    },
    "accuracy": {
      "target": "85%+ vulnerability detection vs OWASP benchmark",
      "why": "False negatives erode trust. 85% is industry standard for automated tools.",
      "measurement": "Test against OWASP Juice Shop + WebGoat monthly. Track false positive rate."
    },
    "availability": {
      "target": "99.5% uptime (max 3.6hrs downtime/month)",
      "why": "Async queue tolerates brief outages. 99.9% unnecessary for MVP.",
      "measurement": "Uptime Robot pings /api/health every 5min."
    },
    "rateLimit": {
      "free": "3 scans/IP/day",
      "why": "Prevent abuse. Encourage upgrades. 3 = enough to test + compare.",
      "implementation": "@upstash/ratelimit sliding window"
    },
    "testing": {
      "coverage": "90% unit test coverage (Vitest)",
      "e2e": "Critical paths: submit → poll → view report (Playwright)",
      "why": "Catch regressions before deploy. 90% = diminishing returns beyond."
    },
    "privacy": {
      "data": "No PII stored. Only public URLs + scan results.",
      "retention": "30-day Redis TTL (automatic deletion)",
      "transport": "HTTPS only (Vercel + Railway enforce)"
    }
  },
  "monetization": {
    "free": "3 scans/month, URL-only, PDF report",
    "paid": {
      "starter": "$49/audit - Full codebase review",
      "pro": "$199/month - Unlimited scans, dashboard",
      "enterprise": "$999+ - Pen testing, compliance"
    }
  },
  "metrics": {
    "kpis": [
      { "id": "KPI-1", "name": "Conversion rate", "target": "5% free→paid" },
      { "id": "KPI-2", "name": "Report time", "target": "<10min (p90)" },
      { "id": "KPI-3", "name": "Accuracy", "target": "85%+ detection" },
      { "id": "KPI-4", "name": "Acquisition", "target": "1K scans in 3mo" },
      { "id": "KPI-5", "name": "False positives", "target": "<2%" }
    ]
  },
  "risks": {
    "high": [
      {
        "id": "R-H-1",
        "risk": "False positives damage trust",
        "mitigation": "Human QA first 100, confidence scores, clear limitations"
      },
      {
        "id": "R-H-2",
        "risk": "Legal issues from unauthorized scanning",
        "mitigation": "User attestation, respect robots.txt, non-destructive only"
      }
    ],
    "medium": [
      {
        "id": "R-M-1",
        "risk": "Slow scans hurt UX",
        "mitigation": "Groq speed, progress indicators, email notification"
      },
      {
        "id": "R-M-2",
        "risk": "Groq API limits/downtime",
        "mitigation": "Retry with backoff, fallback to cached results"
      }
    ]
  },
  "security": {
    "data": "No PII, public URLs only",
    "storage": "Redis encrypted, 30d auto-expire",
    "testing": "Non-destructive, respect robots.txt",
    "transport": "HTTPS only"
  },
  "devops": {
    "principle": "Automate everything. Manual deploys = human error.",
    "envs": {
      "dev": {
        "location": "localhost:3000 (web) + localhost:3001 (api)",
        "redis": "Local Redis or Upstash dev instance",
        "config": ".env.local (not committed)"
      },
      "staging": {
        "location": "Railway preview (api) + Vercel preview (web)",
        "trigger": "Every PR",
        "purpose": "Test with real services before production"
      },
      "prod": {
        "location": "Railway (api) + Vercel (web)",
        "trigger": "Merge to main",
        "monitoring": "Railway dashboard + Vercel analytics"
      }
    },
    "cicd": {
      "pr": {
        "steps": ["lint", "typecheck", "test", "build", "deploy preview"],
        "blocking": "PR can't merge if any step fails"
      },
      "main": {
        "steps": ["deploy prod", "smoke test (curl /api/health)", "notify Slack"],
        "rollback": "Vercel/Railway one-click rollback if smoke test fails"
      }
    },
    "monitoring": {
      "mvp": "Railway logs + Vercel analytics (free tiers)",
      "phase2": "Sentry (errors) + Axiom (structured logs) + PagerDuty (alerts)"
    },
    "secrets": {
      "management": "Railway env vars (api) + Vercel env vars (web)",
      "required": [
        "GROQ_API_KEY",
        "UPSTASH_REDIS_URL",
        "UPSTASH_REDIS_TOKEN",
        "RESEND_API_KEY"
      ],
      "rotation": "Rotate API keys quarterly (calendar reminder)"
    }
  },
}
```

---

## One-Shot Prompt Instructions

**Context**: You are building VibeCode Audit from scratch. This PRD contains all decisions and rationale.

**Approach**:
1. **Read the entire PRD** - Every section has "principle" explaining WHY, not just WHAT
2. **Start with packages/shared** - Define Zod schemas first (types flow from there)
3. **Build in order**: shared → agents → api → web (dependencies flow one direction)
4. **Test as you go** - Write tests before moving to next package
5. **Deploy early** - Push to staging after step 3, production after step 5

**Critical Constraints**:
- **<500 lines per file** - If approaching limit, split by feature/concern
- **Type-safe everything** - If tRPC doesn't infer types, something is wrong
- **Pure functions** - Agent logic must be testable without Redis/Playwright mocks
- **Explicit errors** - No try-catch without specific error handling
- **No premature optimization** - Get working first, measure, then optimize

**Validation Checklist** (run before considering "done"):
- [ ] `pnpm build` succeeds from repo root
- [ ] `pnpm test` shows 90%+ coverage
- [ ] Submit test URL on localhost → receive report in <5min
- [ ] Rate limit blocks 4th request from same IP
- [ ] Failed scan shows helpful error, not stack trace
- [ ] Report includes disclaimer + upgrade CTA
- [ ] Staging deployment handles concurrent scans
- [ ] All secrets in env vars, none in code

**First Principles Checklist**:
- [ ] Every file serves core function (URL → report)
- [ ] Can explain WHY for every tech choice
- [ ] Dependencies are minimal (removed unused packages?)
- [ ] Error messages help user fix problem
- [ ] Code is readable by future maintainer (you in 6 months)

**When stuck**:
1. Re-read the "principle" for that section
2. Ask: "What's the simplest thing that could work?"
3. Build that, test it, iterate
4. Avoid assuming patterns from other frameworks—build what THIS app needs

**Success Criteria**:
- Working demo URL: `vibecodeaudit.com/scan`
- First user can scan their site and get report
- Free tier acquisition funnel active
- Revenue possible (Stripe integration ready for Phase 2)

Now build it. 🚀

