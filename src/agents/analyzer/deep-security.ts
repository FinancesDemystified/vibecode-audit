/**
 * Deep Security Analyzer - Behavioral testing & security copy analysis
 * Dependencies: @vibecode-audit/shared, @vibecode-audit/agents
 * Purpose: Test actual security behavior, analyze security copy, verify claims
 */
import type { EventBus } from '../communication';
import type { SecurityData } from '../scanner/extractor';
import type { CrawlResult } from '../scanner/crawler';

export interface DeepSecurityAnalysis {
  securityCopyAnalysis: SecurityCopyAnalysis;
  authenticationTesting: AuthenticationTesting;
  behavioralTests: BehavioralTests;
  claimVerification: ClaimVerification;
  recommendations: SecurityRecommendation[];
  overallScore: number;
}

export interface SecurityCopyAnalysis {
  privacyPolicy: {
    found: boolean;
    url?: string;
    claims: string[];
    gaps: string[];
    score: number;
  };
  securityPage: {
    found: boolean;
    url?: string;
    claims: string[];
    gaps: string[];
    score: number;
  };
  trustSignals: {
    badges: string[];
    certifications: string[];
    guarantees: string[];
    score: number;
  };
  aiAnalysis: {
    accuracy: number;
    completeness: number;
    clarity: number;
    issues: string[];
  };
}

export interface AuthenticationTesting {
  rateLimiting: {
    tested: boolean;
    protected: boolean;
    threshold?: number;
    evidence: string;
  };
  bruteForceProtection: {
    tested: boolean;
    protected: boolean;
    evidence: string;
  };
  sessionManagement: {
    secureCookies: boolean;
    sessionFixation: boolean;
    timeoutDetected: boolean;
    evidence: string[];
  };
  passwordPolicy: {
    enforced: boolean;
    minLength?: number;
    complexity?: string;
    evidence: string;
  };
  errorMessages: {
    informationDisclosure: boolean;
    userEnumeration: boolean;
    evidence: string[];
  };
}

export interface BehavioralTests {
  csrfProtection: {
    tested: boolean;
    protected: boolean;
    evidence: string;
  };
  xssProtection: {
    tested: boolean;
    vulnerable: boolean;
    evidence: string;
  };
  inputValidation: {
    tested: boolean;
    vulnerable: boolean;
    evidence: string[];
  };
  informationDisclosure: {
    errorMessages: string[];
    exposedEndpoints: string[];
    directoryListing: boolean;
  };
}

export interface ClaimVerification {
  claims: Array<{
    claim: string;
    verified: boolean;
    evidence: string;
    severity: 'low' | 'medium' | 'high';
  }>;
  score: number;
}

export interface SecurityRecommendation {
  category: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  issue: string;
  fix: string;
  impact: string;
  cost: 'free' | 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
}

export async function performDeepSecurityAnalysis(
  baseUrl: string,
  crawlResult: CrawlResult,
  securityData: SecurityData,
  eventBus: EventBus,
  jobId: string,
  credentials?: { username?: string; password?: string; email?: string }
): Promise<DeepSecurityAnalysis> {
  await eventBus.publish(jobId, {
    type: 'agent.started',
    agent: 'analyzer.deep-security',
    jobId,
    timestamp: Date.now(),
  });

  // Run parallel analyses
  const [securityCopy, authTesting, behavioral, claimVerification] = await Promise.all([
    analyzeSecurityCopy(baseUrl, crawlResult, securityData, eventBus, jobId),
    testAuthentication(baseUrl, securityData, eventBus, jobId, credentials),
    performBehavioralTests(baseUrl, crawlResult, securityData, eventBus, jobId),
    verifySecurityClaims(baseUrl, crawlResult, securityData, eventBus, jobId),
  ]);

  // Generate recommendations
  const recommendations = generateRecommendations({
    securityCopy,
    authTesting,
    behavioral,
    claimVerification,
  });

  // Calculate overall score
  // For static sites without auth, redistribute auth weight proportionally
  const hasAuth = authTesting.rateLimiting.tested || 
                  authTesting.bruteForceProtection.tested ||
                  authTesting.sessionManagement.secureCookies;
  
  let overallScore: number;
  if (!hasAuth) {
    // Static site: redistribute 35% auth weight across other categories
    // Direct calculation without double-weighting
    const secCopyScore = securityCopy.aiAnalysis.accuracy * 0.40; // 40% weight
    const behavScore = ((behavioral.csrfProtection.protected ? 33 : 0) + 
                        (!behavioral.xssProtection.vulnerable ? 33 : 0) + 
                        (!behavioral.inputValidation.vulnerable ? 34 : 0)) * 0.40; // 40% weight
    const claimScore = claimVerification.score * 0.20; // 20% weight
    overallScore = secCopyScore + behavScore + claimScore;
  } else {
    // App with auth: use standard weighting
    const authScore = ((authTesting.rateLimiting.protected ? 25 : 0) + 
                       (authTesting.bruteForceProtection.protected ? 25 : 0) + 
                       (authTesting.sessionManagement.secureCookies ? 25 : 0) + 
                       (authTesting.passwordPolicy.enforced ? 25 : 0));
    overallScore = calculateOverallScore({
      securityCopy: securityCopy.aiAnalysis.accuracy * 0.25,
      authTesting: authScore,
      behavioral: (behavioral.csrfProtection.protected ? 33 : 0) + (!behavioral.xssProtection.vulnerable ? 33 : 0) + (!behavioral.inputValidation.vulnerable ? 34 : 0),
      claimVerification: claimVerification.score,
    });
  }

  await eventBus.publish(jobId, {
    type: 'agent.completed',
    agent: 'analyzer.deep-security',
    jobId,
    timestamp: Date.now(),
    data: { overallScore, recommendationsCount: recommendations.length },
  });

  return {
    securityCopyAnalysis: securityCopy,
    authenticationTesting: authTesting,
    behavioralTests: behavioral,
    claimVerification,
    recommendations,
    overallScore: Math.round(overallScore),
  };
}

async function analyzeSecurityCopy(
  baseUrl: string,
  crawlResult: CrawlResult,
  securityData: SecurityData,
  eventBus: EventBus,
  jobId: string
): Promise<SecurityCopyAnalysis> {
  await eventBus.publish(jobId, {
    type: 'agent.progress',
    agent: 'analyzer.deep-security',
    jobId,
    timestamp: Date.now(),
    progress: 10,
    message: 'Analyzing security copy',
  });

  const html = crawlResult.html.toLowerCase();
  const htmlOriginal = crawlResult.html;

  // Find privacy policy
  const privacyPolicyLinks = [
    ...htmlOriginal.matchAll(/href=["']([^"']*(?:privacy|policy)[^"']*)["']/gi),
    ...htmlOriginal.matchAll(/href=["']([^"']*\/privacy[^"']*)["']/gi),
  ];
  const privacyPolicyUrl = privacyPolicyLinks.length > 0
    ? new URL(privacyPolicyLinks[0][1], baseUrl).href
    : undefined;

  let privacyPolicyContent = '';
  if (privacyPolicyUrl) {
    try {
      const response = await fetch(privacyPolicyUrl, {
        headers: { 'User-Agent': 'VibeCode-Audit/1.0' },
      });
      if (response.ok) privacyPolicyContent = await response.text();
    } catch {
      // Privacy policy not accessible
    }
  }

  // Find security page
  const securityPageLinks = [
    ...htmlOriginal.matchAll(/href=["']([^"']*(?:security|secure)[^"']*)["']/gi),
    ...htmlOriginal.matchAll(/href=["']([^"']*\/security[^"']*)["']/gi),
  ];
  const securityPageUrl = securityPageLinks.length > 0
    ? new URL(securityPageLinks[0][1], baseUrl).href
    : undefined;

  let securityPageContent = '';
  if (securityPageUrl) {
    try {
      const response = await fetch(securityPageUrl, {
        headers: { 'User-Agent': 'VibeCode-Audit/1.0' },
      });
      if (response.ok) securityPageContent = await response.text();
    } catch {
      // Security page not accessible
    }
  }

  // Extract claims from privacy policy
  const privacyClaims: string[] = [];
  const privacyGaps: string[] = [];
  if (privacyPolicyContent) {
    const policyLower = privacyPolicyContent.toLowerCase();
    if (policyLower.includes('encrypt')) privacyClaims.push('Data encryption');
    if (policyLower.includes('gdpr') || policyLower.includes('general data protection')) privacyClaims.push('GDPR compliance');
    if (policyLower.includes('ccpa') || policyLower.includes('california consumer')) privacyClaims.push('CCPA compliance');
    if (policyLower.includes('data retention')) privacyClaims.push('Data retention policy');
    if (!policyLower.includes('cookie')) privacyGaps.push('Cookie policy missing');
    if (!policyLower.includes('third-party')) privacyGaps.push('Third-party data sharing not disclosed');
  } else {
    privacyGaps.push('Privacy policy not found or inaccessible');
  }

  // Extract claims from security page
  const securityClaims: string[] = [];
  const securityGaps: string[] = [];
  if (securityPageContent) {
    const securityLower = securityPageContent.toLowerCase();
    if (securityLower.includes('ssl') || securityLower.includes('tls')) securityClaims.push('SSL/TLS encryption');
    if (securityLower.includes('2fa') || securityLower.includes('two-factor')) securityClaims.push('2FA available');
    if (securityLower.includes('soc 2') || securityLower.includes('iso 27001')) securityClaims.push('Security certifications');
    if (securityLower.includes('penetration test') || securityLower.includes('pen test')) securityClaims.push('Penetration testing');
    if (!securityLower.includes('incident')) securityGaps.push('Incident response plan not mentioned');
  } else {
    securityGaps.push('Security page not found or inaccessible');
  }

  // Detect trust signals
  const badges: string[] = [];
  const certifications: string[] = [];
  const guarantees: string[] = [];

  if (html.includes('ssl') || html.includes('secure')) badges.push('SSL Badge');
  if (html.includes('norton') || html.includes('mcafee')) badges.push('Security Badge');
  if (html.includes('trustpilot') || html.includes('trust badge')) badges.push('Trust Badge');
  if (html.includes('soc 2') || html.includes('iso 27001') || html.includes('pci-dss')) {
    certifications.push('Security Certification Mentioned');
  }
  if (html.includes('money-back') || html.includes('guarantee')) guarantees.push('Money-back guarantee');

  // AI analysis of security copy
  const combinedContent = `${privacyPolicyContent} ${securityPageContent}`.trim();
  let aiAnalysis = {
    accuracy: 50,
    completeness: privacyPolicyContent ? 60 : 30,
    clarity: 50,
    issues: [] as string[],
  };

  if (combinedContent.length > 100) {
    // Rule-based analysis (AI integration can be added later)
    aiAnalysis = {
      accuracy: privacyPolicyContent && securityPageContent ? 75 : 50,
      completeness: privacyPolicyContent ? (privacyGaps.length === 0 ? 80 : 60) : 30,
      clarity: combinedContent.length > 500 ? 70 : 50,
      issues: privacyGaps.length > 0 ? privacyGaps : securityGaps.length > 0 ? securityGaps : ['No major issues detected'],
    };
  }

  return {
    privacyPolicy: {
      found: !!privacyPolicyUrl,
      url: privacyPolicyUrl,
      claims: privacyClaims,
      gaps: privacyGaps,
      score: privacyPolicyContent ? Math.max(0, 100 - privacyGaps.length * 15) : 0,
    },
    securityPage: {
      found: !!securityPageUrl,
      url: securityPageUrl,
      claims: securityClaims,
      gaps: securityGaps,
      score: securityPageContent ? Math.max(0, 100 - securityGaps.length * 15) : 0,
    },
    trustSignals: {
      badges,
      certifications,
      guarantees,
      score: (badges.length * 20) + (certifications.length * 30) + (guarantees.length * 20),
    },
    aiAnalysis,
  };
}

async function testAuthentication(
  baseUrl: string,
  securityData: SecurityData,
  eventBus: EventBus,
  jobId: string,
  credentials?: { username?: string; password?: string; email?: string }
): Promise<AuthenticationTesting> {
  await eventBus.publish(jobId, {
    type: 'agent.progress',
    agent: 'analyzer.deep-security',
    jobId,
    timestamp: Date.now(),
    progress: 40,
    message: 'Testing authentication security',
  });

  const loginEndpoint = securityData.authFlow.authEndpoints[0] || '/login';
  const loginUrl = new URL(loginEndpoint, baseUrl).href;

  // Test rate limiting
  let rateLimitingProtected = false;
  let rateLimitThreshold: number | undefined;
  const rateLimitEvidence: string[] = [];

  if (credentials) {
    try {
      const attempts: Array<{ status: number; time: number }> = [];
      for (let i = 0; i < 6; i++) {
        const start = Date.now();
        const formData = new URLSearchParams();
        if (credentials.email) formData.append('email', credentials.email);
        if (credentials.password) formData.append('password', 'wrongpassword');
        
        const response = await fetch(loginUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formData.toString(),
        });
        
        attempts.push({ status: response.status, time: Date.now() - start });
        
        if (response.status === 429) {
          rateLimitingProtected = true;
          rateLimitThreshold = i + 1;
          rateLimitEvidence.push(`Rate limit triggered after ${i + 1} attempts (429)`);
          break;
        }
        
        // Small delay to avoid overwhelming
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      if (!rateLimitingProtected && attempts.length >= 5) {
        rateLimitEvidence.push('No rate limiting detected after 5+ attempts');
      }
    } catch {
      rateLimitEvidence.push('Could not test rate limiting');
    }
  }

  // Test brute force protection (similar to rate limiting but check for account lockout)
  let bruteForceProtected = false;
  const bruteForceEvidence: string[] = [];
  
  if (credentials) {
    try {
      const formData = new URLSearchParams();
      if (credentials.email) formData.append('email', credentials.email);
      formData.append('password', 'wrongpassword1');
      
      const response1 = await fetch(loginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      });
      
      formData.set('password', 'wrongpassword2');
      const response2 = await fetch(loginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      });
      
      // Check if error message changes (indicates lockout)
      const text1 = await response1.text();
      const text2 = await response2.text();
      
      if (text1 !== text2 && (text2.includes('lock') || text2.includes('too many') || text2.includes('suspended'))) {
        bruteForceProtected = true;
        bruteForceEvidence.push('Account lockout detected after multiple failed attempts');
      } else {
        bruteForceEvidence.push('No account lockout detected');
      }
    } catch {
      bruteForceEvidence.push('Could not test brute force protection');
    }
  }

  // Analyze session management
  const sessionEvidence: string[] = [];
  const secureCookies = securityData.cookies.some(c => c.secure && c.httpOnly);
  const sessionFixation = securityData.cookies.some(c => 
    c.name.toLowerCase().includes('session') && !c.secure
  );

  if (secureCookies) {
    sessionEvidence.push('Secure, HttpOnly cookies detected');
  } else {
    sessionEvidence.push('Missing secure or HttpOnly flags on cookies');
  }

  if (sessionFixation) {
    sessionEvidence.push('Potential session fixation vulnerability (non-secure session cookies)');
  }

  // Test password policy (check error messages)
  let passwordPolicyEnforced = false;
  let minLength: number | undefined;
  const passwordEvidence: string[] = [];

  if (credentials) {
    try {
      const formData = new URLSearchParams();
      if (credentials.email) formData.append('email', credentials.email);
      formData.append('password', '123'); // Too short
      
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      });
      
      const text = (await response.text()).toLowerCase();
      if (text.includes('password') && (text.includes('short') || text.includes('length') || text.includes('minimum'))) {
        passwordPolicyEnforced = true;
        const lengthMatch = text.match(/(\d+)\s*(?:character|char)/);
        if (lengthMatch) minLength = parseInt(lengthMatch[1]);
        passwordEvidence.push('Password policy enforced (length requirement detected)');
      } else {
        passwordEvidence.push('No password policy enforcement detected');
      }
    } catch {
      passwordEvidence.push('Could not test password policy');
    }
  }

  // Test error messages for information disclosure
  const errorEvidence: string[] = [];
  let informationDisclosure = false;
  let userEnumeration = false;

  if (credentials) {
    try {
      // Test with non-existent user
      const formData1 = new URLSearchParams();
      formData1.append('email', 'nonexistent@example.com');
      formData1.append('password', 'wrongpassword');
      
      const response1 = await fetch(loginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData1.toString(),
      });
      
      const text1 = (await response1.text()).toLowerCase();
      
      // Test with wrong password (user exists)
      const formData2 = new URLSearchParams();
      if (credentials?.email) formData2.append('email', credentials.email);
      formData2.append('password', 'wrongpassword');
      
      const response2 = await fetch(loginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData2.toString(),
      });
      
      const text2 = (await response2.text()).toLowerCase();
      
      // Compare error messages
      if (text1 !== text2) {
        userEnumeration = true;
        errorEvidence.push('User enumeration possible (different error messages)');
      }
      
      if (text1.includes('database') || text1.includes('sql') || text1.includes('error') || text1.includes('exception')) {
        informationDisclosure = true;
        errorEvidence.push('Information disclosure in error messages');
      }
    } catch {
      errorEvidence.push('Could not test error messages');
    }
  }

  return {
    rateLimiting: {
      tested: !!credentials,
      protected: rateLimitingProtected,
      threshold: rateLimitThreshold,
      evidence: rateLimitEvidence.join('; '),
    },
    bruteForceProtection: {
      tested: !!credentials,
      protected: bruteForceProtected,
      evidence: bruteForceEvidence.join('; '),
    },
    sessionManagement: {
      secureCookies,
      sessionFixation,
      timeoutDetected: false, // Would need to test actual session timeout
      evidence: sessionEvidence,
    },
    passwordPolicy: {
      enforced: passwordPolicyEnforced,
      minLength,
      complexity: passwordPolicyEnforced ? 'detected' : undefined,
      evidence: passwordEvidence.join('; '),
    },
    errorMessages: {
      informationDisclosure,
      userEnumeration,
      evidence: errorEvidence,
    },
  };
}

async function performBehavioralTests(
  baseUrl: string,
  crawlResult: CrawlResult,
  securityData: SecurityData,
  eventBus: EventBus,
  jobId: string
): Promise<BehavioralTests> {
  await eventBus.publish(jobId, {
    type: 'agent.progress',
    agent: 'analyzer.deep-security',
    jobId,
    timestamp: Date.now(),
    progress: 70,
    message: 'Performing behavioral security tests',
  });

  // Test CSRF protection
  let csrfProtected = false;
  const csrfEvidence: string[] = [];
  
  const forms = securityData.forms.filter(f => f.method === 'POST');
  if (forms.length > 0) {
    const form = forms[0];
    const formHtml = crawlResult.html.toLowerCase();
    
    // Check for CSRF token
    if (formHtml.includes('csrf') || formHtml.includes('_token') || formHtml.includes('authenticity')) {
      csrfProtected = true;
      csrfEvidence.push('CSRF token detected in forms');
    } else {
      csrfEvidence.push('No CSRF token detected in POST forms');
    }
  }

  // Test XSS protection (inject benign payload)
  let xssVulnerable = false;
  const xssEvidence: string[] = [];
  
  try {
    const searchForms = securityData.forms.filter(f => 
      f.action.includes('search') || f.inputs.some(i => i.includes('search') || i.includes('q'))
    );
    
    if (searchForms.length > 0) {
      const searchUrl = new URL(searchForms[0].action, baseUrl).href;
      const payload = '<script>alert("xss")</script>';
      const formData = new URLSearchParams();
      formData.append(searchForms[0].inputs[0] || 'q', payload);
      
      const response = await fetch(searchUrl, {
        method: searchForms[0].method,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      });
      
      const html = await response.text();
      if (html.includes(payload) && !html.includes('&lt;script&gt;')) {
        xssVulnerable = true;
        xssEvidence.push('XSS payload reflected without encoding');
      } else {
        xssEvidence.push('XSS protection appears active (payload encoded or filtered)');
      }
    }
  } catch {
    xssEvidence.push('Could not test XSS protection');
  }

  // Test input validation
  let inputVulnerable = false;
  const inputEvidence: string[] = [];
  
  try {
    // Test SQL injection (benign)
    const testForms = securityData.forms.slice(0, 2);
    for (const form of testForms) {
      const formUrl = new URL(form.action, baseUrl).href;
      const sqlPayload = "' OR '1'='1";
      const formData = new URLSearchParams();
      if (form.inputs.length > 0) {
        formData.append(form.inputs[0], sqlPayload);
        
        const response = await fetch(formUrl, {
          method: form.method,
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formData.toString(),
        });
        
        const text = (await response.text()).toLowerCase();
        if (text.includes('sql') || text.includes('database') || text.includes('mysql') || text.includes('postgres')) {
          inputVulnerable = true;
          inputEvidence.push(`SQL injection possible in ${form.action}`);
        }
      }
    }
    
    if (!inputVulnerable && testForms.length > 0) {
      inputEvidence.push('Input validation appears effective');
    }
  } catch {
    inputEvidence.push('Could not test input validation');
  }

  // Check for information disclosure
  const errorMessages: string[] = [];
  const exposedEndpoints: string[] = [];
  
  // Check for common exposed endpoints
  const commonEndpoints = ['/api', '/admin', '/.env', '/config', '/backup', '/.git'];
  for (const endpoint of commonEndpoints) {
    try {
      const url = new URL(endpoint, baseUrl).href;
      const response = await fetch(url, {
        headers: { 'User-Agent': 'VibeCode-Audit/1.0' },
      });
      
      if (response.status === 200 && response.headers.get('content-type')?.includes('text')) {
        const text = await response.text();
        if (text.includes('password') || text.includes('secret') || text.includes('key') || text.includes('token')) {
          exposedEndpoints.push(endpoint);
        }
      }
    } catch {
      // Endpoint doesn't exist or blocked
    }
  }

  // Check for directory listing
  let directoryListing = false;
  try {
    const testPaths = ['/uploads', '/files', '/assets', '/static'];
    for (const path of testPaths) {
      const url = new URL(path, baseUrl).href;
      const response = await fetch(url, {
        headers: { 'User-Agent': 'VibeCode-Audit/1.0' },
      });
      
      if (response.ok) {
        const html = await response.text();
        if (html.includes('<a href') && html.includes('Parent Directory')) {
          directoryListing = true;
          break;
        }
      }
    }
  } catch {
    // Could not test
  }

  return {
    csrfProtection: {
      tested: forms.length > 0,
      protected: csrfProtected,
      evidence: csrfEvidence.join('; '),
    },
    xssProtection: {
      tested: securityData.forms.length > 0,
      vulnerable: xssVulnerable,
      evidence: xssEvidence.join('; '),
    },
    inputValidation: {
      tested: securityData.forms.length > 0,
      vulnerable: inputVulnerable,
      evidence: inputEvidence,
    },
    informationDisclosure: {
      errorMessages,
      exposedEndpoints,
      directoryListing,
    },
  };
}

async function verifySecurityClaims(
  baseUrl: string,
  crawlResult: CrawlResult,
  securityData: SecurityData,
  eventBus: EventBus,
  jobId: string
): Promise<ClaimVerification> {
  await eventBus.publish(jobId, {
    type: 'agent.progress',
    agent: 'analyzer.deep-security',
    jobId,
    timestamp: Date.now(),
    progress: 90,
    message: 'Verifying security claims',
  });

  const html = crawlResult.html.toLowerCase();
  const claims: ClaimVerification['claims'] = [];

  // Check HTTPS claim
  if (html.includes('secure') || html.includes('encrypted')) {
    const isHttps = baseUrl.startsWith('https://');
    claims.push({
      claim: 'HTTPS/Encryption',
      verified: isHttps,
      evidence: isHttps ? 'HTTPS enabled' : 'Claims encryption but HTTP detected',
      severity: 'high',
    });
  }

  // Check 2FA claim
  if (securityData.authFlow.has2FA) {
    // Can't verify actual enforcement, but note it's mentioned
    claims.push({
      claim: '2FA/MFA Available',
      verified: true, // Mentioned in UI
      evidence: '2FA mentioned in UI/scripts (enforcement not verified)',
      severity: 'medium',
    });
  }

  // Check security headers claim
  if (html.includes('security') || html.includes('protected')) {
    const hasCSP = !!securityData.headers.csp;
    const hasHSTS = !!securityData.headers.hsts;
    claims.push({
      claim: 'Security Headers',
      verified: hasCSP && hasHSTS,
      evidence: hasCSP && hasHSTS ? 'CSP and HSTS headers present' : 'Missing security headers',
      severity: 'high',
    });
  }

  // Check cookie security claim
  if (html.includes('secure cookie') || html.includes('encrypted cookie')) {
    const secureCookies = securityData.cookies.some(c => c.secure && c.httpOnly);
    claims.push({
      claim: 'Secure Cookies',
      verified: secureCookies,
      evidence: secureCookies ? 'Secure, HttpOnly cookies detected' : 'Cookies not properly secured',
      severity: 'medium',
    });
  }

  const verifiedCount = claims.filter(c => c.verified).length;
  const score = claims.length > 0 ? (verifiedCount / claims.length) * 100 : 100;

  return {
    claims,
    score: Math.round(score),
  };
}

function generateRecommendations(analysis: {
  securityCopy: SecurityCopyAnalysis;
  authTesting: AuthenticationTesting;
  behavioral: BehavioralTests;
  claimVerification: ClaimVerification;
}): SecurityRecommendation[] {
  const recommendations: SecurityRecommendation[] = [];

  // Security copy recommendations
  if (!analysis.securityCopy.privacyPolicy.found) {
    recommendations.push({
      category: 'Security Copy',
      priority: 'high',
      issue: 'Privacy policy not found',
      fix: 'Create and publish a privacy policy page',
      impact: 'Required for GDPR/CCPA compliance, builds trust',
      cost: 'free',
      effort: 'low',
    });
  }

  if (analysis.securityCopy.privacyPolicy.gaps.length > 0) {
    recommendations.push({
      category: 'Security Copy',
      priority: 'medium',
      issue: `Privacy policy gaps: ${analysis.securityCopy.privacyPolicy.gaps.join(', ')}`,
      fix: 'Update privacy policy to include missing disclosures',
      impact: 'Improves compliance and transparency',
      cost: 'free',
      effort: 'low',
    });
  }

  // Authentication recommendations
  if (!analysis.authTesting.rateLimiting.protected) {
    recommendations.push({
      category: 'Authentication',
      priority: 'critical',
      issue: 'No rate limiting on login endpoint',
      fix: 'Implement rate limiting (e.g., 5 attempts per 15 minutes)',
      impact: 'Prevents brute force attacks',
      cost: 'low',
      effort: 'medium',
    });
  }

  if (!analysis.authTesting.bruteForceProtection.protected) {
    recommendations.push({
      category: 'Authentication',
      priority: 'high',
      issue: 'No account lockout after failed attempts',
      fix: 'Implement temporary account lockout after 5 failed attempts',
      impact: 'Prevents credential stuffing attacks',
      cost: 'free',
      effort: 'low',
    });
  }

  if (analysis.authTesting.errorMessages.userEnumeration) {
    recommendations.push({
      category: 'Authentication',
      priority: 'medium',
      issue: 'User enumeration possible via error messages',
      fix: 'Use generic error messages (e.g., "Invalid credentials")',
      impact: 'Prevents user enumeration attacks',
      cost: 'free',
      effort: 'low',
    });
  }

  // Behavioral test recommendations
  if (!analysis.behavioral.csrfProtection.protected) {
    recommendations.push({
      category: 'Security',
      priority: 'high',
      issue: 'No CSRF protection on forms',
      fix: 'Add CSRF tokens to all POST forms',
      impact: 'Prevents cross-site request forgery attacks',
      cost: 'free',
      effort: 'low',
    });
  }

  if (analysis.behavioral.xssProtection.vulnerable) {
    recommendations.push({
      category: 'Security',
      priority: 'critical',
      issue: 'XSS vulnerability detected',
      fix: 'Encode user input and implement Content-Security-Policy',
      impact: 'Prevents cross-site scripting attacks',
      cost: 'free',
      effort: 'medium',
    });
  }

  if (analysis.behavioral.informationDisclosure.exposedEndpoints.length > 0) {
    recommendations.push({
      category: 'Security',
      priority: 'high',
      issue: `Exposed endpoints: ${analysis.behavioral.informationDisclosure.exposedEndpoints.join(', ')}`,
      fix: 'Restrict access to sensitive endpoints',
      impact: 'Prevents information disclosure',
      cost: 'free',
      effort: 'low',
    });
  }

  return recommendations;
}

function calculateOverallScore(scores: {
  securityCopy: number;
  authTesting: number;
  behavioral: number;
  claimVerification: number;
}): number {
  const total = scores.securityCopy * 0.25 +
    scores.authTesting * 0.35 +
    scores.behavioral * 0.25 +
    scores.claimVerification * 0.15;
  return Math.max(0, Math.min(100, total));
}
