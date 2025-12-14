'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface ScanResponse {
  result?: { data?: { jobId?: string; status?: string } };
}

interface StatusResponse {
  result?: { data?: { status?: string; error?: string } };
}

interface Finding {
  type?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical' | string;
  evidence?: string;
  cwe?: string;
  recommendation?: string;
  // Legacy fields for backwards compatibility
  title?: string;
  description?: string;
}

interface DeepSecurity {
  overallScore?: number;
  securityCopyAnalysis?: {
    privacyPolicy?: { found: boolean; score: number };
    securityPage?: { found: boolean; score: number };
  };
  authenticationTesting?: {
    rateLimiting?: { protected: boolean };
    sessionManagement?: { secureCookies: boolean };
  };
  recommendations?: Array<{ priority: string; category: string; issue: string; fix: string }>;
}

interface VibeCodingVulnerabilities {
  overallRisk?: 'low' | 'medium' | 'high' | 'critical';
  score?: number;
  hardCodedSecrets?: Array<{ type: string; severity: string; evidence: string }>;
  clientSideAuth?: { detected: boolean; risk: string; authImplementation: string };
  unauthenticatedApiAccess?: Array<{ url: string; severity: string; dataType?: string; evidence: string }>;
  backendMisconfigurations?: Array<{ type: string; severity: string; evidence: string }>;
  recommendations?: Array<{ priority: string; category: string; issue: string; fix: string }>;
}

interface Report {
  score?: number;
  summary?: string;
  findings?: Finding[];
  techStack?: { framework?: string; hosting?: string };
  deepSecurity?: DeepSecurity;
  vibeCodingVulnerabilities?: VibeCodingVulnerabilities;
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
  const [expandedIssues, setExpandedIssues] = useState<Set<number>>(new Set());
  const [showAllIssues, setShowAllIssues] = useState(false);
  const [selectedSeverity, setSelectedSeverity] = useState<string | null>(null);

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

  // Get the actual issue title/name from backend
  const getIssueTitle = (finding: Finding) => {
    // Backend sends 'type' as the primary identifier
    if (finding.type) return finding.type;
    // Fallback to legacy 'title' field
    if (finding.title) return finding.title;
    return 'Security Issue';
  };

  // Get the actual description/evidence from backend
  const getIssueDescription = (finding: Finding) => {
    // Backend sends 'evidence' - this is the actual proof/description from the scan
    if (finding.evidence && finding.evidence.trim().length > 0) {
      return finding.evidence;
    }
    // Fallback to legacy 'description' field
    if (finding.description && finding.description.trim().length > 0) {
      return finding.description;
    }
    // Last resort fallback
    return `This ${finding.severity || 'security'} issue was detected in your application.`;
  };

  // Get the actual recommendation from backend
  const getIssueRecommendation = (finding: Finding) => {
    // Backend sends 'recommendation' - this is the actual fix instruction
    if (finding.recommendation && finding.recommendation.trim().length > 0) {
      return finding.recommendation;
    }
    // Fallback for when recommendation is missing
    return `Implement proper security measures to address this ${finding.severity || 'security'} issue. Check your platform documentation for specific steps.`;
  };

  // Get impact based on severity
  const getIssueImpact = (finding: Finding) => {
    const severity = finding.severity?.toLowerCase();
    if (severity === 'critical') {
      return 'This could expose user data, lead to legal issues, or shut down your app. Fix this immediately before launching.';
    }
    if (severity === 'high') {
      return 'This could cause data leaks, unexpected costs, or security breaches. Fix this before launching to real users.';
    }
    if (severity === 'medium') {
      return 'This could cause problems if exploited. Fix this soon to keep your app secure.';
    }
    return 'This is a minor issue, but fixing it will improve your app\'s security.';
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Top Banner */}
      <div className="bg-red-50 border-b border-red-100">
        <div className="max-w-4xl mx-auto px-4 py-3 text-center">
          <p className="text-sm text-gray-800">
            Get detailed security audit of your web app (<span className="font-bold text-red-600">free!</span>)
          </p>
        </div>
      </div>

      {/* Header */}
      <div className="border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900">VibeCode Security Audit</h1>
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
                    ? 'border-red-600 text-red-600'
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
                {/* Hero Section with Animated Steps */}
                <div className="text-center mb-20">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                  >
                    <h1 className="text-4xl md:text-6xl font-bold mb-6 text-gray-900">
                      Your app works. But is it<br />actually ready to launch?
                    </h1>
                    <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
                      You built it with AI. It looks great. Everything works. But if you haven't checked for security problems, 
                      you might be launching something that could break, leak data, or cost you thousands.
                    </p>
                  </motion.div>
                  
                  {/* Scan Form */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="max-w-lg mx-auto mb-16"
                  >
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="flex gap-3">
                        <input
                          type="text"
                          value={url}
                          onChange={(e) => setUrl(e.target.value)}
                          placeholder="your-app.com"
                          required
                          className="flex-1 px-6 py-4 border-2 border-gray-300 rounded-xl focus:border-red-500 focus:outline-none text-base shadow-sm"
                        />
                        <button
                          type="submit"
                          disabled={!url}
                          className="px-8 py-4 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg transition-colors shadow-lg"
                        >
                          Scan Now
                        </button>
                      </div>
                      <p className="text-sm text-gray-500">
                        Free • No credit card • Results in minutes
                      </p>
                    </form>
                  </motion.div>

                  {/* Animated How It Works Steps */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                  >
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-8">
                      How it works
                    </h3>
                    <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                      {[
                        {
                          icon: (
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                          ),
                          title: 'Enter URL',
                          description: 'Submit your website and start scanning',
                          delay: 0.5
                        },
                        {
                          icon: (
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          ),
                          title: 'AI Analysis',
                          description: 'We scan for security problems in minutes',
                          delay: 0.7
                        },
                        {
                          icon: (
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                          ),
                          title: 'Get Report',
                          description: 'See findings with step-by-step fixes',
                          delay: 0.9
                        }
                      ].map((step, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ 
                            duration: 0.5, 
                            delay: step.delay,
                            type: "spring",
                            stiffness: 100
                          }}
                          whileHover={{ scale: 1.05, y: -5 }}
                          className="relative"
                        >
                          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white shadow-lg">
                              {step.icon}
                            </div>
                            <h4 className="font-semibold text-gray-900 mb-2">{step.title}</h4>
                            <p className="text-sm text-gray-600">{step.description}</p>
                            {index < 2 && (
                              <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ delay: step.delay + 0.3, type: "spring" }}
                                  className="w-8 h-0.5 bg-gradient-to-r from-red-400 to-orange-400"
                                />
                                <motion.div
                                  initial={{ x: -10, opacity: 0 }}
                                  animate={{ x: 0, opacity: 1 }}
                                  transition={{ delay: step.delay + 0.5 }}
                                  className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-1/2"
                                >
                                  <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                  </svg>
                                </motion.div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                </div>

                {/* Landing Page Content */}
                <div className="mt-24 space-y-24">
                  {/* The 90% vs 20% Reality */}
                  <div className="text-center">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">
                      You think you're 90% done. Here's the reality:
                    </h2>
                    <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
                      Research shows <span className="font-semibold text-red-600">40%+ of AI-built apps leak user data</span>—names, emails, phone numbers. 
                      <span className="font-semibold"> 1 in 3 has critical security holes</span> that hackers can exploit in minutes.
                    </p>
                    <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto mt-12">
                      <div className="bg-red-50 rounded-2xl p-6">
                        <div className="text-5xl font-bold text-red-600 mb-2">40%+</div>
                        <p className="text-gray-700 font-medium">leak sensitive user data</p>
                        <p className="text-sm text-gray-600 mt-2">Without you knowing</p>
                      </div>
                      <div className="bg-red-50 rounded-2xl p-6">
                        <div className="text-5xl font-bold text-red-600 mb-2">1 in 3</div>
                        <p className="text-gray-700 font-medium">has critical security problems</p>
                        <p className="text-sm text-gray-600 mt-2">That could shut you down</p>
                      </div>
                      <div className="bg-red-50 rounded-2xl p-6">
                        <div className="text-5xl font-bold text-red-600 mb-2">$300+</div>
                        <p className="text-gray-700 font-medium">typical cost from one leak</p>
                        <p className="text-sm text-gray-600 mt-2">Before you even launch</p>
                      </div>
                    </div>
                  </div>

                  {/* Problem Section */}
                  <div className="max-w-3xl mx-auto">
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">
                      AI optimizes for "working," not "secure"
                    </h2>
                    <div className="space-y-4 text-lg text-gray-700 leading-relaxed">
                      <p>
                        You built your app with AI. It works. You're ready to launch.
                      </p>
                      <p>
                        But research from analyzing <span className="font-semibold text-red-600">2,000+ vulnerable apps</span> shows that 
                        <span className="font-semibold"> 40%+ leak sensitive data</span>—names, emails, phone numbers, financials. 
                        <span className="font-semibold"> 20% allow unrestricted database access</span> where anyone can view, create, edit, or delete records.
                      </p>
                      <p>
                        When Row Level Security (RLS) breaks features, AI "fixes" by disabling protection. When authentication is complex, 
                        AI suggests workarounds that expose your data. When secrets are needed, AI puts them in frontend builds where anyone can see them.
                      </p>
                      <p>
                        You don't need to become a security expert. You just need to find vulnerabilities before hackers do.
                      </p>
                    </div>
                  </div>

                  {/* What We Find */}
                  <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-3xl p-12">
                    <div className="max-w-3xl mx-auto">
                      <h2 className="text-3xl font-bold text-gray-900 mb-4">
                        What we check that you probably haven't
                      </h2>
                      <p className="text-lg text-gray-700 mb-8">
                        These are the things non-technical founders don't know to check—but hackers know to look for.
                      </p>
                      <div className="grid md:grid-cols-2 gap-6 text-gray-700">
                        <div className="space-y-4">
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                              <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 mb-1">Data Leakage</p>
                              <p className="text-sm">Public databases, missing RLS, anonymous access</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                              <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                              </svg>
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 mb-1">Exposed Secrets</p>
                              <p className="text-sm">API keys in frontend, .env files in production</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                              <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                              </svg>
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 mb-1">Auth Bypasses</p>
                              <p className="text-sm">Weak authentication, exposed admin panels</p>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                              <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                              </svg>
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 mb-1">Missing Validation</p>
                              <p className="text-sm">No CSRF, XSS protection, input sanitization</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                              <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                              </svg>
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 mb-1">CORS Issues</p>
                              <p className="text-sm">APIs accepting requests from any origin</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                              <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                              </svg>
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 mb-1">Architecture Gaps</p>
                              <p className="text-sm">Client-side logic, schema exposure</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* How It Works - Detailed */}
                  <div className="max-w-3xl mx-auto">
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">
                      We check everything you don't know to check
                    </h2>
                    <div className="space-y-4 text-lg text-gray-700 leading-relaxed">
                      <p>
                        You don't need to understand authentication flows or database security. We do. Our scanner checks everything 
                        in minutes: Can anyone access your database without logging in? Are your API keys visible in the frontend? 
                        Can users see other users' data? Is your admin panel protected?
                      </p>
                      <p>
                        Every issue we find comes with <span className="font-semibold">plain English explanations</span> and 
                        <span className="font-semibold"> step-by-step fixes</span> you can follow—even if you've never written code.
                      </p>
                      <p>
                        We know the specific security problems each AI builder creates. Lovable leaves databases wide open. 
                        Bolt exposes secrets. Replit bypasses security checks. We check for all of them.
                      </p>
                      <p className="font-semibold text-gray-900 mt-6">
                        The question isn't whether your app has problems. The question is: do you want to find them before they find you?
                      </p>
                    </div>
                  </div>

                  {/* The Cost of Waiting */}
                  <div className="bg-gradient-to-br from-red-600 to-red-700 text-white rounded-3xl p-12">
                    <div className="max-w-3xl mx-auto text-center">
                      <h2 className="text-3xl font-bold mb-6">
                        The cost of waiting
                      </h2>
                      <div className="space-y-4 text-lg text-red-50 leading-relaxed">
                        <p>
                          Unchecked security problems lead to data leaks, <span className="font-semibold">$300+ bills from exposed API keys</span>, 
                          database breaches, regulatory violations, and reputation damage.
                        </p>
                        <p>
                          <span className="font-semibold">2,000+ vulnerable apps</span> have been identified in recent research. 
                          Platforms like Lovable, Bolt, Replit, and Cursor all have documented security issues.
                        </p>
                        <p>
                          Most founders spend $10K-$50K learning this the hard way after a security incident. 
                          You can verify security for free, before you launch.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Final CTA */}
                  <div className="text-center max-w-2xl mx-auto">
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">
                      Find out what could go wrong before you launch
                    </h2>
                    <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                      You built something amazing. Don't let security problems you didn't know existed ruin your launch. 
                      Get a free security check. See exactly what needs fixing. Get step-by-step instructions to fix it.
                    </p>
                    <p className="text-base text-gray-500 mb-8">
                      No technical knowledge required. No credit card. Just enter your URL and get your report in minutes.
                    </p>
                    <button
                      onClick={() => {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                        setTimeout(() => {
                          const urlInput = document.querySelector('input[type="text"]') as HTMLInputElement;
                          if (urlInput) {
                            urlInput.focus();
                          }
                        }, 500);
                      }}
                      className="px-8 py-4 bg-red-600 text-white rounded-xl hover:bg-red-700 font-semibold text-lg transition-colors shadow-lg"
                    >
                      Check My App Now →
                    </button>
                    <p className="text-sm text-gray-500 mt-4">
                      100% free • No credit card • Results in minutes
                    </p>
                  </div>
                </div>
              </>
            )}

            {loading && (
              <div className="bg-white border-2 border-gray-900 rounded-xl p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-red-600 border-t-transparent mb-6"></div>
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
          <div className="space-y-8 max-w-4xl mx-auto">
            {/* Score Card - Compact */}
            <div className="bg-gradient-to-br from-red-600 to-red-700 text-white rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider opacity-90 mb-1">Security Score</p>
                  <div className="text-4xl font-bold">
                    {report.score || 0}<span className="text-2xl opacity-75">/10</span>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="text-center">
                    <div className="text-xl font-bold">{report.findings?.length || 0}</div>
                    <div className="text-xs opacity-90">Issues</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold">{criticalFindings.length}</div>
                    <div className="text-xs opacity-90">Critical</div>
                  </div>
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
                      <h4 className="font-semibold mb-1">{getIssueTitle(f)}</h4>
                      <p className="text-sm text-red-700 uppercase font-semibold">{f.severity} SEVERITY</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All Issues - Always Expanded with Filters */}
            {report.findings && report.findings.length > 0 && (
              <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">
                    All Issues ({report.findings.length})
                  </h3>
                </div>

                {/* Severity Filter */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <button
                    onClick={() => setSelectedSeverity(null)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      selectedSeverity === null
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All
                  </button>
                  {['critical', 'high', 'medium', 'low'].map((sev) => {
                    const count = report.findings!.filter(f => f.severity?.toLowerCase() === sev).length;
                    if (count === 0) return null;
                    return (
                      <button
                        key={sev}
                        onClick={() => setSelectedSeverity(sev)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
                          selectedSeverity === sev
                            ? sev === 'critical' ? 'bg-red-600 text-white' :
                              sev === 'high' ? 'bg-orange-600 text-white' :
                              sev === 'medium' ? 'bg-yellow-500 text-white' :
                              'bg-green-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {sev} ({count})
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-3">
                  {report.findings
                    .filter(f => !selectedSeverity || f.severity?.toLowerCase() === selectedSeverity)
                    .map((f, i) => {
                      const severityColor = f.severity?.toLowerCase() === 'critical' ? 'red' :
                        f.severity?.toLowerCase() === 'high' ? 'orange' :
                        f.severity?.toLowerCase() === 'medium' ? 'yellow' : 'green';
                      
                      return (
                        <div key={i} className={`border-2 rounded-lg p-4 ${
                          severityColor === 'red' ? 'border-red-200 bg-red-50' :
                          severityColor === 'orange' ? 'border-orange-200 bg-orange-50' :
                          severityColor === 'yellow' ? 'border-yellow-200 bg-yellow-50' :
                          'border-green-200 bg-green-50'
                        }`}>
                          <div className="flex items-start gap-3">
                            <div className={`flex-shrink-0 w-3 h-3 rounded-full mt-1.5 ${
                              severityColor === 'red' ? 'bg-red-600' :
                              severityColor === 'orange' ? 'bg-orange-600' :
                              severityColor === 'yellow' ? 'bg-yellow-500' :
                              'bg-green-600'
                            }`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <h4 className="font-semibold text-gray-900">{getIssueTitle(f)}</h4>
                                <span className={`text-xs px-2 py-0.5 rounded uppercase font-medium flex-shrink-0 ${
                                  severityColor === 'red' ? 'bg-red-200 text-red-800' :
                                  severityColor === 'orange' ? 'bg-orange-200 text-orange-800' :
                                  severityColor === 'yellow' ? 'bg-yellow-200 text-yellow-800' :
                                  'bg-green-200 text-green-800'
                                }`}>
                                  {f.severity || 'Unknown'}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700 mb-3">{getIssueDescription(f)}</p>
                              {f.recommendation && (
                                <div className="pt-3 border-t border-gray-200">
                                  <p className="text-xs font-semibold text-gray-600 mb-1">How to fix:</p>
                                  <p className="text-sm text-gray-700">{getIssueRecommendation(f)}</p>
                                </div>
                              )}
                              {f.cwe && (
                                <p className="text-xs text-gray-500 mt-2">CWE: {f.cwe}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Tech Stack - Context */}
            {report.techStack && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-bold mb-3 text-gray-900">Detected Technologies</h3>
                <p className="text-sm text-gray-600 mb-4">We detected these technologies in your app. Some security issues are specific to certain platforms.</p>
                <div className="flex flex-wrap gap-2">
                  {report.techStack.framework && (
                    <span className="px-4 py-2 bg-white border border-gray-300 rounded-lg font-semibold text-sm text-gray-700">
                      {report.techStack.framework}
                    </span>
                  )}
                  {report.techStack.hosting && (
                    <span className="px-4 py-2 bg-white border border-gray-300 rounded-lg font-semibold text-sm text-gray-700">
                      {report.techStack.hosting}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Deep Security Analysis */}
            {report.deepSecurity && (
              <div className="bg-white border-2 border-blue-200 rounded-xl p-6 shadow-lg">
                <h3 className="text-xl font-bold mb-4 text-gray-900 flex items-center gap-2">
                  <span>🛡️</span>
                  <span>Deep Security Analysis</span>
                  <span className="text-lg text-gray-500">({report.deepSecurity.overallScore || 0}/100)</span>
                </h3>
                
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm font-semibold text-gray-700 mb-1">Privacy Policy</p>
                    <p className="text-lg font-bold">{report.deepSecurity.securityCopyAnalysis?.privacyPolicy?.found ? '✅ Found' : '❌ Not Found'}</p>
                    {report.deepSecurity.securityCopyAnalysis?.privacyPolicy?.score !== undefined && (
                      <p className="text-xs text-gray-600">Score: {report.deepSecurity.securityCopyAnalysis.privacyPolicy.score}/100</p>
                    )}
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm font-semibold text-gray-700 mb-1">Security Page</p>
                    <p className="text-lg font-bold">{report.deepSecurity.securityCopyAnalysis?.securityPage?.found ? '✅ Found' : '❌ Not Found'}</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm font-semibold text-gray-700 mb-1">Secure Cookies</p>
                    <p className="text-lg font-bold">{report.deepSecurity.authenticationTesting?.sessionManagement?.secureCookies ? '✅ Yes' : '❌ No'}</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm font-semibold text-gray-700 mb-1">Rate Limiting</p>
                    <p className="text-lg font-bold">{report.deepSecurity.authenticationTesting?.rateLimiting?.protected ? '✅ Protected' : '⚠️ Not Tested'}</p>
                  </div>
                </div>

                {report.deepSecurity.recommendations && report.deepSecurity.recommendations.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-2">Key Recommendations:</h4>
                    <div className="space-y-2">
                      {report.deepSecurity.recommendations.slice(0, 3).map((rec, i) => (
                        <div key={i} className="text-sm">
                          <span className={`font-semibold ${
                            rec.priority === 'critical' ? 'text-red-600' :
                            rec.priority === 'high' ? 'text-orange-600' :
                            'text-gray-700'
                          }`}>
                            [{rec.priority.toUpperCase()}]
                          </span>
                          <span className="text-gray-700"> {rec.issue}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Vibe-Coding Vulnerabilities */}
            {report.vibeCodingVulnerabilities && (
              <div className="bg-white border-2 border-purple-200 rounded-xl p-6 shadow-lg">
                <h3 className="text-xl font-bold mb-4 text-gray-900 flex items-center gap-2">
                  <span>🔍</span>
                  <span>Vibe-Coding Vulnerability Scan</span>
                  <span className={`text-lg font-bold ${
                    report.vibeCodingVulnerabilities.overallRisk === 'critical' ? 'text-red-600' :
                    report.vibeCodingVulnerabilities.overallRisk === 'high' ? 'text-orange-600' :
                    report.vibeCodingVulnerabilities.overallRisk === 'medium' ? 'text-yellow-600' :
                    'text-green-600'
                  }`}>
                    ({report.vibeCodingVulnerabilities.overallRisk?.toUpperCase() || 'N/A'})
                  </span>
                  <span className="text-lg text-gray-500">({report.vibeCodingVulnerabilities.score || 0}/100)</span>
                </h3>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-purple-50 rounded-lg p-4">
                    <p className="text-sm font-semibold text-gray-700 mb-1">Hard-Coded Secrets</p>
                    <p className="text-2xl font-bold text-purple-600">{report.vibeCodingVulnerabilities.hardCodedSecrets?.length || 0}</p>
                    <p className="text-xs text-gray-600">Found in JS bundles</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <p className="text-sm font-semibold text-gray-700 mb-1">Client-Side Auth</p>
                    <p className="text-lg font-bold">{report.vibeCodingVulnerabilities.clientSideAuth?.detected ? '⚠️ Detected' : '✅ Server-Side'}</p>
                    {report.vibeCodingVulnerabilities.clientSideAuth && (
                      <p className="text-xs text-gray-600">Risk: {report.vibeCodingVulnerabilities.clientSideAuth.risk}</p>
                    )}
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <p className="text-sm font-semibold text-gray-700 mb-1">Unauthenticated APIs</p>
                    <p className="text-2xl font-bold text-purple-600">{report.vibeCodingVulnerabilities.unauthenticatedApiAccess?.length || 0}</p>
                    <p className="text-xs text-gray-600">Endpoints exposing data</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <p className="text-sm font-semibold text-gray-700 mb-1">Backend Misconfigs</p>
                    <p className="text-2xl font-bold text-purple-600">{report.vibeCodingVulnerabilities.backendMisconfigurations?.length || 0}</p>
                    <p className="text-xs text-gray-600">Security issues</p>
                  </div>
                </div>

                {/* Hard-Coded Secrets List */}
                {report.vibeCodingVulnerabilities.hardCodedSecrets && report.vibeCodingVulnerabilities.hardCodedSecrets.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="font-semibold text-red-600 mb-2">🚨 Hard-Coded Secrets Found:</h4>
                    <div className="space-y-2">
                      {report.vibeCodingVulnerabilities.hardCodedSecrets.slice(0, 5).map((secret, i) => (
                        <div key={i} className="bg-red-50 border border-red-200 rounded-lg p-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-semibold text-red-800">{secret.type}</p>
                              <p className="text-sm text-gray-700">{secret.evidence}</p>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded uppercase font-medium ${
                              secret.severity === 'critical' ? 'bg-red-200 text-red-800' :
                              secret.severity === 'high' ? 'bg-orange-200 text-orange-800' :
                              'bg-yellow-200 text-yellow-800'
                            }`}>
                              {secret.severity}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Unauthenticated API Endpoints */}
                {report.vibeCodingVulnerabilities.unauthenticatedApiAccess && report.vibeCodingVulnerabilities.unauthenticatedApiAccess.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="font-semibold text-orange-600 mb-2">⚠️ Unauthenticated API Endpoints:</h4>
                    <div className="space-y-2">
                      {report.vibeCodingVulnerabilities.unauthenticatedApiAccess.slice(0, 5).map((endpoint, i) => (
                        <div key={i} className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-orange-800 break-all">{endpoint.url}</p>
                              <p className="text-sm text-gray-700">{endpoint.evidence}</p>
                              {endpoint.dataType && (
                                <p className="text-xs text-gray-600 mt-1">Data Type: {endpoint.dataType}</p>
                              )}
                            </div>
                            <span className={`text-xs px-2 py-1 rounded uppercase font-medium flex-shrink-0 ml-2 ${
                              endpoint.severity === 'critical' ? 'bg-red-200 text-red-800' :
                              endpoint.severity === 'high' ? 'bg-orange-200 text-orange-800' :
                              'bg-yellow-200 text-yellow-800'
                            }`}>
                              {endpoint.severity}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {report.vibeCodingVulnerabilities.recommendations && report.vibeCodingVulnerabilities.recommendations.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-2">Recommendations:</h4>
                    <div className="space-y-2">
                      {report.vibeCodingVulnerabilities.recommendations.slice(0, 5).map((rec, i) => (
                        <div key={i} className="text-sm">
                          <span className={`font-semibold ${
                            rec.priority === 'critical' ? 'text-red-600' :
                            rec.priority === 'high' ? 'text-orange-600' :
                            'text-gray-700'
                          }`}>
                            [{rec.priority.toUpperCase()}]
                          </span>
                          <span className="text-gray-700"> {rec.category}: {rec.issue}</span>
                          <p className="text-xs text-gray-600 ml-6 mt-1">Fix: {rec.fix}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Level 5: Unlock Detailed Fixes */}
            {showEmailGate && !unlocked && (
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-400 rounded-2xl p-8 text-center shadow-lg">
                <div className="w-16 h-16 bg-yellow-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-2 text-gray-900">Get Step-by-Step Fix Instructions</h3>
                <p className="text-gray-700 mb-2 max-w-md mx-auto">
                  You've seen what's wrong. Now get detailed, plain-English instructions on how to fix each problem.
                </p>
                <p className="text-sm text-gray-600 mb-6">
                  We'll send you a complete remediation guide with platform-specific fixes for all {report.findings?.length || 0} issues.
                </p>
                <form onSubmit={handleEmailUnlock} className="max-w-md mx-auto">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-red-500 focus:outline-none mb-3 text-base"
                  />
                  <button
                    type="submit"
                    className="w-full px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 font-semibold text-lg transition-colors shadow-lg"
                  >
                    Get Free Fix Instructions →
                  </button>
                  <p className="text-xs text-gray-500 mt-3">100% free • No spam • Unlock instantly</p>
                </form>
              </div>
            )}
          </div>
        )}

        {/* Details Tab */}
        {currentTab === 'details' && unlocked && report && (
          <div className="space-y-6 max-w-4xl mx-auto">
            {report.summary && (
              <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-lg">
                <h3 className="text-lg font-bold mb-3 text-gray-900">Summary</h3>
                <p className="text-gray-700 leading-relaxed">{report.summary}</p>
              </div>
            )}

            {/* Deep Security Analysis - Full Details */}
            {report.deepSecurity && (
              <div className="bg-white border-2 border-blue-200 rounded-xl p-6 shadow-lg">
                <h3 className="text-xl font-bold mb-4 text-gray-900 flex items-center gap-2">
                  <span>🛡️</span>
                  <span>Deep Security Analysis</span>
                  <span className="text-lg text-gray-500">({report.deepSecurity.overallScore || 0}/100)</span>
                </h3>
                
                {report.deepSecurity.recommendations && report.deepSecurity.recommendations.length > 0 && (
                  <div className="space-y-3">
                    {report.deepSecurity.recommendations.map((rec, i) => (
                      <div key={i} className={`border-l-4 pl-4 py-2 ${
                        rec.priority === 'critical' ? 'border-red-500 bg-red-50' :
                        rec.priority === 'high' ? 'border-orange-500 bg-orange-50' :
                        'border-yellow-500 bg-yellow-50'
                      }`}>
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className={`font-semibold ${
                            rec.priority === 'critical' ? 'text-red-700' :
                            rec.priority === 'high' ? 'text-orange-700' :
                            'text-yellow-700'
                          }`}>
                            [{rec.priority.toUpperCase()}] {rec.category}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mb-1">{rec.issue}</p>
                        <p className="text-sm font-medium text-gray-900">Fix: {rec.fix}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Vibe-Coding Vulnerabilities - Full Details */}
            {report.vibeCodingVulnerabilities && (
              <div className="bg-white border-2 border-purple-200 rounded-xl p-6 shadow-lg">
                <h3 className="text-xl font-bold mb-4 text-gray-900 flex items-center gap-2">
                  <span>🔍</span>
                  <span>Vibe-Coding Vulnerability Scan</span>
                  <span className={`text-lg font-bold ${
                    report.vibeCodingVulnerabilities.overallRisk === 'critical' ? 'text-red-600' :
                    report.vibeCodingVulnerabilities.overallRisk === 'high' ? 'text-orange-600' :
                    report.vibeCodingVulnerabilities.overallRisk === 'medium' ? 'text-yellow-600' :
                    'text-green-600'
                  }`}>
                    ({report.vibeCodingVulnerabilities.overallRisk?.toUpperCase() || 'N/A'})
                  </span>
                </h3>

                {report.vibeCodingVulnerabilities.hardCodedSecrets && report.vibeCodingVulnerabilities.hardCodedSecrets.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-semibold text-red-600 mb-3">🚨 Hard-Coded Secrets ({report.vibeCodingVulnerabilities.hardCodedSecrets.length})</h4>
                    <div className="space-y-2">
                      {report.vibeCodingVulnerabilities.hardCodedSecrets.map((secret, i) => (
                        <div key={i} className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-semibold text-red-800">{secret.type}</p>
                              <p className="text-sm text-gray-700 mt-1">{secret.evidence}</p>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded uppercase font-medium ${
                              secret.severity === 'critical' ? 'bg-red-200 text-red-800' :
                              secret.severity === 'high' ? 'bg-orange-200 text-orange-800' :
                              'bg-yellow-200 text-yellow-800'
                            }`}>
                              {secret.severity}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {report.vibeCodingVulnerabilities.unauthenticatedApiAccess && report.vibeCodingVulnerabilities.unauthenticatedApiAccess.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-semibold text-orange-600 mb-3">⚠️ Unauthenticated API Endpoints ({report.vibeCodingVulnerabilities.unauthenticatedApiAccess.length})</h4>
                    <div className="space-y-2">
                      {report.vibeCodingVulnerabilities.unauthenticatedApiAccess.map((endpoint, i) => (
                        <div key={i} className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-orange-800 break-all">{endpoint.url}</p>
                              <p className="text-sm text-gray-700 mt-1">{endpoint.evidence}</p>
                              {endpoint.dataType && (
                                <p className="text-xs text-gray-600 mt-1">Data Type: {endpoint.dataType}</p>
                              )}
                            </div>
                            <span className={`text-xs px-2 py-1 rounded uppercase font-medium flex-shrink-0 ml-2 ${
                              endpoint.severity === 'critical' ? 'bg-red-200 text-red-800' :
                              endpoint.severity === 'high' ? 'bg-orange-200 text-orange-800' :
                              'bg-yellow-200 text-yellow-800'
                            }`}>
                              {endpoint.severity}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {report.vibeCodingVulnerabilities.recommendations && report.vibeCodingVulnerabilities.recommendations.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Recommendations ({report.vibeCodingVulnerabilities.recommendations.length})</h4>
                    <div className="space-y-3">
                      {report.vibeCodingVulnerabilities.recommendations.map((rec, i) => (
                        <div key={i} className={`border-l-4 pl-4 py-2 ${
                          rec.priority === 'critical' ? 'border-red-500 bg-red-50' :
                          rec.priority === 'high' ? 'border-orange-500 bg-orange-50' :
                          'border-yellow-500 bg-yellow-50'
                        }`}>
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <span className={`font-semibold ${
                              rec.priority === 'critical' ? 'text-red-700' :
                              rec.priority === 'high' ? 'text-orange-700' :
                              'text-yellow-700'
                            }`}>
                              [{rec.priority.toUpperCase()}] {rec.category}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 mb-1">{rec.issue}</p>
                          <p className="text-sm font-medium text-gray-900">Fix: {rec.fix}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {report.findings && report.findings.length > 0 && (
              <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-lg">
                <h3 className="text-xl font-bold mb-4 text-gray-900">Basic Security Findings</h3>
                <div className="space-y-4">
                  {report.findings
                    .sort((a, b) => {
                      const order = { critical: 0, high: 1, medium: 2, low: 3 };
                      return (order[a.severity?.toLowerCase() as keyof typeof order] ?? 99) - 
                             (order[b.severity?.toLowerCase() as keyof typeof order] ?? 99);
                    })
                    .map((f, i) => {
                      const severityColor = f.severity?.toLowerCase() === 'critical' ? 'red' :
                        f.severity?.toLowerCase() === 'high' ? 'orange' :
                        f.severity?.toLowerCase() === 'medium' ? 'yellow' : 'green';
                      
                      return (
                        <div key={i} className={`border-2 rounded-lg p-4 ${
                          severityColor === 'red' ? 'border-red-200 bg-red-50' :
                          severityColor === 'orange' ? 'border-orange-200 bg-orange-50' :
                          severityColor === 'yellow' ? 'border-yellow-200 bg-yellow-50' :
                          'border-green-200 bg-green-50'
                        }`}>
                          <div className="flex items-start gap-3 mb-3">
                            <div className={`flex-shrink-0 w-3 h-3 rounded-full mt-1.5 ${
                              severityColor === 'red' ? 'bg-red-600' :
                              severityColor === 'orange' ? 'bg-orange-600' :
                              severityColor === 'yellow' ? 'bg-yellow-500' :
                              'bg-green-600'
                            }`} />
                            <div className="flex-1">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <h4 className="font-bold text-gray-900">{getIssueTitle(f)}</h4>
                                <span className={`text-xs px-2 py-0.5 rounded uppercase font-medium flex-shrink-0 ${
                                  severityColor === 'red' ? 'bg-red-200 text-red-800' :
                                  severityColor === 'orange' ? 'bg-orange-200 text-orange-800' :
                                  severityColor === 'yellow' ? 'bg-yellow-200 text-yellow-800' :
                                  'bg-green-200 text-green-800'
                                }`}>
                                  {f.severity || 'Unknown'}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700 mb-3">{getIssueDescription(f)}</p>
                              {f.recommendation && (
                                <div className="pt-3 border-t border-gray-200">
                                  <p className="text-xs font-semibold text-gray-600 mb-1">How to fix:</p>
                                  <p className="text-sm text-gray-700">{getIssueRecommendation(f)}</p>
                                </div>
                              )}
                              {f.cwe && (
                                <p className="text-xs text-gray-500 mt-2">CWE: {f.cwe}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 mt-20">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex flex-wrap justify-center items-center gap-6 mb-3">
            <a href="/privacy" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Privacy Policy</a>
            <a href="/security" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Security</a>
            <a href="mailto:security@vibecodeaudit.app" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Contact</a>
          </div>
          <p className="text-sm text-gray-500 text-center">© 2025 VibeCode Audit</p>
        </div>
      </div>
    </div>
  );
}
