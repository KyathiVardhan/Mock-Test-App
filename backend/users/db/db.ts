import mongoose from "mongoose";
import dotenv from 'dotenv'

dotenv.config();

export const connectDB = async (Promise:void) => {
    try {
        const mongoUrl = process.env.MONGO_URL;
        if (!mongoUrl) {
            throw new Error("MONGO_URL environment variable is not defined.");
        }
        const connect = await mongoose.connect(mongoUrl);
        if (connect) {
            console.log("connected to mongodb")
        }
        
    } catch (error) {
        console.error('Database connection error:', error);
        process.exit(1);
    }
}