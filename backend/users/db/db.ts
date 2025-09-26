import mongoose from "mongoose";
import dotenv from 'dotenv'

dotenv.config();

export const connectDB = async (): Promise<void> => {
    try {
        const mongoUrl = process.env.MONGO_URL;
        if (!mongoUrl) {
            throw new Error("MONGO_URL environment variable is not defined. Please create a .env file with your MongoDB connection string.");
        }
        
        // Connection options for better timeout handling (keep URI write concerns in MONGO_URL)
        const options = {
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 45000,
            connectTimeoutMS: 30000,
            maxPoolSize: 10,
            minPoolSize: 5,
            maxIdleTimeMS: 30000
        } as const;

        const connect = await mongoose.connect(mongoUrl, options);
        if (connect) {
            console.log("✅ Connected to MongoDB successfully");
        }
        
    } catch (error) {
        console.error('❌ Database connection error:', error);
        console.log('\n🔧 Troubleshooting steps:');
        console.log('1. Check your MongoDB Atlas IP whitelist (add 0.0.0.0/0 for testing)');
        console.log('2. Verify your connection string in .env file');
        console.log('3. Ensure your MongoDB cluster is running');
        console.log('4. Check your network connection');
        process.exit(1);
    }
}