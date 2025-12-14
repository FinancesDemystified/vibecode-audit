/**
 * Vibe-Coding Vulnerability Scanner - Detects common issues in AI-generated apps
 * Dependencies: @vibecode-audit/shared, @vibecode-audit/agents
 * Purpose: Scan for hard-coded secrets, client-side auth, exposed APIs, backend misconfigurations
 */
import type { EventBus } from '../communication';
import type { SecurityData } from '../scanner/extractor';
import type { CrawlResult } from '../scanner/crawler';

export interface VibeCodingVulnerabilities {
  hardCodedSecrets: HardCodedSecret[];
  clientSideAuth: ClientSideAuthAnalysis;
  unauthenticatedApiAccess: UnauthenticatedEndpoint[];
  backendMisconfigurations: BackendMisconfiguration[];
  fileUploadVulnerabilities: FileUploadVulnerability[];
  backendLessPatterns: BackendLessPattern;
  recommendations: VibeCodingRecommendation[];
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  score: number;
}

export interface HardCodedSecret {
  type: 'api-key' | 'supabase-key' | 'firebase-key' | 'token' | 'password' | 'database-url' | 'aws-key';
  location: 'inline-script' | 'external-script' | 'html';
  pattern: string;
  severity: 'critical' | 'high' | 'medium';
  evidence: string;
  recommendation: string;
}

export interface ClientSideAuthAnalysis {
  detected: boolean;
  evidence: string[];
  risk: 'critical' | 'high' | 'medium' | 'low';
  authImplementation: 'client-only' | 'hybrid' | 'server-side';
  issues: string[];
}

export interface UnauthenticatedEndpoint {
  url: string;
  method: string;
  returnsData: boolean;
  dataType?: 'pii' | 'financial' | 'medical' | 'general';
  severity: 'critical' | 'high' | 'medium';
  evidence: string;
}

export interface BackendMisconfiguration {
  type: 'supabase-service-key' | 'firebase-admin-key' | 'missing-rls' | 'open-database' | 'exposed-credentials';
  detected: boolean;
  severity: 'critical' | 'high' | 'medium';
  evidence: string;
  recommendation: string;
}

export interface FileUploadVulnerability {
  endpoint: string;
  unrestricted: boolean;
  fileTypeRestriction: boolean;
  sizeLimit: boolean;
  severity: 'high' | 'medium' | 'low';
  evidence: string;
}

export interface BackendLessPattern {
  detected: boolean;
  type: 'supabase-direct' | 'firebase-direct' | 'api-only' | 'no-backend';
  risk: 'high' | 'medium' | 'low';
  evidence: string[];
}

export interface VibeCodingRecommendation {
  category: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  issue: string;
  fix: string;
  impact: string;
  cost: 'free' | 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
}

export async function scanVibeCodingVulnerabilities(
  baseUrl: string,
  crawlResult: CrawlResult,
  securityData: SecurityData,
  eventBus: EventBus,
  jobId: string
): Promise<VibeCodingVulnerabilities> {
  await eventBus.publish(jobId, {
    type: 'agent.started',
    agent: 'analyzer.vibe-coding-vulnerabilities',
    jobId,
    timestamp: Date.now(),
  });

  await eventBus.publish(jobId, {
    type: 'agent.progress',
    agent: 'analyzer.vibe-coding-vulnerabilities',
    jobId,
    timestamp: Date.now(),
    progress: 20,
    message: 'Scanning for hard-coded secrets',
  });

  const hardCodedSecrets = await scanForSecrets(crawlResult, baseUrl, eventBus, jobId);

  await eventBus.publish(jobId, {
    type: 'agent.progress',
    agent: 'analyzer.vibe-coding-vulnerabilities',
    jobId,
    timestamp: Date.now(),
    progress: 40,
    message: 'Analyzing authentication implementation',
  });

  const clientSideAuth = analyzeClientSideAuth(crawlResult, securityData);

  await eventBus.publish(jobId, {
    type: 'agent.progress',
    agent: 'analyzer.vibe-coding-vulnerabilities',
    jobId,
    timestamp: Date.now(),
    progress: 60,
    message: 'Testing API endpoints for unauthenticated access',
  });

  const unauthenticatedApiAccess = await testUnauthenticatedEndpoints(baseUrl, crawlResult, securityData, eventBus, jobId);

  await eventBus.publish(jobId, {
    type: 'agent.progress',
    agent: 'analyzer.vibe-coding-vulnerabilities',
    jobId,
    timestamp: Date.now(),
    progress: 80,
    message: 'Checking backend misconfigurations',
  });

  const backendMisconfigurations = detectBackendMisconfigurations(crawlResult, securityData);
  const fileUploadVulnerabilities = await testFileUploadEndpoints(baseUrl, crawlResult, securityData, eventBus, jobId);
  const backendLessPatterns = detectBackendLessPatterns(crawlResult, securityData);

  const recommendations = generateRecommendations({
    hardCodedSecrets,
    clientSideAuth,
    unauthenticatedApiAccess,
    backendMisconfigurations,
    fileUploadVulnerabilities,
    backendLessPatterns,
  });

  const overallRisk = calculateOverallRisk({
    hardCodedSecrets,
    clientSideAuth,
    unauthenticatedApiAccess,
    backendMisconfigurations,
    fileUploadVulnerabilities,
    backendLessPatterns,
  });

  const score = calculateScore({
    hardCodedSecrets,
    clientSideAuth,
    unauthenticatedApiAccess,
    backendMisconfigurations,
    fileUploadVulnerabilities,
    backendLessPatterns,
  });

  await eventBus.publish(jobId, {
    type: 'agent.completed',
    agent: 'analyzer.vibe-coding-vulnerabilities',
    jobId,
    timestamp: Date.now(),
    data: { overallRisk, score, findingsCount: hardCodedSecrets.length + unauthenticatedApiAccess.length },
  });

  return {
    hardCodedSecrets,
    clientSideAuth,
    unauthenticatedApiAccess,
    backendMisconfigurations,
    fileUploadVulnerabilities,
    backendLessPatterns,
    recommendations,
    overallRisk,
    score,
  };
}

async function scanForSecrets(
  crawlResult: CrawlResult,
  baseUrl: string,
  eventBus: EventBus,
  jobId: string
): Promise<HardCodedSecret[]> {
  const secrets: HardCodedSecret[] = [];
  const html = crawlResult.html;
  const htmlLower = html.toLowerCase();

  // Extract all JavaScript content (inline + external)
  const inlineScripts: string[] = [];
  const scriptRegex = /<script[^>]*>(.*?)<\/script>/gis;
  let match;
  while ((match = scriptRegex.exec(html)) !== null) {
    inlineScripts.push(match[1]);
  }

  // Extract external script URLs
  const externalScripts: string[] = [];
  const externalScriptRegex = /<script[^>]*src=["']([^"']+)["']/gi;
  while ((match = externalScriptRegex.exec(html)) !== null) {
    externalScripts.push(match[1]);
  }

  // Fetch external scripts
  const externalScriptContents: string[] = [];
  for (const scriptUrl of externalScripts.slice(0, 10)) { // Limit to 10 to avoid timeout
    try {
      const fullUrl = new URL(scriptUrl, baseUrl).href;
      const response = await fetch(fullUrl, {
        headers: { 'User-Agent': 'VibeCode-Audit/1.0' },
      });
      if (response.ok) {
        const content = await response.text();
        externalScriptContents.push(content);
      }
    } catch {
      // Script not accessible
    }
  }

  const allScriptContent = [...inlineScripts, ...externalScriptContents, html].join('\n');

  // Pattern: Supabase service key (starts with eyJ, very long)
  const supabaseServiceKeyRegex = /(eyJ[a-zA-Z0-9_-]{100,})/g;
  const supabaseMatches = allScriptContent.match(supabaseServiceKeyRegex);
  if (supabaseMatches) {
    supabaseMatches.forEach((key) => {
      secrets.push({
        type: 'supabase-key',
        location: inlineScripts.some(s => s.includes(key)) ? 'inline-script' : externalScripts.length > 0 ? 'external-script' : 'html',
        pattern: key.substring(0, 20) + '...',
        severity: 'critical',
        evidence: `Supabase service key found in ${inlineScripts.some(s => s.includes(key)) ? 'inline script' : 'external script'}`,
        recommendation: 'Remove Supabase service key from frontend. Use only anon key in client-side code.',
      });
    });
  }

  // Pattern: Firebase admin/service account key
  const firebaseKeyRegex = /("type"\s*:\s*"service_account"|"private_key_id"\s*:\s*"[^"]+"|AIza[0-9A-Za-z_-]{35})/g;
  const firebaseMatches = allScriptContent.match(firebaseKeyRegex);
  if (firebaseMatches) {
    secrets.push({
      type: 'firebase-key',
      location: 'inline-script',
      pattern: 'Firebase service account detected',
      severity: 'critical',
      evidence: 'Firebase service account credentials found in frontend code',
      recommendation: 'Remove Firebase admin credentials from frontend. Use only client config.',
    });
  }

  // Pattern: API keys (common patterns)
  const apiKeyPatterns = [
    { regex: /(api[_-]?key\s*[=:]\s*["']?)([a-zA-Z0-9_-]{20,})(["']?)/gi, type: 'api-key' as const },
    { regex: /(apikey\s*[=:]\s*["']?)([a-zA-Z0-9_-]{20,})(["']?)/gi, type: 'api-key' as const },
    { regex: /(secret[_-]?key\s*[=:]\s*["']?)([a-zA-Z0-9_-]{20,})(["']?)/gi, type: 'api-key' as const },
  ];

  for (const pattern of apiKeyPatterns) {
    const matches = allScriptContent.match(pattern.regex);
    if (matches && matches.length > 0) {
      matches.slice(0, 5).forEach((match) => {
        const keyMatch = match.match(/([a-zA-Z0-9_-]{20,})/);
        if (keyMatch) {
          secrets.push({
            type: pattern.type,
            location: inlineScripts.some(s => s.includes(match)) ? 'inline-script' : 'external-script',
            pattern: keyMatch[1].substring(0, 10) + '...',
            severity: 'high',
            evidence: `API key found: ${match.substring(0, 50)}`,
            recommendation: 'Move API keys to environment variables or backend. Never expose in frontend.',
          });
        }
      });
    }
  }

  // Pattern: Database URLs (Supabase, MongoDB, PostgreSQL)
  const dbUrlPatterns = [
    /(postgres:\/\/[^"'\s]+)/gi,
    /(mongodb:\/\/[^"'\s]+)/gi,
    /(postgresql:\/\/[^"'\s]+)/gi,
    /(https:\/\/[^"'\s]*\.supabase\.co\/rest\/v1\/[^"'\s]+)/gi,
  ];

  for (const pattern of dbUrlPatterns) {
    const matches = allScriptContent.match(pattern);
    if (matches) {
      matches.slice(0, 3).forEach((url) => {
        if (url.includes('@') || url.includes('password') || url.includes('key=')) {
          secrets.push({
            type: 'database-url',
            location: 'inline-script',
            pattern: url.substring(0, 30) + '...',
            severity: 'critical',
            evidence: `Database URL with credentials found: ${url.substring(0, 50)}`,
            recommendation: 'Remove database URLs with credentials from frontend. Use backend API instead.',
          });
        }
      });
    }
  }

  // Pattern: AWS keys
  const awsKeyRegex = /(AKIA[0-9A-Z]{16})/g;
  const awsMatches = allScriptContent.match(awsKeyRegex);
  if (awsMatches) {
    awsMatches.forEach((key) => {
      secrets.push({
        type: 'aws-key',
        location: 'inline-script',
        pattern: key,
        severity: 'critical',
        evidence: `AWS access key found: ${key}`,
        recommendation: 'Remove AWS keys from frontend. Use IAM roles or backend proxy.',
      });
    });
  }

  // Pattern: JWT tokens (long base64 strings)
  const jwtRegex = /(eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+)/g;
  const jwtMatches = allScriptContent.match(jwtRegex);
  if (jwtMatches) {
    jwtMatches.slice(0, 3).forEach((token) => {
      // Check if it's a service key (very long) vs regular JWT
      if (token.length > 200) {
        secrets.push({
          type: 'token',
          location: 'inline-script',
          pattern: token.substring(0, 20) + '...',
          severity: 'high',
          evidence: 'Long JWT token found in frontend code',
          recommendation: 'Store tokens securely (httpOnly cookies). Avoid exposing in JS.',
        });
      }
    });
  }

  return secrets;
}

function analyzeClientSideAuth(crawlResult: CrawlResult, securityData: SecurityData): ClientSideAuthAnalysis {
  const html = crawlResult.html.toLowerCase();
  const scripts = crawlResult.techStack.scripts.map(s => s.toLowerCase());
  const allScriptContent = html + scripts.join(' ');

  const evidence: string[] = [];
  const issues: string[] = [];
  let authImplementation: 'client-only' | 'hybrid' | 'server-side' = 'server-side';

  // Detect client-side auth patterns
  const clientSideAuthIndicators = [
    'localstorage.setitem.*token',
    'sessionstorage.setitem.*token',
    'localstorage.setitem.*password',
    'fetch.*login.*then.*localstorage',
    'auth.*state.*usestate',
    'supabase.*auth.*signin.*then',
    'firebase.*auth.*signin.*then',
  ];

  let clientSideCount = 0;
  for (const indicator of clientSideAuthIndicators) {
    const regex = new RegExp(indicator, 'gi');
    if (regex.test(allScriptContent)) {
      clientSideCount++;
      evidence.push(`Client-side auth pattern detected: ${indicator}`);
    }
  }

  // Check if auth library is used but no backend validation visible
  if (securityData.authFlow.authLibrary) {
    const authLib = securityData.authFlow.authLibrary.toLowerCase();
    if (authLib.includes('supabase') || authLib.includes('firebase')) {
      // Check if direct database access from client
      if (allScriptContent.includes('supabase.from') || allScriptContent.includes('firebase.database')) {
        authImplementation = 'client-only';
        issues.push('Direct database access from client-side code detected');
        evidence.push('Supabase/Firebase direct client access without backend validation');
      }
    }
  }

  // Check for password storage in client
  if (allScriptContent.includes('password') && (allScriptContent.includes('localstorage') || allScriptContent.includes('sessionstorage'))) {
    issues.push('Password or credentials stored in browser storage');
    evidence.push('Credentials stored in localStorage/sessionStorage');
  }

  // Determine risk level
  let risk: 'critical' | 'high' | 'medium' | 'low' = 'low';
  if (authImplementation === 'client-only' && issues.length > 0) {
    risk = 'critical';
  } else if (clientSideCount > 3) {
    risk = 'high';
  } else if (clientSideCount > 0) {
    risk = 'medium';
  }

  return {
    detected: clientSideCount > 0 || authImplementation === 'client-only',
    evidence,
    risk,
    authImplementation,
    issues,
  };
}

async function testUnauthenticatedEndpoints(
  baseUrl: string,
  crawlResult: CrawlResult,
  securityData: SecurityData,
  eventBus: EventBus,
  jobId: string
): Promise<UnauthenticatedEndpoint[]> {
  const endpoints: UnauthenticatedEndpoint[] = [];
  const html = crawlResult.html.toLowerCase();

  // Extract API endpoints from HTML and scripts
  const apiEndpoints: string[] = [];
  
  // Common API patterns
  const apiPatterns = [
    /\/api\/([a-zA-Z0-9_-]+)/gi,
    /fetch\(["']([^"']*\/api\/[^"']+)["']/gi,
    /axios\.(get|post)\(["']([^"']*\/api\/[^"']+)["']/gi,
    /supabase\.from\(["']([^"']+)["']/gi,
    /firebase\.database\(\)\.ref\(["']([^"']+)["']/gi,
  ];

  for (const pattern of apiPatterns) {
    const matches = crawlResult.html.match(pattern);
    if (matches) {
      matches.forEach((match) => {
        const urlMatch = match.match(/(\/[^"'\s)]+)/);
        if (urlMatch && !apiEndpoints.includes(urlMatch[1])) {
          apiEndpoints.push(urlMatch[1]);
        }
      });
    }
  }

  // Add discovered auth endpoints
  securityData.authFlow.authEndpoints.forEach((endpoint) => {
    if (!apiEndpoints.includes(endpoint)) {
      apiEndpoints.push(endpoint);
    }
  });

  // Test endpoints without authentication
  for (const endpoint of apiEndpoints.slice(0, 20)) { // Limit to 20
    try {
      const url = new URL(endpoint, baseUrl).href;
      
      // Test GET
      const getResponse = await fetch(url, {
        headers: { 'User-Agent': 'VibeCode-Audit/1.0' },
      });

      if (getResponse.ok) {
        const content = await getResponse.text();
        const contentType = getResponse.headers.get('content-type') || '';
        
        // Check if it returns data (not just error/redirect)
        let returnsData = false;
        let dataType: 'pii' | 'financial' | 'medical' | 'general' | undefined;
        
        if (contentType.includes('json')) {
          try {
            const json = JSON.parse(content);
            returnsData = Object.keys(json).length > 0;
            
            // Check for sensitive data patterns
            const contentLower = content.toLowerCase();
            if (contentLower.includes('email') || contentLower.includes('phone') || contentLower.includes('ssn')) {
              dataType = 'pii';
            } else if (contentLower.includes('credit') || contentLower.includes('card') || contentLower.includes('payment')) {
              dataType = 'financial';
            } else if (contentLower.includes('medical') || contentLower.includes('health') || contentLower.includes('patient')) {
              dataType = 'medical';
            } else {
              dataType = 'general';
            }
          } catch {
            // Not JSON
          }
        }

        if (returnsData || content.length > 100) {
          let severity: 'critical' | 'high' | 'medium' = 'medium';
          if (dataType === 'pii' || dataType === 'financial' || dataType === 'medical') {
            severity = 'critical';
          } else if (content.length > 1000) {
            severity = 'high';
          }

          endpoints.push({
            url,
            method: 'GET',
            returnsData: true,
            dataType,
            severity,
            evidence: `Endpoint returns ${dataType || 'data'} without authentication (${content.length} bytes)`,
          });
        }
      }
    } catch {
      // Endpoint not accessible
    }
  }

  return endpoints;
}

function detectBackendMisconfigurations(
  crawlResult: CrawlResult,
  securityData: SecurityData
): BackendMisconfiguration[] {
  const misconfigs: BackendMisconfiguration[] = [];
  const html = crawlResult.html.toLowerCase();
  const scripts = crawlResult.techStack.scripts.map(s => s.toLowerCase());
  const allContent = html + scripts.join(' ');

  // Check for Supabase service key (already detected in secrets, but flag as misconfiguration)
  if (allContent.includes('supabase') && allContent.includes('eyJ')) {
    misconfigs.push({
      type: 'supabase-service-key',
      detected: true,
      severity: 'critical',
      evidence: 'Supabase service key found in frontend code',
      recommendation: 'Supabase service keys should never be in frontend. Use anon key only.',
    });
  }

  // Check for Firebase admin key
  if (allContent.includes('firebase') && (allContent.includes('service_account') || allContent.includes('private_key'))) {
    misconfigs.push({
      type: 'firebase-admin-key',
      detected: true,
      severity: 'critical',
      evidence: 'Firebase admin credentials found in frontend',
      recommendation: 'Firebase admin SDK should only be used server-side.',
    });
  }

  // Check for direct database access (indicates missing RLS/security rules)
  if (allContent.includes('supabase.from') && !allContent.includes('rpc') && !allContent.includes('backend')) {
    misconfigs.push({
      type: 'missing-rls',
      detected: true,
      severity: 'high',
      evidence: 'Direct Supabase client access detected - may indicate missing Row Level Security',
      recommendation: 'Enable Row Level Security (RLS) on all Supabase tables. Never trust client-side only.',
    });
  }

  if (allContent.includes('firebase.database') && !allContent.includes('rules') && !allContent.includes('backend')) {
    misconfigs.push({
      type: 'missing-rls',
      detected: true,
      severity: 'high',
      evidence: 'Direct Firebase database access - verify security rules are configured',
      recommendation: 'Configure Firebase Security Rules. Never allow unrestricted read/write access.',
    });
  }

  return misconfigs;
}

async function testFileUploadEndpoints(
  baseUrl: string,
  crawlResult: CrawlResult,
  securityData: SecurityData,
  eventBus: EventBus,
  jobId: string
): Promise<FileUploadVulnerability[]> {
  const vulnerabilities: FileUploadVulnerability[] = [];

  // Find file upload forms
  const uploadForms = securityData.forms.filter((form) => {
    const formHtml = crawlResult.html.toLowerCase();
    const formIndex = crawlResult.html.indexOf(form.action);
    if (formIndex === -1) return false;
    const formSection = crawlResult.html.substring(Math.max(0, formIndex - 200), formIndex + 200).toLowerCase();
    return formSection.includes('file') || formSection.includes('upload') || form.inputs.some(i => i.includes('file'));
  });

  for (const form of uploadForms.slice(0, 5)) {
    try {
      const url = new URL(form.action, baseUrl).href;
      
      // Test with a small file upload attempt
      const formData = new FormData();
      formData.append('file', new Blob(['test'], { type: 'text/plain' }), 'test.txt');

      const response = await fetch(url, {
        method: form.method || 'POST',
        body: formData,
      });

      // Check if upload succeeded without proper validation
      if (response.ok || response.status === 200) {
        const responseText = await response.text();
        
        // Check if there are file type restrictions
        const formHtml = crawlResult.html.toLowerCase();
        const hasFileTypeCheck = formHtml.includes('accept=') || formHtml.includes('filetype') || formHtml.includes('extension');
        
        vulnerabilities.push({
          endpoint: url,
          unrestricted: true,
          fileTypeRestriction: hasFileTypeCheck,
          sizeLimit: false, // Can't determine without testing
          severity: hasFileTypeCheck ? 'medium' : 'high',
          evidence: `File upload endpoint accepts files without visible restrictions`,
        });
      }
    } catch {
      // Endpoint not accessible or requires auth
    }
  }

  return vulnerabilities;
}

function detectBackendLessPatterns(
  crawlResult: CrawlResult,
  securityData: SecurityData
): BackendLessPattern {
  const html = crawlResult.html.toLowerCase();
  const scripts = crawlResult.techStack.scripts.map(s => s.toLowerCase());
  const allContent = html + scripts.join(' ');

  const evidence: string[] = [];
  let type: 'supabase-direct' | 'firebase-direct' | 'api-only' | 'no-backend' = 'no-backend';
  let detected = false;

  // Check for Supabase direct access
  if (allContent.includes('supabase') && (allContent.includes('supabase.from') || allContent.includes('supabase.rpc'))) {
    detected = true;
    type = 'supabase-direct';
    evidence.push('Direct Supabase client access from frontend');
    if (!allContent.includes('backend') && !allContent.includes('api') && !allContent.includes('server')) {
      evidence.push('No backend API layer detected - direct database access');
    }
  }

  // Check for Firebase direct access
  if (allContent.includes('firebase') && (allContent.includes('firebase.database') || allContent.includes('firestore'))) {
    detected = true;
    type = 'firebase-direct';
    evidence.push('Direct Firebase database access from frontend');
    if (!allContent.includes('backend') && !allContent.includes('api') && !allContent.includes('server')) {
      evidence.push('No backend API layer detected - direct database access');
    }
  }

  // Check for API-only pattern (no backend, just external APIs)
  if (!allContent.includes('backend') && !allContent.includes('server') && 
      (allContent.includes('fetch') || allContent.includes('axios')) &&
      !allContent.includes('supabase') && !allContent.includes('firebase')) {
    detected = true;
    type = 'api-only';
    evidence.push('API-only architecture detected - no backend server');
  }

  let risk: 'high' | 'medium' | 'low' = 'low';
  if (type === 'supabase-direct' || type === 'firebase-direct') {
    risk = 'high';
  } else if (type === 'api-only') {
    risk = 'medium';
  }

  return {
    detected,
    type,
    risk,
    evidence,
  };
}

function generateRecommendations(analysis: {
  hardCodedSecrets: HardCodedSecret[];
  clientSideAuth: ClientSideAuthAnalysis;
  unauthenticatedApiAccess: UnauthenticatedEndpoint[];
  backendMisconfigurations: BackendMisconfiguration[];
  fileUploadVulnerabilities: FileUploadVulnerability[];
  backendLessPatterns: BackendLessPattern;
}): VibeCodingRecommendation[] {
  const recommendations: VibeCodingRecommendation[] = [];

  // Hard-coded secrets
  if (analysis.hardCodedSecrets.length > 0) {
    const criticalSecrets = analysis.hardCodedSecrets.filter(s => s.severity === 'critical');
    if (criticalSecrets.length > 0) {
      recommendations.push({
        category: 'Secrets Management',
        priority: 'critical',
        issue: `${criticalSecrets.length} critical secret(s) exposed in frontend code`,
        fix: 'Immediately rotate exposed keys and move to environment variables/backend',
        impact: 'Prevents unauthorized access to services and data breaches',
        cost: 'free',
        effort: 'low',
      });
    }
  }

  // Client-side auth
  if (analysis.clientSideAuth.authImplementation === 'client-only') {
    recommendations.push({
      category: 'Authentication',
      priority: 'critical',
      issue: 'Client-side-only authentication detected',
      fix: 'Implement server-side authentication validation. Never trust client-side auth alone.',
      impact: 'Prevents auth bypass attacks and unauthorized access',
      cost: 'medium',
      effort: 'high',
    });
  }

  // Unauthenticated API access
  if (analysis.unauthenticatedApiAccess.length > 0) {
    const criticalEndpoints = analysis.unauthenticatedApiAccess.filter(e => e.severity === 'critical');
    if (criticalEndpoints.length > 0) {
      recommendations.push({
        category: 'API Security',
        priority: 'critical',
        issue: `${criticalEndpoints.length} API endpoint(s) expose data without authentication`,
        fix: 'Add authentication middleware to all API endpoints',
        impact: 'Prevents unauthorized data access',
        cost: 'low',
        effort: 'medium',
      });
    }
  }

  // Backend misconfigurations
  if (analysis.backendMisconfigurations.length > 0) {
    analysis.backendMisconfigurations.forEach((misconfig) => {
      recommendations.push({
        category: 'Backend Configuration',
        priority: misconfig.severity,
        issue: misconfig.evidence,
        fix: misconfig.recommendation,
        impact: 'Prevents data exposure and unauthorized access',
        cost: 'free',
        effort: 'low',
      });
    });
  }

  // File upload vulnerabilities
  if (analysis.fileUploadVulnerabilities.length > 0) {
    const unrestricted = analysis.fileUploadVulnerabilities.filter(v => v.unrestricted);
    if (unrestricted.length > 0) {
      recommendations.push({
        category: 'File Upload',
        priority: 'high',
        issue: `${unrestricted.length} unrestricted file upload endpoint(s)`,
        fix: 'Add file type validation, size limits, and virus scanning',
        impact: 'Prevents malicious file uploads and code execution',
        cost: 'low',
        effort: 'medium',
      });
    }
  }

  // Backend-less patterns
  if (analysis.backendLessPatterns.detected && analysis.backendLessPatterns.risk === 'high') {
    recommendations.push({
      category: 'Architecture',
      priority: 'high',
      issue: 'Backend-less architecture with direct database access',
      fix: 'Add backend API layer for authentication and authorization',
      impact: 'Enables proper access control and prevents direct database manipulation',
      cost: 'medium',
      effort: 'high',
    });
  }

  return recommendations;
}

function calculateOverallRisk(analysis: {
  hardCodedSecrets: HardCodedSecret[];
  clientSideAuth: ClientSideAuthAnalysis;
  unauthenticatedApiAccess: UnauthenticatedEndpoint[];
  backendMisconfigurations: BackendMisconfiguration[];
  fileUploadVulnerabilities: FileUploadVulnerability[];
  backendLessPatterns: BackendLessPattern;
}): 'low' | 'medium' | 'high' | 'critical' {
  const criticalSecrets = analysis.hardCodedSecrets.filter(s => s.severity === 'critical').length;
  const criticalEndpoints = analysis.unauthenticatedApiAccess.filter(e => e.severity === 'critical').length;
  const criticalMisconfigs = analysis.backendMisconfigurations.filter(m => m.severity === 'critical').length;

  if (criticalSecrets > 0 || criticalEndpoints > 0 || criticalMisconfigs > 0 || analysis.clientSideAuth.risk === 'critical') {
    return 'critical';
  }

  if (analysis.hardCodedSecrets.length > 0 || analysis.unauthenticatedApiAccess.length > 0 || 
      analysis.clientSideAuth.risk === 'high' || analysis.backendLessPatterns.risk === 'high') {
    return 'high';
  }

  if (analysis.backendMisconfigurations.length > 0 || analysis.fileUploadVulnerabilities.length > 0) {
    return 'medium';
  }

  return 'low';
}

function calculateScore(analysis: {
  hardCodedSecrets: HardCodedSecret[];
  clientSideAuth: ClientSideAuthAnalysis;
  unauthenticatedApiAccess: UnauthenticatedEndpoint[];
  backendMisconfigurations: BackendMisconfiguration[];
  fileUploadVulnerabilities: FileUploadVulnerability[];
  backendLessPatterns: BackendLessPattern;
}): number {
  let score = 100;

  // Deduct for secrets
  score -= analysis.hardCodedSecrets.filter(s => s.severity === 'critical').length * 20;
  score -= analysis.hardCodedSecrets.filter(s => s.severity === 'high').length * 10;
  score -= analysis.hardCodedSecrets.filter(s => s.severity === 'medium').length * 5;

  // Deduct for client-side auth
  if (analysis.clientSideAuth.risk === 'critical') score -= 30;
  else if (analysis.clientSideAuth.risk === 'high') score -= 20;
  else if (analysis.clientSideAuth.risk === 'medium') score -= 10;

  // Deduct for unauthenticated endpoints
  score -= analysis.unauthenticatedApiAccess.filter(e => e.severity === 'critical').length * 15;
  score -= analysis.unauthenticatedApiAccess.filter(e => e.severity === 'high').length * 10;
  score -= analysis.unauthenticatedApiAccess.filter(e => e.severity === 'medium').length * 5;

  // Deduct for misconfigurations
  score -= analysis.backendMisconfigurations.filter(m => m.severity === 'critical').length * 15;
  score -= analysis.backendMisconfigurations.filter(m => m.severity === 'high').length * 10;
  score -= analysis.backendMisconfigurations.filter(m => m.severity === 'medium').length * 5;

  // Deduct for file upload vulnerabilities
  score -= analysis.fileUploadVulnerabilities.filter(v => v.severity === 'high').length * 10;
  score -= analysis.fileUploadVulnerabilities.filter(v => v.severity === 'medium').length * 5;

  // Deduct for backend-less patterns
  if (analysis.backendLessPatterns.risk === 'high') score -= 15;
  else if (analysis.backendLessPatterns.risk === 'medium') score -= 10;

  return Math.max(0, Math.min(100, score));
}
