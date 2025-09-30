import { Request, Response } from "express";
import { validationResult } from 'express-validator';
import { Test } from '../models/TestCollection';
import multer, { FileFilterCallback } from 'multer';
import csv from 'csv-parser';
import { Readable } from 'stream';

interface MulterRequest extends Request {
    file?: Express.Multer.File;
}

interface Question {
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
}

interface TestRequestBody {
    subject: string;
    difficulty: string;
    description?: string;
    duration: string;
}

// Multer configuration for handling CSV file uploads
const storage = multer.memoryStorage(); // Store files in memory
const upload = multer({
    storage,
    fileFilter: (req: Express.Request, file: Express.Multer.File, cb: FileFilterCallback) => {
        // Accept only CSV files
        if (file.mimetype === 'text/csv' || file.mimetype === 'application/vnd.ms-excel' || file.originalname.endsWith('.csv')) {
            cb(null, true);
        } else {
            cb(new Error('Only CSV files are allowed') as any);
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    }
});

// Wrap multer upload in error handling
export const uploadCSV = (req: Request, res: Response, next: Function) => {
    console.log('Processing file upload...');
    upload.single('questionsFile')(req, res, (err: any) => {
        console.log('File upload result:', { error: err?.message, file: req.file });
        
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    success: false,
                    message: 'File size limit exceeded. Maximum size is 5MB'
                });
            }
            return res.status(400).json({
                success: false,
                message: 'File upload error: ' + err.message
            });
        } else if (err) {
            return res.status(400).json({
                success: false,
                message: err.message || 'File upload error'
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded. Please upload a CSV file.'
            });
        }

        console.log('File upload successful:', req.file.originalname);
        next();
    });
};

// Helper function to parse CSV from buffer (accepts headers: Question, A, B, C, D, correct answer, Explanation)
const parseCSVFromBuffer = (buffer: Buffer): Promise<Question[]> => {
    return new Promise((resolve, reject) => {
        const results: any[] = [];
        const stream = Readable.from(buffer.toString());
        
        stream
            .pipe(csv([
                'question',
                'option_a',
                'option_b',
                'option_c',
                'option_d',
                'correct_answer',
                'explanation'
            ]))
            .on('data', (data) => {
                // Map both lowercase snake_case and header-case columns
                const rawQuestion = (data.question || data.Question)?.trim();
                const optionA = (data.option_a || data['Option A'] || data['A'])?.trim();
                const optionB = (data.option_b || data['Option B'] || data['B'])?.trim();
                const optionC = (data.option_c || data['Option C'] || data['C'])?.trim();
                const optionD = (data.option_d || data['Option D'] || data['D'])?.trim();
                const rawCorrect = (data.correct_answer || data['Correct'] || data['correct answer'])?.trim();
                const rawExplanation = (data.explanation || data['Explanation'])?.trim();

                // Skip header row if detected
                const looksLikeHeader = rawQuestion?.toLowerCase() === 'question';
                if (looksLikeHeader) return;

                const options = [optionA, optionB, optionC, optionD].filter(o => o);

                // Resolve correct answer to exact option text, supporting letter or text
                let resolvedCorrectText: string | undefined;
                const letter = (rawCorrect || '').trim().toUpperCase();
                if (['A','B','C','D'].includes(letter)) {
                    const idx = letter.charCodeAt(0) - 'A'.charCodeAt(0);
                    if (idx >= 0 && idx < options.length) {
                        resolvedCorrectText = options[idx];
                    }
                } else if (rawCorrect) {
                    const match = options.find(o => (o || '').trim().toLowerCase() === (rawCorrect || '').trim().toLowerCase());
                    if (match) resolvedCorrectText = match;
                }

                const question = {
                    question: rawQuestion,
                    options,
                    correctAnswer: resolvedCorrectText,
                    explanation: rawExplanation || ''
                };

                if (question.question && question.options.length >= 2 && question.correctAnswer) {
                    results.push(question);
                }
            })
            .on('end', () => {
                resolve(results);
            })
            .on('error', (error) => {
                reject(error);
            });
    });
};

// Register new Test content or add questions to existing test
export const registerTest = async (req: MulterRequest & { admin?: { role: string } }, res: Response) => {
    try {
        console.log('Received request body:', req.body);
        console.log('Received file:', req.file);
        
        // Check if request is from an authenticated admin
        if (!req.admin || req.admin.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only administrators can register tests'
            });
        }

        // Validate the uploaded file
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded',
                errors: [{ field: 'questionsFile', message: 'CSV file is required' }]
            });
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log('Validation errors:', errors.array());
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        // Extract form data
        const { 
            subject, 
            difficulty, 
            description, 
            duration 
        } = req.body as TestRequestBody;

        // Validate required fields
        if (!subject || !difficulty || !duration) {
            return res.status(400).json({
                success: false,
                message: 'Subject, difficulty, and duration are required'
            });
        }

        // Validate difficulty level
        const normalizedCategory = difficulty.toUpperCase();
        if (!['BASIC', 'INTERMEDIATE', 'ADVANCED'].includes(normalizedCategory)) {
            return res.status(400).json({
                success: false,
                message: 'Difficulty must be BASIC, INTERMEDIATE, or ADVANCED'
            });
        }

        // Check if CSV file was uploaded
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'CSV file with questions is required'
            });
        }

        // Parse CSV file from buffer
        let questions: any[] = [];
        try {
            questions = await parseCSVFromBuffer(req.file.buffer);
            
            if (questions.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No valid questions found in CSV file. Please check the format.'
                });
            }
            
            console.log(`Parsed ${questions.length} questions from CSV`);
            
        } catch (csvError) {
            console.error('CSV parsing error:', csvError);
            return res.status(400).json({
                success: false,
                message: 'Failed to parse CSV file. Please check the file format.'
            });
        }

        // Validate each question
        for (let i = 0; i < questions.length; i++) {
            const question = questions[i];
            if (!question.question || !question.options || !question.correctAnswer) {
                return res.status(400).json({
                    success: false,
                    message: `Question at row ${i + 2} is missing required fields`
                });
            }

            if (!Array.isArray(question.options) || question.options.length < 2) {
                return res.status(400).json({
                    success: false,
                    message: `Question at row ${i + 2} must have at least 2 options`
                });
            }

            // Validate correct answer text must match one of the options
            if (!question.options.some((o: string) => (o || '').trim().toLowerCase() === String(question.correctAnswer).trim().toLowerCase())) {
                return res.status(400).json({
                    success: false,
                    message: `Question at row ${i + 2} has invalid correct answer. It must match one of the options.`
                });
            }
        }

        // Check if test with same subject already exists
        const existingTest = await Test.findOne({ 
            subject: subject.toUpperCase()
        });
        
        if (existingTest) {
            // Add new questions to existing test under selected category
            console.log(`Adding ${questions.length} ${normalizedCategory} questions to existing test for subject: ${subject}`);
            
            if (normalizedCategory === 'BASIC') {
                existingTest.basicQuestions.push(...questions);
            } else if (normalizedCategory === 'INTERMEDIATE') {
                existingTest.intermediateQuestions.push(...questions);
            } else {
                existingTest.advancedQuestions.push(...questions);
            }
            
            // Update duration if provided
            if (duration) {
                existingTest.duration = parseInt(duration);
            }

            

            const updatedTest = await existingTest.save();

            return res.status(200).json({
                success: true,
                message: `Successfully added ${questions.length} ${normalizedCategory} questions to existing test`,
                data: {
                    _id: updatedTest._id,
                    
                    subject: updatedTest.subject,
                    totalQuestions: (updatedTest.basicQuestions?.length || 0) + 
                                  (updatedTest.intermediateQuestions?.length || 0) + 
                                  (updatedTest.advancedQuestions?.length || 0),
                    newQuestionsAdded: questions.length,
                    duration: updatedTest.duration,
                    
                    updatedAt: updatedTest.updatedAt
                }
            });
        }

        // Create new test if it doesn't exist
        console.log(`Creating new test for subject: ${subject.toUpperCase()}`);
        
        const newTest = new Test({
            subject: subject.toUpperCase(),
            description: description || '',
            basicQuestions: normalizedCategory === 'BASIC' ? questions : [],
            intermediateQuestions: normalizedCategory === 'INTERMEDIATE' ? questions : [],
            advancedQuestions: normalizedCategory === 'ADVANCED' ? questions : [],
            duration: parseInt(duration),
            price: 0 // Default price
        });

        const savedTest = await newTest.save();

        res.status(201).json({
            success: true,
            message: 'New test created successfully',
            data: {
                _id: savedTest._id,
               
                subject: savedTest.subject,
                totalQuestions: (savedTest.basicQuestions?.length || 0) + 
                              (savedTest.intermediateQuestions?.length || 0) + 
                              (savedTest.advancedQuestions?.length || 0),
                duration: savedTest.duration,
             
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
