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

  const highSeverityFindings = report?.findings?.filter(f => 
    f.severity?.toLowerCase() === 'critical' || f.severity?.toLowerCase() === 'high'
  ).slice(0, 2) || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Ship Secure Code
            <br />
            At Full Speed
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            AI-powered security scanning that finds vulnerabilities before they become costly breaches. 
            Launch with confidence.
          </p>
        </div>

        {/* Scan Form */}
        <div className="max-w-3xl mx-auto mb-12">
          <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Enter your app URL for instant security analysis
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="example.com"
                required
                className="flex-1 px-6 py-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-lg"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !url}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg shadow-lg hover:shadow-xl transition-all"
              >
                {loading ? 'Scanning...' : 'Scan Free'}
              </button>
            </div>
          </form>
        </div>

        {/* Error Display */}
        {error && (
          <div className="max-w-3xl mx-auto mb-8 bg-red-50 border-2 border-red-200 text-red-700 px-6 py-4 rounded-xl">
            {error}
          </div>
        )}

        {/* Status Display */}
        {jobId && status && !report && (
          <div className="max-w-3xl mx-auto bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <div>
                <h3 className="font-semibold text-lg capitalize">{status}</h3>
                <p className="text-sm text-gray-600">Analyzing your application security...</p>
              </div>
            </div>
          </div>
        )}

        {/* Report Display - Partial/Full */}
        {report && (
          <div className="max-w-5xl mx-auto">
            {/* Score Card - Always Visible */}
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-8 rounded-2xl shadow-2xl text-white mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold mb-2">Security Score</h2>
                  <p className="text-blue-100">Your application security rating</p>
                </div>
                <div className="text-7xl font-bold">
                  {report.score || 0}<span className="text-4xl">/10</span>
                </div>
              </div>
            </div>

            {/* Critical Findings Preview - Always Visible */}
            {highSeverityFindings.length > 0 && (
              <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold">🚨 Critical Issues Found</h3>
                  <span className="px-4 py-2 bg-red-100 text-red-700 rounded-full font-semibold">
                    {highSeverityFindings.length} Critical
                  </span>
                </div>
                <div className="space-y-4">
                  {highSeverityFindings.map((f, i) => (
                    <div key={i} className="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">⚠️</span>
                        <div>
                          <h4 className="font-semibold text-lg text-red-900">
                            {f.title || f.description || 'Security Vulnerability'}
                          </h4>
                          <p className="text-red-700 mt-1">
                            Severity: <span className="font-bold uppercase">{f.severity}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tech Stack Preview - Always Visible */}
            {report.techStack && (
              <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 mb-8">
                <h3 className="text-2xl font-bold mb-4">⚙️ Tech Stack Detected</h3>
                <div className="flex gap-3">
                  {report.techStack.framework && (
                    <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full font-semibold">
                      {report.techStack.framework}
                    </span>
                  )}
                  {report.techStack.hosting && (
                    <span className="px-4 py-2 bg-purple-100 text-purple-700 rounded-full font-semibold">
                      {report.techStack.hosting}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Locked Content - Email Gate */}
            {showEmailGate && !unlocked && (
              <div className="bg-white p-12 rounded-2xl shadow-2xl border-2 border-blue-200 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/95 to-white z-10"></div>
                <div className="relative z-20">
                  {/* Blurred Preview */}
                  <div className="filter blur-sm mb-8 opacity-50 select-none pointer-events-none">
                    <h3 className="text-2xl font-bold mb-4">🔒 Full Security Analysis</h3>
                    <div className="space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                      <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                    </div>
                  </div>

                  {/* Unlock CTAs */}
                  <div className="text-center space-y-8">
                    <div>
                      <h3 className="text-3xl font-bold mb-3">🔓 Unlock Full Report</h3>
                      <p className="text-lg text-gray-600">
                        Get detailed recommendations, all findings, and actionable fixes
                      </p>
                    </div>

                    {/* Email Option */}
                    <form onSubmit={handleEmailUnlock} className="max-w-md mx-auto">
                      <p className="font-semibold mb-4 text-gray-700">Get it FREE via email</p>
                      <div className="flex gap-3">
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="your@email.com"
                          required
                          className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
                        />
                        <button
                          type="submit"
                          className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold"
                        >
                          Unlock
                        </button>
                      </div>
                    </form>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-4 bg-white text-gray-500">or get instant access</span>
                      </div>
                    </div>

                    {/* Payment Option */}
                    <form onSubmit={handlePayment} className="max-w-md mx-auto p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border-2 border-blue-200">
                      <p className="font-bold text-xl mb-4 text-blue-900">Instant Access - $2</p>
                      <div className="space-y-3">
                        <input
                          type="text"
                          placeholder="Name"
                          required
                          value={paymentData.name}
                          onChange={(e) => setPaymentData({...paymentData, name: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                        />
                        <input
                          type="text"
                          placeholder="App Name"
                          required
                          value={paymentData.appName}
                          onChange={(e) => setPaymentData({...paymentData, appName: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Total Spent on App So Far"
                          required
                          value={paymentData.totalSpent}
                          onChange={(e) => setPaymentData({...paymentData, totalSpent: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                        />
                        <input
                          type="email"
                          placeholder="Email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                        />
                        <input
                          type="tel"
                          placeholder="Phone"
                          required
                          value={paymentData.phone}
                          onChange={(e) => setPaymentData({...paymentData, phone: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                        />
                        <button
                          type="submit"
                          className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 font-bold text-lg shadow-lg"
                        >
                          Pay $2 - Get Instant Access
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* Full Report - Unlocked */}
            {unlocked && (
              <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
                <h2 className="text-3xl font-bold mb-6">✅ Full Security Report</h2>
                
                {report.summary && (
                  <div className="mb-8">
                    <h3 className="text-xl font-semibold mb-3">Executive Summary</h3>
                    <p className="text-gray-700 leading-relaxed">{report.summary}</p>
                  </div>
                )}

                {report.findings && report.findings.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold mb-4">All Findings ({report.findings.length})</h3>
                    <div className="space-y-3">
                      {report.findings.map((f, i) => (
                        <div key={i} className="p-4 bg-gray-50 border-l-4 border-gray-300 rounded-lg">
                          <div className="flex items-start gap-3">
                            <span className="text-xl">
                              {f.severity?.toLowerCase() === 'critical' ? '🔴' : 
                               f.severity?.toLowerCase() === 'high' ? '🟠' :
                               f.severity?.toLowerCase() === 'medium' ? '🟡' : '🟢'}
                            </span>
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                {f.title || f.description || 'Security Issue'}
                              </h4>
                              <p className="text-sm text-gray-600 mt-1">
                                Severity: <span className="font-semibold uppercase">{f.severity || 'Unknown'}</span>
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-900 text-white py-8 mt-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-400">© 2025 VibeCode Audit - Ship Secure Code at Full Speed</p>
        </div>
      </div>
    </div>
  );
}
