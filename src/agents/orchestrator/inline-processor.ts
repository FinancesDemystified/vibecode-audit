/**
 * Inline scan processor for dev mode (no Redis/BullMQ)
 * Dependencies: agents, redis
 * Purpose: Process scans synchronously with real-time status updates
 */
import { crawlUrl } from '../scanner/crawler';
import { extractSecurityData } from '../scanner/extractor';
import { discoverPostAuth } from '../scanner/post-auth-discoverer';
import { performAuthenticatedScan } from '../scanner/authenticated-crawler';
import { scanVulnerabilities } from '../analyzer/vulnerability';
import { analyzeSEO } from '../analyzer/seo';
import { copyAnalyzer } from '../analyzer/copy';
import { performDeepSecurityAnalysis } from '../analyzer/deep-security';
import { scanVibeCodingVulnerabilities } from '../analyzer/vibe-coding-vulnerabilities';
import { analyzeWithAI, generatePreviewSummary } from '../ai/groq';
import { generateReport } from '../reporter/generator';
import { eventBus } from '../communication';
import { redis } from '../../lib/redis';
import { db } from '../../lib/db';
import { reports } from '../../lib/db/schema';

type Credentials = { username?: string; password?: string; email?: string };

async function updateStatus(jobId: string, status: string, data: Record<string, any> = {}) {
  const key = `job:${jobId}`;
  const existing = await redis.get(key);
  const current = existing ? (typeof existing === 'string' ? JSON.parse(existing) : existing) : {};
  const updated = { ...current, ...data, status };
  await redis.setex(key, 2592000, updated);
}

export async function processInlineScan(
  jobId: string,
  url: string,
  credentials?: Credentials
): Promise<void> {
  try {
    // Stage 1: Discovery
    await updateStatus(jobId, 'scanning', { 
      progress: 3, 
      currentStage: 'Discovery', 
      stageMessage: 'Connecting to target...' 
    });

    const crawlResult = await crawlUrl(url, eventBus, jobId);
    
    await updateStatus(jobId, 'scanning', { 
      progress: 8, 
      currentStage: 'Discovery', 
      stageMessage: 'Mapping site architecture...' 
    });
    
    const securityData = await extractSecurityData(crawlResult, eventBus, jobId);
    
    await updateStatus(jobId, 'scanning', { 
      progress: 12, 
      currentStage: 'Discovery', 
      stageMessage: 'Detecting tech stack & frameworks...' 
    });
    
    await updateStatus(jobId, 'scanning', { 
      progress: 16, 
      currentStage: 'Discovery', 
      stageMessage: 'Finding login & auth endpoints...' 
    });
    
    const postAuthData = await discoverPostAuth(url, securityData, crawlResult.html, eventBus, jobId);
    
    // Stage 2: Content Analysis
    await updateStatus(jobId, 'scanning', { 
      progress: 22, 
      currentStage: 'Content Analysis', 
      stageMessage: 'Analyzing SEO & meta tags...' 
    });
    
    const seoData = await analyzeSEO(crawlResult, eventBus, jobId);
    
    await updateStatus(jobId, 'scanning', { 
      progress: 28, 
      currentStage: 'Content Analysis', 
      stageMessage: 'Auditing web copy & messaging...' 
    });
    
    await updateStatus(jobId, 'scanning', { 
      progress: 32, 
      currentStage: 'Content Analysis', 
      stageMessage: 'Checking trust signals & social proof...' 
    });
    const copyAnalysis = await copyAnalyzer.analyzeCopy(crawlResult.html, url);

    // Authenticated scan if credentials provided
    let authenticatedScan = null;
    if (credentials && (credentials.password || credentials.username || credentials.email)) {
      await updateStatus(jobId, 'authenticating', { 
        progress: 38, 
        currentStage: 'Auth Testing', 
        stageMessage: 'Testing login flow security...' 
      });
      authenticatedScan = await performAuthenticatedScan(
        url,
        credentials,
        securityData,
        eventBus,
        jobId
      );
    }

    // Stage 3: Security Scan
    await updateStatus(jobId, 'analyzing', { 
      progress: 42, 
      currentStage: 'Security Scan', 
      stageMessage: 'Testing for XSS vulnerabilities...' 
    });

    const findings = await scanVulnerabilities(securityData, eventBus, jobId);
    
    await updateStatus(jobId, 'analyzing', { 
      progress: 48, 
      currentStage: 'Security Scan', 
      stageMessage: 'Checking CORS & headers...' 
    });
    
    await updateStatus(jobId, 'analyzing', { 
      progress: 54, 
      currentStage: 'Security Scan', 
      stageMessage: 'Analyzing cookie security...' 
    });
    
    await updateStatus(jobId, 'analyzing', { 
      progress: 58, 
      currentStage: 'Deep Security', 
      stageMessage: 'Testing authentication bypass...' 
    });
    const deepSecurityAnalysis = await performDeepSecurityAnalysis(
      url,
      crawlResult,
      securityData,
      eventBus,
      jobId,
      credentials
    );
    
    // Vibe-coding vulnerability scan
    await updateStatus(jobId, 'analyzing', { 
      progress: 64, 
      currentStage: 'Vibe-Code Scan', 
      stageMessage: 'Scanning for hardcoded secrets...' 
    });
    
    await updateStatus(jobId, 'analyzing', { 
      progress: 68, 
      currentStage: 'Vibe-Code Scan', 
      stageMessage: 'Detecting exposed API keys...' 
    });
    
    await updateStatus(jobId, 'analyzing', { 
      progress: 72, 
      currentStage: 'Vibe-Code Scan', 
      stageMessage: 'Finding unprotected endpoints...' 
    });
    const vibeCodingVulns = await scanVibeCodingVulnerabilities(
      url,
      crawlResult,
      securityData,
      eventBus,
      jobId
    );
    
    // AI Analysis - real breach news
    const { getBreachNews } = await import('../../lib/news-fetcher');
    const news = await getBreachNews();
    const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)] || 'Analyzing patterns...';
    
    await updateStatus(jobId, 'analyzing', { 
      progress: 78, 
      currentStage: 'AI Analysis', 
      stageMessage: news.length ? `Recent breach: ${pick(news)}` : 'Analyzing vulnerability patterns...'
    });
    
    await updateStatus(jobId, 'analyzing', { 
      progress: 82, 
      currentStage: 'AI Analysis', 
      stageMessage: `Scoring against ${news.length || 'known'} vibe-code risks...`
    });
    const analysis = await analyzeWithAI(findings, securityData, eventBus, jobId);

    // Stage 4: Report Generation
    await updateStatus(jobId, 'generating', { 
      progress: 88, 
      currentStage: 'Generating Report', 
      stageMessage: 'Building remediation steps...' 
    });

    const { html, pdf } = await generateReport(analysis, findings, url, jobId, eventBus, vibeCodingVulns);

    const reportUrl = `/api/report/${jobId}`;
    const jobData = await redis.get(`job:${jobId}`);
    const job = jobData ? (typeof jobData === 'string' ? JSON.parse(jobData) : jobData) : null;
    
    const formatTechStack = (ts: typeof securityData.techStack) => ({
      framework: ts.framework || 'Framework not identified',
      hosting: ts.hosting || 'Hosting not identified',
      platform: ts.platform || 'Platform not detected',
      server: ts.server || 'Server not identified',
    });

    const formatAuthFlow = (af: typeof securityData.authFlow) => ({
      ...af,
      loginAttempted: credentials && (credentials.password || credentials.username || credentials.email) ? true : false,
    });

    const findingsWithExplanations = findings.map(finding => {
      const explanation = analysis.findingsExplained?.find(e => e.type === finding.type);
      return { ...finding, explanation: explanation || undefined };
    });

    const report: any = {
      jobId,
      url,
      timestamp: Date.now(),
      score: analysis.score,
      summary: analysis.summary,
      findings: findingsWithExplanations,
      recommendations: analysis.recommendations,
      confidence: analysis.confidence,
      limitations: 'External-only scan. Upgrade for codebase review.',
      techStack: formatTechStack(securityData.techStack),
      authFlow: formatAuthFlow(securityData.authFlow),
      postAuth: {
        authMechanism: postAuthData.authMechanism,
        loginEndpoint: postAuthData.loginEndpoint || 'Not found',
        protectedRoutes: postAuthData.protectedRoutes.length > 0 ? postAuthData.protectedRoutes : ['None detected'],
        dashboardDetected: postAuthData.dashboardIndicators.found,
        likelyFeatures: postAuthData.dashboardIndicators.features.length > 0 ? postAuthData.dashboardIndicators.features : ['None detected'],
        securityIssues: postAuthData.securityIssues,
        recommendations: postAuthData.recommendations,
      },
      authenticatedScan: authenticatedScan ? {
        success: authenticatedScan.success,
        pagesScanned: authenticatedScan.authenticatedPages.length,
        authenticatedPages: authenticatedScan.authenticatedPages,
        apiEndpoints: authenticatedScan.apiEndpoints,
        errors: authenticatedScan.errors,
      } : null,
      seo: {
        metaTags: seoData.metaTags,
        openGraph: seoData.openGraph,
        twitterCard: seoData.twitterCard,
        structuredData: {
          hasJsonLd: seoData.structuredData.jsonLd.length > 0,
          hasMicrodata: seoData.structuredData.microdata,
          schemaTypes: seoData.structuredData.schemaTypes,
        },
        aiOptimization: seoData.aiOptimization,
        issues: seoData.issues,
      },
      copyAnalysis,
      deepSecurity: {
        securityCopyAnalysis: deepSecurityAnalysis.securityCopyAnalysis,
        authenticationTesting: deepSecurityAnalysis.authenticationTesting,
        behavioralTests: deepSecurityAnalysis.behavioralTests,
        claimVerification: deepSecurityAnalysis.claimVerification,
        recommendations: deepSecurityAnalysis.recommendations,
        overallScore: deepSecurityAnalysis.overallScore,
      },
      vibeCodingVulnerabilities: {
        hardCodedSecrets: vibeCodingVulns.hardCodedSecrets,
        clientSideAuth: vibeCodingVulns.clientSideAuth,
        unauthenticatedApiAccess: vibeCodingVulns.unauthenticatedApiAccess,
        backendMisconfigurations: vibeCodingVulns.backendMisconfigurations,
        fileUploadVulnerabilities: vibeCodingVulns.fileUploadVulnerabilities,
        backendLessPatterns: vibeCodingVulns.backendLessPatterns,
        recommendations: vibeCodingVulns.recommendations,
        overallRisk: vibeCodingVulns.overallRisk,
        score: vibeCodingVulns.score,
      },
      breachNews: news.slice(0, 5),
      metadata: {
        version: '1.0.0',
        scanDuration: Date.now() - (job?.createdAt || Date.now()),
      },
    };

    // Generate preview summary
    await updateStatus(jobId, 'generating', { 
      progress: 92, 
      currentStage: 'Generating Report', 
      stageMessage: 'Creating summary...' 
    });
    try {
      const previewSummary = await generatePreviewSummary(report, eventBus, jobId);
      report.previewSummary = previewSummary;
    } catch (error) {
      console.error('[Inline] Failed to generate preview summary:', error);
    }

    // Save report
    await redis.setex(`report:${jobId}`, 2592000, report);

    // Save to DB
    try {
      await db.insert(reports).values({
        jobId,
        url,
        reportData: report,
      }).onConflictDoUpdate({
        target: reports.jobId,
        set: { reportData: report, url },
      });
    } catch (dbError) {
      console.error('[Inline] DB save failed:', dbError);
    }

    // Complete
    await updateStatus(jobId, 'completed', {
      completedAt: Date.now(),
      progress: 100,
      currentStage: 'Complete',
      stageMessage: 'Scan complete!',
      reportUrl,
    });

    console.log(`[Inline Scan] Completed: ${jobId}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await updateStatus(jobId, 'failed', {
      completedAt: Date.now(),
      error: errorMessage,
      currentStage: 'Failed',
      stageMessage: errorMessage,
    });
    console.error(`[Inline Scan] Failed: ${jobId}`, error);
    throw error;
  }
}

