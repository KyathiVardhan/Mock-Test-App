import { Request, Response } from "express";
import { Test } from '../models/TestCollection'; // Adjust path as needed

// Get all tests
export const getAllTests = async (req: Request, res: Response) => {
    try {
        console.log('Fetching all tests from database');

        // Get all tests with basic information (excluding questions for performance)
        const tests = await Test.find({})
            .select('subject duration price createdAt updatedAt basicQuestions intermediateQuestions advancedQuestions')
            .sort({ subject: 1, createdAt: -1 }); // Sort by subject alphabetically, then by newest first

        if (!tests || tests.length === 0) {
            res.status(404).json({
                success: false,
                message: 'No tests found in the database'
            });
            return;
        }

        // Calculate total questions for each test
        const testsWithQuestionCount = tests.map((test) => {
            const basicCount = (test as any).basicQuestions?.length || 0;
            const intermediateCount = (test as any).intermediateQuestions?.length || 0;
            const advancedCount = (test as any).advancedQuestions?.length || 0;
            return {
                _id: test._id,
                subject: test.subject,
                totalQuestions: basicCount + intermediateCount + advancedCount,
                breakdown: {
                    BASIC: basicCount,
                    INTERMEDIATE: intermediateCount,
                    ADVANCED: advancedCount
                },
                duration: test.duration,
                price: test.price,
                createdAt: test.createdAt,
                updatedAt: test.updatedAt
            };
        });

        res.status(200).json({
            success: true,
            message: 'Tests retrieved successfully',
            count: testsWithQuestionCount.length,
            data: testsWithQuestionCount
        });

    } catch (error) {
        console.error('Error fetching tests:', error);
        
        const errorMessage = error instanceof Error ? error.message : 'Internal server error';
        
        res.status(500).json({
            success: false,
            message: 'Failed to fetch tests',
            error: process.env.NODE_ENV === 'development' ? errorMessage : 'Something went wrong'
        });
    }
};
