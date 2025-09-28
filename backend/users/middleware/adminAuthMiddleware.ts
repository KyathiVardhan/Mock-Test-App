import { Request, Response, NextFunction } from 'express';
import { verifyAdminToken } from '../controller/jwtToken';

export interface AuthenticatedAdminRequest extends Request {
    admin?: {
        adminId: string;
        email: string;
        role: string;
    };
}

export const isAdminAuth = async (
    req: AuthenticatedAdminRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        // Get token from cookie or Authorization header
        const token = req.cookies?.adminToken || 
                     req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            res.status(401).json({
                success: false,
                message: 'Admin access token required'
            });
            return;
        }

        // Verify admin token
        const decoded = verifyAdminToken(token);

        // Attach admin info to request
        req.admin = {
            adminId: decoded.adminId,
            email: decoded.email,
            role: decoded.role
        };

        next();
    } catch (error: any) {
        console.error('Admin authentication error:', error);
        
        // Clear invalid token cookie
        res.clearCookie('adminToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            path: '/'
        });

        if (error.message === 'Admin session expired') {
            res.status(401).json({
                success: false,
                message: 'Admin session expired. Please login again'
            });
        } else {
            res.status(401).json({
                success: false,
                message: 'Invalid admin session. Please login again'
            });
        }
    }
};
