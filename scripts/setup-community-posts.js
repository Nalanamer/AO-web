// scripts/setup-community-posts.js
// Script to create the Community Posts collection programmatically

const { Client, Databases, Permission, Role, ID } = require('node-appwrite');
require('dotenv').config({ path: '.env.local' });

// Initialize Appwrite client
const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || '684618380034b6fc0a8e';

// Community Posts collection configuration
const COMMUNITY_POSTS_CONFIG = {
    id: 'community_posts',
    name: 'Community Posts',
    permissions: [
        Permission.read(Role.users()),
        Permission.create(Role.users()),
        Permission.update(Role.users()),
        Permission.delete(Role.users())
    ],
    attributes: [
        { key: 'communityId', type: 'string', size: 50, required: true },
        { key: 'authorId', type: 'string', size: 50, required: true },
        { key: 'authorName', type: 'string', size: 100, required: true },
        { key: 'content', type: 'string', size: 2000, required: true },
        { key: 'type', type: 'enum', elements: ['post', 'announcement'], required: true },
        { key: 'isPinned', type: 'boolean', required: false },
        { key: 'likeCount', type: 'integer', required: true },
        { key: 'commentCount', type: 'integer', required: true },
        { key: 'images', type: 'string', size: 1000, required: false, default: '[]' },
        { key: 'createdAt', type: 'datetime', required: true },
        { key: 'updatedAt', type: 'datetime', required: true }
    ],
    indexes: [
        { key: 'communityId', type: 'key', attributes: ['communityId'], orders: ['ASC'] },
        { key: 'authorId', type: 'key', attributes: ['authorId'], orders: ['ASC'] },
        { key: 'type', type: 'key', attributes: ['type'], orders: ['ASC'] },
        { key: 'isPinned', type: 'key', attributes: ['isPinned'], orders: ['DESC'] },
        { key: 'createdAt', type: 'key', attributes: ['createdAt'], orders: ['DESC'] },
        { key: 'community_created', type: 'key', attributes: ['communityId', 'createdAt'], orders: ['ASC', 'DESC'] }
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

async function setupCommunityPostsCollection() {
    console.log(`\n🔧 Setting up Community Posts collection...`);
    
    try {
        // 1. Create collection
        let collection;
        try {
            collection = await databases.createCollection(
                DATABASE_ID,
                COMMUNITY_POSTS_CONFIG.id,
                COMMUNITY_POSTS_CONFIG.name,
                COMMUNITY_POSTS_CONFIG.permissions,
                false, // documentSecurity
                true   // enabled
            );
            console.log(`✅ Created collection: ${COMMUNITY_POSTS_CONFIG.name}`);
        } catch (error) {
            if (error.message.includes('already exists')) {
                console.log(`⚠️  Collection ${COMMUNITY_POSTS_CONFIG.name} already exists, updating...`);
                collection = await databases.getCollection(DATABASE_ID, COMMUNITY_POSTS_CONFIG.id);
            } else {
                throw error;
            }
        }
        
        // Wait for collection to be ready
        await sleep(2000);
        
        // 2. Create attributes
        console.log(`📝 Creating attributes for ${COMMUNITY_POSTS_CONFIG.name}...`);
        for (const attribute of COMMUNITY_POSTS_CONFIG.attributes) {
            await createAttribute(DATABASE_ID, COMMUNITY_POSTS_CONFIG.id, attribute);
            await sleep(1000); // Wait between attribute creations
        }
        
        // Wait for attributes to be ready
        console.log(`⏳ Waiting for attributes to be ready...`);
        await sleep(5000);
        
        // 3. Create indexes
        console.log(`🔍 Creating indexes for ${COMMUNITY_POSTS_CONFIG.name}...`);
        for (const index of COMMUNITY_POSTS_CONFIG.indexes) {
            await createIndex(DATABASE_ID, COMMUNITY_POSTS_CONFIG.id, index);
            await sleep(1000); // Wait between index creations
        }
        
        console.log(`✅ Completed setup for ${COMMUNITY_POSTS_CONFIG.name}`);
        
    } catch (error) {
        console.error(`❌ Failed to setup collection ${COMMUNITY_POSTS_CONFIG.name}:`, error.message);
        throw error;
    }
}

async function finishCommunityActivitiesCollection() {
    console.log(`\n🔧 Completing Community Activities collection...`);
    
    const MISSING_ATTRIBUTES = [
        { key: 'isVisible', type: 'boolean', required: true },
        { key: 'createdAt', type: 'datetime', required: true },
        { key: 'updatedAt', type: 'datetime', required: true }
    ];
    
    const MISSING_INDEXES = [
        { key: 'isVisible', type: 'key', attributes: ['isVisible'], orders: ['ASC'] },
        { key: 'createdAt', type: 'key', attributes: ['createdAt'], orders: ['DESC'] },
        { key: 'community_activity', type: 'unique', attributes: ['communityId', 'activityId'], orders: ['ASC', 'ASC'] }
    ];
    
    try {
        // Add missing attributes
        console.log(`📝 Adding missing attributes to Community Activities...`);
        for (const attribute of MISSING_ATTRIBUTES) {
            await createAttribute(DATABASE_ID, 'community_activities', attribute);
            await sleep(1000);
        }
        
        // Wait for attributes to be ready
        console.log(`⏳ Waiting for attributes to be ready...`);
        await sleep(3000);
        
        // Add missing indexes
        console.log(`🔍 Adding missing indexes to Community Activities...`);
        for (const index of MISSING_INDEXES) {
            await createIndex(DATABASE_ID, 'community_activities', index);
            await sleep(1000);
        }
        
        console.log(`✅ Completed Community Activities collection`);
        
    } catch (error) {
        console.error(`❌ Failed to complete Community Activities collection:`, error.message);
        throw error;
    }
}

async function updateEventsCollection() {
    console.log(`\n🔧 Adding community support to Events collection...`);
    
    const EVENTS_COLLECTION_ID = '684d043c00216aef747f';
    
    const NEW_ATTRIBUTES = [
        { key: 'communityId', type: 'string', size: 50, required: false },
        { key: 'eventVisibility', type: 'enum', elements: ['public', 'community_only'], required: false },
        { key: 'isFromCommunity', type: 'boolean', required: false }
    ];
    
    const NEW_INDEXES = [
        { key: 'communityId', type: 'key', attributes: ['communityId'], orders: ['ASC'] },
        { key: 'eventVisibility', type: 'key', attributes: ['eventVisibility'], orders: ['ASC'] },
        { key: 'isFromCommunity', type: 'key', attributes: ['isFromCommunity'], orders: ['ASC'] }
    ];
    
    try {
        // Add new attributes
        console.log(`📝 Adding community attributes to Events collection...`);
        for (const attribute of NEW_ATTRIBUTES) {
            await createAttribute(DATABASE_ID, EVENTS_COLLECTION_ID, attribute);
            await sleep(1000);
        }
        
        // Wait for attributes to be ready
        console.log(`⏳ Waiting for attributes to be ready...`);
        await sleep(3000);
        
        // Add new indexes
        console.log(`🔍 Adding community indexes to Events collection...`);
        for (const index of NEW_INDEXES) {
            await createIndex(DATABASE_ID, EVENTS_COLLECTION_ID, index);
            await sleep(1000);
        }
        
        console.log(`✅ Updated Events collection with community support`);
        
    } catch (error) {
        console.error(`❌ Failed to update Events collection:`, error.message);
        throw error;
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
}

async function main() {
    try {
        console.log('🚀 Completing Communities Database Setup...\n');
        
        // Validate environment
        await validateEnvironment();
        
        // Complete Community Activities collection
        await finishCommunityActivitiesCollection();
        
        // Setup Community Posts collection
        await setupCommunityPostsCollection();
        
        // Update Events collection
        await updateEventsCollection();
        
        console.log('\n🎉 Communities database setup completed successfully!');
        console.log('\n📋 Final Summary:');
        console.log('✅ Communities collection (already completed)');
        console.log('✅ Community Members collection (already completed)');
        console.log('✅ Community Activities collection (now completed)');
        console.log('✅ Community Posts collection (now created)');
        console.log('✅ Events collection (now updated with community support)');
        console.log('✅ All attributes and indexes created');
        console.log('✅ Permissions configured');
        
        console.log('\n🔗 Next steps:');
        console.log('1. Update your lib/appwrite.ts with the new collection IDs');
        console.log('2. Add the CommunityService to your project');
        console.log('3. Test the basic functionality');
        console.log('4. Start building the UI components');
        
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
    setupCommunityPostsCollection,
    finishCommunityActivitiesCollection,
    updateEventsCollection,
    main
};