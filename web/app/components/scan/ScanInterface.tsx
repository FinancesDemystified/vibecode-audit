/**
 * Scan interface component
 * Dependencies: React
 * Purpose: URL input form and scan submission
 */
'use client';

import { useState } from 'react';

interface ScanInterfaceProps {
  onSubmit: (url: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export default function ScanInterface({ onSubmit, loading, error }: ScanInterfaceProps) {
  const [url, setUrl] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = `https://${normalizedUrl}`;
    }
    await onSubmit(normalizedUrl);
  };

  return (
    <div className="max-w-lg mx-auto mb-16">
      {error && (
        <div className="bg-red-50 border-2 border-red-600 text-red-800 px-6 py-4 rounded-xl mb-4">
          <span className="font-semibold">Error:</span> {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-3">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="your-app.com"
            required
            disabled={loading}
            className="flex-1 px-6 py-4 border-2 border-gray-300 rounded-xl focus:border-red-500 focus:outline-none text-base shadow-sm"
          />
          <button
            type="submit"
            disabled={!url || loading}
            className="px-8 py-4 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg transition-colors shadow-lg"
          >
            Scan Now
          </button>
        </div>
        <p className="text-sm text-gray-500">
          Free • No credit card • Results in minutes
        </p>
      </form>
    </div>
  );
}

