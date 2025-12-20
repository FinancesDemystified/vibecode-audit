/**
 * Findings list component
 * Dependencies: React
 * Purpose: Display filterable list of security findings
 */
'use client';

import { useState } from 'react';
import type { Finding, Report } from '../../types';
import FindingCard from './FindingCard';

interface FindingsListProps {
  report: Report;
}

export default function FindingsList({ report }: FindingsListProps) {
  const [selectedSeverity, setSelectedSeverity] = useState<string | null>(null);

  if (!report.findings || report.findings.length === 0) {
    return null;
  }

  const criticalFindings = report.findings.filter(f => 
    f.severity?.toLowerCase() === 'critical' || f.severity?.toLowerCase() === 'high'
  ).slice(0, 3);

  const filteredFindings = report.findings.filter(
    f => !selectedSeverity || f.severity?.toLowerCase() === selectedSeverity
  );

  return (
    <div className="space-y-8">
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
                <h4 className="font-semibold mb-1">{f.type || f.title || 'Security Issue'}</h4>
                <p className="text-sm text-red-700 uppercase font-semibold">{f.severity} SEVERITY</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">
            All Issues ({report.findings.length})
          </h3>
        </div>

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
          {filteredFindings.map((f, i) => (
            <FindingCard key={i} finding={f} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

