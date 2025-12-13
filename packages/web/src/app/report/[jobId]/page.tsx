'use client';

import { useParams } from 'next/navigation';
import { trpc } from '../../../lib/trpc';
import type { Report } from '@vibecode-audit/shared';

export default function ReportPage() {
  const params = useParams();
  const jobId = params.jobId as string;
  const { data } = trpc.scan.report.useQuery({ jobId });
  const report = data as Report | undefined;

  if (!report) {
    return <div className="p-8">Loading report...</div>;
  }

  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Security Audit Report</h1>
      <div className="mb-8">
        <div className="text-5xl font-bold mb-2" style={{ color: report.score >= 7 ? '#22c55e' : report.score >= 4 ? '#eab308' : '#ef4444' }}>
          {report.score}/10
        </div>
        <p className="text-gray-600">{report.summary}</p>
      </div>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Findings ({report.findings.length})</h2>
        <div className="space-y-4">
          {report.findings.map((finding, i) => (
            <div key={i} className="p-4 border-l-4 bg-gray-50" style={{ borderColor: finding.severity === 'critical' ? '#ef4444' : finding.severity === 'high' ? '#f97316' : finding.severity === 'medium' ? '#eab308' : '#3b82f6' }}>
              <span className="inline-block px-2 py-1 text-xs font-bold uppercase bg-gray-200 rounded mb-2">
                {finding.severity}
              </span>
              <h3 className="font-bold">{finding.type}</h3>
              <p className="text-sm text-gray-600 mt-1">{finding.evidence}</p>
              <p className="text-sm mt-2"><strong>Fix:</strong> {finding.recommendation}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Recommendations</h2>
        <div className="space-y-2">
          {report.recommendations.map((rec, i) => (
            <div key={i} className="p-3 bg-blue-50 rounded">
              <strong>[{rec.priority.toUpperCase()}]</strong> {rec.action} <em>(Effort: {rec.effort})</em>
            </div>
          ))}
        </div>
      </section>

      <div className="p-6 bg-blue-600 text-white rounded-lg text-center">
        <h3 className="text-xl font-bold mb-2">Need Deeper Insights?</h3>
        <p className="mb-4">Upgrade to a full codebase review for $49</p>
        <a
          href="mailto:support@vibecodeaudit.com?subject=Upgrade Request"
          className="inline-block bg-white text-blue-600 px-6 py-2 rounded font-bold hover:bg-gray-100"
        >
          Contact Us to Upgrade
        </a>
      </div>
    </main>
  );
}

