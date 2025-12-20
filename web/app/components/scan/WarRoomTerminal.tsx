/**
 * WarRoomTerminal - Full-screen scan visualization
 * Dependencies: React
 * Purpose: Centered terminal showing real scan progress
 */
'use client';

import { useEffect, useState, useRef } from 'react';

interface WarRoomTerminalProps {
  jobId: string | null;
  status: string;
  progress: number;
  currentStage: string;
  stageMessage: string;
}

interface LogEntry {
  timestamp: string;
  stage: string;
  message: string;
}

const STAGES = [
  { key: 'discovery', label: 'Discovery', icon: '🔎' },
  { key: 'content', label: 'Copy Audit', icon: '📝' },
  { key: 'security', label: 'Security', icon: '🛡️' },
  { key: 'vibe', label: 'Vibe-Code', icon: '⚡' },
  { key: 'ai', label: 'AI Analysis', icon: '🤖' },
  { key: 'report', label: 'Report', icon: '📊' },
];

export default function WarRoomTerminal({ 
  jobId, 
  status, 
  progress, 
  currentStage, 
  stageMessage 
}: WarRoomTerminalProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [lastStage, setLastStage] = useState('');
  const logsEndRef = useRef<HTMLDivElement>(null);

  const getTimestamp = () => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
  };

  // Add log when stage or message changes
  useEffect(() => {
    if (!currentStage && !stageMessage) return;
    
    const newEntry = `${currentStage}:${stageMessage}`;
    if (newEntry === lastStage) return;
    
    setLastStage(newEntry);
    setLogs(prev => [...prev, {
      timestamp: getTimestamp(),
      stage: currentStage || 'Processing',
      message: stageMessage || 'Working...',
    }].slice(-15));
  }, [currentStage, stageMessage, lastStage]);

  // Auto-scroll logs container only (not page)
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [logs]);

  // Determine current stage index for progress dots
  const getCurrentStageIndex = () => {
    const stage = currentStage.toLowerCase();
    if (stage.includes('discover') || stage.includes('connect') || stage.includes('map')) return 0;
    if (stage.includes('content') || stage.includes('copy') || stage.includes('seo') || stage.includes('trust')) return 1;
    if (stage.includes('security') || stage.includes('xss') || stage.includes('cors') || stage.includes('cookie') || stage.includes('deep')) return 2;
    if (stage.includes('vibe') || stage.includes('secret') || stage.includes('api key') || stage.includes('endpoint')) return 3;
    if (stage.includes('ai') || stage.includes('pattern') || stage.includes('score')) return 4;
    if (stage.includes('report') || stage.includes('generat') || stage.includes('remediat') || stage.includes('complete')) return 5;
    return Math.floor((progress / 100) * 6);
  };

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Terminal Window */}
        <div className="bg-gray-900 rounded-xl overflow-hidden shadow-2xl border border-gray-700">
          {/* Header Bar */}
          <div className="bg-gradient-to-r from-red-600 to-orange-600 px-5 py-3 flex items-center gap-3">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red-300"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-300"></div>
              <div className="w-3 h-3 rounded-full bg-green-300"></div>
            </div>
            <span className="text-white font-bold tracking-wide">SECURITY SCAN</span>
            <div className="ml-auto flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
              <span className="text-white/90 text-sm font-mono">LIVE</span>
            </div>
          </div>

          {/* Stage Progress */}
          <div className="bg-gray-800 px-5 py-3 border-b border-gray-700">
            <div className="flex items-center justify-between gap-2">
              {STAGES.map((stage, idx) => (
                <div key={stage.key} className="flex items-center gap-2">
                  <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-all ${
                    idx < getCurrentStageIndex() 
                      ? 'bg-green-900/50 text-green-400' 
                      : idx === getCurrentStageIndex()
                        ? 'bg-orange-900/50 text-orange-400 animate-pulse'
                        : 'bg-gray-700/50 text-gray-500'
                  }`}>
                    <span>{stage.icon}</span>
                    <span className="hidden sm:inline">{stage.label}</span>
                  </div>
                  {idx < STAGES.length - 1 && (
                    <div className={`w-4 h-0.5 ${idx < getCurrentStageIndex() ? 'bg-green-600' : 'bg-gray-700'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Terminal Output */}
          <div className="bg-black p-4 h-64 overflow-y-auto font-mono text-sm">
            {logs.length === 0 ? (
              <div className="text-gray-500">Starting scan...</div>
            ) : (
              logs.map((log, idx) => (
                <div key={idx} className="mb-2 flex gap-3">
                  <span className="text-gray-600 flex-shrink-0">[{log.timestamp}]</span>
                  <span className="text-blue-400 flex-shrink-0">{log.stage}</span>
                  <span className="text-green-400">{log.message}</span>
                </div>
              ))
            )}
            <div ref={logsEndRef} />
            <div className="flex items-center gap-2 text-gray-600 mt-2">
              <span>$</span>
              <span className="animate-pulse">_</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="bg-gray-800 px-5 py-4">
            <div className="flex items-center justify-between mb-2 text-sm">
              <span className="text-gray-400">{stageMessage || currentStage || 'Processing...'}</span>
              <span className="text-white font-mono font-bold">{Math.floor(progress)}%</span>
            </div>
            <div className="bg-gray-700 rounded-full h-2 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Subtle hint */}
        <p className="text-center text-gray-600 text-sm mt-4">
          Analyzing security vulnerabilities...
        </p>
      </div>
    </div>
  );
}
