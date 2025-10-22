import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { IUser, User } from '../models/registerUser';

export const verifyLimitOfUser = async (req: Request, res: Response) => {
    try {
        // Get token from Authorization header (Bearer Token)
        const authHeader = req.headers.authorization;
        
        // console.log('Authorization Header:', authHeader); // Debug log
        
        // Check if Authorization header exists
        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: 'No authorization header provided'
            });
        }

        // Check if it starts with 'Bearer '
        if (!authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Invalid authorization format. Use: Bearer <token>'
            });
        }

        // Extract token from "Bearer <token>"
        const token = authHeader.split(' ')[1];
        
        console.log('Extracted Token:', token); // Debug log
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }

        // Verify JWT token
        let decoded: any;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET as string);
            console.log('Decoded Token:', decoded); // Debug log
        } catch (error: any) {
            console.error('JWT Verification Error:', error.message);
            
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: 'Token has expired'
                });
            }
            
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid token'
                });
            }
            
            return res.status(401).json({
                success: false,
                message: 'Token verification failed'
            });
        }


        // Find user in database
        const user = await User.findById(decoded._id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        console.log('User found:', { id: user._id, limit: user.limit }); // Debug log

        // Check user's limit
        if (user.limit === 0) {
            return res.status(403).json({
                success: false,
                message: 'You are done with credits',
                limit: 0,
                subscription: user.subscription
            });
        }

        // User has credits - return success
        return res.status(200).json({
            success: true,
            message: 'You are eligible',
            limit: user.limit,
            userName: user.name,
            subscription: user.subscription
        });

    } catch (error: any) {
        console.error('Error in verifyLimitOfUser:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};



export const oneCreditCompleted = async (req: Request, res: Response) => {
    try {
        // Check the token in header
        const authHeader = req.headers.authorization;
        
        // Check if authorization header exists
        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: 'No Authorization header provided'
            });
        }

        // Check if it starts with 'Bearer'
        if (!authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: 'Invalid authorization format. Use: Bearer <token>'
            });
        }

        const token = authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }

        // Verify JWT token
        let decoded: any;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET as string);
            console.log('Decoded Token:', decoded);
        } catch (error: any) {
            console.error('JWT Verification Error:', error.message);
            
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: 'Token has expired'
                });
            }
            
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid token'
                });
            }
            
            return res.status(401).json({
                success: false,
                message: 'Token verification failed'
            });
        }

        // Find the user in db
        const user = await User.findById(decoded._id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        console.log('User found:', { id: user._id, limit: user.limit });

        // Check if limit property exists and is a number
        if (typeof user.limit !== 'number') {
            return res.status(500).json({
                success: false,
                message: 'User limit not properly configured'
            });
        }

        // Check if user has credits
        if (user.limit <= 0) {
            return res.status(403).json({
                success: false,
                message: 'No credits available',
                limit: 0
            });
        }

        // Decrease limit by 1
        user.limit -= 1;
        
        // Save the updated user
        await user.save();

        console.log('Credit decreased:', { id: user._id, newLimit: user.limit });

        // Return success response
        return res.status(200).json({
            success: true,
            message: 'Credit decreased successfully',
            remainingLimit: user.limit,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                limit: user.limit,
                subscription: user.subscription
            }
        });

    } catch (error: any) {
        console.error('Error in oneCreditCompleted:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

