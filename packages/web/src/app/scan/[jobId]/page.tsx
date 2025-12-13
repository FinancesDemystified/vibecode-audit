'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { trpc } from '../../../lib/trpc';

export default function ScanStatusPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.jobId as string;
  const { data: status } = trpc.scan.status.useQuery(
    { jobId },
    { refetchInterval: 2000 }
  );

  useEffect(() => {
    if (status?.status === 'completed' && status.reportUrl) {
      router.push(`/report/${jobId}`);
    }
  }, [status, jobId, router]);

  if (!status) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <main className="min-h-screen p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Scan Status</h1>
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-600">Status: <strong>{status.status}</strong></p>
          {status.progress !== undefined && (
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${status.progress}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 mt-1">{status.progress}%</p>
            </div>
          )}
        </div>
        {status.error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800">{status.error}</p>
          </div>
        )}
      </div>
    </main>
  );
}

