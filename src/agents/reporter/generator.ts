/**
 * Report generator (HTML only)
 * Dependencies: @vibecode-audit/shared
 * Purpose: Generate HTML reports from analysis
 */
import type { Analysis, Finding } from '../../types';
import type { EventBus } from '../communication';

export async function generateReport(
  analysis: Analysis,
  findings: Finding[],
  url: string,
  jobId: string,
  eventBus: EventBus,
  vibeCodingVulns?: any
): Promise<{ html: string; pdf?: Buffer }> {
  await eventBus.publish(jobId, {
    type: 'agent.started',
    agent: 'reporter.generator',
    jobId,
    timestamp: Date.now(),
  });

  await eventBus.publish(jobId, {
    type: 'agent.progress',
    agent: 'reporter.generator',
    jobId,
    timestamp: Date.now(),
    progress: 50,
    message: 'Generating HTML template',
  });

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Security Audit Report - ${url}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
    .score { font-size: 48px; font-weight: bold; color: ${analysis.score >= 7 ? '#22c55e' : analysis.score >= 4 ? '#eab308' : '#ef4444'}; }
    .finding { margin: 20px 0; padding: 15px; border-left: 4px solid ${(f: Finding) => f.severity === 'critical' ? '#ef4444' : f.severity === 'high' ? '#f97316' : f.severity === 'medium' ? '#eab308' : '#3b82f6'}; background: #f9fafb; }
    .severity { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
    .severity.critical { background: #fee2e2; color: #991b1b; }
    .severity.high { background: #fed7aa; color: #9a3412; }
    .severity.medium { background: #fef3c7; color: #854d0e; }
    .severity.low { background: #dbeafe; color: #1e40af; }
    .recommendation { margin: 10px 0; padding: 10px; background: #f0f9ff; border-radius: 4px; }
    .explanation { margin: 15px 0; padding: 15px; background: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 4px; }
    .explanation h4 { margin-top: 0; color: #1e40af; font-size: 14px; }
    .explanation p { margin: 8px 0; font-size: 14px; line-height: 1.6; }
    .vibe-coding { margin: 30px 0; padding: 20px; background: #faf5ff; border: 2px solid #c084fc; border-radius: 8px; }
    .vibe-coding h3 { margin-top: 0; color: #6b21a8; }
    .vibe-section { margin: 15px 0; padding: 12px; background: white; border-radius: 4px; }
    .vibe-section h4 { margin-top: 0; font-size: 16px; }
    .vibe-item { margin: 8px 0; padding: 8px; background: #f9fafb; border-left: 3px solid #c084fc; }
    .limitations { margin-top: 40px; padding: 20px; background: #fef3c7; border-radius: 8px; }
    .cta { margin-top: 30px; padding: 20px; background: #1e40af; color: white; border-radius: 8px; text-align: center; }
    .cta a { color: white; font-weight: bold; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Security Audit Report</h1>
    <p><strong>URL:</strong> ${url}</p>
    <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
    <div class="score">Score: ${analysis.score}/10</div>
  </div>

  <section>
    <h2>Summary</h2>
    <p>${analysis.summary}</p>
    <p><strong>Confidence:</strong> ${(analysis.confidence * 100).toFixed(0)}%</p>
  </section>

  <section>
    <h2>Findings (${findings.length})</h2>
    ${findings.map((f) => `
      <div class="finding">
        <span class="severity ${f.severity}">${f.severity}</span>
        <h3>${f.type}</h3>
        <p><strong>Evidence:</strong> ${f.evidence}</p>
        ${f.cwe ? `<p><strong>CWE:</strong> ${f.cwe}</p>` : ''}
        ${f.explanation ? `
          <div class="explanation">
            <h4>Why This Matters</h4>
            <p><strong>What it means:</strong> ${f.explanation.whatItMeans}</p>
            <p><strong>Why it's a problem:</strong> ${f.explanation.whyItsAProblem}</p>
            <p><strong>Who it affects:</strong> ${f.explanation.whoItAffects}</p>
            <p><strong>When it matters:</strong> ${f.explanation.whenItMatters}</p>
          </div>
        ` : ''}
        <p><strong>Recommendation:</strong> ${f.recommendation}</p>
      </div>
    `).join('')}
  </section>

  <section>
    <h2>Recommendations</h2>
    ${analysis.recommendations.map((r) => `
      <div class="recommendation">
        <strong>[${r.priority.toUpperCase()}]</strong> ${r.action} <em>(Effort: ${r.effort})</em>
      </div>
    `).join('')}
  </section>

  ${vibeCodingVulns ? `
    <section class="vibe-coding">
      <h3>🔍 Vibe-Coding Vulnerability Analysis</h3>
      <p><strong>Overall Risk:</strong> <span style="color: ${vibeCodingVulns.overallRisk === 'critical' ? '#dc2626' : vibeCodingVulns.overallRisk === 'high' ? '#ea580c' : vibeCodingVulns.overallRisk === 'medium' ? '#ca8a04' : '#16a34a'}">${vibeCodingVulns.overallRisk?.toUpperCase() || 'N/A'}</span></p>
      <p><strong>Score:</strong> ${vibeCodingVulns.score || 'N/A'}/10</p>
      
      ${vibeCodingVulns.hardCodedSecrets && vibeCodingVulns.hardCodedSecrets.length > 0 ? `
        <div class="vibe-section">
          <h4 style="color: #dc2626;">🚨 Hard-Coded Secrets (${vibeCodingVulns.hardCodedSecrets.length})</h4>
          ${vibeCodingVulns.hardCodedSecrets.map((s: any) => `
            <div class="vibe-item">
              <strong>Type:</strong> ${s.type}<br>
              <strong>Location:</strong> ${s.location || 'Unknown'}<br>
              <strong>Risk:</strong> ${s.risk || 'High'}
            </div>
          `).join('')}
        </div>
      ` : ''}
      
      ${vibeCodingVulns.clientSideAuth && vibeCodingVulns.clientSideAuth.detected ? `
        <div class="vibe-section">
          <h4 style="color: #ea580c;">⚠️ Client-Side Authentication Detected</h4>
          <p>${vibeCodingVulns.clientSideAuth.description || 'Authentication logic appears to be handled in the frontend, which is a security risk.'}</p>
        </div>
      ` : ''}
      
      ${vibeCodingVulns.unauthenticatedApiAccess && vibeCodingVulns.unauthenticatedApiAccess.length > 0 ? `
        <div class="vibe-section">
          <h4 style="color: #ea580c;">⚠️ Unauthenticated API Endpoints (${vibeCodingVulns.unauthenticatedApiAccess.length})</h4>
          ${vibeCodingVulns.unauthenticatedApiAccess.map((api: any) => `
            <div class="vibe-item">
              <strong>Endpoint:</strong> ${api.endpoint || 'Unknown'}<br>
              <strong>Method:</strong> ${api.method || 'GET'}<br>
              <strong>Risk:</strong> ${api.risk || 'High'}
            </div>
          `).join('')}
        </div>
      ` : ''}
      
      ${vibeCodingVulns.backendMisconfigurations && vibeCodingVulns.backendMisconfigurations.length > 0 ? `
        <div class="vibe-section">
          <h4 style="color: #ca8a04;">⚠️ Backend Misconfigurations (${vibeCodingVulns.backendMisconfigurations.length})</h4>
          ${vibeCodingVulns.backendMisconfigurations.map((m: any) => `
            <div class="vibe-item">
              <strong>Issue:</strong> ${m.issue || 'Unknown'}<br>
              <strong>Description:</strong> ${m.description || ''}
            </div>
          `).join('')}
        </div>
      ` : ''}
      
      ${vibeCodingVulns.recommendations && vibeCodingVulns.recommendations.length > 0 ? `
        <div class="vibe-section">
          <h4>Recommendations</h4>
          ${vibeCodingVulns.recommendations.map((r: any) => `
            <div class="vibe-item">
              <strong>${r.priority || 'Medium'} Priority:</strong> ${r.recommendation || r.action || ''}
            </div>
          `).join('')}
        </div>
      ` : ''}
    </section>
  ` : ''}

  <div class="limitations">
    <h3>⚠️ Limitations</h3>
    <p>This is an external-only scan. For comprehensive security analysis including code review, database schema analysis, and internal architecture review, upgrade to our paid codebase audit service.</p>
  </div>

  <div class="cta">
    <h3>Need Deeper Insights?</h3>
    <p>Upgrade to a full codebase review for $49 and get:</p>
    <ul style="text-align: left; display: inline-block;">
      <li>Complete code analysis</li>
      <li>Database schema review</li>
      <li>Architecture diagrams</li>
      <li>Custom recommendations</li>
    </ul>
    <p><a href="mailto:support@vibecodeaudit.com?subject=Upgrade Request">Contact us to upgrade</a></p>
  </div>
</body>
</html>`;

  await eventBus.publish(jobId, {
    type: 'agent.completed',
    agent: 'reporter.generator',
    jobId,
    timestamp: Date.now(),
    data: { hasHtml: true },
  });

  return { html };
}
