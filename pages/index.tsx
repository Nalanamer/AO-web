// pages/index.tsx - Nuclear option: No router usage during SSR
import { useEffect } from 'react';

export default function Home() {
  useEffect(() => {
    // Only redirect on client-side after the page loads
    const timer = setTimeout(() => {
      if (typeof window !== 'undefined') {
        // Check if user is authenticated (simple localStorage check)
        const userToken = localStorage.getItem('appwrite-session');
        
        if (userToken) {
          window.location.href = '/feed';
        } else {
          window.location.href = '/auth/login';
        }
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          AdventureOne
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Loading your adventure...
        </p>
      </div>
    </div>
  );
}

// Don't export getStaticProps or getServerSideProps to keep it simple