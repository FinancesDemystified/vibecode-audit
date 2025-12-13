/**
 * Report generator (HTML only)
 * Dependencies: @vibecode-audit/shared
 * Purpose: Generate HTML reports from analysis
 */
import type { Analysis, Finding } from '@vibecode-audit/shared';
import type { EventBus } from '../communication';

export async function generateReport(
  analysis: Analysis,
  findings: Finding[],
  url: string,
  jobId: string,
  eventBus: EventBus
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
