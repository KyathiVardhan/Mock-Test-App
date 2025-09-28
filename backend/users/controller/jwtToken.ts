import jwt from 'jsonwebtoken';
import { IUser } from '../models/registerUser';

// Define payload interface for regular users
interface JWTPayload {
    userId: string;
    email: string;
    name: string;
    isVerified?: boolean;
}

// Define payload interface for admin users
interface AdminJWTPayload {
    adminId: string;
    email: string;
    role: string;
    type: 'admin';
}

// Generate JWT Token for regular users
export const generateToken = (user: IUser): string => {
    const payload: JWTPayload = {
        userId: user._id.toString(),
        email: user.email,
        name: user.name,
        isVerified: user.isVerified
    };

    // Create token with secret and expiration
    const token = jwt.sign(
        payload,
        process.env.JWT_SECRET as jwt.Secret,
        {
            expiresIn: typeof process.env.JWT_EXPIRE === 'string' ? process.env.JWT_EXPIRE : '7d',
            issuer: 'legal-test-app',
            audience: 'app-users'
        } as jwt.SignOptions
    );
    return token;
};

// Generate JWT Token for admin users
export const generateAdminToken = (adminEmail: string): string => {
    const payload: AdminJWTPayload = {
        adminId: adminEmail, // Using email as unique identifier for admin
        email: adminEmail,
        role: 'admin',
        type: 'admin'
    };

    // Create admin token with separate secret and shorter expiration
    const token = jwt.sign(
        payload,
        process.env.JWT_ADMIN_SECRET || process.env.JWT_SECRET as jwt.Secret,
        {
            expiresIn: typeof process.env.JWT_ADMIN_EXPIRE === 'string' ? process.env.JWT_ADMIN_EXPIRE : '24h',
            issuer: 'legal-test-admin',
            audience: 'admin-panel'
        } as jwt.SignOptions
    );
    return token;
};

// Verify JWT Token for regular users
export const verifyToken = (token: string): JWTPayload => {
    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET as string
        ) as JWTPayload;
        
        return decoded;
    } catch (error: any) {
        if (error.name === 'TokenExpiredError') {
            throw new Error('Token has expired');
        } else if (error.name === 'JsonWebTokenError') {
            throw new Error('Invalid token');
        } else {
            throw new Error('Token verification failed');
        }
    }
};

// Verify JWT Token for admin users
export const verifyAdminToken = (token: string): AdminJWTPayload => {
    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_ADMIN_SECRET || process.env.JWT_SECRET as string
        ) as AdminJWTPayload;

        // Additional validation to ensure it's an admin token
        if (decoded.type !== 'admin') {
            throw new Error('Invalid admin token type');
        }

        return decoded;
    } catch (error: any) {
        if (error.name === 'TokenExpiredError') {
            throw new Error('Admin session expired');
        } else if (error.name === 'JsonWebTokenError') {
            throw new Error('Invalid admin token');
        } else {
            throw new Error('Admin token verification failed');
        }
    }
};

// Generate Refresh Token (for enhanced security)
export const generateRefreshToken = (userId: string): string => {
    return jwt.sign(
        { userId, type: 'refresh' },
        process.env.JWT_REFRESH_SECRET as string,
        { expiresIn: '30d' }
    );
};

// Generate Admin Refresh Token (optional for admin sessions)
export const generateAdminRefreshToken = (adminEmail: string): string => {
    return jwt.sign(
        { 
            adminId: adminEmail, 
            type: 'admin_refresh',
            role: 'admin'
        },
        process.env.JWT_ADMIN_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET as string,
        { expiresIn: '7d' } // Shorter refresh token expiry for admin
    );
};

// Verify Refresh Token
export const verifyRefreshToken = (token: string): { userId: string; type: string } => {
    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_REFRESH_SECRET as string
        ) as { userId: string; type: string };

        if (decoded.type !== 'refresh') {
            throw new Error('Invalid refresh token type');
        }

        return decoded;
    } catch (error: any) {
        if (error.name === 'TokenExpiredError') {
            throw new Error('Refresh token has expired');
        } else if (error.name === 'JsonWebTokenError') {
            throw new Error('Invalid refresh token');
        } else {
            throw new Error('Refresh token verification failed');
        }
    }
};

// Verify Admin Refresh Token
export const verifyAdminRefreshToken = (token: string): { adminId: string; type: string; role: string } => {
    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_ADMIN_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET as string
        ) as { adminId: string; type: string; role: string };

        if (decoded.type !== 'admin_refresh') {
            throw new Error('Invalid admin refresh token type');
        }

        return decoded;
    } catch (error: any) {
        if (error.name === 'TokenExpiredError') {
            throw new Error('Admin refresh token has expired');
        } else if (error.name === 'JsonWebTokenError') {
            throw new Error('Invalid admin refresh token');
        } else {
            throw new Error('Admin refresh token verification failed');
        }
    }
};

// Utility function to get token type without verification
export const getTokenType = (token: string): 'user' | 'admin' | 'unknown' => {
    try {
        // Decode without verification to check type
        const decoded = jwt.decode(token) as any;
        
        if (decoded?.type === 'admin') {
            return 'admin';
        } else if (decoded?.userId) {
            return 'user';
        } else {
            return 'unknown';
        }
    } catch (error) {
        return 'unknown';
    }
};

// Export types for use in other files
export type { JWTPayload, AdminJWTPayload };
