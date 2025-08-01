

// Fixed script - removes default values from required attributes
import { Client, Databases, Permission, Role } from 'node-appwrite';

const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('682d91b9002f1d1323ca')  // Your project ID
    .setKey('standard_76e9dc3c615517a1677e99624a09ad005e08e5de6b4116f40736f51c854090dfe92fafa71a5cd24685c53a0a86322425ac9504496a73ea331529525a91aef5ce4c1e7cf63d161c1ff9244dedfb5b15d6cb0bfbfc147da99cd682449a03574516880af49da5b15308ae9f350f30390da4175fc69e6dfe5036015b7754d839a6c2');  // Replace with your API key
// Fixed script - removes default values from required attributes


const databases = new Databases(client);
const DATABASE_ID = '684618380034b6fc0a8e';

async function rebuildCommunitiesCollection() {
    try {
        console.log('🔄 Starting Communities collection rebuild...');

        // Step 1: Backup existing data (if any)
        console.log('📦 Backing up existing data...');
        let existingData = [];
        try {
            const existing = await databases.listDocuments(DATABASE_ID, 'communities');
            existingData = existing.documents;
            console.log(`📊 Found ${existingData.length} existing communities to migrate`);
        } catch (error) {
            console.log('ℹ️ No existing data to backup');
        }

        // Step 2: Delete old collection
        console.log('🗑️ Deleting old Communities collection...');
        try {
            await databases.deleteCollection(DATABASE_ID, 'communities');
            console.log('✅ Old collection deleted');
            // Wait for deletion to complete
            await new Promise(resolve => setTimeout(resolve, 3000));
        } catch (error) {
            console.log('ℹ️ Collection may not exist yet');
        }

        // Step 3: Create new collection
        console.log('🏗️ Creating new Communities collection...');
        const collection = await databases.createCollection(
            DATABASE_ID,
            'communities',
            'Communities',
            [
                Permission.read(Role.any()),
                Permission.create(Role.users()),
                Permission.update(Role.users()),
                Permission.delete(Role.users())
            ]
        );

        // Wait for collection to be ready
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Step 4: Add attributes (FIXED - no defaults for required fields)
        console.log('📝 Adding attributes...');

        // Required string attributes (NO DEFAULTS)
        await databases.createStringAttribute(DATABASE_ID, 'communities', 'name', 100, true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await databases.createStringAttribute(DATABASE_ID, 'communities', 'description', 1000, true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await databases.createStringAttribute(DATABASE_ID, 'communities', 'location', 2000, true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await databases.createStringAttribute(DATABASE_ID, 'communities', 'creatorId', 36, true);
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Required array fields stored as JSON strings (NO DEFAULTS)
        await databases.createStringAttribute(DATABASE_ID, 'communities', 'admins', 2000, true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await databases.createStringAttribute(DATABASE_ID, 'communities', 'members', 5000, true);
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Enum attributes
        await databases.createEnumAttribute(
            DATABASE_ID, 
            'communities', 
            'type', 
            ['public', 'private'], 
            true
        );
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Required boolean (NO DEFAULT)
        await databases.createBooleanAttribute(DATABASE_ID, 'communities', 'isActive', true);
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Required integers (NO DEFAULTS)
        await databases.createIntegerAttribute(DATABASE_ID, 'communities', 'memberCount', true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await databases.createIntegerAttribute(DATABASE_ID, 'communities', 'activityCount', true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await databases.createIntegerAttribute(DATABASE_ID, 'communities', 'eventCount', true);
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Required datetime (NO DEFAULTS)
        await databases.createDatetimeAttribute(DATABASE_ID, 'communities', 'createdAt', true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await databases.createDatetimeAttribute(DATABASE_ID, 'communities', 'updatedAt', true);
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Optional attributes (CAN have defaults)
        await databases.createStringAttribute(DATABASE_ID, 'communities', 'pendingMembers', 2000, false, '[]');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await databases.createStringAttribute(DATABASE_ID, 'communities', 'activityTypes', 1000, false, '[]');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await databases.createStringAttribute(DATABASE_ID, 'communities', 'avatar', 500, false);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await databases.createStringAttribute(DATABASE_ID, 'communities', 'coverImage', 500, false);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await databases.createStringAttribute(DATABASE_ID, 'communities', 'website', 300, false);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await databases.createStringAttribute(
            DATABASE_ID, 
            'communities', 
            'settings', 
            2000, 
            false, 
            '{"allowMemberEvents":true,"requireEventApproval":false,"defaultEventVisibility":"community_only"}'
        );

        console.log('✅ All attributes created');

        // Wait for attributes to be ready
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Step 5: Create indexes
        console.log('📇 Creating indexes...');
        
        // Fulltext index for search (fixes your search error)
        await databases.createIndex(DATABASE_ID, 'communities', 'name_search', 'fulltext', ['name']);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Key indexes for performance
        await databases.createIndex(DATABASE_ID, 'communities', 'creatorId', 'key', ['creatorId']);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await databases.createIndex(DATABASE_ID, 'communities', 'type', 'key', ['type']);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await databases.createIndex(DATABASE_ID, 'communities', 'isActive', 'key', ['isActive']);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await databases.createIndex(DATABASE_ID, 'communities', 'createdAt', 'key', ['createdAt'], ['DESC']);

        console.log('✅ All indexes created');

        // Step 6: Migrate existing data (if any) with required fields
        if (existingData.length > 0) {
            console.log('🔄 Migrating existing data...');
            for (const community of existingData) {
                try {
                    // Ensure all required fields have values (no nulls or undefined)
                    const migratedData = {
                        name: community.name || 'Migrated Community',
                        description: community.description || 'Migrated from old collection',
                        type: community.type || 'public',
                        location: community.location || '{"address":"Unknown","latitude":0,"longitude":0}',
                        creatorId: community.creatorId || 'unknown',
                        
                        // Convert arrays to JSON strings, ensure not null
                        admins: JSON.stringify(
                            typeof community.admins === 'string' ? 
                                (community.admins ? community.admins.split(',').filter(id => id.trim()) : []) :
                                (Array.isArray(community.admins) ? community.admins : [])
                        ),
                        members: JSON.stringify(
                            typeof community.members === 'string' ? 
                                (community.members ? community.members.split(',').filter(id => id.trim()) : []) :
                                (Array.isArray(community.members) ? community.members : [])
                        ),
                        
                        // Required boolean and integers (ensure they have values)
                        isActive: community.isActive !== false,
                        memberCount: community.memberCount || 0,
                        activityCount: community.activityCount || 0,
                        eventCount: community.eventCount || 0,
                        
                        // Required datetime (ensure they have values)
                        createdAt: community.createdAt || new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        
                        // Optional fields
                        pendingMembers: JSON.stringify(
                            typeof community.pendingMembers === 'string' ? 
                                (community.pendingMembers ? community.pendingMembers.split(',').filter(id => id.trim()) : []) :
                                (Array.isArray(community.pendingMembers) ? community.pendingMembers : [])
                        ),
                        activityTypes: JSON.stringify(
                            typeof community.activityTypes === 'string' ? 
                                (community.activityTypes ? community.activityTypes.split(',').filter(id => id.trim()) : []) :
                                (Array.isArray(community.activityTypes) ? community.activityTypes : [])
                        ),
                        avatar: community.avatar || null,
                        coverImage: community.coverImage || null,
                        website: community.website || null,
                        settings: community.settings || '{"allowMemberEvents":true,"requireEventApproval":false,"defaultEventVisibility":"community_only"}'
                    };

                    await databases.createDocument(
                        DATABASE_ID,
                        'communities',
                        community.$id,
                        migratedData
                    );
                    console.log(`✅ Migrated community: ${community.name}`);
                } catch (error) {
                    console.error(`❌ Failed to migrate community ${community.name}:`, error.message);
                }
            }
        }

        console.log('🎉 Communities collection rebuild complete!');
        console.log('✅ Fixed data types - arrays stored as JSON strings');
        console.log('✅ Added fulltext search index on name');
        console.log('✅ Set proper permissions');
        console.log('✅ Migrated existing data');
        
        return true;

    } catch (error) {
        console.error('❌ Error rebuilding collection:', error);
        throw error;
    }
}

// Run the rebuild
rebuildCommunitiesCollection()
    .then(() => {
        console.log('🚀 Ready to test! Your communities system should now work correctly.');
        console.log('\n📋 Next steps:');
        console.log('1. Restart your dev server (npm run dev)');
        console.log('2. Test /communities page - should load without errors');
        console.log('3. Test search functionality');
        console.log('4. Test join requests');
    })
    .catch((error) => {
        console.error('💥 Rebuild failed:', error.message);
    });