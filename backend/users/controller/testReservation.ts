import { Request, Response } from "express";
import { validationResult } from 'express-validator';
import { Test } from '../models/TestCollection'; // Adjust path as needed

// Register new Test content or add questions to existing test
export const registerTest = async (req: Request, res: Response) => {
    try {
        console.log('Received request body:', req.body);
        
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log('Validation errors:', errors.array());
            res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
            return;
        }

        const { subject, questions, duration, price, category } = req.body;

        // Validate top-level category
        if (!category || typeof category !== 'string') {
            res.status(400).json({ success: false, message: 'Category is required' });
            return;
        }
        const normalizedCategory = String(category).toUpperCase();
        if (!['BASIC', 'INTERMEDIATE', 'ADVANCED'].includes(normalizedCategory)) {
            res.status(400).json({ success: false, message: 'Category must be BASIC, INTERMEDIATE, or ADVANCED' });
            return;
        }

        // Validate questions structure
        if (!questions || !Array.isArray(questions) || questions.length === 0) {
            res.status(400).json({
                success: false,
                message: 'Questions array is required and must contain at least one question'
            });
            return;
        }

        // Validate each question
        for (let i = 0; i < questions.length; i++) {
            const question = questions[i];
            if (!question.question || !question.options || !question.correctAnswer || !question.explanation) {
                res.status(400).json({
                    success: false,
                    message: `Question at index ${i} is missing required fields`
                });
                return;
            }

            if (!Array.isArray(question.options) || question.options.length < 2) {
                res.status(400).json({
                    success: false,
                    message: `Question at index ${i} must have at least 2 options`
                });
                return;
            }
        }

        // Check if test with same subject already exists
        const existingTest = await Test.findOne({ subject: subject.toUpperCase() });
        
        if (existingTest) {
            // Add new questions to existing test under selected category
            console.log(`Adding ${questions.length} ${normalizedCategory} questions to existing ${subject.toUpperCase()} test`);
            
            if (normalizedCategory === 'BASIC') {
                existingTest.basicQuestions.push(...questions);
            } else if (normalizedCategory === 'INTERMEDIATE') {
                existingTest.intermediateQuestions.push(...questions);
            } else {
                existingTest.advancedQuestions.push(...questions);
            }
            
            // Update duration and price if provided (optional - you can modify this logic)
            if (duration) {
                existingTest.duration = duration;
            }
            if (price !== undefined) {
                existingTest.price = price;
            }

            const updatedTest = await existingTest.save();

            res.status(200).json({
                success: true,
                message: `Successfully added ${questions.length} ${normalizedCategory} questions to existing ${subject.toUpperCase()} test`,
                data: {
                    _id: updatedTest._id,
                    subject: updatedTest.subject,
                    totalQuestions: (updatedTest.basicQuestions?.length || 0) + (updatedTest.intermediateQuestions?.length || 0) + (updatedTest.advancedQuestions?.length || 0),
                    newQuestionsAdded: questions.length,
                    duration: updatedTest.duration,
                    price: updatedTest.price,
                    updatedAt: updatedTest.updatedAt
                }
            });
            return;
        }

        // Create new test if subject doesn't exist
        console.log(`Creating new test for subject: ${subject.toUpperCase()}`);
        
        const newTest = new Test({
            subject: subject.toUpperCase(),
            basicQuestions: normalizedCategory === 'BASIC' ? questions : [],
            intermediateQuestions: normalizedCategory === 'INTERMEDIATE' ? questions : [],
            advancedQuestions: normalizedCategory === 'ADVANCED' ? questions : [],
            duration: duration || 1.5, // Default 1.5 minutes per question
            price: price || 0
        });

        const savedTest = await newTest.save();

        res.status(201).json({
            success: true,
            message: 'New test created successfully',
            data: {
                _id: savedTest._id,
                subject: savedTest.subject,
                totalQuestions: (savedTest.basicQuestions?.length || 0) + (savedTest.intermediateQuestions?.length || 0) + (savedTest.advancedQuestions?.length || 0),
                duration: savedTest.duration,
                price: savedTest.price,
                createdAt: savedTest.createdAt
            }
        });

    } catch (err) {
        console.error('Error registering test:', err);
        

        const errorMessage = err instanceof Error ? err.message : 'Internal server error';
        console.error('Full error details:', err);
        
        res.status(500).json({
            success: false,
            message: errorMessage,
            error: process.env.NODE_ENV === 'development' ? (err instanceof Error ? err.stack : 'Unknown error') : 'Something went wrong'
        });
    }
};
