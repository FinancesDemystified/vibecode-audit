/**
 * VerificationGate - 6-digit code input
 * Dependencies: React, tRPC
 * Purpose: Email verification before showing full report
 */
'use client';

import { useState, useRef, useEffect } from 'react';

interface VerificationGateProps {
  jobId: string;
  email: string;
  url: string;
  onVerified: (accessToken: string) => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://vibecode-audit-production.up.railway.app';

export default function VerificationGate({ jobId, email, url, onVerified }: VerificationGateProps) {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (idx: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    if (val.length > 1) return;
    
    const newCode = [...code];
    newCode[idx] = val;
    setCode(newCode);
    setError(null);
    
    if (val && idx < 5) {
      inputRefs.current[idx + 1]?.focus();
    }
    
    if (newCode.every(d => d) && idx === 5) {
      verifyCode(newCode.join(''));
    }
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newCode = pastedData.split('');
    
    if (newCode.length === 6) {
      setCode(newCode);
      inputRefs.current[5]?.focus();
      verifyCode(newCode.join(''));
    }
  };

  const verifyCode = async (fullCode: string) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/api/trpc/scan.verifyCode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          jobId,
          email,
          code: fullCode,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        let errMsg = 'Invalid code';
        try {
          const errJson = JSON.parse(errText);
          errMsg = errJson.error?.message || errText;
        } catch {}
        throw new Error(errMsg);
      }

      const data = await res.json();
      const result = data.result?.data;
      
      if (result?.success && result?.accessToken) {
        onVerified(result.accessToken);
      } else {
        throw new Error('Verification failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setResendSuccess(false);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/api/trpc/scan.resendCode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, email }),
      });

      if (!res.ok) throw new Error('Failed to resend');

      setResendSuccess(true);
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();

      setTimeout(() => setResendSuccess(false), 3000);
    } catch (err) {
      setError('Failed to resend code');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200 rounded-xl p-8 shadow-lg">
      <div className="text-center mb-6">
        <div className="text-4xl mb-3">🔒</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify Your Email</h2>
        <p className="text-gray-700">
          We sent a 6-digit code to <strong>{email}</strong>
        </p>
      </div>

      <div className="flex justify-center gap-2 mb-6" onPaste={handlePaste}>
        {code.map((digit, idx) => (
          <input
            key={idx}
            ref={el => { inputRefs.current[idx] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(idx, e.target.value)}
            onKeyDown={(e) => handleKeyDown(idx, e)}
            disabled={loading}
            className={`w-12 h-14 text-center text-2xl font-bold border-2 rounded-lg 
              ${error ? 'border-red-500 bg-red-50' : 'border-gray-300'}
              focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all`}
          />
        ))}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-800 px-4 py-3 rounded-lg mb-4 text-sm text-center">
          {error}
        </div>
      )}

      {resendSuccess && (
        <div className="bg-green-100 border border-green-400 text-green-800 px-4 py-3 rounded-lg mb-4 text-sm text-center">
          New code sent! Check your email
        </div>
      )}

      <div className="text-center space-y-3">
        <p className="text-sm text-gray-600">
          Code expires in 5 minutes
        </p>
        
        <div className="flex gap-4 justify-center text-sm">
          <button
            onClick={handleResend}
            disabled={resending || loading}
            className="text-red-600 hover:text-red-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resending ? 'Sending...' : 'Resend Code'}
          </button>
          <span className="text-gray-400">•</span>
          <button
            onClick={() => window.location.href = '/'}
            className="text-gray-600 hover:text-gray-700 font-semibold"
          >
            Change Email
          </button>
        </div>
      </div>

      {loading && (
        <div className="mt-4 text-center">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-red-600"></div>
          <p className="text-sm text-gray-600 mt-2">Verifying...</p>
        </div>
      )}
    </div>
  );
}

