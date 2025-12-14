/**
 * Authenticated crawler - logs in and scans protected pages
 * Dependencies: none
 * Purpose: Perform authenticated scans of protected routes
 */
import type { EventBus } from '../communication';
import type { SecurityData } from '../scanner/extractor';

export interface Credentials {
  username?: string;
  password?: string;
  email?: string;
}

export interface AuthenticatedScanResult {
  success: boolean;
  sessionCookies: string[];
  authenticatedPages: Array<{
    url: string;
    statusCode: number;
    title?: string;
    features: string[];
    securityIssues: string[];
  }>;
  apiEndpoints: Array<{
    url: string;
    method: string;
    requiresAuth: boolean;
    responseStatus: number;
  }>;
  errors: string[];
}

export async function performAuthenticatedScan(
  baseUrl: string,
  credentials: Credentials,
  securityData: SecurityData,
  eventBus: EventBus,
  jobId: string
): Promise<AuthenticatedScanResult> {
  await eventBus.publish(jobId, {
    type: 'agent.started',
    agent: 'authenticated-scanner',
    jobId,
    timestamp: Date.now(),
  });

  const result: AuthenticatedScanResult = {
    success: false,
    sessionCookies: [],
    authenticatedPages: [],
    apiEndpoints: [],
    errors: [],
  };

  try {
    // Step 1: Attempt login
    const loginEndpoint = securityData.authFlow.authEndpoints[0] || '/login';
    const loginUrl = new URL(loginEndpoint, baseUrl).href;

    await eventBus.publish(jobId, {
      type: 'agent.progress',
      agent: 'authenticated-scanner',
      jobId,
      timestamp: Date.now(),
      progress: 20,
      message: `Attempting login at ${loginEndpoint}`,
    });

    // Build login payload based on form inputs
    const formData = new URLSearchParams();
    
    // Common field names
    if (credentials.email) {
      formData.append('email', credentials.email);
    } else if (credentials.username) {
      formData.append('username', credentials.username);
    }
    
    if (credentials.password) {
      formData.append('password', credentials.password);
    }

    // Try login
    const loginResponse = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'VibeCode-Audit/1.0',
      },
      body: formData.toString(),
      redirect: 'manual',
    });

    // Extract session cookies
    const setCookieHeader = loginResponse.headers.get('set-cookie');
    if (setCookieHeader) {
      // Handle both single and multiple Set-Cookie headers
      const cookies = Array.isArray(setCookieHeader) 
        ? setCookieHeader 
        : [setCookieHeader];
      result.sessionCookies = cookies.filter(Boolean);
    }

    // Check if login succeeded (redirect to dashboard or 200 OK)
    const isSuccess = 
      loginResponse.status === 200 ||
      loginResponse.status >= 300 && loginResponse.status < 400 ||
      loginResponse.headers.get('location')?.includes('dashboard') ||
      loginResponse.headers.get('location')?.includes('app');

    if (!isSuccess && result.sessionCookies.length === 0) {
      result.errors.push(`Login failed: Status ${loginResponse.status}`);
      return result;
    }

    result.success = true;

    await eventBus.publish(jobId, {
      type: 'agent.progress',
      agent: 'authenticated-scanner',
      jobId,
      timestamp: Date.now(),
      progress: 50,
      message: 'Login successful, crawling protected pages',
    });

    // Step 2: Crawl protected routes with session
    const protectedRoutes = [
      '/dashboard',
      '/app',
      '/home',
      '/profile',
      '/settings',
      '/account',
    ];

    const cookieHeader = result.sessionCookies.map(c => c.split(';')[0]).join('; ');

    for (const route of protectedRoutes) {
      try {
        const protectedUrl = new URL(route, baseUrl).href;
        const response = await fetch(protectedUrl, {
          headers: {
            'Cookie': cookieHeader,
            'User-Agent': 'VibeCode-Audit/1.0',
          },
          redirect: 'follow',
        });

        if (response.status === 200) {
          const html = await response.text();
          const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
          const title = titleMatch ? titleMatch[1] : undefined;

          // Detect features
          const features: string[] = [];
          const htmlLower = html.toLowerCase();
          if (htmlLower.includes('chart') || htmlLower.includes('graph')) features.push('analytics');
          if (htmlLower.includes('table') || htmlLower.includes('data')) features.push('data-display');
          if (htmlLower.includes('form') || htmlLower.includes('input')) features.push('forms');
          if (htmlLower.includes('api') || htmlLower.includes('fetch')) features.push('api-calls');

          // Check for security issues
          const securityIssues: string[] = [];
          if (!htmlLower.includes('csrf') && htmlLower.includes('form')) {
            securityIssues.push('No CSRF token detected in forms');
          }
          if (htmlLower.includes('password') && htmlLower.includes('type="text"')) {
            securityIssues.push('Password field may not be masked');
          }

          result.authenticatedPages.push({
            url: protectedUrl,
            statusCode: response.status,
            title,
            features,
            securityIssues,
          });
        }
      } catch (error) {
        result.errors.push(`Failed to crawl ${route}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Step 3: Test API endpoints
    const apiEndpoints = [
      '/api/user',
      '/api/me',
      '/api/profile',
      '/api/dashboard',
      '/api/data',
    ];

    await eventBus.publish(jobId, {
      type: 'agent.progress',
      agent: 'authenticated-scanner',
      jobId,
      timestamp: Date.now(),
      progress: 80,
      message: 'Testing authenticated API endpoints',
    });

    for (const endpoint of apiEndpoints) {
      try {
        const apiUrl = new URL(endpoint, baseUrl).href;
        
        // Test without auth first
        const unauthResponse = await fetch(apiUrl, {
          headers: { 'User-Agent': 'VibeCode-Audit/1.0' },
        });
        
        // Test with auth
        const authResponse = await fetch(apiUrl, {
          headers: {
            'Cookie': cookieHeader,
            'User-Agent': 'VibeCode-Audit/1.0',
          },
        });

        result.apiEndpoints.push({
          url: apiUrl,
          method: 'GET',
          requiresAuth: authResponse.status !== unauthResponse.status,
          responseStatus: authResponse.status,
        });
      } catch {
        // Endpoint might not exist
      }
    }

    await eventBus.publish(jobId, {
      type: 'agent.completed',
      agent: 'authenticated-scanner',
      jobId,
      timestamp: Date.now(),
      data: { 
        pagesScanned: result.authenticatedPages.length,
        apiEndpoints: result.apiEndpoints.length,
      },
    });

  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    await eventBus.publish(jobId, {
      type: 'agent.failed',
      agent: 'authenticated-scanner',
      jobId,
      timestamp: Date.now(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  return result;
}

