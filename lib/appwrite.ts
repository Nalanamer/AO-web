// lib/appwrite.ts - Web Appwrite configuration
import { Client, Account, Databases, ID, Query } from 'appwrite';

// Initialize Appwrite client
export const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

// Initialize services
export const account = new Account(client);
export const databases = new Databases(client);

// Database and Collection IDs - matching your mobile app exactly
export const DATABASE_ID = process.env.NEXT_PUBLIC_DATABASE_ID || '684618380034b6fc0a8e';
export const ACTIVITIES_COLLECTION_ID = process.env.NEXT_PUBLIC_ACTIVITIES_COLLECTION_ID!;
export const EVENTS_COLLECTION_ID = process.env.NEXT_PUBLIC_EVENTS_COLLECTION_ID!;
export const COMMENTS_COLLECTION_ID = process.env.NEXT_PUBLIC_COMMENTS_COLLECTION_ID!;
export const USER_PROFILES_COLLECTION_ID = process.env.NEXT_PUBLIC_USER_PROFILES_COLLECTION_ID!;
export const APP_CONFIG_COLLECTION_ID = process.env.NEXT_PUBLIC_APP_CONFIG_COLLECTION_ID!;

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