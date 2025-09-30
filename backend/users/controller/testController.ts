import { Request, Response } from "express";
import { Test } from "../models/TestCollection";

// Map difficulty to corresponding field in schema
const difficultyToField: Record<string, string> = {
    BASIC: "basicQuestions",
    INTERMEDIATE: "intermediateQuestions",
    ADVANCED: "advancedQuestions"
};

// Get questions by subject and difficulty
export const getQuestionsByDifficulty = (async (req: Request, res: Response) => {
    const { subject, difficulty } = req.params;

    try {
        const normalizedDifficulty = (difficulty || '').toUpperCase();
        const validDifficulties = ['BASIC', 'INTERMEDIATE', 'ADVANCED'];
        if (!validDifficulties.includes(normalizedDifficulty)) {
            res.status(400).json({
                success: false,
                message: 'Invalid difficulty level. Use BASIC, INTERMEDIATE, or ADVANCED'
            });
            return;
        }

        // Load the test document for the subject
        const testDoc = await Test.findOne({ subject: (subject || '').toUpperCase() });
        if (!testDoc) {
            res.status(404).json({
                success: false,
                message: `Subject ${subject} not found`
            });
            return;
        }

        // Select questions array by difficulty
        const field = difficultyToField[normalizedDifficulty];
        // @ts-ignore - dynamic access
        const questionsArray = (testDoc as any)[field] as Array<{ question: string; options: string[] }>;

        if (!questionsArray || questionsArray.length === 0) {
            res.status(404).json({
                success: false,
                message: `No questions found for ${subject} at ${normalizedDifficulty} level`
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Questions retrieved successfully',
            data: {
                testId: testDoc._id,
                subject: testDoc.subject,
                difficulty: normalizedDifficulty,
                totalQuestions: questionsArray.length,
                duration: testDoc.duration,
                questions: questionsArray.map((q, index) => {
                    // Normalize correctAnswer to be the option index (number)
                    let correctIndex = -1 as number;
                    if (typeof (q as any).correctAnswer === 'number') {
                        correctIndex = (q as any).correctAnswer as number;
                    } else if (typeof (q as any).correctAnswer === 'string') {
                        correctIndex = q.options.indexOf((q as any).correctAnswer as string);
                    }

                    return {
                        id: `${testDoc._id}-${normalizedDifficulty}-${index + 1}`,
                        questionNumber: index + 1,
                        question: q.question,
                        options: q.options,
                        correctAnswer: correctIndex,
                        explanation: (q as any).explanation
                    };
                })
            }
        });

    } catch (error) {
        console.error('Error fetching questions:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while fetching questions'
        });
    }
});

// Get all available difficulties for a subject
export const getSubjectDifficulties = (async (req: Request, res: Response) => {
    const { subject } = req.params;

    try {
        const testData = await Test.findOne({ subject: (subject || '').toUpperCase() });

        if (!testData) {
            res.status(404).json({
                success: false,
                message: 'Subject not found'
            });
            return;
        }

        const difficulties: Array<{ level: string; count: number; description: string }> = [];

        if (testData.basicQuestions?.length > 0) {
            difficulties.push({
                level: 'BASIC',
                count: testData.basicQuestions.length,
                description: 'Foundation level questions for beginners'
            });
        }

        if (testData.intermediateQuestions?.length > 0) {
            difficulties.push({
                level: 'INTERMEDIATE',
                count: testData.intermediateQuestions.length,
                description: 'Moderate level questions for regular practice'
            });
        }

        if (testData.advancedQuestions?.length > 0) {
            difficulties.push({
                level: 'ADVANCED',
                count: testData.advancedQuestions.length,
                description: 'Challenging questions for advanced learners'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Difficulties retrieved successfully',
            data: {
                subject: testData.subject,
                totalDuration: testData.duration,
                difficulties
            }
        });

    } catch (error) {
        console.error('Error fetching subject difficulties:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
