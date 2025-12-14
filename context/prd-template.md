```json
{
  "meta": {
    "productName": "VibeCode Audit",
    "documentType": "PRD",
    "version": "1.0.0",
    "status": "MVP",
    "productOwner": { "name": "TBD", "email": "TBD", "slack": "TBD" },
    "technicalLead": { "name": "TBD", "email": "TBD", "slack": "TBD" },
    "stakeholders": [
      { "name": "Solo Founders", "role": "Primary Users", "team": "Target Market", "contact": "via platform" }
    ],
    "targetLaunch": {
      "date": "2025-Q2",
      "milestoneName": "MVP Launch",
      "timezone": "America/New_York"
    },
    "lastUpdated": "2025-01-15",
    "nextReview": "2025-01-22"
  },
  "executiveSummary": {
    "productVision": {
      "oneLiner": "AI-powered external architecture review tool that generates instant security, authentication, and implementation reports from just a URL",
      "who": "Solo founders, indie hackers, and early-stage startups building web applications",
      "doesWhat": "Performs automated black-box analysis of web apps using AI agents to detect vulnerabilities, assess security posture, and infer architecture patterns—delivering comprehensive reports in under 10 minutes",
      "timeToValue": "5-10 minutes from URL submission to report delivery",
      "guarantee": "Free external scan reveals 40-60% of surface-level issues; paid codebase review uncovers 90%+ of vulnerabilities",
      "replaces": "Manual security audits ($5K-$20K, weeks of wait time) and expensive penetration testing services",
      "nonGoals": [
        "Full penetration testing (paid tier only)",
        "Code quality analysis without repository access",
        "Compliance certification (informational only)",
        "Real-time monitoring (one-time scans only)"
      ]
    },
    "successCriteria": [
      { "id": "SC-1", "metric": "Free scan conversion rate", "target": "5%", "measurementMethod": "Track users who upgrade to paid tier within 7 days", "owner": "Product Owner" },
      { "id": "SC-2", "metric": "Report generation time", "target": "<10 minutes (90th percentile)", "measurementMethod": "Monitor job queue completion times", "owner": "Technical Lead" },
      { "id": "SC-3", "metric": "Report accuracy", "target": "85%+ detection rate for known vulnerabilities", "measurementMethod": "Compare findings against manual audits on test sites", "owner": "Technical Lead" },
      { "id": "SC-4", "metric": "User acquisition", "target": "1,000 free scans in first 3 months", "measurementMethod": "Analytics dashboard tracking scan submissions", "owner": "Product Owner" },
      { "id": "SC-5", "metric": "False positive rate", "target": "<2%", "measurementMethod": "Human QA review of first 100 reports", "owner": "Technical Lead" }
    ],
    "businessGoals": {
      "phase1": { 
        "timeframe": "Weeks 1-4", 
        "goal": "Launch MVP with single-agent security scanning and basic report generation", 
        "definitionOfDone": [
          "URL submission form with validation",
          "Single security agent with Groq integration",
          "Basic HTML/PDF report generation",
          "Email delivery working",
          "Railway + Vercel deployment live"
        ] 
      },
      "phase2": { 
        "timeframe": "Weeks 5-8", 
        "goal": "Multi-agent parallel scanning with rich reports and user dashboard", 
        "definitionOfDone": [
          "Auth, Security, and Implementation agents running in parallel",
          "PDF reports with visualizations",
          "User dashboard with scan history",
          "GitHub/Replit integration for paid users",
          "Stripe payment processing"
        ] 
      },
      "phase3": { 
        "timeframe": "Weeks 9-16", 
        "goal": "Scale with custom agent tuning, benchmarking, and API access", 
        "definitionOfDone": [
          "Tech stack-specific agent fine-tuning",
          "Competitive benchmarking features",
          "CI/CD API integration",
          "Sentry monitoring + analytics",
          "NPS >40"
        ] 
      }
    }
  },
  "problemDefinition": {
    "currentState": {
      "description": "Solo founders building MVPs on platforms like Bubble, Replit, or bolt.new lack affordable access to professional security and architecture audits. Current options are expensive ($5K-$20K), slow (weeks of wait time), or require deep technical expertise. Founders launch apps with hidden vulnerabilities, leading to security breaches, technical debt, and costly rewrites.",
      "workflowSteps": [
        { "step": 1, "action": "Research security audit options", "tool": "Google search, referrals", "timeMinutes": 120 },
        { "step": 2, "action": "Contact audit firms for quotes", "tool": "Email, phone calls", "timeMinutes": 60 },
        { "step": 3, "action": "Wait for proposal and scheduling", "tool": "Email", "timeMinutes": null },
        { "step": 4, "action": "Provide codebase access and documentation", "tool": "GitHub, documentation tools", "timeMinutes": 180 },
        { "step": 5, "action": "Wait for audit completion", "tool": "Email updates", "timeMinutes": null },
        { "step": 6, "action": "Review findings and implement fixes", "tool": "Code editor, deployment tools", "timeMinutes": 2400 }
      ],
      "painPoints": [
        { "id": "P-1", "type": "cost", "statement": "Professional audits cost $5K-$20K, unaffordable for solo founders", "evidence": "Industry standard pricing for security audits" },
        { "id": "P-2", "type": "time", "statement": "Manual audits take 2-4 weeks from request to delivery", "evidence": "Typical audit timeline from security firms" },
        { "id": "P-3", "type": "opacity", "statement": "No quick feedback loop during MVP development—vulnerabilities discovered too late", "evidence": "Common founder complaint: 'I wish I knew this before launch'" },
        { "id": "P-4", "type": "risk", "statement": "Apps launch with hidden security vulnerabilities leading to breaches", "evidence": "Average cost of security breach for startups: $200K+" },
        { "id": "P-5", "type": "stress", "statement": "Founders lack confidence in architecture without expert validation", "evidence": "User research interviews with 10 solo founders" }
      ]
    },
    "impact": {
      "financial": [
        { "id": "I-F-1", "statement": "Security breaches cost startups $200K+ on average in remediation, legal fees, and lost customers", "valueUSD": 200000, "frequency": "per incident", "notes": "Based on 2024 cybersecurity breach cost studies" },
        { "id": "I-F-2", "statement": "Professional audit costs $5K-$20K per review", "valueUSD": 12500, "frequency": "per audit", "notes": "Industry average" },
        { "id": "I-F-3", "statement": "Architecture rework delays launch by 2-4 weeks, costing $10K-$50K in opportunity cost", "valueUSD": 30000, "frequency": "per rework", "notes": "Based on average solo founder opportunity cost" }
      ],
      "operational": [
        { "id": "I-O-1", "statement": "40-60 hours spent debugging preventable security issues", "timeMinutesPerUnit": 3000, "unitsPerWeek": 1, "annualizedHours": 50, "notes": "Average time per founder per year" },
        { "id": "I-O-2", "statement": "2-4 weeks wait time for audit results blocks development progress", "timeMinutesPerUnit": 20160, "unitsPerWeek": 0.25, "annualizedHours": 52, "notes": "Per audit cycle" }
      ],
      "human": [
        { "id": "I-H-1", "statement": "Founders experience stress and uncertainty about security posture", "signals": [ "User interviews reveal anxiety about launching with vulnerabilities", "Support tickets asking 'Is my app secure enough?'", "Delayed launches due to security concerns" ] },
        { "id": "I-H-2", "statement": "Lack of confidence leads to over-engineering or under-investing in security", "signals": [ "Founders either ignore security or spend excessive time on it", "No clear guidance on what's 'good enough' for MVP stage" ] }
      ],
      "strategic": [
        { "id": "I-S-1", "statement": "Delayed launches due to architecture rework block revenue and user acquisition", "blockedInitiatives": [ "Product launches", "Investor pitches requiring security validation", "Enterprise customer onboarding" ] },
        { "id": "I-S-2", "statement": "Technical debt accumulates without visibility, making future scaling expensive", "blockedInitiatives": [ "Rapid feature development", "Team scaling", "Platform migrations" ] }
      ]
    }
  },
  "users": {
    "personas": [
      {
        "id": "U-1",
        "name": "Alex, Solo Founder",
        "role": "Primary User - Building SaaS MVP",
        "primary": true,
        "pain": [
          "Can't afford $5K-$20K professional audits",
          "No quick way to validate security before launch",
          "Uncertain if architecture will scale",
          "Worried about hidden vulnerabilities"
        ],
        "goals": [
          "Get instant feedback on app security",
          "Identify critical vulnerabilities before launch",
          "Understand architecture strengths/weaknesses",
          "Convert to paid audit if needed"
        ],
        "techSavvy": "medium",
        "usagePattern": { "frequency": "1-3 scans per month during MVP development", "context": "Before major launches or investor pitches", "device": "laptop" },
        "jobsToBeDone": [
          { "id": "JTBD-1", "when": "Before launching MVP to public", "iWantTo": "Get a quick security and architecture review", "soICan": "Launch with confidence and avoid costly rewrites" },
          { "id": "JTBD-2", "when": "After making significant architecture changes", "iWantTo": "Validate that changes didn't introduce vulnerabilities", "soICan": "Maintain security posture as I iterate" },
          { "id": "JTBD-3", "when": "Preparing for investor pitch", "iWantTo": "Show due diligence on security and architecture", "soICan": "Demonstrate professionalism and reduce investor concerns" }
        ]
      },
      {
        "id": "U-2",
        "name": "Dev Team Lead",
        "role": "Secondary User - Early-stage startup (5-10 people)",
        "primary": false,
        "pain": [
          "Limited budget for security audits",
          "Need to prioritize which areas to audit",
          "Team lacks security expertise"
        ],
        "goals": [
          "Get team-wide visibility into security posture",
          "Prioritize security fixes based on severity",
          "Track security improvements over time"
        ],
        "techSavvy": "high",
        "usagePattern": { "frequency": "Weekly scans during active development", "context": "CI/CD integration, pre-deployment checks", "device": "laptop" },
        "jobsToBeDone": [
          { "id": "JTBD-4", "when": "Before deploying to production", "iWantTo": "Run automated security scan", "soICan": "Catch vulnerabilities before they reach users" },
          { "id": "JTBD-5", "when": "Onboarding new team members", "iWantTo": "Show them the current security posture", "soICan": "Set expectations and identify training needs" }
        ]
      }
    ]
  },
  "scope": {
    "mvp": {
      "inScope": [
        {
          "id": "F-1",
          "name": "URL Submission & Validation",
          "description": "Simple form where users submit their web app URL. System validates URL is accessible (HTTP check, ping), returns helpful error messages for invalid URLs.",
          "userValue": "Quick entry point to start scan—no account required for free tier",
          "acceptanceCriteria": [
            "Form accepts valid HTTP/HTTPS URLs",
            "Validates URL is reachable within 10 seconds",
            "Displays clear error messages for invalid/unreachable URLs",
            "Rate limits to 3 scans per IP per day (free tier)"
          ],
          "dependencies": [ "Upstash Redis for rate limiting", "URL validation library" ]
        },
        {
          "id": "F-2",
          "name": "Single-Agent Security Scanning",
          "description": "Initial MVP focuses on security agent only. Agent uses Groq LLM to analyze URL, runs OWASP Top 10 passive checks, validates HTTPS/TLS, checks security headers (CSP, HSTS, CORS), performs light stress testing (50-100 concurrent requests).",
          "userValue": "Identifies critical security vulnerabilities in minutes",
          "acceptanceCriteria": [
            "Security agent completes scan in <10 minutes",
            "Detects common OWASP Top 10 issues",
            "Validates TLS configuration",
            "Checks security headers",
            "Performs non-destructive stress test"
          ],
          "dependencies": [ "Groq API integration", "OWASP ZAP API", "Playwright for crawling", "BullMQ job queue" ]
        },
        {
          "id": "F-3",
          "name": "Basic Report Generation",
          "description": "Generates HTML/PDF report with security findings, scores (1-10), severity levels, and actionable recommendations. Includes 'limitations' section highlighting external-only constraints.",
          "userValue": "Actionable insights delivered in readable format",
          "acceptanceCriteria": [
            "Report generated within 5 minutes of scan completion",
            "Includes overall security score (1-10)",
            "Lists findings with severity (Critical/High/Medium/Low)",
            "Provides specific recommendations per finding",
            "Includes limitations section with CTA to paid tier"
          ],
          "dependencies": [ "PDF generation library", "Report template", "Email service (Resend)" ]
        },
        {
          "id": "F-4",
          "name": "Email Report Delivery",
          "description": "Sends report via email to user (optional, requires email input). Report includes download link and summary.",
          "userValue": "Convenient access to report without staying on site",
          "acceptanceCriteria": [
            "Email sent within 1 minute of report generation",
            "Email includes report PDF attachment or download link",
            "Email includes summary of key findings",
            "Email includes CTA to upgrade for full codebase review"
          ],
          "dependencies": [ "Resend or SendGrid integration", "Email template" ]
        },
        {
          "id": "F-5",
          "name": "Job Queue & Status Polling",
          "description": "Async job processing with BullMQ + Redis. Frontend polls job status endpoint to show progress. Returns job ID immediately on submission.",
          "userValue": "Non-blocking user experience, can close browser and return later",
          "acceptanceCriteria": [
            "Job ID returned immediately on URL submission",
            "Status endpoint returns: pending, processing, completed, failed",
            "Frontend polls every 5 seconds while processing",
            "Progress indicators show estimated time remaining"
          ],
          "dependencies": [ "BullMQ", "Upstash Redis", "tRPC status endpoint" ]
        }
      ],
      "outOfScope": [
        { "id": "OOS-1", "item": "Multi-agent parallel scanning (Auth + Security + Implementation)", "reason": "MVP focuses on security only for faster time-to-market", "revisitPhase": "phase2" },
        { "id": "OOS-2", "item": "User accounts and dashboard", "reason": "Free tier doesn't require accounts; reduces friction", "revisitPhase": "phase2" },
        { "id": "OOS-3", "item": "GitHub/Replit codebase integration", "reason": "Paid tier feature; MVP is URL-only", "revisitPhase": "phase2" },
        { "id": "OOS-4", "item": "Rich PDF visualizations and charts", "reason": "MVP uses simple HTML/PDF; visualizations add complexity", "revisitPhase": "phase2" },
        { "id": "OOS-5", "item": "CI/CD API integration", "reason": "Targeted at teams, not solo founders in MVP", "revisitPhase": "phase3" }
      ],
      "nonFunctionalRequirements": {
        "accuracy": { "target": "85%+ detection rate for known vulnerabilities", "notes": "Validated against manual audits on test sites" },
        "performance": {
          "pageLoadSeconds": 2,
          "apiP95Milliseconds": 500,
          "offlineAfterFirstLoad": false
        },
        "availability": { "targetUptime": "99.5%", "notes": "Serverless architecture with Railway + Vercel provides auto-scaling" },
        "compatibility": {
          "browsers": [ "Chrome (last 2)", "Firefox (last 2)", "Safari (last 2)", "Edge (last 2)" ],
          "devices": [ "laptop", "tablet", "desktop" ]
        },
        "accessibility": {
          "standard": "WCAG-2.1-AA",
          "requirements": [ "keyboardNavigation", "highContrast", "readableTypography", "screenReaderSupport" ]
        },
        "privacy": {
          "piiPolicy": "no_pii",
          "dataRetention": "server_logs_only",
          "notes": "No PII collected in MVP (email optional). Scan results stored in Redis with 30-day auto-expiration."
        }
      }
    }
  },
  "ux": {
    "designPrinciples": [
      { "id": "DP-1", "principle": "Speed over perfection", "why": "Solo founders need instant feedback; 5-minute report beats 2-week perfect audit" },
      { "id": "DP-2", "principle": "Transparency about limitations", "why": "Builds trust by being honest about what external scans can/can't detect" },
      { "id": "DP-3", "principle": "Progressive disclosure", "why": "Show summary first, details on demand—don't overwhelm with technical jargon" },
      { "id": "DP-4", "principle": "Clear value hierarchy", "why": "Free scan shows value, paid tier solves limitations—natural conversion funnel" },
      { "id": "DP-5", "principle": "Mobile-first but desktop-optimized", "why": "Founders work on laptops, but reports should be readable on any device" }
    ],
    "userJourneys": [
      {
        "id": "UJ-1",
        "name": "First-Time Free Scan",
        "steps": [
          { "step": 1, "userAction": "Lands on homepage", "systemResponse": "Display hero section with value prop: 'Get instant security feedback in 5 minutes'", "successSignal": "User understands value proposition" },
          { "step": 2, "userAction": "Clicks 'Start Free Scan'", "systemResponse": "Navigate to URL submission form", "successSignal": "Form loads in <2 seconds" },
          { "step": 3, "userAction": "Enters web app URL (e.g., https://myapp.com)", "systemResponse": "Real-time URL validation (format check)", "successSignal": "Valid URL format detected" },
          { "step": 4, "userAction": "Clicks 'Scan Now'", "systemResponse": "Validate URL accessibility, create job, return job ID", "successSignal": "Job ID returned, redirect to status page" },
          { "step": 5, "userAction": "Views status page with progress", "systemResponse": "Show 'Scanning in progress... Estimated 5-10 minutes' with progress bar", "successSignal": "User understands wait time" },
          { "step": 6, "userAction": "Waits (or closes browser)", "systemResponse": "Background job processes: security agent scans URL", "successSignal": "Job completes in <10 minutes" },
          { "step": 7, "userAction": "Returns to status page (or receives email)", "systemResponse": "Display 'Scan Complete' with report preview", "successSignal": "Report ready to view" },
          { "step": 8, "userAction": "Views report", "systemResponse": "Show security score, findings list, recommendations, limitations section", "successSignal": "User finds actionable insights" },
          { "step": 9, "userAction": "Sees 'Upgrade for Full Codebase Review' CTA", "systemResponse": "Display pricing tiers and benefits", "successSignal": "User considers upgrade (conversion opportunity)" }
        ]
      },
      {
        "id": "UJ-2",
        "name": "Returning User - Quick Rescan",
        "steps": [
          { "step": 1, "userAction": "Returns to site with same URL", "systemResponse": "Check if scan exists in cache (last 7 days)", "successSignal": "Cached report found or new scan initiated" },
          { "step": 2, "userAction": "Submits URL again", "systemResponse": "Show 'You scanned this 3 days ago. Rescan to check for changes?'", "successSignal": "User confirms rescan" },
          { "step": 3, "userAction": "Views updated report", "systemResponse": "Highlight changes since last scan (if any)", "successSignal": "User sees improvement or new issues" }
        ]
      }
    ],
    "screens": [
      {
        "id": "S-1",
        "name": "Homepage",
        "components": [
          { "id": "C-1", "type": "form", "name": "Hero URL Input", "description": "Large, prominent URL input field with 'Start Free Scan' button. Placeholder: 'https://your-app.com'" },
          { "id": "C-2", "type": "help", "name": "Value Proposition", "description": "Headline: 'Get instant security feedback in 5 minutes'. Subheadline explaining free vs paid" },
          { "id": "C-3", "type": "result", "name": "Example Report Preview", "description": "Screenshot or mockup of sample report to show what users get" }
        ]
      },
      {
        "id": "S-2",
        "name": "Scan Status Page",
        "components": [
          { "id": "C-4", "type": "form", "name": "Progress Indicator", "description": "Animated progress bar with estimated time remaining. Status: 'Scanning...', 'Analyzing security headers...', 'Checking for vulnerabilities...'" },
          { "id": "C-5", "type": "help", "name": "What's Being Scanned", "description": "List of checks in progress: HTTPS validation, Security headers, OWASP Top 10, Stress test" },
          { "id": "C-6", "type": "form", "name": "Email Input (Optional)", "description": "Optional email field to receive report when complete" }
        ]
      },
      {
        "id": "S-3",
        "name": "Report View",
        "components": [
          { "id": "C-7", "type": "result", "name": "Security Score Card", "description": "Large score display (1-10) with color coding (red/yellow/green)" },
          { "id": "C-8", "type": "result", "name": "Findings List", "description": "Table or list of vulnerabilities with severity, description, recommendation" },
          { "id": "C-9", "type": "help", "name": "Limitations Section", "description": "Clear explanation of what external scans can't detect, with CTA to paid tier" },
          { "id": "C-10", "type": "form", "name": "Download PDF Button", "description": "Download report as PDF" },
          { "id": "C-11", "type": "form", "name": "Upgrade CTA", "description": "Prominent button: 'Upgrade for Full Codebase Review - $49'" }
        ]
      }
    ],
    "copyAndStates": {
      "emptyState": "No scans yet. Enter your app URL above to get started!",
      "loadingState": "Scanning your app... This usually takes 5-10 minutes. You can close this page and we'll email you when it's ready.",
      "successState": "Scan complete! Your security report is ready. Review findings below or download the full PDF report.",
      "errorState": "Oops! We couldn't scan your app. Please check that the URL is correct and accessible, then try again.",
      "validationMessages": [
        { "field": "url", "rule": "required", "message": "Please enter a URL" },
        { "field": "url", "rule": "format", "message": "URL must start with http:// or https://" },
        { "field": "url", "rule": "reachable", "message": "We couldn't reach this URL. Please check it's publicly accessible." },
        { "field": "url", "rule": "rateLimit", "message": "You've reached the free scan limit (3 per day). Upgrade for unlimited scans." }
      ]
    },
    "branding": {
      "colorTokens": {
        "primary": "#3B82F6",
        "success": "#10B981",
        "warning": "#F59E0B",
        "danger": "#EF4444",
        "background": "#FFFFFF",
        "text": "#1F2937"
      },
      "typography": {
        "fontFamily": "Inter, system-ui, sans-serif",
        "basePx": 16,
        "headingPx": 24,
        "smallPx": 14,
        "lineHeight": 1.5
      }
    }
  },
  "systemDesign": {
    "architecture": {
      "frontend": { 
        "framework": "Next.js 14+ (App Router)", 
        "rendering": "SSR + Client-side for interactive components", 
        "keyModules": [ "URL submission form", "Status polling", "Report viewer", "Payment integration (Stripe)" ] 
      },
      "backend": { 
        "type": "serverless", 
        "framework": "tRPC with TypeScript", 
        "endpoints": [ "/api/scan (POST)", "/api/scan/[jobId]/status (GET)", "/api/scan/[jobId]/report (GET)", "/api/health (GET)" ] 
      },
      "ai": {
        "used": true,
        "provider": "Groq",
        "model": "llama-3.3-70b-versatile or mixtral-8x7b",
        "purpose": [ "explain", "assist", "summarize" ],
        "guardrails": [
          "Only analyze publicly accessible URLs",
          "Non-destructive scans only (respect robots.txt)",
          "Rate limiting to prevent abuse",
          "No storage of sensitive data from scanned sites"
        ],
        "notUsedFor": [ "core_correctness", "final_decisioning" ]
      },
      "data": {
        "mvp": { "storage": "none", "schemaRef": "Upstash Redis for job state + results cache (30-day TTL)" },
        "phase2": { "db": "PostgreSQL (Neon)", "auth": "NextAuth.js or Clerk", "tables": [ "users", "scans", "reports", "subscriptions" ] }
      },
      "deployment": { 
        "host": "Railway (frontend + backend)", 
        "cdn": "Railway Edge Network", 
        "ciCd": "GitHub Actions", 
        "envs": [ "dev", "staging", "prod" ],
        "pattern": "monorepo-separate-services",
        "lessonsLearned": {
          "packageLockSync": {
            "issue": "package-lock.json version mismatch causes npm ci failures",
            "solution": "Always regenerate lock file when dependencies change: cd web && rm package-lock.json && npm install",
            "prevention": "Commit package-lock.json; verify versions match package.json before deploying"
          },
          "publicDirectory": {
            "issue": "Dockerfile COPY fails if public/ directory doesn't exist",
            "solution": "Use conditional copy: RUN mkdir -p ./public && (cp -r /app/public/* ./public/ 2>/dev/null || true)",
            "prevention": "Create empty public/.gitkeep or handle missing directories gracefully in Dockerfile"
          },
          "buildContext": {
            "issue": "Railway builds wrong directory (root vs web/)",
            "solution": "Use separate railway.json files: root for backend, web/ for frontend",
            "prevention": "Configure Railway service build context explicitly in dashboard or railway.json"
          }
        },
        "templatablePattern": {
          "structure": {
            "monorepo": true,
            "backend": { "path": "root", "builder": "DOCKERFILE", "config": "railway.json" },
            "frontend": { "path": "web/", "builder": "NIXPACKS", "config": "web/railway.json" }
          },
          "dockerfiles": {
            "backend": {
              "location": "Dockerfile",
              "pattern": "multi-stage-build",
              "stages": ["builder", "production"],
              "keyPoints": ["Copy package*.json first for layer caching", "Separate dev/prod dependencies"]
            },
            "frontend": {
              "location": "web/Dockerfile",
              "pattern": "multi-stage-build",
              "stages": ["deps", "builder", "runner"],
              "keyPoints": ["Use npm ci for reproducible builds", "Handle optional public/ directory", "Copy .next build output"]
            }
          },
          "railwayConfig": {
            "backend": {
              "builder": "DOCKERFILE",
              "dockerfilePath": "Dockerfile",
              "startCommand": "node dist/server.js"
            },
            "frontend": {
              "builder": "NIXPACKS",
              "startCommand": "npm start",
              "fallback": "DOCKERFILE if NIXPACKS fails"
            }
          },
          "checklist": [
            "package-lock.json matches package.json versions",
            "public/ directory exists or Dockerfile handles missing gracefully",
            "Railway service uses correct build context",
            "Environment variables set per-service",
            "Health endpoint responds: /api/health"
          ]
        }
      }
    },
    "dataFlow": {
      "mvp": [
        { "step": 1, "actor": "user", "action": "submit_url", "system": "frontend", "output": "URL string" },
        { "step": 2, "actor": "frontend", "action": "validate_url_format", "system": "client", "output": "validated URL" },
        { "step": 3, "actor": "frontend", "action": "post_scan_request", "system": "api (tRPC)", "output": "job ID" },
        { "step": 4, "actor": "api", "action": "enqueue_scan_job", "system": "BullMQ + Redis", "output": "job queued" },
        { "step": 5, "actor": "worker", "action": "validate_url_reachable", "system": "external (target URL)", "output": "HTTP response" },
        { "step": 6, "actor": "worker", "action": "spawn_security_agent", "system": "agents package (Groq)", "output": "agent instance" },
        { "step": 7, "actor": "security_agent", "action": "crawl_and_analyze", "system": "Playwright + OWASP ZAP", "output": "raw findings" },
        { "step": 8, "actor": "security_agent", "action": "analyze_with_groq", "system": "Groq API", "output": "structured findings + recommendations" },
        { "step": 9, "actor": "worker", "action": "generate_report", "system": "report generator", "output": "HTML/PDF report" },
        { "step": 10, "actor": "worker", "action": "store_results", "system": "Redis", "output": "report URL + metadata" },
        { "step": 11, "actor": "worker", "action": "send_email", "system": "Resend", "output": "email sent" },
        { "step": 12, "actor": "frontend", "action": "poll_status", "system": "api", "output": "job status + report URL" },
        { "step": 13, "actor": "user", "action": "view_report", "system": "frontend", "output": "displayed report" }
      ],
      "phase2": [
        { "step": 1, "actor": "user", "action": "authenticate", "system": "NextAuth.js", "output": "user session" },
        { "step": 2, "actor": "system", "action": "persist_scan_history", "system": "PostgreSQL (Drizzle)", "output": "scan record in DB" },
        { "step": 3, "actor": "system", "action": "track_conversion", "system": "analytics", "output": "conversion event" }
      ]
    }
  },
  "logicSpec": {
    "inputs": [
      { "name": "url", "type": "string", "required": true, "constraints": { "min": 10, "max": 2048 }, "notes": "Must be valid HTTP/HTTPS URL, publicly accessible" },
      { "name": "email", "type": "string", "required": false, "constraints": { "min": 5, "max": 255 }, "notes": "Optional email for report delivery" }
    ],
    "scenarios": [
      {
        "id": "SCN-1",
        "name": "Security Header Analysis",
        "when": "Security agent crawls target URL",
        "requiredInputs": [ "url" ],
        "calculation": {
          "highLevel": "Agent fetches HTTP headers, checks for security headers (CSP, HSTS, X-Frame-Options, etc.), scores based on presence and configuration",
          "pseudoCode": "headers = fetch(url).headers; score = 0; if headers.has('Strict-Transport-Security'): score += 2; if headers.has('Content-Security-Policy'): score += 2; if headers.has('X-Frame-Options'): score += 1; return score / 10;",
          "constants": [
            { "name": "MAX_SECURITY_SCORE", "value": 10, "units": "points", "source": "Industry best practices" },
            { "name": "REQUIRED_HEADERS", "value": ["HSTS", "CSP", "X-Frame-Options"], "units": "list", "source": "OWASP recommendations" }
          ]
        },
        "validationRules": [
          { "rule": "URL must be reachable", "errorCode": "URL_UNREACHABLE", "message": "Could not connect to URL. Please check it's publicly accessible." },
          { "rule": "URL must use HTTPS for production", "errorCode": "HTTP_NOT_SECURE", "message": "Warning: Site uses HTTP instead of HTTPS. Consider upgrading." }
        ],
        "outputs": {
          "statusField": "valid",
          "fields": [ "securityScore", "headersPresent", "headersMissing", "recommendations", "severity" ]
        }
      },
      {
        "id": "SCN-2",
        "name": "OWASP Top 10 Passive Scan",
        "when": "Security agent runs vulnerability checks",
        "requiredInputs": [ "url" ],
        "calculation": {
          "highLevel": "Agent uses OWASP ZAP API to run passive scans, detects common vulnerabilities (XSS, SQL injection, insecure deserialization, etc.)",
          "pseudoCode": "zapResults = owaspZAP.scan(url); vulnerabilities = []; for finding in zapResults: if finding.severity >= 'Medium': vulnerabilities.append(finding); return vulnerabilities;",
          "constants": [
            { "name": "SCAN_TIMEOUT", "value": 300, "units": "seconds", "source": "OWASP ZAP default" },
            { "name": "MIN_SEVERITY", "value": "Medium", "units": "enum", "source": "OWASP classification" }
          ]
        },
        "validationRules": [
          { "rule": "Scan must complete within timeout", "errorCode": "SCAN_TIMEOUT", "message": "Scan took too long. Site may be slow or blocking requests." },
          { "rule": "No destructive actions allowed", "errorCode": "DESTRUCTIVE_BLOCKED", "message": "Scan aborted: Site appears to block automated testing." }
        ],
        "outputs": {
          "statusField": "valid",
          "fields": [ "vulnerabilitiesFound", "severityBreakdown", "recommendations", "confidenceScore" ]
        }
      },
      {
        "id": "SCN-3",
        "name": "Stress Test (Light Load)",
        "when": "Security agent performs load testing",
        "requiredInputs": [ "url" ],
        "calculation": {
          "highLevel": "Agent sends 50-100 concurrent requests to target URL, measures response times, error rates, and rate limiting behavior",
          "pseudoCode": "requests = []; for i in range(50): requests.append(asyncFetch(url)); results = await Promise.all(requests); avgResponseTime = mean(results.responseTime); errorRate = count(results.status >= 400) / 50; return {avgResponseTime, errorRate, rateLimited};",
          "constants": [
            { "name": "CONCURRENT_REQUESTS", "value": 50, "units": "count", "source": "Light load to avoid DoS" },
            { "name": "MAX_RESPONSE_TIME", "value": 5000, "units": "milliseconds", "source": "Reasonable threshold" }
          ]
        },
        "validationRules": [
          { "rule": "Must not exceed 100 requests", "errorCode": "RATE_LIMIT_EXCEEDED", "message": "Respecting rate limits: Reduced request count." },
          { "rule": "Must complete within 60 seconds", "errorCode": "STRESS_TEST_TIMEOUT", "message": "Stress test timed out. Site may be experiencing issues." }
        ],
        "outputs": {
          "statusField": "valid",
          "fields": [ "avgResponseTime", "p95ResponseTime", "errorRate", "rateLimited", "recommendations" ]
        }
      }
    ],
    "edgeCases": [
      { "id": "EC-1", "description": "URL requires authentication (login wall)", "expectedBehavior": "Report notes 'Authentication required - limited scan depth. Upgrade for authenticated codebase review.'" },
      { "id": "EC-2", "description": "URL returns 404 or 500 error", "expectedBehavior": "Report shows error, suggests checking URL accessibility, offers to rescan" },
      { "id": "EC-3", "description": "URL blocks automated crawlers (robots.txt disallow)", "expectedBehavior": "Respect robots.txt, note limitation in report, suggest manual review" },
      { "id": "EC-4", "description": "URL is a SPA with client-side routing", "expectedBehavior": "Use Playwright to wait for JS execution, crawl client-side routes, note SPA architecture in report" },
      { "id": "EC-5", "description": "URL rate limits or blocks requests during scan", "expectedBehavior": "Reduce request frequency, note rate limiting in findings, complete partial scan" },
      { "id": "EC-6", "description": "Groq API rate limit or timeout", "expectedBehavior": "Retry with exponential backoff, fallback to cached results if available, show 'partial analysis' in report" }
    ],
    "outputSchema": {
      "typescriptInterface": "ScanReport",
      "fields": [
        { "name": "jobId", "type": "string", "required": true },
        { "name": "url", "type": "string", "required": true },
        { "name": "securityScore", "type": "number", "required": true },
        { "name": "findings", "type": "array", "required": true },
        { "name": "findings[].id", "type": "string", "required": true },
        { "name": "findings[].severity", "type": "string", "required": true },
        { "name": "findings[].title", "type": "string", "required": true },
        { "name": "findings[].description", "type": "string", "required": true },
        { "name": "findings[].recommendation", "type": "string", "required": true },
        { "name": "findings[].confidence", "type": "number", "required": false },
        { "name": "limitations", "type": "array", "required": true },
        { "name": "timestamp", "type": "string", "required": true },
        { "name": "version", "type": "string", "required": true }
      ]
    }
  },
  "apiSpec": {
    "endpoints": [
      {
        "id": "API-1",
        "method": "POST",
        "path": "/api/scan",
        "description": "Submit a URL for security scanning. Returns job ID immediately for async processing.",
        "request": {
          "contentType": "application/json",
          "schema": { "url": "string (required)", "email": "string (optional)" },
          "examples": [ { "url": "https://example.com", "email": "user@example.com" } ]
        },
        "responses": {
          "200": { 
            "schema": { "success": true, "jobId": "string", "status": "pending", "estimatedTimeMinutes": 10 }, 
            "examples": [ { "success": true, "jobId": "job_abc123", "status": "pending", "estimatedTimeMinutes": 10 } ] 
          },
          "400": { 
            "schema": { "success": false, "error": { "code": "INVALID_URL", "message": "URL format is invalid", "field": "url" } }, 
            "examples": [ { "success": false, "error": { "code": "INVALID_URL", "message": "URL must start with http:// or https://", "field": "url" } } ] 
          },
          "429": { 
            "schema": { "success": false, "error": { "code": "RATE_LIMIT_EXCEEDED", "message": "Free tier limit: 3 scans per day" } }, 
            "examples": [ { "success": false, "error": { "code": "RATE_LIMIT_EXCEEDED", "message": "You've reached the free scan limit. Upgrade for unlimited scans." } } ] 
          },
          "500": { 
            "schema": { "success": false, "error": { "code": "SERVER_ERROR", "message": "Internal server error. Please try again later." } }, 
            "examples": [ { "success": false, "error": { "code": "SERVER_ERROR", "message": "Internal server error. Please try again later." } } ] 
          }
        }
      },
      {
        "id": "API-2",
        "method": "GET",
        "path": "/api/scan/[jobId]/status",
        "description": "Poll job status. Returns current status (pending, processing, completed, failed) and report URL if ready.",
        "request": {
          "contentType": "application/json",
          "schema": {},
          "examples": []
        },
        "responses": {
          "200": { 
            "schema": { "success": true, "status": "pending|processing|completed|failed", "progress": "number (0-100)", "reportUrl": "string (if completed)" }, 
            "examples": [ 
              { "success": true, "status": "processing", "progress": 45, "reportUrl": null },
              { "success": true, "status": "completed", "progress": 100, "reportUrl": "/api/scan/job_abc123/report" }
            ] 
          },
          "404": { 
            "schema": { "success": false, "error": { "code": "JOB_NOT_FOUND", "message": "Job ID not found" } }, 
            "examples": [ { "success": false, "error": { "code": "JOB_NOT_FOUND", "message": "Invalid job ID" } } ] 
          }
        }
      },
      {
        "id": "API-3",
        "method": "GET",
        "path": "/api/scan/[jobId]/report",
        "description": "Retrieve completed scan report (HTML or PDF).",
        "request": {
          "contentType": "application/json",
          "schema": {},
          "examples": []
        },
        "responses": {
          "200": { 
            "schema": { "success": true, "report": "ScanReport object" }, 
            "examples": [ { "success": true, "report": { "jobId": "job_abc123", "url": "https://example.com", "securityScore": 7.5, "findings": [] } } ] 
          },
          "404": { 
            "schema": { "success": false, "error": { "code": "REPORT_NOT_FOUND", "message": "Report not found or not ready" } }, 
            "examples": [ { "success": false, "error": { "code": "REPORT_NOT_FOUND", "message": "Report not available yet" } } ] 
          }
        }
      },
      {
        "id": "API-4",
        "method": "GET",
        "path": "/api/health",
        "description": "Health check endpoint for monitoring and CI/CD smoke tests.",
        "request": {
          "contentType": "application/json",
          "schema": {},
          "examples": []
        },
        "responses": {
          "200": { 
            "schema": { "status": "healthy", "version": "1.0.0", "timestamp": "ISO 8601 string" }, 
            "examples": [ { "status": "healthy", "version": "1.0.0", "timestamp": "2025-01-15T12:00:00Z" } ] 
          }
        }
      }
    ]
  },
  "implementationPlan": {
    "milestones": [
      {
        "id": "M-1",
        "name": "Project Initialization & Foundation",
        "timeframe": "Step 1",
        "goal": "Set up monorepo, tooling, and basic project structure",
        "deliverables": [
          "Turborepo monorepo with pnpm workspaces",
          "Root-level TypeScript, ESLint, Prettier configs",
          "Husky pre-commit hooks",
          "Packages: web, api, agents, shared initialized",
          "shadcn/ui configured in web package"
        ],
        "tasks": [
          { "id": "T-1", "name": "Create Turborepo monorepo", "owner": "Technical Lead", "estimateHours": 4, "dependencies": [], "definitionOfDone": [ "pnpm create turbo@latest completes", "Workspace structure created" ] },
          { "id": "T-2", "name": "Configure root-level tooling (TS, ESLint, Prettier)", "owner": "Technical Lead", "estimateHours": 3, "dependencies": [ "T-1" ], "definitionOfDone": [ "All config files in place", "Linting works" ] },
          { "id": "T-3", "name": "Setup Husky + lint-staged", "owner": "Technical Lead", "estimateHours": 2, "dependencies": [ "T-2" ], "definitionOfDone": [ "Pre-commit hook runs lint on staged files" ] },
          { "id": "T-4", "name": "Initialize Next.js web package", "owner": "Frontend Dev", "estimateHours": 4, "dependencies": [ "T-1" ], "definitionOfDone": [ "Next.js app runs locally", "shadcn/ui installed" ] },
          { "id": "T-5", "name": "Initialize tRPC API package", "owner": "Backend Dev", "estimateHours": 4, "dependencies": [ "T-1" ], "definitionOfDone": [ "tRPC router setup", "Health endpoint works" ] },
          { "id": "T-6", "name": "Initialize agents package with Groq", "owner": "Backend Dev", "estimateHours": 6, "dependencies": [ "T-1" ], "definitionOfDone": [ "Groq SDK integrated", "Test API call succeeds" ] }
        ]
      },
      {
        "id": "M-2",
        "name": "Architecture & Database Setup",
        "timeframe": "Step 2",
        "goal": "Feature-sliced folder structure, database schema, Redis configuration",
        "deliverables": [
          "Feature-sliced folder structure in all packages",
          "Drizzle ORM setup with Neon PostgreSQL",
          "Zod schemas for scan jobs and results",
          "Upstash Redis configuration",
          "tRPC router with scan endpoints"
        ],
        "tasks": [
          { "id": "T-7", "name": "Create feature-sliced folder structure", "owner": "Technical Lead", "estimateHours": 2, "dependencies": [ "M-1" ], "definitionOfDone": [ "All packages have src/app, src/components, src/lib, src/hooks structure" ] },
          { "id": "T-8", "name": "Setup Drizzle ORM with Neon", "owner": "Backend Dev", "estimateHours": 4, "dependencies": [ "T-7" ], "definitionOfDone": [ "Drizzle connects to Neon", "Migration folder created" ] },
          { "id": "T-9", "name": "Define Zod schemas for scan jobs", "owner": "Backend Dev", "estimateHours": 3, "dependencies": [ "T-7" ], "definitionOfDone": [ "Schemas validate correctly", "Types exported from shared package" ] },
          { "id": "T-10", "name": "Configure Upstash Redis", "owner": "Backend Dev", "estimateHours": 3, "dependencies": [ "T-7" ], "definitionOfDone": [ "Redis connection works", "Rate limiting configured" ] },
          { "id": "T-11", "name": "Build tRPC scan endpoints", "owner": "Backend Dev", "estimateHours": 6, "dependencies": [ "T-9", "T-10" ], "definitionOfDone": [ "POST /api/scan and GET /api/scan/[id]/status work" ] }
        ]
      },
      {
        "id": "M-3",
        "name": "Core Features - Scanning & Reporting",
        "timeframe": "Step 3",
        "goal": "URL submission, security agent, job queue, basic report generation",
        "deliverables": [
          "URL submission form with validation",
          "Single security agent with Groq integration",
          "BullMQ job queue processing",
          "Basic HTML/PDF report generation",
          "Email delivery"
        ],
        "tasks": [
          { "id": "T-12", "name": "Build URL submission form", "owner": "Frontend Dev", "estimateHours": 6, "dependencies": [ "M-2" ], "definitionOfDone": [ "Form validates URLs", "Submits to tRPC endpoint", "Shows loading state" ] },
          { "id": "T-13", "name": "Implement security agent with Groq", "owner": "Backend Dev", "estimateHours": 12, "dependencies": [ "M-2" ], "definitionOfDone": [ "Agent crawls URL", "Runs OWASP checks", "Uses Groq for analysis", "Returns structured findings" ] },
          { "id": "T-14", "name": "Setup BullMQ job queue", "owner": "Backend Dev", "estimateHours": 6, "dependencies": [ "T-11" ], "definitionOfDone": [ "Jobs enqueue correctly", "Workers process jobs", "Status updates work" ] },
          { "id": "T-15", "name": "Build report generator", "owner": "Backend Dev", "estimateHours": 8, "dependencies": [ "T-13" ], "definitionOfDone": [ "HTML report generated", "PDF export works", "Includes scores and findings" ] },
          { "id": "T-16", "name": "Integrate email delivery (Resend)", "owner": "Backend Dev", "estimateHours": 4, "dependencies": [ "T-15" ], "definitionOfDone": [ "Emails send successfully", "Includes report link" ] }
        ]
      },
      {
        "id": "M-4",
        "name": "Testing, Deployment & Launch",
        "timeframe": "Step 4",
        "goal": "Testing, CI/CD, deployment to production",
        "deliverables": [
          "Vitest test suite (90% coverage)",
          "Railway deployment for API",
          "Vercel deployment for web",
          "Stripe payment integration",
          "GitHub Actions CI/CD"
        ],
        "tasks": [
          { "id": "T-17", "name": "Setup Vitest and write unit tests", "owner": "Technical Lead", "estimateHours": 12, "dependencies": [ "M-3" ], "definitionOfDone": [ "90% code coverage achieved", "All tests pass" ] },
          { "id": "T-18", "name": "Deploy API to Railway", "owner": "Backend Dev", "estimateHours": 4, "dependencies": [ "M-3" ], "definitionOfDone": [ "API accessible at Railway URL", "Health endpoint responds" ] },
          { "id": "T-19", "name": "Deploy web to Vercel", "owner": "Frontend Dev", "estimateHours": 3, "dependencies": [ "M-3" ], "definitionOfDone": [ "Site live on Vercel", "Forms submit correctly" ] },
          { "id": "T-20", "name": "Integrate Stripe for payments", "owner": "Backend Dev", "estimateHours": 6, "dependencies": [ "M-3" ], "definitionOfDone": [ "Payment flow works", "Webhooks process correctly" ] },
          { "id": "T-21", "name": "Setup GitHub Actions CI/CD", "owner": "Technical Lead", "estimateHours": 4, "dependencies": [ "T-18", "T-19" ], "definitionOfDone": [ "CI runs on PR", "Auto-deploys on merge" ] }
        ]
      }
    ]
  },
  "testing": {
    "unitTests": {
      "tools": [ "vitest" ],
      "coverageTargets": { "logicPercent": 90, "apiPercent": 85 },
      "testMatrix": [
        { 
          "scenarioId": "SCN-1", 
          "cases": [ 
            { "name": "Valid URL with all security headers", "inputs": { "url": "https://secure-site.com" }, "expected": { "securityScore": 9, "headersPresent": ["HSTS", "CSP"] } },
            { "name": "URL missing security headers", "inputs": { "url": "https://insecure-site.com" }, "expected": { "securityScore": 4, "headersMissing": ["HSTS", "CSP"] } }
          ] 
        },
        { 
          "scenarioId": "SCN-2", 
          "cases": [ 
            { "name": "Site with XSS vulnerability", "inputs": { "url": "https://vulnerable-site.com" }, "expected": { "vulnerabilitiesFound": 1, "severity": "High" } },
            { "name": "Secure site with no vulnerabilities", "inputs": { "url": "https://secure-site.com" }, "expected": { "vulnerabilitiesFound": 0 } }
          ] 
        }
      ]
    },
    "integrationTests": {
      "apiContract": [
        { "endpointId": "API-1", "case": "valid URL", "expectedStatus": 200 },
        { "endpointId": "API-1", "case": "invalid URL format", "expectedStatus": 400 },
        { "endpointId": "API-1", "case": "rate limit exceeded", "expectedStatus": 429 },
        { "endpointId": "API-2", "case": "valid job ID", "expectedStatus": 200 },
        { "endpointId": "API-2", "case": "invalid job ID", "expectedStatus": 404 },
        { "endpointId": "API-4", "case": "health check", "expectedStatus": 200 }
      ]
    },
    "manualQA": {
      "browsers": [ "chrome", "firefox", "safari", "edge" ],
      "devices": [ "laptop", "tablet" ],
      "checklist": [
        "URL submission form validates correctly",
        "Job status polling updates in real-time",
        "Report displays all findings correctly",
        "PDF download works",
        "Email delivery receives report",
        "Rate limiting enforces 3 scans/day",
        "Error states show helpful messages"
      ],
      "acceptanceCriteria": [
        "User can submit URL and receive report within 10 minutes",
        "Report includes actionable recommendations",
        "Limitations section clearly explains external-only constraints",
        "Upgrade CTA is visible and functional"
      ]
    },
    "uat": {
      "testers": [ { "name": "TBD", "role": "Solo Founder" }, { "name": "TBD", "role": "Dev Team Lead" } ],
      "scenarios": [
        "Submit URL for first-time scan",
        "View report and understand findings",
        "Attempt to upgrade to paid tier",
        "Rescan same URL after making changes"
      ],
      "successMetrics": [
        "90% of testers complete scan successfully",
        "80% find report actionable",
        "30% attempt to upgrade (conversion test)"
      ],
      "signOff": { "required": true, "signedBy": "Product Owner", "date": "TBD" }
    }
  },
  "devops": {
    "environments": [
      { "name": "dev", "url": "http://localhost:3000", "deployTrigger": "Manual (pnpm dev)", "notes": "Local development with hot reload" },
      { "name": "staging", "url": "https://staging.vibecodeaudit.com", "deployTrigger": "On pull request (preview deployments)", "notes": "Railway preview for API, Vercel preview for web" },
      { "name": "prod", "url": "https://vibecodeaudit.com", "deployTrigger": "On merge to main branch", "notes": "Railway production for API, Vercel production for web" }
    ],
    "ciCd": {
      "onPullRequest": [ "lint", "typecheck", "unitTests", "build", "previewDeploy" ],
      "onMergeMain": [ "deployProd", "smokeTest" ],
      "smokeTests": [ 
        { "endpoint": "/api/health", "expected": { "status": "healthy" } },
        { "endpoint": "/api/scan", "expected": { "method": "POST", "validRequest": "returns jobId" } }
      ]
    },
    "monitoring": {
      "mvp": [ "hostAnalytics", "userReportedErrors" ],
      "phase2": [ "sentry", "performanceDashboards", "dbMetrics", "railwayDashboard" ]
    }
  },
  "securityAndPrivacy": {
    "dataClassification": "no_pii",
    "pii": { "collected": false, "stored": false, "fieldsExplicitlyExcluded": [ "name", "address", "ssn", "accountId", "phoneNumber" ] },
    "storage": {
      "client": { "enabled": false, "type": "localStorage", "retentionPolicy": "none", "userCanClear": true },
      "server": { "logs": "minimal", "retentionDays": 30 }
    },
    "auth": { "mvp": "none", "phase2": { "provider": "NextAuth.js or Clerk", "rbac": [ "admin", "user", "readonly" ], "mfa": false } },
    "transport": { "httpsOnly": true },
    "auditTrail": { "enabled": false, "phase2": { "logUser": true, "logVersion": true, "immutable": true } }
  },
  "complianceAndLegal": {
    "regulations": [ "GDPR (EU users)", "CCPA (California users)" ],
    "auditability": {
      "methodologyIncludedInOutput": true,
      "reproducibility": { "versionedLogic": true, "deterministicCore": true }
    },
    "intellectualProperty": {
      "ownershipNotes": "VibeCode Audit platform and methodology owned by company. Scan results and reports owned by users.",
      "thirdPartyDependencies": [
        { "name": "Groq API", "license": "Commercial API", "risk": "Low - standard API terms" },
        { "name": "OWASP ZAP", "license": "Apache 2.0", "risk": "Low - open source" },
        { "name": "Playwright", "license": "Apache 2.0", "risk": "Low - open source" }
      ]
    },
    "dataResidency": { "requirements": "No specific requirements for MVP", "hostingRegion": "US (Vercel + Railway)", "notes": "Phase 2 may require EU hosting for GDPR compliance" }
  },
  "metrics": {
    "mvpKPIs": [
      { "id": "KPI-1", "name": "Free scan conversion rate", "type": "revenue", "target": "5%", "howMeasured": "Track users who upgrade within 7 days of free scan", "instrumentation": "Stripe webhook events + analytics" },
      { "id": "KPI-2", "name": "Report generation time", "type": "time", "target": "<10 minutes (90th percentile)", "howMeasured": "Monitor job queue completion times", "instrumentation": "Redis job timestamps" },
      { "id": "KPI-3", "name": "Report accuracy", "type": "accuracy", "target": "85%+ detection rate", "howMeasured": "Compare findings against manual audits on test sites", "instrumentation": "Manual QA validation" },
      { "id": "KPI-4", "name": "User acquisition", "type": "adoption", "target": "1,000 free scans in first 3 months", "howMeasured": "Analytics dashboard tracking scan submissions", "instrumentation": "Vercel Analytics + custom events" },
      { "id": "KPI-5", "name": "False positive rate", "type": "reliability", "target": "<2%", "howMeasured": "Human QA review of first 100 reports", "instrumentation": "Manual review tracking" },
      { "id": "KPI-6", "name": "User satisfaction (NPS)", "type": "confidence", "target": "NPS >40", "howMeasured": "Post-scan survey", "instrumentation": "Email survey + analytics" }
    ],
    "phase2KPIs": [
      { "id": "KPI-P2-1", "name": "Paid tier MRR", "target": "$5K MRR by month 6" },
      { "id": "KPI-P2-2", "name": "Multi-agent scan accuracy", "target": "90%+ detection rate" }
    ],
    "phase3KPIs": [
      { "id": "KPI-P3-1", "name": "API usage", "target": "10+ CI/CD integrations" },
      { "id": "KPI-P3-2", "name": "Enterprise customers", "target": "3+ enterprise contracts" }
    ]
  },
  "risks": {
    "highRisk": [
      { 
        "id": "R-H-1", 
        "risk": "False positives damage trust and credibility", 
        "impact": "high", 
        "likelihood": "medium", 
        "mitigations": [
          "Human QA review of first 100 reports",
          "Confidence scores per finding",
          "Clear limitations section in reports",
          "Iterative agent prompt tuning based on feedback"
        ], 
        "owner": "Technical Lead" 
      },
      { 
        "id": "R-H-2", 
        "risk": "Legal issues from unauthorized scanning (ToS violations)", 
        "impact": "high", 
        "likelihood": "low", 
        "mitigations": [
          "Require user attestation of URL ownership",
          "Respect robots.txt",
          "Non-destructive scans only",
          "Terms of service clearly state user responsibility",
          "Legal review of scanning practices"
        ], 
        "owner": "Product Owner" 
      }
    ],
    "mediumRisk": [
      { 
        "id": "R-M-1", 
        "risk": "Slow scan times hurt user experience", 
        "impact": "medium", 
        "likelihood": "medium", 
        "mitigations": [
          "Optimize agent parallelization",
          "Set clear expectations (5-10 min)",
          "Progress indicators during scan",
          "Email notification when complete",
          "Use Groq for fast inference"
        ], 
        "owner": "Technical Lead" 
      },
      { 
        "id": "R-M-2", 
        "risk": "Groq API rate limits or downtime", 
        "impact": "medium", 
        "likelihood": "low", 
        "mitigations": [
          "Implement retry logic with exponential backoff",
          "Fallback to cached results if available",
          "Monitor API status",
          "Consider backup LLM provider (Phase 2)"
        ], 
        "owner": "Backend Dev" 
      },
      { 
        "id": "R-M-3", 
        "risk": "Low conversion rate from free to paid", 
        "impact": "medium", 
        "likelihood": "medium", 
        "mitigations": [
          "A/B test CTA placement and messaging",
          "Show clear value of paid tier (what it unlocks)",
          "Offer limited-time discounts",
          "Collect user feedback on barriers"
        ], 
        "owner": "Product Owner" 
      }
    ],
    "lowRisk": [
      { 
        "id": "R-L-1", 
        "risk": "Competitors launch similar products", 
        "impact": "low", 
        "likelihood": "medium", 
        "mitigations": [
          "Focus on speed and accuracy differentiation",
          "Build strong brand and community",
          "Iterate quickly based on user feedback"
        ], 
        "owner": "Product Owner" 
      },
      { 
        "id": "R-L-2", 
        "risk": "Scaling costs exceed revenue (Groq, infrastructure)", 
        "impact": "low", 
        "likelihood": "low", 
        "mitigations": [
          "Monitor costs per scan",
          "Optimize agent prompts to reduce token usage",
          "Implement caching for similar URLs",
          "Price paid tier to cover costs + margin"
        ], 
        "owner": "Technical Lead" 
      }
    ]
  },
  "openQuestions": [
    { 
      "id": "Q-1", 
      "question": "What LLM model balances cost vs. accuracy?", 
      "neededBy": "Week 1", 
      "owner": "Technical Lead", 
      "status": "answered", 
      "resolution": "Using Groq with llama-3.3-70b-versatile for speed (300+ tokens/sec) and cost efficiency ($0.59/1M tokens). Validated in proof-of-concept." 
    },
    { 
      "id": "Q-2", 
      "question": "Legal review needed for automated scanning ToS compliance?", 
      "neededBy": "Week 2", 
      "owner": "Product Owner", 
      "status": "open", 
      "resolution": "" 
    },
    { 
      "id": "Q-3", 
      "question": "Should we offer white-label reports for agencies?", 
      "neededBy": "Phase 2", 
      "owner": "Product Owner", 
      "status": "deferred", 
      "resolution": "Evaluate after MVP launch based on user demand" 
    },
    { 
      "id": "Q-4", 
      "question": "What's the optimal pricing for paid tiers?", 
      "neededBy": "Week 3", 
      "owner": "Product Owner", 
      "status": "open", 
      "resolution": "Current plan: Starter $49/audit, Pro $199/month, Enterprise $999+. A/B test during MVP." 
    }
  ],
  "appendices": {
    "references": [
      { "id": "REF-1", "title": "OWASP Top 10", "source": "OWASP Foundation", "link": "https://owasp.org/www-project-top-ten/", "notes": "Primary vulnerability classification standard" },
      { "id": "REF-2", "title": "Groq API Documentation", "source": "Groq", "link": "https://console.groq.com/docs", "notes": "LLM API for agent analysis" },
      { "id": "REF-3", "title": "External Architecture Review Feasibility", "source": "Internal Research", "link": "context/idea.md", "notes": "First principles analysis of URL-only reviews" },
      { "id": "REF-4", "title": "Example External Review Report", "source": "Internal Research", "link": "context/example.md", "notes": "Sample report format and structure" }
    ],
    "testCaseLibrary": [
      { 
        "id": "TC-1", 
        "name": "Valid URL submission", 
        "inputs": { "url": "https://example.com" }, 
        "expected": { "jobId": "string", "status": "pending" }, 
        "status": "todo" 
      },
      { 
        "id": "TC-2", 
        "name": "Invalid URL format", 
        "inputs": { "url": "not-a-url" }, 
        "expected": { "error": "INVALID_URL" }, 
        "status": "todo" 
      },
      { 
        "id": "TC-3", 
        "name": "Rate limit enforcement", 
        "inputs": { "url": "https://example.com", "attempts": 4 }, 
        "expected": { "error": "RATE_LIMIT_EXCEEDED" }, 
        "status": "todo" 
      },
      { 
        "id": "TC-4", 
        "name": "Security scan completion", 
        "inputs": { "url": "https://test-site.com" }, 
        "expected": { "securityScore": "number 1-10", "findings": "array" }, 
        "status": "todo" 
      }
    ],
    "feedbackLog": [
      { 
        "id": "FB-1", 
        "date": "TBD", 
        "tester": "TBD", 
        "feedback": "TBD", 
        "action": "TBD", 
        "status": "open" 
      }
    ],
    "pitchMaterials": [
      { 
        "id": "PM-1", 
        "type": "deck", 
        "status": "todo", 
        "location": "TBD" 
      },
      { 
        "id": "PM-2", 
        "type": "demoVideo", 
        "status": "todo", 
        "location": "TBD" 
      },
      { 
        "id": "PM-3", 
        "type": "roiCalculator", 
        "status": "todo", 
        "location": "TBD" 
      }
    ],
    "agentLogic": {
      "securityAgent": {
        "description": "Primary agent for MVP. Analyzes security posture using Groq LLM and external tools.",
        "workflow": [
          {
            "step": 1,
            "action": "Crawl and fetch",
            "tool": "Playwright",
            "prompt": "Navigate to {url} and fetch all HTTP headers, page content, and JavaScript sources. Respect robots.txt. Wait for page load and client-side rendering.",
            "output": "Raw HTML, headers, JS sources"
          },
          {
            "step": 2,
            "action": "Extract security headers",
            "tool": "Custom parser",
            "prompt": "Parse HTTP headers and extract: Strict-Transport-Security, Content-Security-Policy, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy",
            "output": "Structured header data"
          },
          {
            "step": 3,
            "action": "Run OWASP ZAP passive scan",
            "tool": "OWASP ZAP API",
            "prompt": "Run passive vulnerability scan on {url}. Detect XSS, SQL injection, insecure deserialization, broken access control, and other OWASP Top 10 issues.",
            "output": "Vulnerability findings array"
          },
          {
            "step": 4,
            "action": "Validate TLS/HTTPS",
            "tool": "ssllabs-scan API or custom",
            "prompt": "Check TLS certificate validity, cipher suites, protocol versions. Ensure HTTPS is enforced.",
            "output": "TLS configuration score"
          },
          {
            "step": 5,
            "action": "Light stress test",
            "tool": "Custom load tester",
            "prompt": "Send 50 concurrent GET requests to {url}. Measure response times, error rates, and rate limiting behavior. Do not exceed 100 requests total.",
            "output": "Performance metrics"
          },
          {
            "step": 6,
            "action": "Analyze with Groq",
            "tool": "Groq API (llama-3.3-70b-versatile)",
            "prompt": "You are a security expert analyzing a web application. Given the following data:\n\nHeaders: {headers}\nVulnerabilities: {vulnerabilities}\nTLS Score: {tlsScore}\nPerformance: {performance}\n\nAnalyze the security posture and provide:\n1. Overall security score (1-10)\n2. Critical findings with severity (Critical/High/Medium/Low)\n3. Specific recommendations for each finding\n4. Confidence level (0-1) for each finding\n\nFormat as JSON matching ScanReport schema. Be concise but actionable.",
            "output": "Structured security analysis"
          },
          {
            "step": 7,
            "action": "Generate recommendations",
            "tool": "Groq API",
            "prompt": "Based on the security analysis, generate 3-5 prioritized recommendations. Each should include: what to fix, why it matters, and how to implement. Target audience: solo founders with medium technical expertise.",
            "output": "Recommendations array"
          }
        ],
        "errorHandling": {
          "urlUnreachable": "Return error with helpful message, suggest checking URL accessibility",
          "timeout": "Return partial results with note about timeout, suggest rescan",
          "groqApiError": "Retry with exponential backoff (3 attempts), fallback to rule-based scoring if needed",
          "rateLimited": "Respect rate limits, reduce request frequency, note in findings"
        }
      },
      "authAgent": {
        "description": "Phase 2 agent. Detects authentication mechanisms and tests for vulnerabilities.",
        "workflow": [
          {
            "step": 1,
            "action": "Detect auth endpoints",
            "tool": "Playwright + custom crawler",
            "prompt": "Crawl {url} and identify authentication-related pages: /login, /signup, /auth, /oauth. Look for forms, OAuth buttons, JWT tokens in localStorage.",
            "output": "Auth endpoints list"
          },
          {
            "step": 2,
            "action": "Test rate limiting",
            "tool": "Custom tester",
            "prompt": "Attempt 5 rapid login requests with invalid credentials. Check if rate limiting is enforced (429 status, CAPTCHA, account lockout).",
            "output": "Rate limiting assessment"
          },
          {
            "step": 3,
            "action": "Check password policies",
            "tool": "Playwright + form analysis",
            "prompt": "Inspect login/signup forms for password requirements (length, complexity). Check if passwords are transmitted over HTTPS only.",
            "output": "Password policy assessment"
          },
          {
            "step": 4,
            "action": "Analyze with Groq",
            "tool": "Groq API",
            "prompt": "Analyze authentication security based on: endpoints found, rate limiting behavior, password policies, OAuth implementation. Provide score (1-10) and findings.",
            "output": "Auth security analysis"
          }
        ],
        "status": "phase2"
      },
      "implementationAgent": {
        "description": "Phase 2 agent. Fingerprints tech stack and infers architecture patterns.",
        "workflow": [
          {
            "step": 1,
            "action": "Fingerprint tech stack",
            "tool": "Custom detector + Playwright",
            "prompt": "Analyze page source, HTTP headers (X-Powered-By, Server), JavaScript frameworks (React, Vue, Angular), API patterns (REST, GraphQL), and build artifacts.",
            "output": "Tech stack detection"
          },
          {
            "step": 2,
            "action": "Infer architecture",
            "tool": "Playwright + custom analyzer",
            "prompt": "Map site structure: SPA vs MPA, API endpoints, routing patterns, state management. Infer scalability patterns.",
            "output": "Architecture inference"
          },
          {
            "step": 3,
            "action": "Measure performance",
            "tool": "Lighthouse API or custom",
            "prompt": "Run Lighthouse performance audit. Measure: First Contentful Paint, Time to Interactive, Total Blocking Time, Cumulative Layout Shift.",
            "output": "Performance metrics"
          },
          {
            "step": 4,
            "action": "Analyze with Groq",
            "tool": "Groq API",
            "prompt": "Analyze implementation quality based on tech stack, architecture patterns, and performance metrics. Provide score (1-10) and recommendations for solo founders.",
            "output": "Implementation analysis"
          }
        ],
        "status": "phase2"
      },
      "orchestration": {
        "framework": "LangGraph",
        "pattern": "Parallel agent execution (Phase 2), Sequential for MVP",
        "mvp": {
          "flow": "Security Agent only",
          "steps": ["Validate URL", "Run Security Agent", "Generate Report"]
        },
        "phase2": {
          "flow": "Parallel execution of Auth + Security + Implementation agents",
          "steps": [
            "Validate URL",
            "Spawn 3 agents in parallel",
            "Wait for all agents to complete",
            "Aggregate results",
            "Generate comprehensive report"
          ]
        },
        "errorHandling": "If any agent fails, continue with others. Mark partial results in report."
      },
      "groqIntegration": {
        "model": "llama-3.3-70b-versatile",
        "fallback": "mixtral-8x7b",
        "apiKey": "Environment variable GROQ_API_KEY",
        "rateLimiting": "Respect Groq rate limits, implement exponential backoff",
        "promptOptimization": "Keep prompts concise, use structured output format, include examples in few-shot prompts",
        "tokenBudget": "Max 4000 tokens per agent analysis to control costs",
        "temperature": 0.3,
        "maxTokens": 2000
      }
    }
  }
}
```
