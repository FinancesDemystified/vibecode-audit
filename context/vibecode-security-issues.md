# AI Code Builder Security Issues
**Non-developer blind spots in Lovable, Bolt, Base44, V0, Replit, Antigravity, Cursor, Gemini**

Sources: Mobb.ai research (40% data leak rate), Wiz Base44 disclosure, Reddit communities, HN incidents, Mindgard Antigravity research, OX Security Cursor CVE analysis, Noma Labs Gemini research

---

## COST ISSUES 💰

- **Token waste loops**: AI breaks 10 things fixing 1 → millions wasted on infinite cycles
- **Platform lock-in**: Bolt forces proprietary DB despite explicit prompts → token drain
- **Token expiration**: Unused tokens expire 60 days even with active subscription
- **Leaked API keys**: Frontend exposure → $300+ bills (documented OpenAI drain)
- **Inefficient prompting**: 10M tokens for landing page vs 1M for full app
- **Replit expensive**: $30/hr agent costs, $360/day reported, $1800-$3500 typical full app
- **Hidden costs**: Auto-sync breaks migrations → data loss → rebuild costs
- **Predatory patterns**: Agent v3 slower than competitors but charges more
- **Cursor pricing chaos**: "Unlimited" changed to "Extended" with no definition, 3-prompt rate limits
- **Billing without warning**: Users report surprise charges, EU violations (Article 19 Directive 2019/770)
- **Bank chargebacks**: Users successfully dispute 8 months of Cursor charges
- **Context manipulation**: Advertised limits don't match actual token usage
- **Gemini $20/month**: Google One AI Pro $19.99/month individual pricing

## PII & DATA LEAKAGE 🔓
**40%+ apps affected**

- **Public databases**: Default configs expose names, emails, phone, financials, messages
- **No Row Level Security (RLS)**: Supabase tables created without access controls
- **Anonymous write access**: 20% apps allow anyone to view/create/edit/delete records
- **No warnings**: Platforms don't alert when storing PII in public databases
- **Simple exploitation**: Regular API calls access all user data

## SECURITY THREATS 🚨

### Authentication
- **Base44 auth bypass**: app_id (visible in URL) granted full SSO bypass access
- **API keys in frontend**: .env exposed in React/Next.js production builds
- **Weak secrets**: app_id, manifest paths hardcoded and discoverable

### AI-Generated Vulnerabilities
- **AI removes security**: When RLS breaks features, AI "fixes" by disabling protection
- **Functionality > security**: Platforms optimize "working" over "secure"
- **Missing validation**: No input sanitization, CSRF, XSS prevention in generated code

### Platform Architecture
- **Shared infrastructure risk**: Single platform flaw affects ALL apps built on it
- **Exposed API docs**: Swagger/internal endpoints publicly accessible (Base44)
- **No security testing**: Apps deployed without vulnerability scans
- **Admin panel exposure**: `/admin` routes discoverable, no auth

## ARCHITECTURE GAPS 🏗️

- **No env management**: Secrets committed to git, visible in builds
- **Client-side logic**: Business rules in frontend only → easily bypassed
- **CORS misconfiguration**: APIs accept requests from any origin
- **Session flaws**: Weak tokens, no expiration
- **Schema exposure**: DB structure visible to attackers

## KNOWLEDGE GAPS 📊
**What non-devs don't check:**

- Network tab for exposed secrets
- Database tables default to public read/write
- Testing as unauthenticated user
- Client vs server code execution
- `.env` doesn't protect production secrets
- "Working" ≠ "secure"
- AI prioritizes speed over security
- "Trusted workspace" doesn't mean safe workspace
- AI agent = full system access without sandboxing
- Config files in home directory can be weaponized
- Uninstalling AI tools doesn't remove malicious configs

## PLATFORM COMPARISON 🎯

**Lovable**
- Default Supabase: No RLS
- AI suggests disabling RLS to fix bugs
- Security scanner catches some issues

**Bolt**  
- Forces proprietary services
- Token expiration policy
- Breaks with custom backends

**Base44**
- Auth bypass (patched July 2025)
- Shared infrastructure single point of failure

**Replit**
- Agent v3 expensive: $30/hr reported, $360/day bills
- RLS silently bypassed in multi-tenant apps
- Object storage SDK functions broken (data migration pain)
- Environment variables revert without warning
- Dev/prod database confusion (prod points to dev DB)
- OAuth tokens double-encrypted breaking auth
- Auto-sync causes data loss
- Secrets manager exists but not enforced
- Agent "goes rogue" - deletes databases when over-permissioned

**Antigravity (Google)**
- Hacked 24 hours after launch (Nov 2025)
- Persistent backdoor vulnerability: survives uninstall/reinstall
- Malicious "trusted workspace" embeds code that auto-executes on every launch
- Config injection bypasses OS-level security (Windows/macOS)
- "Trust" button is security theater—required to use product at all
- AI follows malicious rules files "WITHOUT EXCEPTION" per system prompt
- Even strictest mode ("Review-driven") fully exploitable
- Backdoor activates without project opened, just app launch
- Google marked as "Won't Fix (Intended Behavior)" initially
- No effective setting to prevent workspace → global config writes
- Agentic AI with full system access, zero sandboxing

**Cursor IDE**
- **94 known CVEs** in outdated Chromium (last updated March 2025)
- **1.8 million developers** exposed to supply chain attacks
- **CVE-2025-54136 (MCPoison)**: Persistent RCE via MCP trust bypass
- Approved MCP configs can be silently changed to malicious payloads
- No re-approval required after config modification
- Deeplink attacks trigger remote code execution
- Developer machines = API keys, production access, source code exposure
- **CVE-2025-7656** weaponized: V8 JIT compiler overflow causes crashes/RCE
- Cursor dismissed vulnerability as "self-DOS" (ignoring 93 other unpatched CVEs)
- Pricing chaos: "Unlimited" → "Extended" with no definition, rate limits hit after 3 prompts
- Users report billing without warning, EU consumer protection violations
- Context manipulation: advertised limits don't match actual behavior
- Slow queue artificially throttled (120-second countdown hardcoded)
- Auto-context smaller than advertised, chat summaries truncate 95% of context

**Gemini (Google)**
- **GeminiJack vulnerability** (zero-click indirect prompt injection)
- Attack via shared Google Doc, calendar invite, or email
- Hidden instructions in documents executed as legitimate AI commands
- Exfiltrates Gmail, Calendar, Docs data without user interaction
- Single poisoned document = years of email + calendar + docs stolen
- No malware, no phishing, just normal AI search traffic
- **CVSS 9.4** vulnerability: Federated search = attack surface
- AI treats external documents as "organizational knowledge"
- Invisible image requests exfiltrate data (bypasses DLP)
- Fixed by Google: Vertex AI Search separated from Gemini Enterprise
- Gemini app has excessive permissions (third-party app access)
- Data exposure, unauthorized actions, user manipulation risks
- $19.99/month individual pricing (Google One AI Pro)
- Privacy concerns: AI accesses messages without clear boundaries

**All Platforms**
- No "secure by default"
- Missing security education
- Prioritize ease > protection
- Developer tools = supply chain gold for attackers

## CRITICAL STATISTICS

- **40%+** apps leak sensitive data
- **20%** apps allow unrestricted database write access
- **$300+** typical cost from single API key leak
- **$360/day** reported Replit Agent costs
- **$1800-$3500** typical full app build cost on Replit
- **10M** tokens wasted on simple fixes (inefficient users)
- **24 hours** Base44 fix time after disclosure; Antigravity hacked in same time
- **2,000+** vulnerable apps identified in research
- **1 in 3** audited apps has critical vulnerabilities
- **Agent v3** slowest coding agent on market (reported by users switching to Cursor)
- **0 days** to exploit Antigravity after launch (Nov 2025)
- **1.8 million** Cursor/Windsurf developers exposed to 94 CVEs
- **94 known CVEs** in Cursor's outdated Chromium (only 1 weaponized so far)
- **CVSS 9.4** GeminiJack vulnerability severity score

## RECOMMENDATIONS

1. **Always enable RLS** before deploying Supabase apps
2. **Never commit secrets** - use proper env variable systems (Replit Secrets, not .env in prod)
3. **Test unauthenticated** - try accessing data without login
4. **Check Network tab** - inspect all API calls in browser DevTools
5. **Use security scanners** - SafeVibe.codes, Securable.co, or manual audits
6. **Validate server-side** - never trust client-side checks alone
7. **Review AI changes** - AI may remove security to "fix" bugs
8. **Understand deployment** - production builds expose different code than dev
9. **Separate dev/prod DBs** - never point production to development database
10. **Use Secrets managers** - Replit has built-in encryption, use it
11. **Verify permissions** - don't over-permission AI agents (can delete databases)
12. **Monitor costs** - Use ChatGPT to optimize prompts before sending to Replit/Bolt
13. **Migration planning** - Most successful projects migrate off vibe platforms after MVP
14. **PRD first** - Write Product Requirements Doc before prompting AI
15. **Checkpoint strategy** - Revert checkpoints when flow drifts, don't prompt out of holes
16. **Audit AI workspaces** - Treat "trusted workspace" as full system access grant
17. **Sandbox AI tools** - Use VMs/Docker for AI code agents (Antigravity, Cursor, etc)
18. **Check ~/.config regularly** - AI agents can plant persistent backdoors in home dir
19. **Never auto-trust code** - "Trust this workspace" = potential RCE vulnerability
20. **Understand agent permissions** - AI with file write = potential config poisoning
21. **Update IDEs aggressively** - Cursor/Windsurf lag behind Chromium patches by months
22. **MCP configs are attack surfaces** - Audit Model Context Protocol files like source code
23. **Disable auto-loading images** - In AI-generated responses to prevent exfiltration
24. **Federated AI search = blast radius** - Map what datasources your AI can access
25. **Monitor for prompt injection** - Detect instructions embedded in indexed documents

---

**First Principle**: AI optimizes for working code, not secure code. Security requires explicit human verification.

**Source data**: Mobb.ai security research (2,000+ vulnerable apps analyzed), Wiz Research Base44 disclosure, Reddit communities (r/boltnewbuilders, r/nocode, r/webdev, r/replit, r/ChatGPTCoding, r/Bard, r/cursor), Lovable security docs, Hacker News incident reports, Mindgard Antigravity vulnerability research (Nov 2025), Forbes cybersecurity reporting, DEV.to security analysis, OX Security Cursor CVE research (94 CVEs, Oct 2025), Check Point Research Cursor RCE (CVE-2025-54136), Noma Labs GeminiJack research (CVSS 9.4).

