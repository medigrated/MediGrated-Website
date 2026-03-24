/**
 * One-time script to clear all collections from the database.
 * Run with: node scripts/clearDatabase.js
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function clearDatabase() {
    try {
        if (!process.env.MONGO_URI) {
            console.error('MONGO_URI not set.');
            process.exit(1);
        }

        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Connected to MongoDB');

        const collections = await mongoose.connection.db.listCollections().toArray();
        for (const col of collections) {
            await mongoose.connection.db.dropCollection(col.name);
            console.log(`  Dropped collection: ${col.name}`);
        }

        console.log('\n✅ All collections cleared successfully!');
        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('Error clearing database:', error.message);
        process.exit(1);
    }
}

clearDatabase();
