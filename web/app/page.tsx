/**
 * Main page orchestrator
 * Dependencies: React, components, hooks
 * Purpose: Orchestrate scan, report, and landing page views
 */
'use client';

import { useState, useEffect } from 'react';
import type { Report } from './types';
import { useScanStatus } from './hooks/useScanStatus';
import { useReport } from './hooks/useReport';
import LandingHero from './components/landing/LandingHero';
import LandingContent from './components/landing/LandingContent';
import ScanStatus from './components/scan/ScanStatus';
import ReportSummary from './components/report/ReportSummary';
import FindingsList from './components/report/FindingsList';
import EmailGate from './components/email/EmailGate';
import VerificationGate from './components/email/VerificationGate';
import WarRoomTerminal from './components/scan/WarRoomTerminal';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://vibecode-audit-production.up.railway.app';

export default function Home() {
  const [url, setUrl] = useState('');
  const [jobId, setJobId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEmailGate, setShowEmailGate] = useState(false);
  const [showVerificationGate, setShowVerificationGate] = useState(false);
  const [capturedEmail, setCapturedEmail] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [currentTab, setCurrentTab] = useState<'scan' | 'results' | 'details'>('scan');
  
  const { report, preview, fetchReport, verifyAccessToken, setReport } = useReport();
  const { status, progress, currentStage, stageMessage, error: statusError, isLoading: isStatusLoading } = useScanStatus(
    jobId,
    async (id: string) => {
      setLoading(false);
      await fetchReport(id);
      setShowEmailGate(true);
      setCurrentTab('results');
    }
  );

  useEffect(() => {
    if (isStatusLoading) {
      setLoading(true);
    }
  }, [isStatusLoading]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const urlJobId = params.get('jobId');
    
    if (token && urlJobId) {
      setJobId(urlJobId);
      verifyAccessToken(urlJobId, token).then(() => {
        setUnlocked(true);
        setShowEmailGate(false);
        setCurrentTab('details');
      });
    }
  }, [verifyAccessToken]);

  const handleSubmit = async (urlInput: string) => {
    setLoading(true);
    setError(null);
    setReport(null);
    setShowEmailGate(false);
    setUnlocked(false);
    setCurrentTab('scan');
    setUrl(urlInput);

    try {
      const res = await fetch(`${API_URL}/api/trpc/scan.submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput }),
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
      
      const data = await res.json();
      const newJobId = data.result?.data?.jobId;
      
      if (!newJobId) throw new Error('No jobId in response');
      
      setJobId(newJobId);
      setLoading(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submit failed');
      setLoading(false);
    }
  };

  const handleEmailSubmit = (email: string) => {
    setCapturedEmail(email);
    setShowEmailGate(false);
    setShowVerificationGate(true);
  };

  const handleVerified = (accessToken: string) => {
    setUnlocked(true);
    setShowVerificationGate(false);
    setCurrentTab('details');
    window.history.replaceState({}, '', `/?jobId=${jobId}&token=${accessToken}`);
  };

  const handleEmailSent = () => {
    setEmailSent(true);
  };

  const downloadReport = () => {
    if (!report) return;
    const reportData = {
      url: report.url || url,
      timestamp: report.timestamp || new Date().toISOString(),
      score: report.score,
      summary: report.summary,
      findings: report.findings || [],
      recommendations: report.recommendations || [],
      techStack: report.techStack,
      deepSecurity: report.deepSecurity,
      vibeCodingVulnerabilities: report.vibeCodingVulnerabilities,
    };
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `security-audit-${report.url?.replace(/https?:\/\//, '').replace(/\//g, '-') || 'report'}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(downloadUrl);
  };

  const criticalFindings = report?.findings?.filter(f => 
    f.severity?.toLowerCase() === 'critical' || f.severity?.toLowerCase() === 'high'
  ).slice(0, 3) || [];

  const displayError = error || statusError;

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-red-50 border-b border-red-100">
        <div className="max-w-4xl mx-auto px-4 py-3 text-center">
          <p className="text-sm text-gray-800">
            Get detailed security audit of your web app (<span className="font-bold text-red-600">free!</span>)
          </p>
        </div>
      </div>

      <div className="border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900">VibeCode Security Audit</h1>
        </div>
      </div>

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
                <>
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
                  <button
                    onClick={downloadReport}
                    className="ml-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold text-sm transition-colors"
                  >
                    Download Report
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-8">
        {currentTab === 'scan' && (
          <div className="max-w-2xl mx-auto">
            {!loading && !report && (
              <>
                <LandingHero onSubmit={handleSubmit} loading={loading} error={displayError} />
                <LandingContent />
              </>
            )}

            {loading && (
              <WarRoomTerminal 
                jobId={jobId}
                status={status}
                progress={progress}
                currentStage={currentStage}
                stageMessage={stageMessage}
              />
            )}

            {displayError && (
              <div className="bg-red-50 border-2 border-red-600 text-red-800 px-6 py-4 rounded-xl">
                <span className="font-semibold">Error:</span> {displayError}
              </div>
            )}
          </div>
        )}

        {currentTab === 'results' && (preview || report) && (
          <div className="space-y-8 max-w-4xl mx-auto">
            <ReportSummary 
              report={report}
              preview={preview}
              criticalCount={criticalFindings.length}
              totalIssues={preview?.findingsSummary?.total || report?.findings?.length || 0}
            />

            {preview && !unlocked && (
              <>
                <div className="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <span>🔍</span>
                    <span>Security Issues Found</span>
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="bg-white rounded-lg p-4 text-center">
                      <div className="text-3xl font-bold text-red-600">{preview.findingsSummary?.critical || 0}</div>
                      <div className="text-sm text-gray-600">Critical</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 text-center">
                      <div className="text-3xl font-bold text-orange-600">{preview.findingsSummary?.high || 0}</div>
                      <div className="text-sm text-gray-600">High</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 text-center">
                      <div className="text-3xl font-bold text-yellow-600">{preview.findingsSummary?.medium || 0}</div>
                      <div className="text-sm text-gray-600">Medium</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 text-center">
                      <div className="text-3xl font-bold text-green-600">{preview.findingsSummary?.low || 0}</div>
                      <div className="text-sm text-gray-600">Low</div>
                    </div>
                  </div>

                  {preview.previewSummary ? (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-5 mb-4">
                      <p className="text-gray-800 leading-relaxed text-base font-medium">
                        {preview.previewSummary}
                      </p>
                    </div>
                  ) : (
                    <p className="text-gray-700 mb-4">
                      We found <strong>{preview.findingsSummary?.total || 0} security issues</strong> in your application,
                      including <strong>{preview.findingsSummary?.critical || 0} critical</strong> and{' '}
                      <strong>{preview.findingsSummary?.high || 0} high-severity</strong> problems.
                    </p>
                  )}

                  {preview.findingsSummary?.preview && preview.findingsSummary.preview.length > 0 && (
                    <div className="space-y-2 mb-4">
                      <p className="font-semibold text-gray-900">Issues include:</p>
                      <ul className="space-y-1">
                        {preview.findingsSummary.preview.map((f: any, i: number) => (
                          <li key={i} className="flex items-center gap-2 text-gray-700">
                            <span className={`w-2 h-2 rounded-full ${
                              f.severity === 'critical' ? 'bg-red-600' :
                              f.severity === 'high' ? 'bg-orange-600' :
                              f.severity === 'medium' ? 'bg-yellow-500' : 'bg-green-600'
                            }`} />
                            <span className="font-medium">{f.type}</span>
                            <span className="text-xs px-2 py-0.5 rounded uppercase bg-gray-200 text-gray-700">
                              {f.severity}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {preview && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mt-4">
                      <p className="font-semibold text-purple-900 mb-2">🔍 Vibe-Coding Analysis:</p>
                      {preview.vibeCodingSummary ? (
                        <>
                          {(preview.vibeCodingSummary.secretsCount > 0 || 
                            preview.vibeCodingSummary.clientSideAuthDetected || 
                            preview.vibeCodingSummary.unauthenticatedApisCount > 0 || 
                            preview.vibeCodingSummary.misconfigurationsCount > 0) ? (
                            <ul className="space-y-1 text-sm text-gray-700">
                              {preview.vibeCodingSummary.secretsCount > 0 && (
                                <li>• {preview.vibeCodingSummary.secretsCount} hard-coded secret(s) in frontend</li>
                              )}
                              {preview.vibeCodingSummary.clientSideAuthDetected && (
                                <li>• Client-side authentication detected</li>
                              )}
                              {preview.vibeCodingSummary.unauthenticatedApisCount > 0 && (
                                <li>• {preview.vibeCodingSummary.unauthenticatedApisCount} unauthenticated API endpoint(s)</li>
                              )}
                              {preview.vibeCodingSummary.misconfigurationsCount > 0 && (
                                <li>• {preview.vibeCodingSummary.misconfigurationsCount} backend misconfiguration(s)</li>
                              )}
                            </ul>
                          ) : (
                            <p className="text-sm text-gray-600">No vibe-coding vulnerabilities detected</p>
                          )}
                          {preview.vibeCodingSummary.overallRisk && (
                            <p className="text-xs text-gray-500 mt-2">
                              Risk Level: <span className="font-semibold">{preview.vibeCodingSummary.overallRisk.toUpperCase()}</span>
                              {preview.vibeCodingSummary.score !== undefined && (
                                <span> • Score: {preview.vibeCodingSummary.score}/10</span>
                              )}
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-sm text-gray-600">Analysis in progress...</p>
                      )}
                    </div>
                  )}
                </div>

                {showEmailGate && !showVerificationGate && jobId && (
                  <EmailGate
                    jobId={jobId}
                    url={preview?.url || url}
                    issuesFound={preview.findingsSummary?.total || 0}
                    onUnlock={(email) => handleEmailSubmit(email)}
                    onEmailSent={handleEmailSent}
                  />
                )}

                {showVerificationGate && capturedEmail && jobId && (
                  <VerificationGate
                    jobId={jobId}
                    email={capturedEmail}
                    url={preview?.url || url}
                    onVerified={handleVerified}
                  />
                )}
              </>
            )}

            {unlocked && report && (
              <FindingsList report={report} />
            )}
              </div>
            )}

        {currentTab === 'details' && unlocked && report && (
          <div className="space-y-6 max-w-4xl mx-auto">
            {report.summary && (
              <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-lg">
                <h3 className="text-lg font-bold mb-3 text-gray-900">Summary</h3>
                <p className="text-gray-700 leading-relaxed">{report.summary}</p>
              </div>
            )}

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

                {(report as any).breachNews && (report as any).breachNews.length > 0 && (
                  <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r">
                    <h4 className="font-semibold text-yellow-900 mb-2">📰 Recent Breaches You Should Know About</h4>
                    <ul className="space-y-2 text-sm text-gray-700">
                      {(report as any).breachNews.map((item: string, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-yellow-600 mt-0.5">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs text-gray-600 mt-3">Updated daily from security news feeds</p>
                  </div>
                )}

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

                {report.vibeCodingVulnerabilities.hardCodedSecrets?.length === 0 &&
                 report.vibeCodingVulnerabilities.unauthenticatedApiAccess?.length === 0 &&
                 report.vibeCodingVulnerabilities.backendMisconfigurations?.length === 0 &&
                 report.vibeCodingVulnerabilities.fileUploadVulnerabilities?.length === 0 &&
                 !report.vibeCodingVulnerabilities.clientSideAuth?.detected &&
                 report.vibeCodingVulnerabilities.recommendations?.length === 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <p className="text-green-800 font-medium">✓ No vibe-coding vulnerabilities detected</p>
                    <p className="text-sm text-green-700 mt-1">Scanned for hardcoded secrets, exposed APIs, and backend misconfigurations</p>
                  </div>
                )}
              </div>
            )}

            {report.findings && report.findings.length > 0 && (
              <FindingsList report={report} />
            )}
          </div>
        )}
      </div>

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
