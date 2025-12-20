/**
 * Hook for real-time scan status via SSE
 * Dependencies: React
 * Purpose: Encapsulate scan status streaming logic
 */
import { useState, useEffect, useRef } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://vibecode-audit-production.up.railway.app';
const USE_SSE = process.env.NEXT_PUBLIC_USE_SSE === 'true'; // Default to false (use polling)

interface UseScanStatusReturn {
  status: string;
  progress: number;
  currentStage: string;
  stageMessage: string;
  error: string | null;
  isLoading: boolean;
}

export function useScanStatus(jobId: string | null, onComplete: (id: string) => void): UseScanStatusReturn {
  const [status, setStatus] = useState('');
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState('');
  const [stageMessage, setStageMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!jobId) return;

    if (USE_SSE && typeof EventSource !== 'undefined') {
      // Use SSE for real-time updates
      const eventSource = new EventSource(`${API_URL}/api/scan/${jobId}/stream`);
      eventSourceRef.current = eventSource;

      eventSource.onmessage = (e) => {
        try {
          const statusData = JSON.parse(e.data);
          setStatus(statusData.status || '');
          if (statusData.progress !== undefined) setProgress(statusData.progress);
          if (statusData.currentStage) setCurrentStage(statusData.currentStage);
          if (statusData.stageMessage) setStageMessage(statusData.stageMessage);
          
          if (statusData.error) {
            setError(statusData.error);
          }
          
          if (statusData.status === 'completed') {
            eventSource.close();
            onComplete(jobId);
          } else if (statusData.status === 'failed') {
            eventSource.close();
            setError(statusData.error || 'Scan failed');
          }
        } catch (err) {
          console.error('[SSE] Failed to parse status:', err);
        }
      };

      eventSource.onerror = (err) => {
        console.error('[SSE] Connection error:', err);
        eventSource.close();
        setError('Connection lost. Please refresh the page.');
      };

      return () => {
        eventSource.close();
      };
    } else {
      // Fallback to polling
      intervalRef.current = setInterval(async () => {
        try {
          const res = await fetch(
            `${API_URL}/api/trpc/scan.status?input=${encodeURIComponent(JSON.stringify({ jobId }))}`
          );
          if (!res.ok) throw new Error('Status check failed');
          
          const data = await res.json();
          const statusData = data.result?.data;
          const currentStatus = statusData?.status;
          
          if (currentStatus) {
            setStatus(currentStatus);
            if (statusData.progress !== undefined) setProgress(statusData.progress);
            if (statusData.currentStage) setCurrentStage(statusData.currentStage);
            if (statusData.stageMessage) setStageMessage(statusData.stageMessage);
            
            if (currentStatus === 'completed') {
              if (intervalRef.current) clearInterval(intervalRef.current);
              onComplete(jobId);
            } else if (currentStatus === 'failed') {
              if (intervalRef.current) clearInterval(intervalRef.current);
              setError(statusData.error || 'Scan failed');
            }
          }
        } catch (err) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setError(err instanceof Error ? err.message : 'Status check failed');
        }
      }, 2000);

      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
  }, [jobId, onComplete]);

  return { status, progress, currentStage, stageMessage, error, isLoading: !!jobId && status !== 'completed' && status !== 'failed' };
}

