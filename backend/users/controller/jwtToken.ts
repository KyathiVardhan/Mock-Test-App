
import jwt from 'jsonwebtoken';
import { IUser } from '../models/registerUser';

// Define payload interface for type safety
interface JWTPayload {
    userId: string;
    email: string;
    name: string;
    isVerified?: boolean;
}

// Generate JWT Token
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
            issuer: 'your-app-name',
            audience: 'your-app-users'
        } as jwt.SignOptions
    );
    return token;
};

// Verify JWT Token
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

// Generate Refresh Token (for enhanced security)
export const generateRefreshToken = (userId: string): string => {
    return jwt.sign(
        { userId, type: 'refresh' },
        process.env.JWT_REFRESH_SECRET as string,
        { expiresIn: '30d' }
    );
};
