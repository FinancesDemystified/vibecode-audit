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
  [key: string]: unknown;
}

export default function Home() {
  const [url, setUrl] = useState('');
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://vibecode-audit-production.up.railway.app';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setReport(null);

    try {
      const res = await fetch(`${API_URL}/api/trpc/scan.submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!res.ok) throw new Error(`Failed: ${res.status}`);
      
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
        return;
      }
      const restRes = await fetch(`${API_URL}/api/report/${id}`);
      if (restRes.ok) {
        setReport(await restRes.json());
      } else {
        throw new Error('Report not found');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch report');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">VibeCode Audit</h1>
          <p className="text-gray-600">AI-powered security scanner</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="example.com"
              required
              className="flex-1 px-4 py-2 border rounded-lg"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !url}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Scanning...' : 'Scan'}
            </button>
          </div>
        </form>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {jobId && status && (
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h2 className="font-semibold mb-2">Status</h2>
            <p className="text-sm text-gray-600">Job ID: {jobId}</p>
            <p className="mt-2">
              Status: <span className="font-medium capitalize">{status}</span>
              {(status === 'pending' || status === 'scanning') && (
                <span className="ml-2 inline-block animate-spin">⏳</span>
              )}
            </p>
          </div>
        )}

        {report && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-2xl font-bold mb-4">Report</h2>
            <div className="space-y-4">
              {report.score && (
                <div>
                  <span className="font-semibold">Security Score: </span>
                  <span className="text-2xl">{report.score}/10</span>
                </div>
              )}
              {report.summary && (
                <div>
                  <h3 className="font-semibold mb-2">Summary</h3>
                  <p className="text-gray-700">{report.summary}</p>
                </div>
              )}
              {report.findings && report.findings.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Findings</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {report.findings.map((f, i) => (
                      <li key={i} className="text-gray-700">
                        {f.severity || 'Unknown'}: {f.title || f.description || 'No description'}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <pre className="bg-gray-50 p-4 rounded text-xs overflow-auto">
                {JSON.stringify(report, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
