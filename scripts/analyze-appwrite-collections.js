// scripts/analyze-appwrite-collections.js
// Script to analyze all collections, attributes, and indexes in your Appwrite database

import { Client, Databases } from 'node-appwrite';
import fs from 'fs';
import path from 'path';

// Initialize Appwrite client
const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('682d91b9002f1d1323ca')  // Your project ID
    .setKey('standard_76e9dc3c615517a1677e99624a09ad005e08e5de6b4116f40736f51c854090dfe92fafa71a5cd24685c53a0a86322425ac9504496a73ea331529525a91aef5ce4c1e7cf63d161c1ff9244dedfb5b15d6cb0bfbfc147da99cd682449a03574516880af49da5b15308ae9f350f30390da4175fc69e6dfe5036015b7754d839a6c2');  // Replace with your API key
// analyze-appwrite-collections.js (CommonJS version)
//const { Client, Databases } = require('node-appwrite');
//const fs = require('fs');

const databases = new Databases(client);
const DATABASE_ID = '684618380034b6fc0a8e';

async function analyzeDatabase() {
    try {
        console.log('🔍 Analyzing Appwrite Database...');
        console.log(`📋 Database ID: ${DATABASE_ID}`);
        console.log('='.repeat(80));

        const collections = await databases.listCollections(DATABASE_ID);
        
        const analysis = {
            databaseId: DATABASE_ID,
            totalCollections: collections.total,
            collections: [],
            summary: {
                totalAttributes: 0,
                totalIndexes: 0,
                attributeTypes: {},
                collectionSizes: {}
            },
            generatedAt: new Date().toISOString()
        };

        console.log(`📊 Found ${collections.total} collections\n`);

        for (const collection of collections.collections) {
            console.log(`🔍 Analyzing: ${collection.name} (${collection.$id})`);
            
            const collectionData = {
                id: collection.$id,
                name: collection.name,
                enabled: collection.enabled,
                documentSecurity: collection.documentSecurity,
                attributes: [],
                indexes: [],
                permissions: collection.$permissions || []
            };

            // Get attributes
            try {
                const attributes = await databases.listAttributes(DATABASE_ID, collection.$id);
                collectionData.attributes = attributes.attributes.map(attr => ({
                    key: attr.key,
                    type: attr.type,
                    status: attr.status,
                    required: attr.required,
                    array: attr.array,
                    size: attr.size || null,
                    min: attr.min || null,
                    max: attr.max || null,
                    default: attr.default || null,
                    elements: attr.elements || null
                }));

                attributes.attributes.forEach(attr => {
                    analysis.summary.attributeTypes[attr.type] = (analysis.summary.attributeTypes[attr.type] || 0) + 1;
                });

                analysis.summary.totalAttributes += attributes.attributes.length;
                console.log(`  📝 Attributes: ${attributes.attributes.length}`);
            } catch (error) {
                console.log(`  ❌ Error getting attributes: ${error.message}`);
                collectionData.attributesError = error.message;
            }

            // Get indexes
            try {
                const indexes = await databases.listIndexes(DATABASE_ID, collection.$id);
                collectionData.indexes = indexes.indexes.map(index => ({
                    key: index.key,
                    type: index.type,
                    status: index.status,
                    attributes: index.attributes,
                    orders: index.orders || null
                }));

                analysis.summary.totalIndexes += indexes.indexes.length;
                console.log(`  📇 Indexes: ${indexes.indexes.length}`);
            } catch (error) {
                console.log(`  ❌ Error getting indexes: ${error.message}`);
                collectionData.indexesError = error.message;
            }

            analysis.summary.collectionSizes[collection.name] = {
                attributes: collectionData.attributes.length,
                indexes: collectionData.indexes.length
            };

            analysis.collections.push(collectionData);
            console.log(`  ✅ Complete\n`);
        }

        // Generate report
        console.log('📊 SUMMARY REPORT');
        console.log('='.repeat(80));
        console.log(`Total Collections: ${analysis.totalCollections}`);
        console.log(`Total Attributes: ${analysis.summary.totalAttributes}`);
        console.log(`Total Indexes: ${analysis.summary.totalIndexes}`);
        
        console.log('\n📋 Attribute Types Distribution:');
        Object.entries(analysis.summary.attributeTypes).forEach(([type, count]) => {
            console.log(`  ${type}: ${count}`);
        });

        console.log('\n📏 Collection Sizes:');
        Object.entries(analysis.summary.collectionSizes).forEach(([name, sizes]) => {
            console.log(`  ${name}: ${sizes.attributes} attributes, ${sizes.indexes} indexes`);
        });

        // Detailed breakdown
        console.log('\n🔍 DETAILED BREAKDOWN');
        console.log('='.repeat(80));

        analysis.collections.forEach(collection => {
            console.log(`\n📁 ${collection.name.toUpperCase()} (${collection.id})`);
            console.log(`Status: ${collection.enabled ? 'Enabled' : 'Disabled'}`);
            
            if (collection.attributes.length > 0) {
                console.log('\n  📝 ATTRIBUTES:');
                collection.attributes.forEach(attr => {
                    const details = [];
                    if (attr.required) details.push('required');
                    if (attr.array) details.push('array');
                    if (attr.size) details.push(`size:${attr.size}`);
                    if (attr.default !== null) details.push(`default:${attr.default}`);
                    if (attr.elements) details.push(`elements:[${attr.elements.join(',')}]`);
                    
                    console.log(`    ${attr.key}: ${attr.type} ${details.length ? `(${details.join(', ')})` : ''}`);
                });
            }

            if (collection.indexes.length > 0) {
                console.log('\n  📇 INDEXES:');
                collection.indexes.forEach(index => {
                    const orders = index.orders ? ` [${index.orders.join(',')}]` : '';
                    console.log(`    ${index.key}: ${index.type} on [${index.attributes.join(', ')}]${orders}`);
                });
            }
        });

        // Save to file
        fs.writeFileSync('appwrite-analysis.json', JSON.stringify(analysis, null, 2));
        console.log('\n💾 Analysis saved to: appwrite-analysis.json');
        
        return analysis;

    } catch (error) {
        console.error('❌ Error analyzing database:', error.message);
        throw error;
    }
}

// Run the analysis
if (require.main === module) {
    analyzeDatabase()
        .then(() => {
            console.log('\n🚀 Analysis complete!');
        })
        .catch((error) => {
            console.error('💥 Analysis failed:', error.message);
        });
}