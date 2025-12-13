# ✅ Authenticated Scanning - Full Post-Login Audit

## Feature: Actual Login & Protected Route Scanning

The post-auth agent can now **actually log in** and scan the authenticated application!

---

## How It Works

### 1. **Submit Scan with Credentials** (Optional)

```bash
curl -X POST https://vibecode-audit-production.up.railway.app/api/trpc/scan.submit \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "credentials": {
      "email": "test@example.com",
      "password": "testpassword"
    }
  }'
```

**OR with username:**
```json
{
  "url": "https://example.com",
  "credentials": {
    "username": "testuser",
    "password": "testpassword"
  }
}
```

### 2. **What Happens**

1. **Landing Page Scan** (always)
   - Tech stack detection
   - Security headers
   - Auth flow discovery

2. **Login Attempt** (if credentials provided)
   - Detects login endpoint
   - Submits credentials
   - Captures session cookies

3. **Authenticated Crawling** (if login succeeds)
   - Crawls protected routes: `/dashboard`, `/app`, `/profile`, `/settings`
   - Tests API endpoints with/without auth
   - Detects features: analytics, forms, data-display
   - Checks for security issues: CSRF tokens, password masking

4. **Report Generation**
   - Includes authenticated scan results
   - Shows what was accessible post-login
   - Flags security issues in protected areas

---

## Report Structure

```json
{
  "postAuth": {
    "authMechanism": "form",
    "loginEndpoint": "/login",
    "protectedRoutes": ["/dashboard", "/app"],
    "dashboardDetected": true
  },
  
  "authenticatedScan": {
    "success": true,
    "pagesScanned": 3,
    "authenticatedPages": [
      {
        "url": "https://example.com/dashboard",
        "statusCode": 200,
        "title": "Dashboard",
        "features": ["analytics", "data-display", "forms"],
        "securityIssues": [
          "No CSRF token detected in forms"
        ]
      }
    ],
    "apiEndpoints": [
      {
        "url": "https://example.com/api/user",
        "method": "GET",
        "requiresAuth": true,
        "responseStatus": 200
      }
    ],
    "errors": []
  }
}
```

---

## Security Features

### ✅ What Gets Tested:

1. **Session Management**
   - Cookie extraction and validation
   - Session persistence across requests

2. **Protected Route Access**
   - Verifies routes require authentication
   - Tests auth bypass vulnerabilities

3. **API Security**
   - Tests endpoints with/without auth
   - Identifies unprotected APIs

4. **Form Security**
   - CSRF token detection
   - Password field masking
   - Input validation presence

5. **Feature Detection**
   - Analytics dashboards
   - Data tables
   - Forms and inputs
   - API calls

---

## Use Cases

### **Free Tier** (No Credentials)
- Landing page audit
- Auth flow discovery
- Protected route inference
- Recommendation: "Provide credentials for full audit"

### **Paid/Premium Tier** (With Credentials)
- Full authenticated scan
- Dashboard security audit
- API endpoint testing
- Post-login vulnerability detection

---

## Security & Privacy

### **Credential Handling:**
- ✅ Credentials stored in Redis (encrypted at rest)
- ✅ Never logged or exposed in reports
- ✅ Only used for single scan session
- ✅ Expires with job (30 days max)

### **Ethical Considerations:**
- ✅ Only scans URLs user owns
- ✅ Requires explicit credential submission
- ✅ No credential guessing/brute force
- ✅ Respects rate limits

---

## Example Workflow

```bash
# 1. Submit scan with credentials
JOB_ID=$(curl -X POST .../scan.submit -d '{"url":"...","credentials":{...}}' | jq -r '.result.data.jobId')

# 2. Check status
curl .../scan.status?input={"jobId":"$JOB_ID"}

# 3. Get full report (includes authenticated scan)
curl .../api/report/$JOB_ID
```

---

## Limitations

1. **Auth Types Supported:**
   - ✅ Form-based (username/password, email/password)
   - ⏳ OAuth (coming soon - requires browser automation)
   - ⏳ API keys (coming soon)

2. **Complex Auth:**
   - Multi-factor auth not supported
   - CAPTCHA not handled
   - OAuth flows need manual token

3. **Session Handling:**
   - Basic cookie-based sessions
   - JWT in localStorage not yet supported

---

## Next Enhancements

1. **Browser Automation** (Playwright/Puppeteer)
   - Handle OAuth flows
   - JavaScript-heavy apps
   - Complex form interactions

2. **Session Management**
   - JWT token extraction
   - localStorage/sessionStorage
   - Token refresh handling

3. **Deep API Testing**
   - GraphQL endpoint discovery
   - API documentation extraction
   - Rate limit testing

**The authenticated scanning feature is now LIVE!** 🎉

