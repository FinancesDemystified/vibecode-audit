/**
 * Report summary component
 * Dependencies: React
 * Purpose: Display security score and key metrics
 */
'use client';

import type { Report } from '../../types';

interface ReportSummaryProps {
  report: Report | null;
  preview?: any;
  criticalCount: number;
  totalIssues: number;
}

export default function ReportSummary({ report, preview, criticalCount, totalIssues }: ReportSummaryProps) {
  const score = preview?.score || report?.score || 0;
  const issues = preview?.findingsSummary?.total || totalIssues || 0;
  const critical = preview?.findingsSummary?.critical || criticalCount || 0;

  return (
    <div className="bg-gradient-to-br from-red-600 to-red-700 text-white rounded-xl p-6 shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider opacity-90 mb-1">Security Score</p>
          <div className="text-4xl font-bold">
            {score}<span className="text-2xl opacity-75">/10</span>
          </div>
        </div>
        <div className="flex gap-6">
          <div className="text-center">
            <div className="text-xl font-bold">{issues}</div>
            <div className="text-xs opacity-90">Issues</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold">{critical}</div>
            <div className="text-xs opacity-90">Critical</div>
          </div>
        </div>
      </div>
    </div>
  );
}

