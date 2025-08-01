
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function EmailOTPVerification() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const { verifyEmailOTP, resendEmailOTP, otpUserId, otpEmail, emailOtpRequired } = useAuth();
  const router = useRouter();

  // Redirect if no OTP required
  useEffect(() => {
    if (!emailOtpRequired || !otpUserId || !otpEmail) {
      router.push('/auth/login');
    }
  }, [emailOtpRequired, otpUserId, otpEmail, router]);

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

 
const handleVerify = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!otpUserId) return;

  setLoading(true);
  setError('');

  try {
    const result = await verifyEmailOTP(otpUserId, code);
    
    if (result?.success) {
      if (result.newUser) {
        // New user - redirect to complete registration
        setTimeout(() => {
          router.push('/auth/register?step=2'); // Or create a new complete-registration page
        }, 100);
      } else {
        // Existing user - redirect to feed
        setTimeout(() => {
          router.push('/feed');
        }, 100);
      }
    }
  } catch (error: any) {
    setError(error.message || 'Verification failed. Please try again.');
  } finally {
    setLoading(false);
  }
};
  const handleResend = async () => {
    setLoading(true);
    setError('');

    try {
      await resendEmailOTP();
      setResendCooldown(60); // 60 second cooldown
    } catch (error: any) {
      setError(error.message || 'Failed to resend code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Verify your email
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            We've sent a verification code to{' '}
            <span className="font-medium text-gray-900">{otpEmail}</span>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleVerify}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="code" className="sr-only">Verification code</label>
            <input
              id="code"
              name="code"
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 text-center text-lg tracking-wider"
              placeholder="Enter 6-digit code"
              maxLength={6}
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={handleResend}
              disabled={resendCooldown > 0 || loading}
              className="text-sm text-emerald-600 hover:text-emerald-500 disabled:text-gray-400"
            >
              {resendCooldown > 0 
                ? `Resend code in ${resendCooldown}s` 
                : 'Resend verification code'
              }
            </button>
          </div>
        </form>

        <div className="text-center mt-4">
  <Link href="/auth/login" className="text-sm text-emerald-600 hover:text-emerald-500">
    ← Back to login
  </Link>
</div>
      </div>
    </div>
  );
}
