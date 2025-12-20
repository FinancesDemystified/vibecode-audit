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

  const severityColor = finding.severity?.toLowerCase() === 'critical' ? 'red' :
    finding.severity?.toLowerCase() === 'high' ? 'orange' :
    finding.severity?.toLowerCase() === 'medium' ? 'yellow' : 'green';

  return (
    <div key={index} className={`border-2 rounded-lg p-4 ${
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
            <h4 className="font-semibold text-gray-900">{getIssueTitle(finding)}</h4>
            <span className={`text-xs px-2 py-0.5 rounded uppercase font-medium flex-shrink-0 ${
              severityColor === 'red' ? 'bg-red-200 text-red-800' :
              severityColor === 'orange' ? 'bg-orange-200 text-orange-800' :
              severityColor === 'yellow' ? 'bg-yellow-200 text-yellow-800' :
              'bg-green-200 text-green-800'
            }`}>
              {finding.severity || 'Unknown'}
            </span>
          </div>
          <p className="text-sm text-gray-700 mb-3">{getIssueDescription(finding)}</p>
          {finding.explanation && (
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-3 rounded-r">
              <p className="text-xs font-semibold text-blue-900 mb-2">Why This Matters:</p>
              <div className="space-y-2 text-sm text-gray-700">
                <p><strong>What it means:</strong> {finding.explanation.whatItMeans}</p>
                <p><strong>Why it's a problem:</strong> {finding.explanation.whyItsAProblem}</p>
                <p><strong>Who it affects:</strong> {finding.explanation.whoItAffects}</p>
                <p><strong>When it matters:</strong> {finding.explanation.whenItMatters}</p>
              </div>
            </div>
          )}
          {finding.recommendation && (
            <div className="pt-3 border-t border-gray-200">
              <p className="text-xs font-semibold text-gray-600 mb-1">How to fix:</p>
              <p className="text-sm text-gray-700">{getIssueRecommendation(finding)}</p>
            </div>
          )}
          {finding.cwe && (
            <p className="text-xs text-gray-500 mt-2">CWE: {finding.cwe}</p>
          )}
        </div>
      </div>
    </div>
  );
}

