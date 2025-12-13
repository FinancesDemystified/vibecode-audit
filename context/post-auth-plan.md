# Post-Auth Crawling Enhancement Plan

## Goal
Audit what happens after authentication - the actual application workflow

## Challenges
1. **No Real Credentials**: Can't actually log in without user permission
2. **Ethical/Legal**: Must stay within bounds
3. **Rate Limiting**: Many apps block rapid auth attempts

## Solution: Smart Discovery Approach

### Phase 1: Auth Flow Mapping (No Login)
- Detect login forms and their fields
- Map auth endpoints (e.g., `/api/auth/login`, `/dashboard`)
- Identify OAuth flows
- Infer post-login destinations from:
  - Redirect URLs in forms
  - JavaScript routing patterns
  - Common patterns (`/dashboard`, `/app`, `/home`)
  
### Phase 2: Public Authenticated Pages
- Check for publicly accessible authenticated pages (often misconfigured)
- Test common endpoints without auth
- Look for exposed API documentation

### Phase 3: With User Consent (Premium Feature)
- Accept test credentials from user
- Actually log in and crawl
- Audit dashboard, settings, API calls
- Check session management, token security

## Implementation

### New Agent: `post-auth-discoverer`
```typescript
interface PostAuthDiscovery {
  authMechanism: 'form' | 'oauth' | 'api-key' | 'unknown';
  loginEndpoint: string;
  expectedRedirect: string;
  protectedRoutes: string[];
  publiclyAccessible: string[]; // Should be protected but aren't
  sessionMechanism: 'cookie' | 'jwt' | 'unknown';
  recommendations: string[];
}
```

### Scan Flow
1. Landing page scan (current)
2. Detect auth (enhanced)
3. **NEW**: Map protected routes
4. **NEW**: Test for auth bypass
5. **NEW**: Infer post-login features
6. Generate report with "what we found" + "what needs user credentials"

## Examples from GodlyDeeds

Landing: https://godlydeeds.ai
Auth detected: "Join the Beta" → `/login`
Inferred protected: `/dashboard`, `/studies`, `/growth`
Recommendation: "Provide test credentials for full audit of dashboard security"

