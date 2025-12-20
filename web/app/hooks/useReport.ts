/**
 * Hook for fetching reports
 * Dependencies: React
 * Purpose: Encapsulate report fetching logic
 */
import { useState } from 'react';
import type { Report } from '../types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://vibecode-audit-production.up.railway.app';

export function useReport() {
  const [report, setReport] = useState<Report | null>(null);
  const [preview, setPreview] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = async (jobId: string) => {
    setLoading(true);
    setError(null);
    try {
      const previewRes = await fetch(
        `${API_URL}/api/trpc/scan.preview?input=${encodeURIComponent(JSON.stringify({ jobId }))}`
      );
      
      if (previewRes.ok) {
        const data = await previewRes.json();
        setPreview(data.result?.data);
        return;
      }

      const res = await fetch(
        `${API_URL}/api/trpc/scan.report?input=${encodeURIComponent(JSON.stringify({ jobId }))}`
      );
      if (res.ok) {
        const data = await res.json();
        setReport(data.result?.data);
        return;
      }

      const restRes = await fetch(`${API_URL}/api/report/${jobId}`);
      if (restRes.ok) {
        setReport(await restRes.json());
        return;
      }

      throw new Error('Report not found');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch report');
    } finally {
      setLoading(false);
    }
  };

  const verifyAccessToken = async (jobId: string, token: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${API_URL}/api/trpc/scan.verifyAccess?input=${encodeURIComponent(JSON.stringify({ jobId, token }))}`
      );

      if (!res.ok) {
        throw new Error('Invalid or expired access token');
      }

      const data = await res.json();
      setReport(data.result?.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify access token');
    } finally {
      setLoading(false);
    }
  };

  return { report, preview, error, loading, fetchReport, verifyAccessToken, setReport };
}

