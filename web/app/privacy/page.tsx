import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | VibeCode Audit',
  description: 'Privacy policy for VibeCode Audit security scanning service',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        
        <div className="space-y-6 text-gray-300">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Data Collection</h2>
            <p>
              VibeCode Audit collects minimal data necessary to provide our security scanning service:
            </p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>URLs submitted for scanning</li>
              <li>Optional email addresses for scan result notifications</li>
              <li>Technical scan data (HTTP headers, response codes, detected patterns)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Data Usage</h2>
            <p>We use collected data to:</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>Perform security scans and generate reports</li>
              <li>Send scan results to provided email addresses</li>
              <li>Improve our scanning algorithms and detection capabilities</li>
              <li>Monitor service performance and reliability</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Data Encryption</h2>
            <p>
              All data is encrypted in transit using TLS 1.3. Scan results are encrypted at rest using industry-standard AES-256 encryption. 
              Data is stored securely on Railway infrastructure with automatic backups.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Data Retention</h2>
            <p>
              Scan reports are retained for 30 days for retrieval purposes, then automatically deleted. 
              Email addresses provided for notifications are not stored beyond report delivery unless you create an account.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Third-Party Services</h2>
            <p>We use the following third-party services:</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li><strong>Railway</strong> - Hosting and infrastructure</li>
              <li><strong>Upstash Redis</strong> - Encrypted data storage</li>
              <li><strong>Vercel</strong> - Web hosting</li>
              <li><strong>Groq</strong> - AI-powered security analysis</li>
            </ul>
            <p className="mt-2">
              These services process data on our behalf under strict data processing agreements.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Cookies</h2>
            <p>
              We use minimal essential cookies for service functionality. No tracking or advertising cookies are used.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">GDPR & CCPA Compliance</h2>
            <p>
              We comply with GDPR and CCPA regulations. You have the right to:
            </p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>Request access to your data</li>
              <li>Request deletion of your data</li>
              <li>Opt-out of data collection</li>
              <li>Data portability</li>
            </ul>
            <p className="mt-2">
              Contact us at privacy@vibecodeaudit.app for data requests.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Updates</h2>
            <p>
              This privacy policy may be updated periodically. Last updated: December 14, 2024.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Contact</h2>
            <p>
              For privacy-related questions: <a href="mailto:privacy@vibecodeaudit.app" className="text-purple-400 hover:text-purple-300">privacy@vibecodeaudit.app</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
