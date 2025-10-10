import { Request, Response } from "express";
import { Test } from "../models/TestCollection";

// Map difficulty to corresponding field in schema
const difficultyToField: Record<string, string> = {
    BASIC: "basicQuestions",
    INTERMEDIATE: "intermediateQuestions",
    ADVANCED: "advancedQuestions"
};

// // Get questions by subject and difficulty
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


// Get questions by subject and difficulty (WITHOUT sensitive data)
export const getQuestionsForTest = (async (req: Request, res: Response) => {
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

        const testDoc = await Test.findOne({ subject: (subject || '').toUpperCase() });
        if (!testDoc) {
            res.status(404).json({
                success: false,
                message: `Subject ${subject} not found`
            });
            return;
        }

        const field = difficultyToField[normalizedDifficulty];
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
            message: 'Test loaded successfully',
            data: {
                testId: testDoc._id,
                subject: testDoc.subject,
                difficulty: normalizedDifficulty,
                totalQuestions: questionsArray.length,
                duration: testDoc.duration,
                // ONLY send questions and options - NO correct answers or explanations
                questions: questionsArray.map((q, index) => ({
                    id: `${testDoc._id}-${normalizedDifficulty}-${index + 1}`,
                    questionNumber: index + 1,
                    question: q.question,
                    options: q.options
                    // correctAnswer and explanation are NOT included
                }))
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


// Submit test and get results with explanations
export const submitTest = async (req: Request, res: Response) => {
    const { testId, difficulty, answers, startTime, endTime } = req.body;

    try {
        // Validate required fields
        if (!testId || !difficulty || !answers || !startTime) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: testId, difficulty, answers, startTime'
            });
        }

        // Find the test document
        const testDoc = await Test.findById(testId);
        if (!testDoc) {
            return res.status(404).json({
                success: false,
                message: 'Test not found'
            });
        }

        // Get the correct questions array
        const normalizedDifficulty = difficulty.toUpperCase();
        const field = difficultyToField[normalizedDifficulty];
        const questionsArray = (testDoc as any)[field] as Array<any>;

        if (!questionsArray || questionsArray.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Questions not found for this test'
            });
        }

        // Calculate score and prepare results
        let correctCount = 0;
        const results = questionsArray.map((question, index) => {
            // Normalize correctAnswer to be the option index
            let correctIndex = -1;
            if (typeof question.correctAnswer === 'number') {
                correctIndex = question.correctAnswer;
            } else if (typeof question.correctAnswer === 'string') {
                correctIndex = question.options.indexOf(question.correctAnswer);
            }

            const userAnswer = answers[index];
            const isCorrect = userAnswer !== undefined && userAnswer === correctIndex;
            
            if (isCorrect) {
                correctCount++;
            }

            return {
                questionId: `${testId}-${normalizedDifficulty}-${index + 1}`,
                questionNumber: index + 1,
                question: question.question,
                options: question.options,
                correctAnswer: correctIndex,
                userAnswer: userAnswer,
                isCorrect,
                explanation: question.explanation || 'No explanation available'
            };
        });

        // Calculate additional metrics
        const totalQuestions = questionsArray.length;
        const percentage = Math.round((correctCount / totalQuestions) * 100);
        const timeTaken = endTime ? Math.round((new Date(endTime).getTime() - new Date(startTime).getTime()) / 1000) : null;

        // Determine grade based on percentage
        let grade = 'F';
        if (percentage >= 90) grade = 'A+';
        else if (percentage >= 80) grade = 'A';
        else if (percentage >= 70) grade = 'B';
        else if (percentage >= 60) grade = 'C';
        else if (percentage >= 50) grade = 'D';

        res.status(200).json({
            success: true,
            message: 'Test submitted successfully',
            data: {
                testId,
                subject: testDoc.subject,
                difficulty: normalizedDifficulty,
                score: {
                    correct: correctCount,
                    total: totalQuestions,
                    percentage,
                    grade
                },
                timing: {
                    startTime,
                    endTime: endTime || new Date().toISOString(),
                    timeTaken: timeTaken ? `${Math.floor(timeTaken / 60)}:${(timeTaken % 60).toString().padStart(2, '0')}` : null
                },
                results
            }
        });

    } catch (error) {
        console.error('Error submitting test:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while submitting test'
        });
    }
};


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
