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
    <div className="border border-gray-200 rounded-lg p-6 bg-white">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">Security Score</p>
          <div className="text-5xl font-semibold text-gray-900">
            {score}<span className="text-2xl text-gray-500 font-normal">/10</span>
          </div>
        </div>
        <div className="flex gap-8">
          <div>
            <div className="text-2xl font-semibold text-gray-900">{issues}</div>
            <div className="text-sm text-gray-500">Issues</div>
          </div>
          <div>
            <div className="text-2xl font-semibold text-gray-900">{critical}</div>
            <div className="text-sm text-gray-500">Critical</div>
          </div>
        </div>
      </div>
    </div>
  );
}

