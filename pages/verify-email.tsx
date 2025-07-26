// Updated verify-email.tsx with refreshUser functionality
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { account } from '../lib/appwrite';
import { useAuth } from '../contexts/AuthContext';

const VerifyEmail: React.FC = () => {
  const router = useRouter();
  const { refreshUser } = useAuth(); // ✅ ADD: Get refreshUser from AuthContext
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleVerification = async () => {
      const { userId, secret } = router.query;

      if (!userId || !secret) {
        setStatus('error');
        setMessage('Invalid verification link. Missing required parameters.');
        return;
      }

      try {
        // Confirm the email verification with Appwrite
        await account.updateVerification(userId as string, secret as string);
        
        // ✅ ADD: Refresh user data to update emailVerification status
        await refreshUser();
        
        setStatus('success');
        setMessage('Email verified successfully! You can now access all features.');
        
        // Redirect to profile after 3 seconds
        setTimeout(() => {
          router.push('/profile');
        }, 3000);
        
      } catch (error: any) {
        console.error('Email verification error:', error);
        setStatus('error');
        setMessage('Failed to verify email. The link may be expired or invalid.');
      }
    };

    if (router.isReady) {
      handleVerification();
    }
  }, [router.isReady, router.query, refreshUser]); // ✅ ADD: refreshUser to dependency array

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8 text-center">
        {status === 'loading' && (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Verifying Your Email...
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Please wait while we verify your email address.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="rounded-full h-16 w-16 bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center mx-auto mb-4">
              <svg className="h-8 w-8 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Email Verified! ✅
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {message}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Redirecting to your profile in a few seconds...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="rounded-full h-16 w-16 bg-red-100 dark:bg-red-900 flex items-center justify-center mx-auto mb-4">
              <svg className="h-8 w-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Verification Failed ❌
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {message}
            </p>
            <div className="space-y-3">
              <button
                onClick={() => router.push('/profile')}
                className="w-full bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Go to Profile
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;