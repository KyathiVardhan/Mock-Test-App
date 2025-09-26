import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend Request interface to include user property
export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
        name?: string;
        // Add other user properties as needed
    };
}

// Authentication middleware
export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        console.log('Checking authentication...');
        
        // Get token from cookies
        const token = req.cookies.token;
        
        // Check if token exists
        if (!token) {
            console.log('No token found in cookies');
            res.status(401).json({
                success: false,
                message: 'Access denied. No token provided. Please login first.',
                requiresAuth: true
            });
            return;
        }

        // Verify the token
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            console.error('JWT_SECRET not configured');
            res.status(500).json({
                success: false,
                message: 'Server configuration error'
            });
            return;
        }

        // Decode and verify token
        const decoded = jwt.verify(token, jwtSecret) as any;
        
        console.log('Token verified successfully for user:', decoded.email);
        
        // Add user info to request object
        req.user = {
            id: decoded.id || decoded.userId,
            email: decoded.email,
            name: decoded.name
        };

        // Proceed to next middleware/route handler
        next();

    } catch (error) {
        console.error('Token verification failed:', error);

        // Handle specific JWT errors
        if (error instanceof jwt.JsonWebTokenError) {
            res.status(403).json({
                success: false,
                message: 'Invalid token. Please login again.',
                requiresAuth: true
            });
            return;
        }

        if (error instanceof jwt.TokenExpiredError) {
            res.status(403).json({
                success: false,
                message: 'Token expired. Please login again.',
                requiresAuth: true,
                expired: true
            });
            return;
        }

        // Generic error
        res.status(403).json({
            success: false,
            message: 'Token verification failed. Please login again.',
            requiresAuth: true
        });
    }
};
