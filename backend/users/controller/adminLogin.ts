import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { generateAdminToken } from './jwtToken'; // Updated import
import dotenv from 'dotenv';

dotenv.config();

export interface AdminLogin {
    email: string;
    password: string;
}

export const loginAdmin = async (req: Request, res: Response) => {
    const { email, password }: AdminLogin = req.body;

    try {
        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        // Get admin credentials from environment variables
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;

        // Check if admin credentials are configured
        if (!adminEmail || !adminPassword) {
            console.error('Admin credentials not configured in environment variables');
            return res.status(500).json({
                success: false,
                message: "Admin system not configured"
            });
        }

        // Validate admin email
        if (email.toLowerCase().trim() !== adminEmail.toLowerCase().trim()) {
            return res.status(401).json({
                success: false,
                message: "Invalid admin credentials"
            });
        }

        // Validate admin password
        let isPasswordCorrect = false;
        
        try {
            // Check if password is hashed (bcrypt format)
            if (adminPassword.startsWith('$2b$') || adminPassword.startsWith('$2a$')) {
                // Compare with hashed password
                isPasswordCorrect = await bcrypt.compare(password, adminPassword);
            } else {
                // Compare plain text password
                isPasswordCorrect = password === adminPassword;
            }
        } catch (error) {
            console.error('Password comparison error:', error);
            return res.status(500).json({
                success: false,
                message: "Authentication error"
            });
        }

        if (!isPasswordCorrect) {
            return res.status(401).json({
                success: false,
                message: "Password you entered was incorrect"
            });
        }

        // Generate admin token using the updated function
        const token = generateAdminToken(adminEmail);

        // Set token as HTTP-only cookie
        res.cookie('adminToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
            path: '/'
        });

        // Log successful admin login
        console.log(`Admin login successful: ${adminEmail} at ${new Date().toISOString()}`);

        res.status(200).json({
            success: true,
            message: "Admin login successful",
            data: {
                email: adminEmail,
                role: 'admin',
                type: 'admin',
                loginTime: new Date().toISOString()
            },
            token // Include token in response for frontend storage if needed
        });

    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

export const logoutAdmin = async (req: Request, res: Response) => {
    
    res.clearCookie('token');
    res.status(200).json({
        success: true,
        message: 'Logged out successfully'
    });
    
};
