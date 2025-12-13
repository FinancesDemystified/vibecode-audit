/**
 * Security data extractor
 * Dependencies: @vibecode-audit/shared
 * Purpose: Extract security headers, tech stack, forms from crawl results
 */
import type { EventBus } from '../communication';
import type { CrawlResult } from './crawler';

export interface SecurityData {
  headers: {
    hsts?: string;
    csp?: string;
    xFrameOptions?: string;
    xContentTypeOptions?: string;
    strictTransportSecurity?: string;
  };
  technologies: string[];
  techStack: {
    server?: string;
    framework?: string;
    hosting?: string;
    platform?: string;
  };
  authFlow: {
    hasLoginForm: boolean;
    hasSignupForm: boolean;
    authEndpoints: string[];
    oauthProviders: string[];
  };
  forms: Array<{
    action: string;
    method: string;
    inputs: string[];
  }>;
  cookies: Array<{
    name: string;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: string;
  }>;
}


export async function extractSecurityData(
  crawl: CrawlResult,
  eventBus: EventBus,
  jobId: string
): Promise<SecurityData> {
  await eventBus.publish(jobId, {
    type: 'agent.started',
    agent: 'scanner.extractor',
    jobId,
    timestamp: Date.now(),
  });

  const securityHeaders = {
    hsts: crawl.headers['strict-transport-security'],
    csp: crawl.headers['content-security-policy'],
    xFrameOptions: crawl.headers['x-frame-options'],
    xContentTypeOptions: crawl.headers['x-content-type-options'],
    strictTransportSecurity: crawl.headers['strict-transport-security'],
  };

  await eventBus.publish(jobId, {
    type: 'agent.progress',
    agent: 'scanner.extractor',
    jobId,
    timestamp: Date.now(),
    progress: 30,
    message: 'Parsing headers',
  });

  const technologies: string[] = [];
  if (crawl.techStack.framework) {
    technologies.push(crawl.techStack.framework);
  }
  if (crawl.techStack.server) {
    technologies.push(crawl.techStack.server);
  }
  if (crawl.techStack.hosting) {
    technologies.push(crawl.techStack.hosting);
  }
  if (crawl.techStack.platform) {
    technologies.push(crawl.techStack.platform);
  }

  await eventBus.publish(jobId, {
    type: 'agent.progress',
    agent: 'scanner.extractor',
    jobId,
    timestamp: Date.now(),
    progress: 60,
    message: 'Detecting technologies',
  });

  const formRegex = /<form[^>]*action=["']([^"']+)["'][^>]*method=["']([^"']+)["'][^>]*>(.*?)<\/form>/gis;
  const forms: SecurityData['forms'] = [];
  let match;
  while ((match = formRegex.exec(crawl.html)) !== null) {
    const inputRegex = /<input[^>]*name=["']([^"']+)["'][^>]*>/gi;
    const inputs: string[] = [];
    let inputMatch;
    while ((inputMatch = inputRegex.exec(match[3])) !== null) {
      inputs.push(inputMatch[1]);
    }
    forms.push({
      action: match[1],
      method: match[2].toUpperCase(),
      inputs,
    });
  }

  await eventBus.publish(jobId, {
    type: 'agent.progress',
    agent: 'scanner.extractor',
    jobId,
    timestamp: Date.now(),
    progress: 90,
    message: 'Extracting forms',
  });

  // Detect auth flows
  const authFlow = {
    hasLoginForm: false,
    hasSignupForm: false,
    authEndpoints: [] as string[],
    oauthProviders: [] as string[],
  };
  
  const htmlLower = crawl.html.toLowerCase();
  
  // Parse actual form elements for login/signup
  const formRegex = /<form[^>]*>(.*?)<\/form>/gis;
  let formMatch;
  while ((formMatch = formRegex.exec(crawl.html)) !== null) {
    const formContent = formMatch[1].toLowerCase();
    const hasPassword = formContent.includes('type="password"') || formContent.includes("type='password'");
    const hasEmail = formContent.includes('type="email"') || formContent.includes("type='email'") || formContent.includes('name="email"') || formContent.includes("name='email'");
    const hasUsername = formContent.includes('name="username"') || formContent.includes("name='username'") || formContent.includes('name="user"') || formContent.includes("name='user'");
    
    if (hasPassword && (hasEmail || hasUsername)) {
      // Check if it's signup or login
      const formAction = formMatch[0].toLowerCase();
      if (formAction.includes('signup') || formAction.includes('sign-up') || formAction.includes('register')) {
        authFlow.hasSignupForm = true;
      } else if (formAction.includes('login') || formAction.includes('signin') || formAction.includes('sign-in')) {
        authFlow.hasLoginForm = true;
      } else {
        // Default to login if password field found
        authFlow.hasLoginForm = true;
      }
    }
  }
  
  // Fallback: Check for login/signup text if no forms found
  if (!authFlow.hasLoginForm && !authFlow.hasSignupForm) {
    authFlow.hasLoginForm = htmlLower.includes('login') || htmlLower.includes('sign in') || htmlLower.includes('signin');
    authFlow.hasSignupForm = htmlLower.includes('signup') || htmlLower.includes('sign up') || htmlLower.includes('register');
  }
  
  // Extract auth endpoints from links, forms, and scripts
  const linkRegex = /href=["']([^"']*(?:login|signin|signup|register|auth|oauth)[^"']*)["']/gi;
  let linkMatch;
  while ((linkMatch = linkRegex.exec(crawl.html)) !== null) {
    authFlow.authEndpoints.push(linkMatch[1]);
  }
  
  // Check for auth API endpoints in scripts
  const apiRegex = /["']([^"']*\/api\/(?:auth|login|signin|signup|register)[^"']*)["']/gi;
  let apiMatch;
  while ((apiMatch = apiRegex.exec(crawl.html)) !== null) {
    authFlow.authEndpoints.push(apiMatch[1]);
  }
  
  // Detect modern auth providers
  if (crawl.techStack.scripts.some(s => s.includes('clerk'))) {
    authFlow.oauthProviders.push('Clerk');
  }
  if (crawl.techStack.scripts.some(s => s.includes('auth0'))) {
    authFlow.oauthProviders.push('Auth0');
  }
  if (crawl.techStack.scripts.some(s => s.includes('supabase') && s.includes('auth'))) {
    authFlow.oauthProviders.push('Supabase Auth');
  }
  if (crawl.techStack.scripts.some(s => s.includes('next-auth'))) {
    authFlow.oauthProviders.push('NextAuth');
  }
  
  // Detect OAuth providers from buttons, links, and scripts
  const oauthButtonRegex = /<[^>]*(?:button|a)[^>]*(?:google|facebook|github|twitter|microsoft|apple)[^>]*>/gi;
  let oauthMatch;
  const foundProviders = new Set<string>();
  while ((oauthMatch = oauthButtonRegex.exec(crawl.html)) !== null) {
    const buttonText = oauthMatch[0].toLowerCase();
    if (buttonText.includes('google')) foundProviders.add('Google');
    if (buttonText.includes('facebook')) foundProviders.add('Facebook');
    if (buttonText.includes('github')) foundProviders.add('GitHub');
    if (buttonText.includes('twitter') || buttonText.includes('x.com')) foundProviders.add('Twitter/X');
    if (buttonText.includes('microsoft')) foundProviders.add('Microsoft');
    if (buttonText.includes('apple')) foundProviders.add('Apple');
  }
  
  // Check for OAuth scripts
  if (crawl.techStack.scripts.some(s => s.includes('google-signin') || s.includes('gapi'))) {
    foundProviders.add('Google');
  }
  if (crawl.techStack.scripts.some(s => s.includes('facebook') && s.includes('sdk'))) {
    foundProviders.add('Facebook');
  }
  if (crawl.techStack.scripts.some(s => s.includes('github') && s.includes('oauth'))) {
    foundProviders.add('GitHub');
  }
  
  // Check for OAuth callback URLs
  if (crawl.html.match(/\/auth\/(?:callback|redirect|google|facebook|github)/i)) {
    if (!foundProviders.has('Google') && htmlLower.includes('google')) foundProviders.add('Google');
    if (!foundProviders.has('Facebook') && htmlLower.includes('facebook')) foundProviders.add('Facebook');
    if (!foundProviders.has('GitHub') && htmlLower.includes('github')) foundProviders.add('GitHub');
  }
  
  authFlow.oauthProviders.push(...Array.from(foundProviders));

  const cookieHeader = crawl.headers['set-cookie'];
  const cookies: SecurityData['cookies'] = [];
  if (cookieHeader) {
    const cookieStrings = Array.isArray(cookieHeader) ? cookieHeader : [cookieHeader];
    cookieStrings.forEach((cookieStr) => {
      const parts = cookieStr.split(';');
      const nameValue = parts[0].split('=');
      const cookie: SecurityData['cookies'][0] = {
        name: nameValue[0].trim(),
      };
      parts.slice(1).forEach((part: string) => {
        const trimmed = part.trim().toLowerCase();
        if (trimmed === 'httponly') cookie.httpOnly = true;
        if (trimmed === 'secure') cookie.secure = true;
        if (trimmed.startsWith('samesite=')) {
          cookie.sameSite = trimmed.split('=')[1];
        }
      });
      cookies.push(cookie);
    });
  }

  await eventBus.publish(jobId, {
    type: 'agent.completed',
    agent: 'scanner.extractor',
    jobId,
    timestamp: Date.now(),
    data: { technologies, formsCount: forms.length, authFlow },
  });

  return {
    headers: securityHeaders,
    technologies,
    techStack: {
      server: crawl.techStack.server,
      framework: crawl.techStack.framework,
      hosting: crawl.techStack.hosting,
      platform: crawl.techStack.platform,
    },
    authFlow,
    forms,
    cookies,
  };
}

