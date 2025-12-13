/**
 * Post-authentication discovery agent
 * Dependencies: none
 * Purpose: Map protected routes, auth patterns, session mechanisms without credentials
 */
import type { EventBus } from '../communication';
import type { SecurityData } from '../scanner/extractor';

export interface PostAuthDiscovery {
  authMechanism: 'form' | 'oauth' | 'api-key' | 'mixed' | 'unknown';
  loginEndpoint: string | null;
  expectedRedirects: string[];
  protectedRoutes: string[];
  publiclyAccessibleProtected: string[]; // Auth bypass vulnerabilities
  sessionMechanism: 'cookie' | 'jwt' | 'session-storage' | 'unknown';
  dashboardIndicators: {
    found: boolean;
    likelyPaths: string[];
    features: string[];
  };
  securityIssues: string[];
  recommendations: string[];
}

export async function discoverPostAuth(
  baseUrl: string,
  securityData: SecurityData,
  html: string,
  eventBus: EventBus,
  jobId: string
): Promise<PostAuthDiscovery> {
  await eventBus.publish(jobId, {
    type: 'agent.started',
    agent: 'post-auth-discoverer',
    jobId,
    timestamp: Date.now(),
  });

  const result: PostAuthDiscovery = {
    authMechanism: 'unknown',
    loginEndpoint: null,
    expectedRedirects: [],
    protectedRoutes: [],
    publiclyAccessibleProtected: [],
    sessionMechanism: 'unknown',
    dashboardIndicators: {
      found: false,
      likelyPaths: [],
      features: [],
    },
    securityIssues: [],
    recommendations: [],
  };

  // Determine auth mechanism
  if (securityData.authFlow.oauthProviders.length > 0 && securityData.authFlow.hasLoginForm) {
    result.authMechanism = 'mixed';
  } else if (securityData.authFlow.oauthProviders.length > 0) {
    result.authMechanism = 'oauth';
  } else if (securityData.authFlow.hasLoginForm) {
    result.authMechanism = 'form';
  } else if (html.toLowerCase().includes('api-key') || html.toLowerCase().includes('apikey')) {
    result.authMechanism = 'api-key';
  }

  // Extract login endpoint
  if (securityData.authFlow.authEndpoints.length > 0) {
    result.loginEndpoint = securityData.authFlow.authEndpoints[0];
  }

  // Detect session mechanism
  if (securityData.cookies.some(c => c.name.toLowerCase().includes('session'))) {
    result.sessionMechanism = 'cookie';
  } else if (html.includes('localStorage') && html.includes('token')) {
    result.sessionMechanism = 'jwt';
  } else if (html.includes('sessionStorage')) {
    result.sessionMechanism = 'session-storage';
  }

  await eventBus.publish(jobId, {
    type: 'agent.progress',
    agent: 'post-auth-discoverer',
    jobId,
    timestamp: Date.now(),
    progress: 30,
    message: 'Analyzing auth patterns',
  });

  // Infer protected routes from common patterns
  const commonProtectedPaths = [
    '/dashboard',
    '/app',
    '/home',
    '/profile',
    '/settings',
    '/account',
    '/admin',
    '/user',
    '/my-',
  ];

  const htmlLower = html.toLowerCase();
  
  // Extract from links in HTML
  const linkRegex = /href=["']([^"']+)["']/gi;
  let match;
  while ((match = linkRegex.exec(html)) !== null) {
    const path = match[1];
    // Check if it looks like a protected route
    if (commonProtectedPaths.some(p => path.includes(p))) {
      result.protectedRoutes.push(path);
    }
    // Check for redirects (action URLs, OAuth redirects)
    if (path.includes('redirect') || path.includes('callback')) {
      result.expectedRedirects.push(path);
    }
  }

  // Detect dashboard indicators
  const dashboardKeywords = ['dashboard', 'workspace', 'portal', 'panel', 'console', 'my account', 'admin panel', 'control panel'];
  const featureKeywords = ['analytics', 'reports', 'insights', 'metrics', 'data', 'chart', 'statistics', 'overview'];
  
  // Check for dashboard in links and routes
  const dashboardLinkRegex = /href=["']([^"']*(?:dashboard|workspace|portal|panel|console|admin)[^"']*)["']/gi;
  let dashboardLinkMatch;
  while ((dashboardLinkMatch = dashboardLinkRegex.exec(html)) !== null) {
    result.dashboardIndicators.found = true;
    const path = dashboardLinkMatch[1].split('?')[0].split('#')[0];
    if (!result.dashboardIndicators.likelyPaths.includes(path)) {
      result.dashboardIndicators.likelyPaths.push(path);
    }
  }
  
  // Check for dashboard keywords in content
  dashboardKeywords.forEach(kw => {
    if (htmlLower.includes(kw)) {
      result.dashboardIndicators.found = true;
      const path = `/${kw.replace(/\s+/g, '-')}`;
      if (!result.dashboardIndicators.likelyPaths.includes(path)) {
        result.dashboardIndicators.likelyPaths.push(path);
      }
    }
  });

  // Check for dashboard features
  featureKeywords.forEach(kw => {
    if (htmlLower.includes(kw)) {
      if (!result.dashboardIndicators.features.includes(kw)) {
        result.dashboardIndicators.features.push(kw);
      }
    }
  });
  
  // Check for dashboard API endpoints
  const dashboardApiRegex = /["']([^"']*\/api\/(?:dashboard|analytics|metrics|stats|reports)[^"']*)["']/gi;
  let apiMatch;
  while ((apiMatch = dashboardApiRegex.exec(html)) !== null) {
    result.dashboardIndicators.found = true;
    if (!result.dashboardIndicators.features.includes('API endpoints')) {
      result.dashboardIndicators.features.push('API endpoints');
    }
  }

  await eventBus.publish(jobId, {
    type: 'agent.progress',
    agent: 'post-auth-discoverer',
    jobId,
    timestamp: Date.now(),
    progress: 70,
    message: 'Testing for auth bypass',
  });

  // Test common protected endpoints (without auth)
  const testPaths = ['/api/users', '/api/user', '/api/me', '/dashboard', '/admin'];
  
  for (const path of testPaths) {
    try {
      const testUrl = new URL(path, baseUrl).href;
      const response = await fetch(testUrl, {
        headers: { 'User-Agent': 'VibeCode-Audit/1.0' },
        redirect: 'manual',
      });
      
      // If we get 200 OK without auth, that's a problem
      if (response.status === 200) {
        result.publiclyAccessibleProtected.push(path);
        result.securityIssues.push(`Potential auth bypass: ${path} accessible without authentication`);
      }
    } catch {
      // Expected - endpoint might not exist
    }
  }

  // Generate recommendations
  if (result.authMechanism === 'form' && result.sessionMechanism === 'unknown') {
    result.recommendations.push('Session mechanism unclear - verify secure cookie implementation');
  }

  if (result.sessionMechanism === 'session-storage') {
    result.securityIssues.push('Session storage used - vulnerable to XSS attacks');
    result.recommendations.push('Use HttpOnly cookies instead of sessionStorage for auth tokens');
  }

  if (result.authMechanism === 'form' && securityData.authFlow.oauthProviders.length === 0) {
    result.recommendations.push('Consider adding OAuth (Google/GitHub) for easier, more secure sign-in');
  }

  if (result.publiclyAccessibleProtected.length > 0) {
    result.recommendations.push('URGENT: Fix auth bypass vulnerabilities - protected routes are publicly accessible');
  }

  if (result.dashboardIndicators.found && !result.publiclyAccessibleProtected.includes('/dashboard')) {
    result.recommendations.push('Provide test credentials for comprehensive post-login audit (dashboard security, API endpoints, data handling)');
  }

  await eventBus.publish(jobId, {
    type: 'agent.completed',
    agent: 'post-auth-discoverer',
    jobId,
    timestamp: Date.now(),
    data: { protectedRoutes: result.protectedRoutes.length, issues: result.securityIssues.length },
  });

  return result;
}

