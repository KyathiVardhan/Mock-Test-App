import express from "express";
import cors from 'cors';
import cookieParser from 'cookie-parser';

import { registerUser } from "./controller/userRegistration";
import { connectDB } from "./db/db";
import { loginUser } from "./controller/userLogin";
import testRoutes from "./routes/testRoutes";
import adminRoutes from '../users/routes/adminRoutes'
import examRoutes from '../users/routes/examRoutes'

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));

connectDB();

app.use("/api/register", registerUser);
app.use("/api/login", loginUser);
app.use("/api/tests", testRoutes);
app.use("/api/admin/", adminRoutes);
app.use("/api/exams/", examRoutes)

// Logout endpoint
app.post("/api/logout", (req, res) => {
    res.clearCookie('token');
    res.status(200).json({
        success: true,
        message: 'Logged out successfully'
    });
});

const port = 5000;

const server = async (Promise: void) => {
    try {
        app.listen(port, () => {
            console.log(`port is running at ${port}`)
        });
    } catch (error) {
        console.log("port is not running properly");
        process.exit(1);
    }
}

server();