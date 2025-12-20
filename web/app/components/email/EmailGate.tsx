/**
 * Email gate component for report access
 * Dependencies: React
 * Purpose: Email capture form for unlocking full reports
 */
'use client';

import { useState } from 'react';

interface EmailGateProps {
  jobId: string;
  url: string;
  issuesFound: number;
  onUnlock: () => void;
  onEmailSent: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://vibecode-audit-production.up.railway.app';

export default function EmailGate({ jobId, url, issuesFound, onUnlock, onEmailSent }: EmailGateProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [productOptIn, setProductOptIn] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !jobId) return;

    setEmailSending(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/api/trpc/scan.requestAccess`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          jobId, 
          email,
          name: name || undefined,
          phone: phone || undefined,
          company: company || url || undefined,
          marketingOptIn,
          productOptIn,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to send email');
      }

      const data = await res.json();
      setEmailSent(true);
      onEmailSent();

      // In dev mode, auto-unlock if token provided
      if (process.env.NODE_ENV === 'development' && data.result?.data?.accessToken) {
        onUnlock();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send email');
    } finally {
      setEmailSending(false);
    }
  };

  if (emailSent) {
    return (
      <div className="bg-green-50 border-2 border-green-500 rounded-xl p-6 text-center">
        <div className="text-4xl mb-3">✅</div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Check Your Email!</h3>
        <p className="text-gray-700">
          We've sent a secure access link to <strong>{email}</strong>.
          Click the link in your email to view your full security report.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-400 rounded-2xl p-8 text-center shadow-lg">
      <div className="w-16 h-16 bg-yellow-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
      <h3 className="text-2xl font-bold mb-2 text-gray-900">Get Your Full Security Report</h3>
      <p className="text-gray-700 mb-2 max-w-md mx-auto">
        Get detailed evidence, specific locations, and step-by-step fix instructions for all {issuesFound} issues.
      </p>
      <p className="text-sm text-gray-600 mb-6">
        We'll send you a secure access link instantly.
      </p>
      {error && (
        <div className="bg-red-50 border-2 border-red-600 text-red-800 px-6 py-4 rounded-xl mb-4">
          <span className="font-semibold">Error:</span> {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="max-w-md mx-auto text-left">
        <div className="space-y-3 mb-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email *"
            required
            disabled={emailSending}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-red-500 focus:outline-none text-base"
          />
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name (optional)"
            disabled={emailSending}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-red-500 focus:outline-none text-base"
          />
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone (optional)"
            disabled={emailSending}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-red-500 focus:outline-none text-base"
          />
          <input
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder={`Company/Website (optional, default: ${url})`}
            disabled={emailSending}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-red-500 focus:outline-none text-base"
          />
        </div>
        <div className="space-y-2 mb-4">
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={marketingOptIn}
              onChange={(e) => setMarketingOptIn(e.target.checked)}
              disabled={emailSending}
              className="mt-1 w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
            />
            <span className="text-sm text-gray-700">
              Send me security tips and updates <span className="text-gray-500">(recommended)</span>
            </span>
          </label>
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={productOptIn}
              onChange={(e) => setProductOptIn(e.target.checked)}
              disabled={emailSending}
              className="mt-1 w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
            />
            <span className="text-sm text-gray-700">
              Notify me of new vulnerabilities for my tech stack
            </span>
          </label>
        </div>
        <button
          type="submit"
          disabled={emailSending}
          className="w-full px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg transition-colors shadow-lg"
        >
          {emailSending ? 'Sending...' : 'Get Full Report →'}
        </button>
        <p className="text-xs text-gray-500 mt-3 text-center">100% free • No spam • Instant access</p>
      </form>
    </div>
  );
}

