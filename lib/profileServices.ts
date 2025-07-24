import { databases, DATABASE_ID, USER_PROFILES_COLLECTION_ID, ID } from './appwrite';

export interface ExtendedProfileData {
  userId: string;
  name: string;
  email: string;
  dateOfBirth: string;
  disciplines: string[];
  bio?: string;
  location?: string;
  searchRadius?: number;
  availability?: {
    weekdays: string[];
    preferredTimes: string[];
  };
  languages?: string[];
  experienceLevels?: { [key: string]: string };
  phoneNumber?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  medicalInfo?: {
    conditions: string[];
    allergies: string[];
    bloodType: string;
  };
  notificationPreferences?: {
    email: boolean;
    sms: boolean;
    push: boolean;
    marketing: boolean;
  };
  profileComplete: boolean;
  isPublicProfile: boolean;
  provider: string;
}

export const createUserProfile = async (profileData: ExtendedProfileData) => {
  try {
    const document = await databases.createDocument(
      DATABASE_ID,
      USER_PROFILES_COLLECTION_ID,
      ID.unique(),
      {
        ...profileData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    );
    return document;
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

export const updateUserProfile = async (profileId: string, updates: Partial<ExtendedProfileData>) => {
  try {
    const document = await databases.updateDocument(
      DATABASE_ID,
      USER_PROFILES_COLLECTION_ID,
      profileId,
      {
        ...updates,
        updatedAt: new Date().toISOString()
      }
    );
    return document;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};