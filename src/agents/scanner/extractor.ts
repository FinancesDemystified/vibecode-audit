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
    referrerPolicy?: string;
    permissionsPolicy?: string;
    server?: string;
    xPoweredBy?: string;
    xAspNetVersion?: string;
    xAspNetMvcVersion?: string;
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
    authLibrary?: string; // Clerk, BetterAuth, NextAuth, Auth0, Supabase, etc. (detected from scripts)
    socialProviders: string[]; // Google, GitHub, Facebook, etc. (detected from buttons/links)
    has2FA: boolean; // 2FA/MFA mentioned in UI/scripts (NOT enforcement - we can't verify requirement)
    loginAttempted?: boolean; // Set in worker if credentials provided and login was attempted
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
    referrerPolicy: crawl.headers['referrer-policy'],
    permissionsPolicy: crawl.headers['permissions-policy'],
    server: crawl.headers['server'],
    xPoweredBy: crawl.headers['x-powered-by'],
    xAspNetVersion: crawl.headers['x-aspnet-version'],
    xAspNetMvcVersion: crawl.headers['x-aspnetmvc-version'],
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
    authLibrary: undefined as string | undefined,
    socialProviders: [] as string[],
    has2FA: false,
  };
  
  const htmlLower = crawl.html.toLowerCase();
  
  // Parse actual form elements for login/signup
  const formContentRegex = /<form[^>]*>(.*?)<\/form>/gis;
  let formMatch;
  while ((formMatch = formContentRegex.exec(crawl.html)) !== null) {
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
  
  // Detect auth libraries (distinct from OAuth providers)
  const scriptsLower = crawl.techStack.scripts.map(s => s.toLowerCase());
  
  if (scriptsLower.some(s => s.includes('clerk') || s.includes('clerk.dev') || s.includes('clerk.com'))) {
    authFlow.authLibrary = 'Clerk';
  } else if (scriptsLower.some(s => s.includes('better-auth') || s.includes('betterauth'))) {
    authFlow.authLibrary = 'BetterAuth';
  } else if (scriptsLower.some(s => s.includes('next-auth') || s.includes('nextauth'))) {
    authFlow.authLibrary = 'NextAuth.js';
  } else if (scriptsLower.some(s => s.includes('auth0'))) {
    authFlow.authLibrary = 'Auth0';
  } else if (scriptsLower.some(s => s.includes('supabase') && (s.includes('auth') || s.includes('supabase.auth')))) {
    authFlow.authLibrary = 'Supabase Auth';
  } else if (scriptsLower.some(s => s.includes('firebase') && s.includes('auth'))) {
    authFlow.authLibrary = 'Firebase Auth';
  } else if (scriptsLower.some(s => s.includes('passport.js') || s.includes('passportjs'))) {
    authFlow.authLibrary = 'Passport.js';
  } else if (htmlLower.includes('kinde') || scriptsLower.some(s => s.includes('kinde'))) {
    authFlow.authLibrary = 'Kinde';
  } else if (htmlLower.includes('lucia') || scriptsLower.some(s => s.includes('lucia-auth'))) {
    authFlow.authLibrary = 'Lucia';
  }
  
  // Also add to oauthProviders for backward compatibility
  if (authFlow.authLibrary) {
    authFlow.oauthProviders.push(authFlow.authLibrary);
  }
  
  // Detect social OAuth providers (separate from auth libraries)
  const oauthButtonRegex = /<[^>]*(?:button|a)[^>]*(?:google|facebook|github|twitter|microsoft|apple|discord|linkedin|spotify|twitch)[^>]*>/gi;
  let oauthMatch;
  const foundSocialProviders = new Set<string>();
  while ((oauthMatch = oauthButtonRegex.exec(crawl.html)) !== null) {
    const buttonText = oauthMatch[0].toLowerCase();
    if (buttonText.includes('google')) foundSocialProviders.add('Google');
    if (buttonText.includes('facebook')) foundSocialProviders.add('Facebook');
    if (buttonText.includes('github')) foundSocialProviders.add('GitHub');
    if (buttonText.includes('twitter') || buttonText.includes('x.com')) foundSocialProviders.add('Twitter/X');
    if (buttonText.includes('microsoft')) foundSocialProviders.add('Microsoft');
    if (buttonText.includes('apple')) foundSocialProviders.add('Apple');
    if (buttonText.includes('discord')) foundSocialProviders.add('Discord');
    if (buttonText.includes('linkedin')) foundSocialProviders.add('LinkedIn');
    if (buttonText.includes('spotify')) foundSocialProviders.add('Spotify');
    if (buttonText.includes('twitch')) foundSocialProviders.add('Twitch');
  }
  
  // Check for OAuth scripts and API endpoints
  if (scriptsLower.some(s => s.includes('google-signin') || s.includes('gapi') || s.includes('accounts.google.com'))) {
    foundSocialProviders.add('Google');
  }
  if (scriptsLower.some(s => s.includes('facebook') && (s.includes('sdk') || s.includes('connect')))) {
    foundSocialProviders.add('Facebook');
  }
  if (scriptsLower.some(s => s.includes('github') && (s.includes('oauth') || s.includes('github.com/login')))) {
    foundSocialProviders.add('GitHub');
  }
  if (scriptsLower.some(s => s.includes('microsoft') && s.includes('login'))) {
    foundSocialProviders.add('Microsoft');
  }
  if (scriptsLower.some(s => s.includes('apple') && s.includes('signin'))) {
    foundSocialProviders.add('Apple');
  }
  
  // Check for OAuth callback URLs
  const callbackRegex = /\/auth\/(?:callback|redirect|google|facebook|github|microsoft|apple|discord|linkedin)/i;
  if (crawl.html.match(callbackRegex)) {
    if (htmlLower.includes('google')) foundSocialProviders.add('Google');
    if (htmlLower.includes('facebook')) foundSocialProviders.add('Facebook');
    if (htmlLower.includes('github')) foundSocialProviders.add('GitHub');
    if (htmlLower.includes('microsoft')) foundSocialProviders.add('Microsoft');
    if (htmlLower.includes('apple')) foundSocialProviders.add('Apple');
    if (htmlLower.includes('discord')) foundSocialProviders.add('Discord');
    if (htmlLower.includes('linkedin')) foundSocialProviders.add('LinkedIn');
  }
  
  authFlow.socialProviders = Array.from(foundSocialProviders);
  authFlow.oauthProviders.push(...authFlow.socialProviders);
  
  // Detect 2FA/MFA mentions (NOT enforcement - we can only see if it's mentioned in UI/scripts)
  // Note: This detects mentions, not actual requirement. Could be marketing, optional feature, or documentation.
  const twoFactorIndicators = [
    'two-factor', '2fa', 'mfa', 'multi-factor', 'totp', 'authenticator',
    'verification code', 'security code', 'sms code', 'backup code',
    'time-based one-time', 'google authenticator', 'authy', 'duo'
  ];
  authFlow.has2FA = twoFactorIndicators.some(indicator => 
    htmlLower.includes(indicator) || 
    scriptsLower.some(s => s.includes(indicator)) ||
    crawl.techStack.metaTags && Object.values(crawl.techStack.metaTags).some(v => v.toLowerCase().includes(indicator))
  );

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

