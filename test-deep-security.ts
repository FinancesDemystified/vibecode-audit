/**
 * Test script for deep security analysis
 * Run: npx tsx test-deep-security.ts
 */
import { crawlUrl } from './src/agents/scanner/crawler';
import { extractSecurityData } from './src/agents/scanner/extractor';
import { performDeepSecurityAnalysis } from './src/agents/analyzer/deep-security';
import { eventBus } from './src/agents/communication';

const url = 'https://godlydeeds.ai';
const jobId = 'test-' + Date.now();

async function test() {
  console.log(`🔍 Running deep security analysis on ${url}\n`);

  try {
    // Step 1: Crawl
    console.log('📡 Crawling URL...');
    const crawlResult = await crawlUrl(url, eventBus, jobId);
    console.log(`✅ Crawled: ${crawlResult.statusCode} - ${crawlResult.finalUrl}\n`);

    // Step 2: Extract security data
    console.log('🔐 Extracting security data...');
    const securityData = await extractSecurityData(crawlResult, eventBus, jobId);
    console.log(`✅ Auth flow detected: ${securityData.authFlow.hasLoginForm ? 'Login form' : 'No login form'}`);
    console.log(`   OAuth providers: ${securityData.authFlow.oauthProviders.join(', ') || 'None'}\n`);

    // Step 3: Deep security analysis
    console.log('🛡️  Performing deep security analysis...\n');
    const deepSecurity = await performDeepSecurityAnalysis(
      url,
      crawlResult,
      securityData,
      undefined, // No credentials for this test
      eventBus,
      jobId
    );

    // Display results
    console.log('='.repeat(80));
    console.log('DEEP SECURITY ANALYSIS RESULTS');
    console.log('='.repeat(80));
    console.log(`\n📊 Overall Security Score: ${deepSecurity.overallScore}/100\n`);

    // Security Copy Analysis
    console.log('📄 SECURITY COPY ANALYSIS');
    console.log('-'.repeat(80));
    console.log(`Privacy Policy: ${deepSecurity.securityCopyAnalysis.privacyPolicy.found ? '✅ Found' : '❌ Not found'}`);
    if (deepSecurity.securityCopyAnalysis.privacyPolicy.found) {
      console.log(`  URL: ${deepSecurity.securityCopyAnalysis.privacyPolicy.url}`);
      console.log(`  Claims: ${deepSecurity.securityCopyAnalysis.privacyPolicy.claims.join(', ') || 'None'}`);
      console.log(`  Gaps: ${deepSecurity.securityCopyAnalysis.privacyPolicy.gaps.join(', ') || 'None'}`);
      console.log(`  Score: ${deepSecurity.securityCopyAnalysis.privacyPolicy.score}/100`);
    }
    console.log(`\nSecurity Page: ${deepSecurity.securityCopyAnalysis.securityPage.found ? '✅ Found' : '❌ Not found'}`);
    if (deepSecurity.securityCopyAnalysis.securityPage.found) {
      console.log(`  URL: ${deepSecurity.securityCopyAnalysis.securityPage.url}`);
      console.log(`  Claims: ${deepSecurity.securityCopyAnalysis.securityPage.claims.join(', ') || 'None'}`);
      console.log(`  Score: ${deepSecurity.securityCopyAnalysis.securityPage.score}/100`);
    }
    console.log(`\nTrust Signals:`);
    console.log(`  Badges: ${deepSecurity.securityCopyAnalysis.trustSignals.badges.join(', ') || 'None'}`);
    console.log(`  Certifications: ${deepSecurity.securityCopyAnalysis.trustSignals.certifications.join(', ') || 'None'}`);
    console.log(`  Guarantees: ${deepSecurity.securityCopyAnalysis.trustSignals.guarantees.join(', ') || 'None'}`);

    // Authentication Testing
    console.log('\n🔐 AUTHENTICATION TESTING');
    console.log('-'.repeat(80));
    console.log(`Rate Limiting: ${deepSecurity.authenticationTesting.rateLimiting.tested ? (deepSecurity.authenticationTesting.rateLimiting.protected ? '✅ Protected' : '❌ Not protected') : '⚠️  Not tested (no credentials)'}`);
    if (deepSecurity.authenticationTesting.rateLimiting.tested) {
      console.log(`  Evidence: ${deepSecurity.authenticationTesting.rateLimiting.evidence}`);
    }
    console.log(`\nBrute Force Protection: ${deepSecurity.authenticationTesting.bruteForceProtection.tested ? (deepSecurity.authenticationTesting.bruteForceProtection.protected ? '✅ Protected' : '❌ Not protected') : '⚠️  Not tested (no credentials)'}`);
    if (deepSecurity.authenticationTesting.bruteForceProtection.tested) {
      console.log(`  Evidence: ${deepSecurity.authenticationTesting.bruteForceProtection.evidence}`);
    }
    console.log(`\nSession Management:`);
    console.log(`  Secure Cookies: ${deepSecurity.authenticationTesting.sessionManagement.secureCookies ? '✅' : '❌'}`);
    console.log(`  Session Fixation Risk: ${deepSecurity.authenticationTesting.sessionManagement.sessionFixation ? '⚠️  Yes' : '✅ No'}`);
    console.log(`  Evidence: ${deepSecurity.authenticationTesting.sessionManagement.evidence.join('; ')}`);
    console.log(`\nPassword Policy: ${deepSecurity.authenticationTesting.passwordPolicy.enforced ? '✅ Enforced' : '❌ Not enforced'}`);
    if (deepSecurity.authenticationTesting.passwordPolicy.minLength) {
      console.log(`  Min Length: ${deepSecurity.authenticationTesting.passwordPolicy.minLength} characters`);
    }
    console.log(`  Evidence: ${deepSecurity.authenticationTesting.passwordPolicy.evidence}`);
    console.log(`\nError Messages:`);
    console.log(`  Information Disclosure: ${deepSecurity.authenticationTesting.errorMessages.informationDisclosure ? '⚠️  Yes' : '✅ No'}`);
    console.log(`  User Enumeration: ${deepSecurity.authenticationTesting.errorMessages.userEnumeration ? '⚠️  Yes' : '✅ No'}`);
    if (deepSecurity.authenticationTesting.errorMessages.evidence.length > 0) {
      console.log(`  Evidence: ${deepSecurity.authenticationTesting.errorMessages.evidence.join('; ')}`);
    }

    // Behavioral Tests
    console.log('\n🧪 BEHAVIORAL SECURITY TESTS');
    console.log('-'.repeat(80));
    console.log(`CSRF Protection: ${deepSecurity.behavioralTests.csrfProtection.tested ? (deepSecurity.behavioralTests.csrfProtection.protected ? '✅ Protected' : '❌ Not protected') : '⚠️  Not tested'}`);
    console.log(`  Evidence: ${deepSecurity.behavioralTests.csrfProtection.evidence}`);
    console.log(`\nXSS Protection: ${deepSecurity.behavioralTests.xssProtection.tested ? (deepSecurity.behavioralTests.xssProtection.vulnerable ? '⚠️  Vulnerable' : '✅ Protected') : '⚠️  Not tested'}`);
    console.log(`  Evidence: ${deepSecurity.behavioralTests.xssProtection.evidence}`);
    console.log(`\nInput Validation: ${deepSecurity.behavioralTests.inputValidation.tested ? (deepSecurity.behavioralTests.inputValidation.vulnerable ? '⚠️  Vulnerable' : '✅ Protected') : '⚠️  Not tested'}`);
    console.log(`  Evidence: ${deepSecurity.behavioralTests.inputValidation.evidence.join('; ')}`);
    console.log(`\nInformation Disclosure:`);
    if (deepSecurity.behavioralTests.informationDisclosure.exposedEndpoints.length > 0) {
      console.log(`  ⚠️  Exposed Endpoints: ${deepSecurity.behavioralTests.informationDisclosure.exposedEndpoints.join(', ')}`);
    } else {
      console.log(`  ✅ No exposed endpoints detected`);
    }
    console.log(`  Directory Listing: ${deepSecurity.behavioralTests.informationDisclosure.directoryListing ? '⚠️  Enabled' : '✅ Disabled'}`);

    // Claim Verification
    console.log('\n✅ CLAIM VERIFICATION');
    console.log('-'.repeat(80));
    console.log(`Score: ${deepSecurity.claimVerification.score}/100`);
    deepSecurity.claimVerification.claims.forEach((claim, i) => {
      console.log(`\n${i + 1}. ${claim.claim}: ${claim.verified ? '✅ Verified' : '❌ Not verified'}`);
      console.log(`   Severity: ${claim.severity.toUpperCase()}`);
      console.log(`   Evidence: ${claim.evidence}`);
    });

    // Recommendations
    console.log('\n💡 RECOMMENDATIONS');
    console.log('-'.repeat(80));
    const byPriority = {
      critical: deepSecurity.recommendations.filter(r => r.priority === 'critical'),
      high: deepSecurity.recommendations.filter(r => r.priority === 'high'),
      medium: deepSecurity.recommendations.filter(r => r.priority === 'medium'),
      low: deepSecurity.recommendations.filter(r => r.priority === 'low'),
    };

    ['critical', 'high', 'medium', 'low'].forEach(priority => {
      if (byPriority[priority as keyof typeof byPriority].length > 0) {
        console.log(`\n${priority.toUpperCase()} PRIORITY:`);
        byPriority[priority as keyof typeof byPriority].forEach((rec, i) => {
          console.log(`\n${i + 1}. [${rec.category}] ${rec.issue}`);
          console.log(`   Fix: ${rec.fix}`);
          console.log(`   Impact: ${rec.impact}`);
          console.log(`   Cost: ${rec.cost} | Effort: ${rec.effort}`);
        });
      }
    });

    console.log('\n' + '='.repeat(80));
    console.log('✅ Analysis complete!');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

test();
