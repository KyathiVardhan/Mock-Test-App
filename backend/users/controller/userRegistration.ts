import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { IUserInput, User } from '../models/registerUser';
import { generateToken } from './jwtToken';


// Register new user
export const registerUser = (async (req: Request, res: Response) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
        });
        return;
    }

    const { name, email, password, avatar }: IUserInput = req.body;

    try {
        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            res.status(409).json({
                success: false,
                message: 'User already exists with this email address'
            });
            return;
        }

        // Create new user
        const userData: IUserInput = {
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password,
            avatar: avatar || ''
        };

        const user = await User.create(userData);

        // Generate JWT token
        const token = generateToken(user);

        // Set token as HTTP-only cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        // Send welcome email (optional)
        

        // Store user session in Redis (optional)
       

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                name: user.name,
                email: user.email,
                id: user._id,
                avatar: user.avatar,
                isVerified: user.isVerified
            },
            token
        });

    } catch (error: any) {
        console.error('Registration error:', error);
        
        if (error.code === 11000) {
            res.status(409).json({
                success: false,
                message: 'Email address is already registered'
            });
        } else if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map((err: any) => ({
                field: err.path,
                message: err.message
            }));
            
            res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validationErrors
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Internal server error during registration'
            });
        }
    }
});


