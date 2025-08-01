// lib/appwrite.js - Updated with missing collection
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

// ✅ Community Collections - All Present
export const USER_SUBSCRIPTIONS_COLLECTION_ID = 'user_subscriptions';
export const USER_USAGE_COLLECTION_ID = 'user_usage';
export const COMMUNITIES_COLLECTION_ID = 'communities';
export const COMMUNITY_MEMBERS_COLLECTION_ID = 'community_members';
export const COMMUNITY_ACTIVITIES_COLLECTION_ID = 'community_activities';
export const COMMUNITY_POSTS_COLLECTION_ID = 'community_posts';
export const COMMUNITY_INVITES_COLLECTION_ID = 'community_invites';

// ✅ ADD THIS - The missing collection
export const COMMUNITY_JOIN_REQUESTS_COLLECTION_ID = 'community_join_requests';

// ✅ Use existing notifications collection instead of creating new one
export const COMMUNITY_NOTIFICATIONS_COLLECTION_ID = 'notifications';

//Colletion to manage event invited 
export const EVENT_INVITES_COLLECTION_ID = process.env.NEXT_PUBLIC_EVENT_INVITES_COLLECTION_ID || 'event_invites';


// Export utilities
export { ID, Query };

// Debug logging
console.log('✅ Appwrite configuration loaded');
console.log('Database ID:', DATABASE_ID);
console.log('Communities Collections Ready:', {
    communities: COMMUNITIES_COLLECTION_ID,
    members: COMMUNITY_MEMBERS_COLLECTION_ID,
    activities: COMMUNITY_ACTIVITIES_COLLECTION_ID,
    posts: COMMUNITY_POSTS_COLLECTION_ID,
    invites: COMMUNITY_INVITES_COLLECTION_ID,
    joinRequests: COMMUNITY_JOIN_REQUESTS_COLLECTION_ID,
    notifications: COMMUNITY_NOTIFICATIONS_COLLECTION_ID
});