// scripts/setup-communities-database.js
// Programmatic setup script for Communities collections in Appwrite

const { Client, Databases, Permission, Role, ID } = require('node-appwrite');
require('dotenv').config({ path: '.env.local' });


// Initialize Appwrite client
const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY); // Server API key required

const databases = new Databases(client);

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || '684618380034b6fc0a8e';

// Collection definitions
const COLLECTIONS = {
    communities: {
        id: 'communities',
        name: 'Communities',
        permissions: [
            Permission.read(Role.users()),
            Permission.create(Role.users()),
            Permission.update(Role.users()),
            Permission.delete(Role.users())
        ],
        attributes: [
            { key: 'name', type: 'string', size: 100, required: true },
            { key: 'description', type: 'string', size: 500, required: true },
            { key: 'type', type: 'enum', elements: ['public', 'private'], required: true },
            { key: 'location', type: 'string', size: 500, required: true },
            { key: 'creatorId', type: 'string', size: 50, required: true },
            { key: 'admins', type: 'string', size: 1000, required: true },
            { key: 'members', type: 'string', size: 5000, required: true },
            { key: 'pendingMembers', type: 'string', size: 1000, required: false, default: '[]' },
            { key: 'activityTypes', type: 'string', size: 500, required: false, default: '[]' },
            { key: 'avatar', type: 'string', size: 255, required: false },
            { key: 'coverImage', type: 'string', size: 255, required: false },
            { key: 'website', type: 'string', size: 255, required: false },
            { key: 'isActive', type: 'boolean', required: true },
            { key: 'memberCount', type: 'integer', required: true },
            { key: 'activityCount', type: 'integer', required: true },
            { key: 'eventCount', type: 'integer', required: true },
            { key: 'createdAt', type: 'datetime', required: true },
            { key: 'updatedAt', type: 'datetime', required: true }
        ],
        indexes: [
            { key: 'name', type: 'key', attributes: ['name'], orders: ['ASC'] },
            { key: 'type', type: 'key', attributes: ['type'], orders: ['ASC'] },
            { key: 'creatorId', type: 'key', attributes: ['creatorId'], orders: ['ASC'] },
            { key: 'isActive', type: 'key', attributes: ['isActive'], orders: ['ASC'] },
            { key: 'memberCount', type: 'key', attributes: ['memberCount'], orders: ['DESC'] },
            { key: 'createdAt', type: 'key', attributes: ['createdAt'], orders: ['DESC'] }
        ]
    },
    
    community_members: {
        id: 'community_members',
        name: 'Community Members',
        permissions: [
            Permission.read(Role.users()),
            Permission.create(Role.users()),
            Permission.update(Role.users()),
            Permission.delete(Role.users())
        ],
        attributes: [
            { key: 'communityId', type: 'string', size: 50, required: true },
            { key: 'userId', type: 'string', size: 50, required: true },
            { key: 'role', type: 'enum', elements: ['owner', 'admin', 'member'], required: true },
            { key: 'status', type: 'enum', elements: ['active', 'pending', 'rejected'], required: true },
            { key: 'joinedAt', type: 'datetime', required: true },
            { key: 'invitedBy', type: 'string', size: 50, required: false },
            { key: 'lastActiveAt', type: 'datetime', required: false },
            { key: 'notifications', type: 'boolean', required: true }
        ],
        indexes: [
            { key: 'communityId', type: 'key', attributes: ['communityId'], orders: ['ASC'] },
            { key: 'userId', type: 'key', attributes: ['userId'], orders: ['ASC'] },
            { key: 'status', type: 'key', attributes: ['status'], orders: ['ASC'] },
            { key: 'role', type: 'key', attributes: ['role'], orders: ['ASC'] },
            { key: 'joinedAt', type: 'key', attributes: ['joinedAt'], orders: ['DESC'] },
            { key: 'community_user', type: 'unique', attributes: ['communityId', 'userId'], orders: ['ASC', 'ASC'] }
        ]
    },
    
    community_activities: {
        id: 'community_activities',
        name: 'Community Activities',
        permissions: [
            Permission.read(Role.users()),
            Permission.create(Role.users()),
            Permission.update(Role.users()),
            Permission.delete(Role.users())
        ],
        attributes: [
            { key: 'communityId', type: 'string', size: 50, required: true },
            { key: 'activityId', type: 'string', size: 50, required: true },
            { key: 'addedBy', type: 'string', size: 50, required: true },
            { key: 'isPinned', type: 'boolean', required: false, default: false },
            { key: 'notes', type: 'string', size: 500, required: false },
            { key: 'isVisible', type: 'boolean', required: true, default: true },
            { key: 'createdAt', type: 'datetime', required: true },
            { key: 'updatedAt', type: 'datetime', required: true }
        ],
        indexes: [
            { key: 'communityId', type: 'key', attributes: ['communityId'], orders: ['ASC'] },
            { key: 'activityId', type: 'key', attributes: ['activityId'], orders: ['ASC'] },
            { key: 'addedBy', type: 'key', attributes: ['addedBy'], orders: ['ASC'] },
            { key: 'isVisible', type: 'key', attributes: ['isVisible'], orders: ['ASC'] },
            { key: 'createdAt', type: 'key', attributes: ['createdAt'], orders: ['DESC'] },
            { key: 'community_activity', type: 'unique', attributes: ['communityId', 'activityId'], orders: ['ASC', 'ASC'] }
        ]
    },
    
    community_posts: {
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
    }
};

// Events collection updates
const EVENTS_UPDATES = {
    collectionId: '684d043c00216aef747f', // Your existing Events collection ID
    newAttributes: [
        { key: 'communityId', type: 'string', size: 50, required: false },
        { key: 'eventVisibility', type: 'enum', elements: ['public', 'community_only'], required: false },
        { key: 'isFromCommunity', type: 'boolean', required: false }
    ],
    newIndexes: [
        { key: 'communityId', type: 'key', attributes: ['communityId'], orders: ['ASC'] },
        { key: 'eventVisibility', type: 'key', attributes: ['eventVisibility'], orders: ['ASC'] },
        { key: 'isFromCommunity', type: 'key', attributes: ['isFromCommunity'], orders: ['ASC'] }
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

async function setupCollection(collectionConfig) {
    console.log(`\n🔧 Setting up collection: ${collectionConfig.name}`);
    
    try {
        // Create collection
        let collection;
        try {
            collection = await databases.createCollection(
                DATABASE_ID,
                collectionConfig.id,
                collectionConfig.name,
                collectionConfig.permissions,
                false, // documentSecurity
                true   // enabled
            );
            console.log(`✅ Created collection: ${collectionConfig.name}`);
        } catch (error) {
            if (error.message.includes('already exists')) {
                console.log(`⚠️  Collection ${collectionConfig.name} already exists, updating...`);
                collection = await databases.getCollection(DATABASE_ID, collectionConfig.id);
            } else {
                throw error;
            }
        }
        
        // Wait for collection to be ready
        await sleep(2000);
        
        // Create attributes
        console.log(`📝 Creating attributes for ${collectionConfig.name}...`);
        for (const attribute of collectionConfig.attributes) {
            await createAttribute(DATABASE_ID, collectionConfig.id, attribute);
            await sleep(1000); // Wait between attribute creations
        }
        
        // Wait for attributes to be ready
        console.log(`⏳ Waiting for attributes to be ready...`);
        await sleep(5000);
        
        // Create indexes
        console.log(`🔍 Creating indexes for ${collectionConfig.name}...`);
        for (const index of collectionConfig.indexes) {
            await createIndex(DATABASE_ID, collectionConfig.id, index);
            await sleep(1000); // Wait between index creations
        }
        
        console.log(`✅ Completed setup for ${collectionConfig.name}`);
        
    } catch (error) {
        console.error(`❌ Failed to setup collection ${collectionConfig.name}:`, error.message);
        throw error;
    }
}

async function updateEventsCollection() {
    console.log(`\n🔧 Updating Events collection with community support...`);
    
    try {
        // Add new attributes
        console.log(`📝 Adding new attributes to Events collection...`);
        for (const attribute of EVENTS_UPDATES.newAttributes) {
            await createAttribute(DATABASE_ID, EVENTS_UPDATES.collectionId, attribute);
            await sleep(1000);
        }
        
        // Wait for attributes to be ready
        console.log(`⏳ Waiting for attributes to be ready...`);
        await sleep(3000);
        
        // Add new indexes
        console.log(`🔍 Adding new indexes to Events collection...`);
        for (const index of EVENTS_UPDATES.newIndexes) {
            await createIndex(DATABASE_ID, EVENTS_UPDATES.collectionId, index);
            await sleep(1000);
        }
        
        console.log(`✅ Updated Events collection successfully`);
        
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
        console.log('\nPlease create a .env file with:');
        console.log('APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1');
        console.log('APPWRITE_PROJECT_ID=your_project_id');
        console.log('APPWRITE_API_KEY=your_server_api_key');
        console.log('APPWRITE_DATABASE_ID=684618380034b6fc0a8e');
        process.exit(1);
    }
    
    console.log('✅ Environment variables validated');
    console.log(`📋 Using database: ${DATABASE_ID}`);
}

async function main() {
    try {
        console.log('🚀 Starting Communities Database Setup...\n');
        
        // Validate environment
        await validateEnvironment();
        
        // Setup each collection
        for (const [key, config] of Object.entries(COLLECTIONS)) {
            await setupCollection(config);
        }
        
        // Update Events collection
        await updateEventsCollection();
        
        console.log('\n🎉 Communities database setup completed successfully!');
        console.log('\n📋 Summary:');
        console.log('✅ Communities collection created');
        console.log('✅ Community Members collection created');
        console.log('✅ Community Activities collection created');
        console.log('✅ Community Posts collection created');
        console.log('✅ Events collection updated with community support');
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

// Export for potential programmatic use
module.exports = {
    COLLECTIONS,
    EVENTS_UPDATES,
    setupCollection,
    updateEventsCollection,
    main
};

// Run if called directly
if (require.main === module) {
    main();
}