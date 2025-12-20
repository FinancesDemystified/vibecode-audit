/**
 * Scan status component
 * Dependencies: React
 * Purpose: Display scan progress and status
 */
'use client';

interface ScanStatusProps {
  status: string;
  progress: number;
  currentStage: string;
  stageMessage: string;
}

export default function ScanStatus({ status, progress, currentStage, stageMessage }: ScanStatusProps) {
  return (
    <div className="bg-white border-2 border-gray-900 rounded-xl p-12 text-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-red-600 border-t-transparent mb-6"></div>
      <h3 className="text-xl font-bold capitalize mb-2">{currentStage || status}</h3>
      <p className="text-gray-600 mb-4">{stageMessage || 'Analyzing your application security...'}</p>
      {progress > 0 && (
        <div className="w-full max-w-md mx-auto">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-red-600 h-2.5 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
}

