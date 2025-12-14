import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Security | VibeCode Audit',
  description: 'Security practices and infrastructure for VibeCode Audit',
};

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold mb-8">Security</h1>
        
        <div className="space-y-6 text-gray-300">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Our Security Commitment</h2>
            <p>
              VibeCode Audit is built with security as a foundational principle. We employ industry-leading 
              security practices to protect your data and ensure reliable service delivery.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Encryption</h2>
            <ul className="list-disc ml-6 space-y-2">
              <li><strong>TLS 1.3</strong> - All data transmitted between your browser and our servers is encrypted using TLS 1.3</li>
              <li><strong>AES-256</strong> - Data at rest is encrypted using AES-256 encryption</li>
              <li><strong>HTTPS Everywhere</strong> - All pages and API endpoints enforce HTTPS with HSTS</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Security Headers</h2>
            <p>We implement comprehensive security headers including:</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>Content-Security-Policy (CSP) with strict directives</li>
              <li>X-Frame-Options to prevent clickjacking</li>
              <li>X-Content-Type-Options to prevent MIME sniffing</li>
              <li>X-XSS-Protection for browser-level XSS filtering</li>
              <li>Referrer-Policy for privacy protection</li>
              <li>Permissions-Policy to restrict device access</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Infrastructure Security</h2>
            <ul className="list-disc ml-6 space-y-2">
              <li><strong>Isolated Environments</strong> - Production, staging, and development environments are strictly separated</li>
              <li><strong>Rate Limiting</strong> - API endpoints protected with intelligent rate limiting via Upstash</li>
              <li><strong>DDoS Protection</strong> - Cloudflare-level protection on frontend, Railway protection on backend</li>
              <li><strong>Automated Backups</strong> - Daily encrypted backups with 30-day retention</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Scanning Security</h2>
            <p>Our security scanning engine follows responsible disclosure principles:</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>Non-invasive testing methods</li>
              <li>Respectful of robots.txt and rate limits</li>
              <li>No exploitation of discovered vulnerabilities</li>
              <li>Secure storage of scan results with automatic expiration</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Continuous Security Testing</h2>
            <p>We practice what we preach:</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>Weekly automated security scans using our own platform</li>
              <li>Quarterly penetration testing by third-party security researchers</li>
              <li>Continuous monitoring for vulnerabilities in dependencies</li>
              <li>Automated security updates via Dependabot</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Compliance</h2>
            <p>We maintain compliance with:</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li><strong>GDPR</strong> - General Data Protection Regulation</li>
              <li><strong>CCPA</strong> - California Consumer Privacy Act</li>
              <li><strong>OWASP</strong> - Following OWASP Top 10 security guidelines</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Incident Response</h2>
            <p>
              We maintain a comprehensive incident response plan with defined escalation procedures. 
              In the event of a security incident, affected users will be notified within 24 hours.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Responsible Disclosure</h2>
            <p>
              If you discover a security vulnerability, please report it responsibly to{' '}
              <a href="mailto:security@vibecodeaudit.app" className="text-purple-400 hover:text-purple-300">
                security@vibecodeaudit.app
              </a>
              . We appreciate the security community's help in keeping our platform secure.
            </p>
            <p className="mt-2">
              We commit to:
            </p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>Acknowledge reports within 24 hours</li>
              <li>Provide regular updates on remediation progress</li>
              <li>Credit researchers who report vulnerabilities responsibly (with permission)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Contact</h2>
            <p>
              Security inquiries: <a href="mailto:security@vibecodeaudit.app" className="text-purple-400 hover:text-purple-300">security@vibecodeaudit.app</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
