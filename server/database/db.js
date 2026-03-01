const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();
    
const connectDB = async () => {
    try {
        if (!process.env.MONGO_URI) {
            console.warn('MONGO_URI not set — skipping MongoDB connection');
            return;
        }

        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection failed:', error.message);
        console.error('Continuing without DB connection — some features will be disabled.');
        // Do NOT exit the process here; let the server run so frontend can connect.
    }
};

module.exports = connectDB;
