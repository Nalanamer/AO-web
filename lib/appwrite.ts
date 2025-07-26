// lib/appwrite.ts - Web Appwrite configuration
import { Client, Account, Databases, ID, Query } from 'appwrite';

// Add fallbacks for all environment variables
const APPWRITE_ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '682d91b9002f1d1323ca';

// Initialize Appwrite client
export const client = new Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID);

// Initialize services
export const account = new Account(client);
export const databases = new Databases(client);

// Database and Collection IDs - matching your mobile app exactly
export const DATABASE_ID = process.env.NEXT_PUBLIC_DATABASE_ID || '684618380034b6fc0a8e';
export const ACTIVITIES_COLLECTION_ID = process.env.NEXT_PUBLIC_ACTIVITIES_COLLECTION_ID || '68461850000a31697c8a';
export const EVENTS_COLLECTION_ID = process.env.NEXT_PUBLIC_EVENTS_COLLECTION_ID || '684d043c00216aef747f';
export const COMMENTS_COLLECTION_ID = process.env.NEXT_PUBLIC_COMMENTS_COLLECTION_ID || 'comments';
export const USER_PROFILES_COLLECTION_ID = process.env.NEXT_PUBLIC_USER_PROFILES_COLLECTION_ID || '684d5264001042b563dd';
export const APP_CONFIG_COLLECTION_ID = process.env.NEXT_PUBLIC_APP_CONFIG_COLLECTION_ID || '684f5437000a2d76b247';

// ✅ NEW: Add the subscription collections
export const USER_SUBSCRIPTIONS_COLLECTION_ID = 'user_subscriptions';
export const USER_USAGE_COLLECTION_ID = 'user_usage';

// Export utilities
export { ID, Query };

// Debug logging
console.log('✅ Appwrite configuration loaded');
console.log('Database ID:', DATABASE_ID);
console.log('Subscriptions Collection:', USER_SUBSCRIPTIONS_COLLECTION_ID);
console.log('Usage Collection:', USER_USAGE_COLLECTION_ID);