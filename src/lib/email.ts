/**
 * Email service using Resend
 * Dependencies: resend
 * Purpose: Send transactional emails
 */
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.FROM_EMAIL || 'security@vibecodeaudit.app';
const WEB_URL = process.env.WEB_URL || 'http://localhost:3000';

interface AccessEmailData {
  email: string;
  name?: string;
  jobId: string;
  accessToken: string;
  url: string;
  issuesFound: number;
  criticalCount: number;
}

export async function sendAccessEmail(data: AccessEmailData): Promise<void> {
  const accessUrl = `${WEB_URL}/?jobId=${data.jobId}&token=${data.accessToken}`;
  
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Security Audit Results</title>
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background: #f9fafb;
    }
    .container {
      background: white;
      border-radius: 12px;
      padding: 32px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 32px;
      padding-bottom: 24px;
      border-bottom: 2px solid #e5e7eb;
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
      color: #dc2626;
      margin-bottom: 8px;
    }
    .alert-box {
      background: ${data.criticalCount > 0 ? '#fee2e2' : '#fef3c7'};
      border-left: 4px solid ${data.criticalCount > 0 ? '#dc2626' : '#f59e0b'};
      padding: 16px;
      margin: 24px 0;
      border-radius: 6px;
    }
    .stats {
      display: flex;
      justify-content: space-around;
      margin: 24px 0;
      padding: 20px;
      background: #f9fafb;
      border-radius: 8px;
    }
    .stat {
      text-align: center;
    }
    .stat-number {
      font-size: 32px;
      font-weight: bold;
      color: #dc2626;
    }
    .stat-label {
      font-size: 14px;
      color: #6b7280;
    }
    .cta-button {
      display: inline-block;
      background: #dc2626;
      color: white;
      text-decoration: none;
      padding: 16px 32px;
      border-radius: 8px;
      font-weight: 600;
      margin: 24px 0;
      text-align: center;
    }
    .cta-button:hover {
      background: #b91c1c;
    }
    .footer {
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 14px;
      color: #6b7280;
    }
    .warning {
      font-weight: 600;
      color: #dc2626;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🔒 VibeCode Security Audit</div>
      <p style="margin: 0; color: #6b7280;">Your security scan results are ready</p>
    </div>

    <h2>${data.name ? `Hi ${data.name},` : 'Hello,'}</h2>
    <p>Scan Complete for ${data.url}</p>

    <div class="alert-box">
      <p style="margin: 0;">
        ${data.criticalCount > 0 
          ? `<span class="warning">⚠️ ${data.criticalCount} critical issue${data.criticalCount > 1 ? 's' : ''} found</span> that need immediate attention.`
          : `Found ${data.issuesFound} security issue${data.issuesFound !== 1 ? 's' : ''} in your application.`
        }
      </p>
    </div>

    <div class="stats">
      <div class="stat">
        <div class="stat-number">${data.issuesFound}</div>
        <div class="stat-label">Total Issues</div>
      </div>
      <div class="stat">
        <div class="stat-number">${data.criticalCount}</div>
        <div class="stat-label">Critical</div>
      </div>
    </div>

    <p>
      We've completed a comprehensive security analysis of your application. 
      ${data.criticalCount > 0 
        ? 'Our scan detected critical vulnerabilities that could expose user data or compromise your application.'
        : 'Review your detailed findings to improve your security posture before launch.'
      }
    </p>

    <p><strong>What's in your full report:</strong></p>
    <ul>
      <li>Complete vulnerability details with evidence</li>
      <li>Step-by-step remediation instructions</li>
      <li>Vibe-coding specific security issues</li>
      <li>Deep security analysis & recommendations</li>
    </ul>

    <div style="text-align: center;">
      <a href="${accessUrl}" class="cta-button">
        View Full Security Report →
      </a>
    </div>

    <p style="font-size: 14px; color: #6b7280;">
      This link will remain active for 30 days. Keep it secure as it contains detailed information about your application's vulnerabilities.
    </p>

    <div class="footer">
      <p>
        <strong>VibeCode Security Audit</strong><br>
        Professional security scanning for AI-built applications
      </p>
      <p style="font-size: 12px; margin-top: 16px;">
        If you didn't request this scan, you can safely ignore this email.
      </p>
    </div>
  </div>
</body>
</html>`;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: data.email,
    subject: `Security Audit Complete: ${data.issuesFound} issue${data.issuesFound !== 1 ? 's' : ''} found in ${data.url}`,
    html,
  });
}

export async function sendTestEmail(to: string): Promise<void> {
  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: 'Test Email from VibeCode Audit',
    html: '<p>If you received this, Resend is working correctly!</p>',
  });
}
