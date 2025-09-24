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

// Get all users (admin only)
// export const getAllUsers = TryCatch(async (req: AuthenticatedRequest, res: Response) => {
//     try {
//         const users = await User.find()
//             .select('-password')
//             .sort({ createdAt: -1 });

//         res.status(200).json({
//             success: true,
//             message: 'Users retrieved successfully',
//             data: {
//                 users,
//                 total: users.length
//             }
//         });
//     } catch (error) {
//         console.error('Error fetching users:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error retrieving users'
//         });
//     }
// });

// Get single user by ID
// export const getUserById = TryCatch(async (req: AuthenticatedRequest, res: Response) => {
//     try {
//         const user = await User.findById(req.params.id).select('-password');
        
//         if (!user) {
//             res.status(404).json({
//                 success: false,
//                 message: 'User not found'
//             });
//             return;
//         }

//         res.status(200).json({
//             success: true,
//             message: 'User retrieved successfully',
//             data: { user }
//         });
//     } catch (error) {
//         console.error('Error fetching user:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error retrieving user'
//         });
//     }
// });

// Get current user profile
// export const getMyProfile = TryCatch(async (req: AuthenticatedRequest, res: Response) => {
//     const user = req.user;
    
//     res.status(200).json({
//         success: true,
//         message: 'Profile retrieved successfully',
//         data: { user }
//     });
// });

// Update user profile
// export const updateProfile = TryCatch(async (req: AuthenticatedRequest, res: Response) => {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//         res.status(400).json({
//             success: false,
//             message: 'Validation failed',
//             errors: errors.array()
//         });
//         return;
//     }

//     try {
//         const { name, avatar } = req.body;
        
//         const user = await User.findByIdAndUpdate(
//             req.user?._id,
//             { 
//                 name: name?.trim(),
//                 avatar: avatar || req.user?.avatar
//             },
//             { 
//                 new: true, 
//                 runValidators: true,
//                 select: '-password'
//             }
//         );

//         if (!user) {
//             res.status(404).json({
//                 success: false,
//                 message: 'User not found'
//             });
//             return;
//         }

//         // Update Redis cache
//         try {
//             await redisClient.set(`user:${user._id}`, JSON.stringify({
//                 id: user._id,
//                 email: user.email,
//                 name: user.name
//             }), {
//                 EX: 7 * 24 * 60 * 60
//             });
//         } catch (redisError) {
//             console.error('Redis error during profile update:', redisError);
//         }

//         const token = generateToken(user);

//         res.status(200).json({
//             success: true,
//             message: 'Profile updated successfully',
//             data: {
//                 user,
//                 token
//             }
//         });
//     } catch (error: any) {
//         console.error('Profile update error:', error);
        
//         if (error.name === 'ValidationError') {
//             const validationErrors = Object.values(error.errors).map((err: any) => ({
//                 field: err.path,
//                 message: err.message
//             }));
            
//             res.status(400).json({
//                 success: false,
//                 message: 'Validation failed',
//                 errors: validationErrors
//             });
//         } else {
//             res.status(500).json({
//                 success: false,
//                 message: 'Error updating profile'
//             });
//         }
//     }
// });
