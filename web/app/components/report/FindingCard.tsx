/**
 * Individual finding card component
 * Dependencies: React
 * Purpose: Display a single security finding with details
 */
'use client';

import type { Finding } from '../../types';

interface FindingCardProps {
  finding: Finding;
  index: number;
}

export default function FindingCard({ finding, index }: FindingCardProps) {
  const getIssueTitle = (f: Finding) => {
    if (f.type) return f.type;
    if (f.title) return f.title;
    return 'Security Issue';
  };

  const getIssueDescription = (f: Finding) => {
    if (f.evidence && f.evidence.trim().length > 0) {
      return f.evidence;
    }
    if (f.description && f.description.trim().length > 0) {
      return f.description;
    }
    return `This ${f.severity || 'security'} issue was detected in your application.`;
  };

  const getIssueRecommendation = (f: Finding) => {
    if (f.recommendation && f.recommendation.trim().length > 0) {
      return f.recommendation;
    }
    return `Implement proper security measures to address this ${f.severity || 'security'} issue. Check your platform documentation for specific steps.`;
  };

  const severity = finding.severity?.toLowerCase() || 'low';
  const severityBadge = severity === 'critical' ? 'bg-gray-900 text-white' :
    severity === 'high' ? 'bg-gray-800 text-white' :
    severity === 'medium' ? 'bg-gray-700 text-white' :
    'bg-gray-100 text-gray-700';

  return (
    <div key={index} className="border border-gray-200 rounded-lg p-5 bg-white hover:border-gray-300 transition-colors">
      <div className="flex items-start justify-between gap-4 mb-3">
        <h4 className="text-base font-semibold text-gray-900">{getIssueTitle(finding)}</h4>
        <span className={`text-xs px-2.5 py-1 rounded-md font-medium flex-shrink-0 ${severityBadge}`}>
          {finding.severity || 'Unknown'}
        </span>
      </div>
      <p className="text-sm text-gray-600 mb-4 leading-relaxed">{getIssueDescription(finding)}</p>
      {finding.explanation && (
        <div className="border-l border-gray-300 pl-4 py-2 mb-4 bg-gray-50 rounded-r">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Why This Matters</p>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="font-medium text-gray-900 mb-1">What it means</dt>
              <dd className="text-gray-600">{finding.explanation.whatItMeans}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-900 mb-1">Why it's a problem</dt>
              <dd className="text-gray-600">{finding.explanation.whyItsAProblem}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-900 mb-1">Who it affects</dt>
              <dd className="text-gray-600">{finding.explanation.whoItAffects}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-900 mb-1">When it matters</dt>
              <dd className="text-gray-600">{finding.explanation.whenItMatters}</dd>
            </div>
          </dl>
        </div>
      )}
      {finding.recommendation && (
        <div className="pt-4 border-t border-gray-100">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">How to Fix</p>
          <p className="text-sm text-gray-700 leading-relaxed">{getIssueRecommendation(finding)}</p>
        </div>
      )}
      {finding.cwe && (
        <p className="text-xs text-gray-400 mt-3 font-mono">CWE-{finding.cwe}</p>
      )}
    </div>
  );
}

