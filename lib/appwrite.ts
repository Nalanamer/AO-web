// lib/appwrite.ts - Appwrite configuration for web
import { Client, Account, Databases, ID, Query } from 'appwrite';

// Initialize Appwrite client
export const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

// Initialize services
export const account = new Account(client);
export const databases = new Databases(client);

// Database and Collection IDs
export const DATABASE_ID =  '684618380034b6fc0a8e';
export const ACTIVITIES_COLLECTION_ID = process.env.NEXT_PUBLIC_ACTIVITIES_COLLECTION_ID!;
export const EVENTS_COLLECTION_ID = process.env.NEXT_PUBLIC_EVENTS_COLLECTION_ID!;
export const COMMENTS_COLLECTION_ID = process.env.NEXT_PUBLIC_COMMENTS_COLLECTION_ID!;
export const USER_PROFILES_COLLECTION_ID = process.env.NEXT_PUBLIC_USER_PROFILES_COLLECTION_ID!;
export const APP_CONFIG_COLLECTION_ID = process.env.NEXT_PUBLIC_APP_CONFIG_COLLECTION_ID!;

// Export utilities
export { ID, Query };

// User interface matching your mobile app
export interface AppwriteUser {
    $id: string;
    email: string;
    name: string;
    emailVerification: boolean;
    registration: string;
}

export interface UserProfile {
    $id: string;
    userId: string;
    name: string;
    email: string;
    dateOfBirth: string | null;
    disciplines: string[];
    provider: string;
    profileComplete: boolean;
    isPublicProfile: boolean;
    location: string;
    searchRadius: number;
    locationCoords: any;
    availability: any;
    experienceLevels: any;
    phoneNumber: string | null;
    phoneVerified: boolean;
    emergencyContactV2: any;
    medicalInfo: any;
    notificationPreferences: any;
    onboardingProgress: any;
}

// Get user profile from database (same logic as mobile app)
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
        if (!USER_PROFILES_COLLECTION_ID || USER_PROFILES_COLLECTION_ID === 'userProfiles') {
            console.log('⚠️ User profiles collection not configured');
            return null;
        }

        const profiles = await databases.listDocuments(
            DATABASE_ID,
            USER_PROFILES_COLLECTION_ID,
            [Query.equal('userId', userId)]
        );

        if (profiles.documents.length === 0) {
            console.log('⚠️ No profile found for user:', userId);
            return null;
        }

        const profile = profiles.documents[0] as any;
        console.log('✅ Profile found for user:', userId);
        
        return {
            $id: profile.$id,
            userId: profile.userId,
            name: profile.name || '',
            email: profile.email || '',
            dateOfBirth: profile.dateOfBirth || null,
            disciplines: Array.isArray(profile.disciplines) ? profile.disciplines : [],
            provider: profile.provider || 'email',
            profileComplete: profile.profileComplete || false,
            isPublicProfile: profile.isPublicProfile || false,
            location: profile.location || '',
            searchRadius: profile.searchRadius ? parseInt(profile.searchRadius.toString()) : 50,
            locationCoords: profile.locationCoords || null,
            availability: profile.availability || null,
            experienceLevels: profile.experienceLevels || null,
            phoneNumber: profile.phoneNumber || null,
            phoneVerified: profile.phoneVerified || false,
            emergencyContactV2: profile.emergencyContactV2 || null,
            medicalInfo: profile.medicalInfo || null,
            notificationPreferences: profile.notificationPreferences || null,
            onboardingProgress: profile.onboardingProgress || null
        };
        
    } catch (error) {
        console.error('❌ Error fetching user profile:', error);
        return null;
    }
}

// Test connection function
export async function testAppwriteConnection() {
    try {
        const session = await account.get();
        console.log('✅ Appwrite connection successful:', session);
        return true;
    } catch (error) {
        console.log('⚠️ No active session (not logged in)');
        return false;
    }
}

// Debug logging for development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.log('✅ Appwrite initialized for web:', {
        endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT,
        project: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID,
        database: DATABASE_ID
    });
}