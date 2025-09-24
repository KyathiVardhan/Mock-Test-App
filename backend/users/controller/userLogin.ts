import { Request, Response } from 'express';
import { IUserInput, User } from '../models/registerUser';
import bcrypt from 'bcryptjs';
import { generateToken } from './jwtToken';

export interface ILogin {
    email: string;
    password: string;
}

export const loginUser = async(req: Request, res: Response)=>{
    const {email, password}: ILogin = req.body;
    
    try {
        const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
        // const user = await User.findOne({email})
        if (!user) {
            res.status(404).json({
                success: false,
                message: "User doesn't exists"
            });
            return;
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(401).json({
                success: false,
                message: "Password you entered was incorrect."
            });
        }

        const token = generateToken(user);

        // Set token as HTTP-only cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.status(200).json({
            success: true,
            message: "You are successfully logged in.",
            data: {
                name: user.name,
                email: user.email,
                id: user._id,
                avatar: user.avatar,
                isVerified: user.isVerified
            },
            token
        })
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}