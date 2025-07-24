// pages/chat/index.tsx - Fixed authChecked error
import React from 'react';
import Head from 'next/head';
import { useAuth } from '../../contexts/AuthContext';
import { ChatInterface } from '@/components/chat/ChatInterface';

export default function Chat() {
    // ✅ Fixed: Removed authChecked since it doesn't exist in useAuth hook
    const { user, loading: authLoading } = useAuth();

    // Show loading while checking authentication
    if (authLoading) {
        return (
            <>
                <Head>
                    <title>AdventureOne Chat</title>
                    <meta name="description" content="Chat with your AI assistant" />
                </Head>
                
                <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
                    </div>
                </div>
            </>
        );
    }

    // Show login prompt if not authenticated
    if (!user) {
        return (
            <>
                <Head>
                    <title>AdventureOne Chat - Login Required</title>
                    <meta name="description" content="Login to access chat" />
                </Head>
                
                <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Chat Access</h1>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">Please log in to access the chat feature</p>
                        <button
                            onClick={() => window.location.href = '/auth/login'}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg transition-colors"
                        >
                            Go to Login
                        </button>
                    </div>
                </div>
            </>
        );
    }

    // Show authenticated chat interface
    return (
        <>
            <Head>
                <title>AdventureOne Chat</title>
                <meta name="description" content="Chat with your AI assistant" />
            </Head>
            
            <ChatInterface />
        </>
    );
}