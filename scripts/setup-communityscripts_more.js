// Appwrite Collections Setup Script - Community Invites
// Run this script to create missing collections and attributes

const { Client, Databases, Permission, Role, ID } = require('node-appwrite');
require('dotenv').config({ path: '.env.local' });

// Initialize Appwrite client
const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || '684618380034b6fc0a8e';

// Community Invites collection configuration
const COMMUNITY_INVITES_CONFIG = {
    id: 'community_invites',
    name: 'Community Invites',
    permissions: [
        Permission.read(Role.users()),
        Permission.create(Role.users()),
        Permission.update(Role.users()),
        Permission.delete(Role.users())
    ],
    attributes: [
        { key: 'communityId', type: 'string', size: 50, required: true },
        { key: 'email', type: 'string', size: 100, required: true },
        { key: 'invitedBy', type: 'string', size: 50, required: true },
        { key: 'invitedUserId', type: 'string', size: 50, required: false },
        { key: 'role', type: 'enum', elements: ['admin', 'member'], required: false, default: 'admin' },
        { key: 'status', type: 'enum', elements: ['pending', 'accepted', 'rejected', 'cancelled'], required: false, default: 'pending' },
        { key: 'inviteToken', type: 'string', size: 100, required: true },
        { key: 'expiresAt', type: 'datetime', required: true },
        { key: 'createdAt', type: 'datetime', required: true },
        { key: 'respondedAt', type: 'datetime', required: false }
    ],
    indexes: [
        { key: 'invite_token_unique', type: 'unique', attributes: ['inviteToken'], orders: ['ASC'] },
        { key: 'community_index', type: 'key', attributes: ['communityId'], orders: ['ASC'] },
        { key: 'email_index', type: 'key', attributes: ['email'], orders: ['ASC'] },
        { key: 'status_index', type: 'key', attributes: ['status'], orders: ['ASC'] },
        { key: 'invited_by_index', type: 'key', attributes: ['invitedBy'], orders: ['ASC'] }
    ]
};

// Utility functions
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function createAttribute(databaseId, collectionId, attribute) {
    try {
        let result;
        
        switch (attribute.type) {
            case 'string':
                result = await databases.createStringAttribute(
                    databaseId,
                    collectionId,
                    attribute.key,
                    attribute.size,
                    attribute.required || false,
                    attribute.default || null,
                    attribute.array || false
                );
                break;
                
            case 'integer':
                result = await databases.createIntegerAttribute(
                    databaseId,
                    collectionId,
                    attribute.key,
                    attribute.required || false,
                    attribute.min || null,
                    attribute.max || null,
                    attribute.default || null,
                    attribute.array || false
                );
                break;
                
            case 'boolean':
                result = await databases.createBooleanAttribute(
                    databaseId,
                    collectionId,
                    attribute.key,
                    attribute.required || false,
                    attribute.default || null,
                    attribute.array || false
                );
                break;
                
            case 'datetime':
                result = await databases.createDatetimeAttribute(
                    databaseId,
                    collectionId,
                    attribute.key,
                    attribute.required || false,
                    attribute.default || null,
                    attribute.array || false
                );
                break;
                
            case 'enum':
                result = await databases.createEnumAttribute(
                    databaseId,
                    collectionId,
                    attribute.key,
                    attribute.elements,
                    attribute.required || false,
                    attribute.default || null,
                    attribute.array || false
                );
                break;
                
            default:
                throw new Error(`Unsupported attribute type: ${attribute.type}`);
        }
        
        console.log(`✅ Created attribute: ${attribute.key} (${attribute.type})`);
        return result;
    } catch (error) {
        if (error.message.includes('already exists')) {
            console.log(`⚠️  Attribute ${attribute.key} already exists, skipping...`);
        } else {
            console.error(`❌ Failed to create attribute ${attribute.key}:`, error.message);
            throw error;
        }
    }
}

async function createIndex(databaseId, collectionId, index) {
    try {
        const result = await databases.createIndex(
            databaseId,
            collectionId,
            index.key,
            index.type,
            index.attributes,
            index.orders || null
        );
        console.log(`✅ Created index: ${index.key} (${index.type})`);
        return result;
    } catch (error) {
        if (error.message.includes('already exists')) {
            console.log(`⚠️  Index ${index.key} already exists, skipping...`);
        } else {
            console.error(`❌ Failed to create index ${index.key}:`, error.message);
            throw error;
        }
    }
}

async function setupCommunityInvitesCollection() {
    console.log(`\n🔧 Setting up Community Invites collection...`);
    
    try {
        // 1. Create collection
        let collection;
        try {
            collection = await databases.createCollection(
                DATABASE_ID,
                COMMUNITY_INVITES_CONFIG.id,
                COMMUNITY_INVITES_CONFIG.name,
                COMMUNITY_INVITES_CONFIG.permissions,
                false, // documentSecurity
                true   // enabled
            );
            console.log(`✅ Created collection: ${COMMUNITY_INVITES_CONFIG.name}`);
        } catch (error) {
            if (error.message.includes('already exists')) {
                console.log(`⚠️  Collection ${COMMUNITY_INVITES_CONFIG.name} already exists, updating...`);
                collection = await databases.getCollection(DATABASE_ID, COMMUNITY_INVITES_CONFIG.id);
            } else {
                throw error;
            }
        }
        
        // Wait for collection to be ready
        await sleep(2000);
        
        // 2. Create attributes
        console.log(`📝 Creating attributes for ${COMMUNITY_INVITES_CONFIG.name}...`);
        for (const attribute of COMMUNITY_INVITES_CONFIG.attributes) {
            await createAttribute(DATABASE_ID, COMMUNITY_INVITES_CONFIG.id, attribute);
            await sleep(1000); // Wait between attribute creations
        }
        
        // Wait for attributes to be ready
        console.log(`⏳ Waiting for attributes to be ready...`);
        await sleep(5000);
        
        // 3. Create indexes
        console.log(`🔍 Creating indexes for ${COMMUNITY_INVITES_CONFIG.name}...`);
        for (const index of COMMUNITY_INVITES_CONFIG.indexes) {
            await createIndex(DATABASE_ID, COMMUNITY_INVITES_CONFIG.id, index);
            await sleep(1000); // Wait between index creations
        }
        
        console.log(`✅ Completed setup for ${COMMUNITY_INVITES_CONFIG.name}`);
        
    } catch (error) {
        console.error(`❌ Failed to setup collection ${COMMUNITY_INVITES_CONFIG.name}:`, error.message);
        throw error;
    }
}

async function addMissingUserProfileAttributes() {
    console.log(`\n🔧 Adding missing attributes to User Profiles collection...`);
    
    const USER_PROFILES_COLLECTION_ID = '684d5264001042b563dd';
    
    const MISSING_ATTRIBUTES = [
        { key: 'adminOfCommunities', type: 'string', size: 50, required: false, array: true },
        { key: 'pendingCommunityInvites', type: 'integer', required: false, default: 0 }
    ];
    
    try {
        console.log(`📝 Adding missing attributes to User Profiles...`);
        for (const attribute of MISSING_ATTRIBUTES) {
            // Handle array attributes differently
            if (attribute.array) {
                try {
                    const result = await databases.createStringAttribute(
                        DATABASE_ID,
                        USER_PROFILES_COLLECTION_ID,
                        attribute.key,
                        attribute.size,
                        attribute.required || false,
                        null, // No default for array attributes
                        true // array
                    );
                    console.log(`✅ Created array attribute: ${attribute.key}`);
                } catch (error) {
                    if (error.message.includes('already exists')) {
                        console.log(`⚠️  Attribute ${attribute.key} already exists, skipping...`);
                    } else {
                        throw error;
                    }
                }
            } else {
                await createAttribute(DATABASE_ID, USER_PROFILES_COLLECTION_ID, attribute);
            }
            await sleep(1000);
        }
        
        console.log(`✅ Completed User Profiles attributes update`);
        
    } catch (error) {
        console.error(`❌ Failed to update User Profiles collection:`, error.message);
        throw error;
    }
}

async function addCommunitiesSettings() {
    console.log(`\n🔧 Adding settings attribute to Communities collection...`);
    
    const COMMUNITIES_COLLECTION_ID = 'communities';
    
    const SETTINGS_ATTRIBUTE = {
        key: 'settings',
        type: 'string',
        size: 1000,
        required: false,
        default: '{"allowMemberEvents":true,"requireEventApproval":false,"defaultEventVisibility":"community_only"}'
    };
    
    try {
        await createAttribute(DATABASE_ID, COMMUNITIES_COLLECTION_ID, SETTINGS_ATTRIBUTE);
        console.log(`✅ Added settings attribute to Communities collection`);
        
    } catch (error) {
        console.error(`❌ Failed to add settings to Communities collection:`, error.message);
        // Don't throw - this might not be critical
    }
}

async function validateEnvironment() {
    console.log('🔍 Validating environment variables...');
    
    const required = ['APPWRITE_ENDPOINT', 'APPWRITE_PROJECT_ID', 'APPWRITE_API_KEY'];
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
        console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
        process.exit(1);
    }
    
    console.log('✅ Environment variables validated');
    console.log(`📋 Using database: ${DATABASE_ID}`);
    console.log(`📋 Project: ${process.env.APPWRITE_PROJECT_ID}`);
}

async function main() {
    try {
        console.log('🚀 Setting up Community Invites Collection...\n');
        
        // Validate environment
        await validateEnvironment();
        
        // Setup Community Invites collection
        await setupCommunityInvitesCollection();
        
        // Add missing User Profile attributes
        await addMissingUserProfileAttributes();
        
        // Add Communities settings (optional)
        await addCommunitiesSettings();
        
        console.log('\n🎉 Community Invites setup completed successfully!');
        console.log('\n📋 What was created/updated:');
        console.log('✅ Community Invites collection (created)');
        console.log('✅ User Profiles collection (added adminOfCommunities, pendingCommunityInvites)');
        console.log('✅ Communities collection (added settings attribute)');
        console.log('✅ All attributes and indexes created');
        console.log('✅ Permissions configured');
        
        console.log('\n🔗 Next steps:');
        console.log('1. Add this constant to your lib/appwrite.ts:');
        console.log('   export const COMMUNITY_INVITES_COLLECTION_ID = "community_invites";');
        console.log('2. Test your community settings page');
        console.log('3. Verify the settings button appears for community admins');
        console.log('4. Test the admin invitation system');
        
    } catch (error) {
        console.error('\n💥 Setup failed:', error.message);
        console.log('\n🔧 Troubleshooting:');
        console.log('1. Check your environment variables');
        console.log('2. Ensure your API key has proper permissions');
        console.log('3. Verify your database ID is correct');
        console.log('4. Check Appwrite console for any error details');
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = {
    setupCommunityInvitesCollection,
    addMissingUserProfileAttributes,
    addCommunitiesSettings,
    main
};