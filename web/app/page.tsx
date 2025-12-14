'use client';

import { useState } from 'react';

interface ScanResponse {
  result?: { data?: { jobId?: string; status?: string } };
}

interface StatusResponse {
  result?: { data?: { status?: string; error?: string } };
}

interface Finding {
  severity?: string;
  title?: string;
  description?: string;
}

interface Report {
  score?: number;
  summary?: string;
  findings?: Finding[];
  techStack?: { framework?: string; hosting?: string };
  [key: string]: unknown;
}

export default function Home() {
  const [url, setUrl] = useState('');
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showEmailGate, setShowEmailGate] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [email, setEmail] = useState('');
  const [paymentData, setPaymentData] = useState({ name: '', appName: '', totalSpent: '', phone: '' });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://vibecode-audit-production.up.railway.app';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setReport(null);
    setShowEmailGate(false);
    setUnlocked(false);

    try {
      let normalizedUrl = url.trim();
      if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
        normalizedUrl = `https://${normalizedUrl}`;
      }
      
      const res = await fetch(`${API_URL}/api/trpc/scan.submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: normalizedUrl }),
      });

      if (!res.ok) {
        const errText = await res.text();
        let errMsg = `Failed: ${res.status}`;
        try {
          const errJson = JSON.parse(errText);
          errMsg = errJson.error?.message || errText;
        } catch {}
        throw new Error(errMsg);
      }
      
      const data: ScanResponse = await res.json();
      const newJobId = data.result?.data?.jobId;
      
      if (!newJobId) throw new Error('No jobId in response');
      
      setJobId(newJobId);
      setStatus('pending');
      pollStatus(newJobId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submit failed');
      setLoading(false);
    }
  };

  const pollStatus = async (id: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `${API_URL}/api/trpc/scan.status?input=${encodeURIComponent(JSON.stringify({ jobId: id }))}`
        );
        if (!res.ok) throw new Error('Status check failed');
        
        const data: StatusResponse = await res.json();
        const statusData = data.result?.data;
        const currentStatus = statusData?.status;
        
        if (currentStatus) {
          setStatus(currentStatus);
          if (currentStatus === 'completed') {
            clearInterval(interval);
            setLoading(false);
            fetchReport(id);
          } else if (currentStatus === 'failed') {
            clearInterval(interval);
            setLoading(false);
            setError(statusData.error || 'Scan failed');
          }
        }
      } catch (err) {
        clearInterval(interval);
        setLoading(false);
        setError(err instanceof Error ? err.message : 'Status check failed');
      }
    }, 3000);
  };

  const fetchReport = async (id: string) => {
    try {
      const res = await fetch(
        `${API_URL}/api/trpc/scan.report?input=${encodeURIComponent(JSON.stringify({ jobId: id }))}`
      );
      if (res.ok) {
        const data = await res.json();
        setReport(data.result?.data);
        setShowEmailGate(true);
        return;
      }
      const restRes = await fetch(`${API_URL}/api/report/${id}`);
      if (restRes.ok) {
        setReport(await restRes.json());
        setShowEmailGate(true);
      } else {
        throw new Error('Report not found');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch report');
    }
  };

  const handleEmailUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setUnlocked(true);
      setShowEmailGate(false);
    }
  };

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setUnlocked(true);
    setShowEmailGate(false);
  };

  const criticalFindings = report?.findings?.filter(f => 
    f.severity?.toLowerCase() === 'critical' || f.severity?.toLowerCase() === 'high'
  ).slice(0, 3) || [];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="max-w-6xl mx-auto px-4 pt-20 pb-12">
        <div className="text-center mb-16">
          <p className="text-sm text-gray-500 uppercase tracking-wider mb-6">Security Scanning</p>
          <h1 className="text-6xl md:text-7xl font-bold mb-4">
            Launch at
          </h1>
          <h1 className="text-6xl md:text-7xl font-bold mb-8">
            <span className="relative inline-block">
              Full Speed
              <svg className="absolute -bottom-2 left-0 w-full" height="8" viewBox="0 0 300 8" fill="none">
                <path d="M0 4C100 1 200 1 300 4" stroke="#3B82F6" strokeWidth="4"/>
              </svg>
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-12">
            Building your MVP but unsure if it's secure? Get instant security analysis before you launch.
          </p>
        </div>

        {/* Scan Form */}
        <div className="max-w-3xl mx-auto mb-20">
          <form onSubmit={handleSubmit} className="bg-white border-2 border-gray-900 p-6 rounded-xl shadow-lg">
            <div className="flex flex-col md:flex-row gap-3">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="your-app.com"
                required
                className="flex-1 px-6 py-4 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none text-lg"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !url}
                className="px-8 py-4 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg"
              >
                {loading ? 'Scanning...' : 'Scan Now'}
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-3">Free security scan • No credit card required</p>
          </form>
        </div>
      </div>

      {/* Problem Statement */}
      {!report && !loading && (
        <div className="bg-gray-50 py-20">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Building your MVP supercharges
              <br />
              productivity but also introduces
              <br />
              <span className="text-red-600">Hidden Security Risks</span>
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Launching without knowing your vulnerabilities
              <br />
              Can Feel Unattainable
            </p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="max-w-3xl mx-auto px-4 mb-8">
          <div className="bg-red-50 border-2 border-red-600 text-red-800 px-6 py-4 rounded-xl">
            <span className="font-semibold">Error:</span> {error}
          </div>
        </div>
      )}

      {/* Status */}
      {jobId && status && !report && (
        <div className="max-w-3xl mx-auto px-4 mb-8">
          <div className="bg-white border-2 border-gray-900 p-8 rounded-xl">
            <div className="flex items-center gap-4">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent"></div>
              <div>
                <h3 className="font-bold text-xl capitalize">{status}</h3>
                <p className="text-gray-600">Analyzing your application security...</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report */}
      {report && (
        <div className="max-w-5xl mx-auto px-4 pb-20">
          {/* Score - Always Visible */}
          <div className="bg-black text-white p-12 rounded-xl mb-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-wider text-gray-400 mb-2">Security Score</p>
                <h2 className="text-4xl font-bold">Your App's Security Rating</h2>
              </div>
              <div className="text-8xl font-bold">
                {report.score || 0}<span className="text-4xl text-gray-400">/10</span>
              </div>
            </div>
          </div>

          {/* Critical Issues - Always Visible */}
          {criticalFindings.length > 0 && (
            <div className="bg-white border-2 border-red-600 p-8 rounded-xl mb-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-3xl font-bold">Critical Vulnerabilities Detected</h3>
                <span className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold">
                  {criticalFindings.length} Critical
                </span>
              </div>
              <div className="space-y-4">
                {criticalFindings.map((f, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 bg-red-50 rounded-lg">
                    <span className="text-3xl">🚨</span>
                    <div className="flex-1">
                      <h4 className="font-bold text-lg mb-1">
                        {f.title || f.description || 'Security Vulnerability'}
                      </h4>
                      <p className="text-red-700 font-semibold uppercase text-sm">
                        {f.severity} SEVERITY
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tech Stack */}
          {report.techStack && (
            <div className="bg-white border-2 border-gray-900 p-8 rounded-xl mb-8">
              <h3 className="text-2xl font-bold mb-4">Detected Tech Stack</h3>
              <div className="flex gap-3">
                {report.techStack.framework && (
                  <span className="px-5 py-2 bg-blue-600 text-white rounded-lg font-semibold">
                    {report.techStack.framework}
                  </span>
                )}
                {report.techStack.hosting && (
                  <span className="px-5 py-2 bg-gray-900 text-white rounded-lg font-semibold">
                    {report.techStack.hosting}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Summary - Always Visible */}
          {report.summary && (
            <div className="bg-white border-2 border-gray-900 p-8 rounded-xl mb-8">
              <h3 className="text-2xl font-bold mb-4">Executive Summary</h3>
              <p className="text-gray-700 leading-relaxed">{report.summary}</p>
            </div>
          )}

          {/* All Findings List - Always Visible */}
          {report.findings && report.findings.length > 0 && (
            <div className="bg-white border-2 border-gray-900 p-8 rounded-xl mb-8">
              <h3 className="text-2xl font-bold mb-6">All Security Issues Detected ({report.findings.length})</h3>
              <div className="space-y-3">
                {report.findings.map((f, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-lg">
                    <span className="text-2xl">
                      {f.severity?.toLowerCase() === 'critical' ? '🔴' : 
                       f.severity?.toLowerCase() === 'high' ? '🟠' :
                       f.severity?.toLowerCase() === 'medium' ? '🟡' : '🟢'}
                    </span>
                    <div className="flex-1">
                      <h4 className="font-bold text-lg">
                        {f.title || f.description || 'Security Issue'}
                      </h4>
                      <p className="text-sm font-semibold uppercase text-gray-600">
                        {f.severity || 'Unknown'} Severity
                      </p>
                    </div>
                    <span className="text-gray-400 text-2xl">🔒</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 bg-yellow-50 border-2 border-yellow-600 rounded-lg">
                <p className="text-center font-semibold text-yellow-900">
                  ⚠️ Detailed fixes and remediation steps are locked
                </p>
              </div>
            </div>
          )}

          {/* Email Gate - Inline, Not Overlay */}
          {showEmailGate && !unlocked && (
            <div className="bg-white border-2 border-red-600 p-12 rounded-xl">
              <div className="max-w-2xl mx-auto">
                <div className="text-center mb-8">
                  <span className="text-6xl mb-4 block">🔒</span>
                  <h3 className="text-4xl font-bold mb-3">Unlock Detailed Fixes</h3>
                  <p className="text-xl text-gray-600">
                    Get step-by-step remediation instructions for all {report.findings?.length || 0} vulnerabilities
                  </p>
                </div>

                {/* What You Get */}
                <div className="bg-gray-50 p-6 rounded-lg mb-8">
                  <h4 className="font-bold text-lg mb-4">What's Included:</h4>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-3">
                      <span className="text-green-600 font-bold">✓</span>
                      <span>Detailed fix instructions for each vulnerability</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-green-600 font-bold">✓</span>
                      <span>Code snippets and implementation examples</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-green-600 font-bold">✓</span>
                      <span>Priority ranking and risk assessment</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-green-600 font-bold">✓</span>
                      <span>Best practices and prevention tips</span>
                    </li>
                  </ul>
                </div>

                {/* Email Option */}
                <form onSubmit={handleEmailUnlock} className="mb-6">
                  <p className="font-bold text-lg mb-3">Get it FREE via email</p>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        required
                        className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                      >
                        Unlock
                      </button>
                  </div>
                </form>

                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t-2 border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="px-6 bg-white text-gray-500 font-semibold">or instant access</span>
                  </div>
                </div>

                {/* Payment Option */}
                <form onSubmit={handlePayment} className="p-6 bg-black text-white rounded-lg">
                  <p className="font-bold text-2xl mb-6 text-center">Instant Access - $2</p>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Name"
                      required
                      value={paymentData.name}
                      onChange={(e) => setPaymentData({...paymentData, name: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-700 bg-gray-900 text-white rounded-lg focus:border-blue-600 focus:outline-none placeholder-gray-500"
                    />
                    <input
                      type="text"
                      placeholder="App Name"
                      required
                      value={paymentData.appName}
                      onChange={(e) => setPaymentData({...paymentData, appName: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-700 bg-gray-900 text-white rounded-lg focus:border-blue-600 focus:outline-none placeholder-gray-500"
                    />
                    <input
                      type="text"
                      placeholder="Total Spent on App"
                      required
                      value={paymentData.totalSpent}
                      onChange={(e) => setPaymentData({...paymentData, totalSpent: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-700 bg-gray-900 text-white rounded-lg focus:border-blue-600 focus:outline-none placeholder-gray-500"
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-700 bg-gray-900 text-white rounded-lg focus:border-blue-600 focus:outline-none placeholder-gray-500"
                    />
                    <input
                      type="tel"
                      placeholder="Phone"
                      required
                      value={paymentData.phone}
                      onChange={(e) => setPaymentData({...paymentData, phone: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-700 bg-gray-900 text-white rounded-lg focus:border-blue-600 focus:outline-none placeholder-gray-500"
                    />
                    <button
                      type="submit"
                      className="w-full px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold text-lg mt-4"
                    >
                      Pay $2 - Get Instant Access
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Detailed Fixes - Only After Unlock */}
          {unlocked && report.findings && report.findings.length > 0 && (
            <div className="bg-white border-2 border-gray-900 p-8 rounded-xl">
              <h3 className="text-3xl font-bold mb-8">Detailed Remediation Guide</h3>
              <div className="space-y-6">
                {report.findings.map((f, i) => (
                  <div key={i} className="p-6 border-2 border-gray-200 rounded-lg">
                    <div className="flex items-start gap-4 mb-4">
                      <span className="text-3xl">
                        {f.severity?.toLowerCase() === 'critical' ? '🔴' : 
                         f.severity?.toLowerCase() === 'high' ? '🟠' :
                         f.severity?.toLowerCase() === 'medium' ? '🟡' : '🟢'}
                      </span>
                      <div className="flex-1">
                        <h4 className="font-bold text-xl mb-2">
                          {f.title || f.description || 'Security Issue'}
                        </h4>
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-semibold uppercase">
                          {f.severity || 'Unknown'} Severity
                        </span>
                      </div>
                    </div>
                    <div className="pl-14 space-y-3">
                      <div>
                        <h5 className="font-semibold text-sm uppercase text-gray-600 mb-1">Description</h5>
                        <p className="text-gray-700">{f.description || f.title || 'Security vulnerability detected'}</p>
                      </div>
                      <div>
                        <h5 className="font-semibold text-sm uppercase text-gray-600 mb-1">Recommended Fix</h5>
                        <p className="text-gray-700">Implement proper input validation, sanitization, and security headers to prevent this vulnerability.</p>
                      </div>
                      <div>
                        <h5 className="font-semibold text-sm uppercase text-gray-600 mb-1">Priority</h5>
                        <p className="text-gray-700">{f.severity?.toLowerCase() === 'critical' || f.severity?.toLowerCase() === 'high' ? 'Fix immediately before launch' : 'Address in next sprint'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="bg-black text-white py-12 mt-20">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-gray-400">© 2025 VibeCode Audit</p>
        </div>
      </div>
    </div>
  );
}
