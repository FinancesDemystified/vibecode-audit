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
  const [currentTab, setCurrentTab] = useState<'scan' | 'results' | 'details'>('scan');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://vibecode-audit-production.up.railway.app';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setReport(null);
    setShowEmailGate(false);
    setUnlocked(false);
    setCurrentTab('scan');

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
        setCurrentTab('results');
        return;
      }
      const restRes = await fetch(`${API_URL}/api/report/${id}`);
      if (restRes.ok) {
        setReport(await restRes.json());
        setShowEmailGate(true);
        setCurrentTab('results');
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
      setCurrentTab('details');
    }
  };

  const criticalFindings = report?.findings?.filter(f => 
    f.severity?.toLowerCase() === 'critical' || f.severity?.toLowerCase() === 'high'
  ).slice(0, 3) || [];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold">VibeCode Security Audit</h1>
        </div>
      </div>

      {/* Navigation Tabs - Only show when we have a report */}
      {report && (
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4">
            <div className="flex gap-8">
              <button
                onClick={() => setCurrentTab('scan')}
                className={`py-4 px-2 border-b-2 font-semibold text-sm transition-colors ${
                  currentTab === 'scan'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Scan URL
              </button>
              <button
                onClick={() => setCurrentTab('results')}
                className={`py-4 px-2 border-b-2 font-semibold text-sm transition-colors ${
                  currentTab === 'results'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                View Results
              </button>
              {unlocked && (
                <button
                  onClick={() => setCurrentTab('details')}
                  className={`py-4 px-2 border-b-2 font-semibold text-sm transition-colors ${
                    currentTab === 'details'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Full Report
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Scan Tab */}
        {currentTab === 'scan' && (
          <div className="max-w-2xl mx-auto">
            {!loading && !report && (
              <>
                <div className="text-center mb-12">
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">
                    Get instant security analysis
                  </h2>
                  <p className="text-lg text-gray-600">
                    Scan your web app for vulnerabilities before launch
                  </p>
                </div>

                <div className="bg-white border-2 border-gray-900 rounded-xl p-8 shadow-sm">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Website URL
                      </label>
                      <input
                        type="text"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="example.com"
                        required
                        className="w-full px-4 py-4 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none text-base"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!url}
                      className="w-full px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg transition-colors"
                    >
                      Start Security Scan
                    </button>
                  </form>
                  <p className="text-sm text-gray-500 text-center mt-4">
                    Free scan • No credit card required
                  </p>
                </div>

                <div className="mt-12 p-6 bg-blue-50 rounded-xl border border-blue-200">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <span className="text-2xl">🔒</span>
                    <span>How it works</span>
                  </h3>
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        1
                      </div>
                      <p className="text-sm text-gray-700">Enter your website URL</p>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        2
                      </div>
                      <p className="text-sm text-gray-700">AI scans for security vulnerabilities</p>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        3
                      </div>
                      <p className="text-sm text-gray-700">Get detailed security report</p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {loading && (
              <div className="bg-white border-2 border-gray-900 rounded-xl p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mb-6"></div>
                <h3 className="text-xl font-bold capitalize mb-2">{status}</h3>
                <p className="text-gray-600">Analyzing your application security...</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border-2 border-red-600 text-red-800 px-6 py-4 rounded-xl">
                <span className="font-semibold">Error:</span> {error}
              </div>
            )}
          </div>
        )}

        {/* Results Tab */}
        {currentTab === 'results' && report && (
          <div className="space-y-6">
            {/* Score Card */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-xl p-8 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-wider opacity-90 mb-1">Security Score</p>
                  <h2 className="text-2xl font-bold">Your App Rating</h2>
                </div>
                <div className="text-6xl font-bold">
                  {report.score || 0}<span className="text-3xl opacity-75">/10</span>
                </div>
              </div>
            </div>

            {/* Critical Issues */}
            {criticalFindings.length > 0 && (
              <div className="bg-white border-2 border-red-600 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <span>🚨</span>
                    <span>Critical Issues</span>
                  </h3>
                  <span className="px-3 py-1 bg-red-600 text-white rounded-full text-sm font-bold">
                    {criticalFindings.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {criticalFindings.map((f, i) => (
                    <div key={i} className="p-4 bg-red-50 rounded-lg">
                      <h4 className="font-semibold mb-1">{f.title || f.description || 'Security Vulnerability'}</h4>
                      <p className="text-sm text-red-700 uppercase font-semibold">{f.severity} SEVERITY</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tech Stack */}
            {report.techStack && (
              <div className="bg-white border-2 border-gray-900 rounded-xl p-6">
                <h3 className="text-lg font-bold mb-3">Detected Technologies</h3>
                <div className="flex flex-wrap gap-2">
                  {report.techStack.framework && (
                    <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-semibold text-sm">
                      {report.techStack.framework}
                    </span>
                  )}
                  {report.techStack.hosting && (
                    <span className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold text-sm">
                      {report.techStack.hosting}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* All Findings */}
            {report.findings && report.findings.length > 0 && (
              <div className="bg-white border-2 border-gray-900 rounded-xl p-6">
                <h3 className="text-lg font-bold mb-4">
                  All Issues Found ({report.findings.length})
                </h3>
                <div className="space-y-2">
                  {report.findings.map((f, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-blue-600 transition-colors">
                      <span className="text-xl">
                        {f.severity?.toLowerCase() === 'critical' ? '🔴' : 
                         f.severity?.toLowerCase() === 'high' ? '🟠' :
                         f.severity?.toLowerCase() === 'medium' ? '🟡' : '🟢'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm truncate">{f.title || f.description || 'Security Issue'}</h4>
                        <p className="text-xs text-gray-600 uppercase">{f.severity || 'Unknown'}</p>
                      </div>
                      <span className="text-gray-400 text-xl">🔒</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Unlock CTA */}
            {showEmailGate && !unlocked && (
              <div className="bg-yellow-50 border-2 border-yellow-600 rounded-xl p-8 text-center">
                <span className="text-5xl mb-4 block">🔓</span>
                <h3 className="text-2xl font-bold mb-2">Unlock Full Report</h3>
                <p className="text-gray-700 mb-6">
                  Get detailed fixes and step-by-step remediation for all {report.findings?.length || 0} vulnerabilities
                </p>
                <form onSubmit={handleEmailUnlock} className="max-w-md mx-auto">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none mb-3"
                  />
                  <button
                    type="submit"
                    className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                  >
                    Get Free Full Report
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* Details Tab */}
        {currentTab === 'details' && unlocked && report && (
          <div className="space-y-6">
            <div className="bg-green-50 border-2 border-green-600 rounded-xl p-6 text-center">
              <span className="text-5xl mb-3 block">✅</span>
              <h2 className="text-2xl font-bold">Report Unlocked!</h2>
              <p className="text-gray-600">Detailed remediation instructions below</p>
            </div>

            {report.summary && (
              <div className="bg-white border-2 border-gray-900 rounded-xl p-6">
                <h3 className="text-lg font-bold mb-3">Executive Summary</h3>
                <p className="text-gray-700 leading-relaxed">{report.summary}</p>
              </div>
            )}

            {report.findings && report.findings.length > 0 && (
              <div className="bg-white border-2 border-gray-900 rounded-xl p-6">
                <h3 className="text-lg font-bold mb-6">Detailed Remediation Guide</h3>
                <div className="space-y-6">
                  {report.findings.map((f, i) => (
                    <div key={i} className="p-5 border-2 border-gray-200 rounded-lg">
                      <div className="flex items-start gap-3 mb-4">
                        <span className="text-3xl">
                          {f.severity?.toLowerCase() === 'critical' ? '🔴' : 
                           f.severity?.toLowerCase() === 'high' ? '🟠' :
                           f.severity?.toLowerCase() === 'medium' ? '🟡' : '🟢'}
                        </span>
                        <div>
                          <h4 className="font-bold text-lg mb-1">{f.title || f.description || 'Security Issue'}</h4>
                          <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold uppercase">
                            {f.severity || 'Unknown'} Severity
                          </span>
                        </div>
                      </div>
                      <div className="space-y-3 pl-11">
                        <div>
                          <h5 className="font-semibold text-xs uppercase text-gray-600 mb-1">Description</h5>
                          <p className="text-sm text-gray-700">{f.description || f.title || 'Security vulnerability detected'}</p>
                        </div>
                        <div>
                          <h5 className="font-semibold text-xs uppercase text-gray-600 mb-1">Recommended Fix</h5>
                          <p className="text-sm text-gray-700">Implement proper input validation, sanitization, and security headers to prevent this vulnerability.</p>
                        </div>
                        <div>
                          <h5 className="font-semibold text-xs uppercase text-gray-600 mb-1">Priority</h5>
                          <p className="text-sm text-gray-700">
                            {f.severity?.toLowerCase() === 'critical' || f.severity?.toLowerCase() === 'high' 
                              ? 'Fix immediately before launch' 
                              : 'Address in next sprint'}
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

      {/* Footer */}
      <div className="border-t border-gray-200 mt-20">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center">
          <p className="text-sm text-gray-500">© 2025 VibeCode Audit</p>
        </div>
      </div>
    </div>
  );
}
