import express, { Request, Response } from 'express';
import multer from 'multer';
import csv from 'csv-parser';
import fs from 'fs';
import path from 'path';
import { Exam } from '../models/LawExamsCollection';

// Configure multer for CSV uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = './uploads/csv/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}-${file.originalname}`;
        cb(null, uniqueName);
    }
});

export const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
            cb(null, true);
        } else {
            cb(new Error('Only CSV files are allowed') as any, false);
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// Interface for CSV row
interface CSVQuestion {
    question: string;
    option1: string;
    option2: string;
    option3: string;
    option4: string;
    correctAnswer: string | number;
    explanation: string;
    difficulty: 'basic' | 'intermediate' | 'advanced';
    subject: string;
}

// Helper function to clean CSV row
function cleanCSVRow(row: any): CSVQuestion {
    // Validate required fields
    if (!row.question?.trim()) {
        throw new Error('Question is required');
    }
    if (!row.option1?.trim() || !row.option2?.trim() || !row.option3?.trim() || !row.option4?.trim()) {
        throw new Error('All 4 options are required');
    }

    return {
        question: row.question.trim(),
        option1: row.option1.trim(),
        option2: row.option2.trim(),
        option3: row.option3.trim(),
        option4: row.option4.trim(),
        correctAnswer: row.correctAnswer?.trim() || '',
        explanation: row.explanation?.trim() || '',
        difficulty: (row.difficulty?.toLowerCase()?.trim() as 'basic' | 'intermediate' | 'advanced') || 'basic',
        subject: row.subject?.trim() || ''
    };
}

// Helper function to format question for database
function formatQuestion(csvQuestion: CSVQuestion) {
    const options = [
        csvQuestion.option1,
        csvQuestion.option2,
        csvQuestion.option3,
        csvQuestion.option4
    ];

    return {
        question: csvQuestion.question,
        options,
        correctAnswer: csvQuestion.correctAnswer,
        explanation: csvQuestion.explanation
    };
}

// Controller for adding exam via CSV
export const addExamFromCSV = async (req: Request, res: Response) => {
    try {
        const { examName } = req.body;
        
        if (!examName) {
            return res.status(400).json({
                success: false,
                message: 'Exam name is required'
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'CSV file is required'
            });
        }

        // Check if exam already exists
        const existingExam = await Exam.findOne({ examName });
        if (existingExam) {
            return res.status(400).json({
                success: false,
                message: 'Exam with this name already exists'
            });
        }

        const filePath = req.file.path;
        const questions: CSVQuestion[] = [];
        let subject = '';

        // Parse CSV file
        await new Promise<void>((resolve, reject) => {
            fs.createReadStream(filePath)
                .pipe(csv())
                .on('data', (row: any) => {
                    try {
                        const cleanRow = cleanCSVRow(row);
                        questions.push(cleanRow);
                        
                        if (!subject && cleanRow.subject) {
                            subject = cleanRow.subject.toUpperCase();
                        }
                    } catch (error) {
                        console.error('Error parsing row:', error);
                    }
                })
                .on('end', resolve)
                .on('error', reject);
        });

        // Delete uploaded file
        fs.unlinkSync(filePath);

        if (questions.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid questions found in CSV file'
            });
        }

        // Organize questions by difficulty
        const basicQuestions = questions
            .filter(q => q.difficulty === 'basic')
            .map(q => formatQuestion(q));
            
        const intermediateQuestions = questions
            .filter(q => q.difficulty === 'intermediate')
            .map(q => formatQuestion(q));
            
        const advancedQuestions = questions
            .filter(q => q.difficulty === 'advanced')
            .map(q => formatQuestion(q));

        // Create new exam
        const newExam = new Exam({
            examName,
            subject,
            basicQuestions,
            intermediateQuestions,
            advancedQuestions
        });

        await newExam.save();

        res.status(201).json({
            success: true,
            message: 'Exam created successfully',
            data: {
                examId: newExam._id,
                examName: newExam.examName,
                subject: newExam.subject,
                totalQuestions: basicQuestions.length + intermediateQuestions.length + advancedQuestions.length,
                breakdown: {
                    basic: basicQuestions.length,
                    intermediate: intermediateQuestions.length,
                    advanced: advancedQuestions.length
                }
            }
        });

    } catch (error) {
        console.error('Error creating exam:', error);
        
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Controller for adding questions to existing exam
export const addQuestionsToExam = async (req: Request, res: Response) => {
    try {
        const { examId } = req.params;
        
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'CSV file is required'
            });
        }

        const exam = await Exam.findById(examId);
        if (!exam) {
            return res.status(404).json({
                success: false,
                message: 'Exam not found'
            });
        }

        const filePath = req.file.path;
        const questions: CSVQuestion[] = [];

        await new Promise<void>((resolve, reject) => {
            fs.createReadStream(filePath)
                .pipe(csv())
                .on('data', (row: any) => {
                    try {
                        const cleanRow = cleanCSVRow(row);
                        questions.push(cleanRow);
                    } catch (error) {
                        console.error('Error parsing row:', error);
                    }
                })
                .on('end', resolve)
                .on('error', reject);
        });

        fs.unlinkSync(filePath);

        if (questions.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid questions found in CSV file'
            });
        }

        const basicQuestions = questions
            .filter(q => q.difficulty === 'basic')
            .map(q => formatQuestion(q));
            
        const intermediateQuestions = questions
            .filter(q => q.difficulty === 'intermediate')
            .map(q => formatQuestion(q));
            
        const advancedQuestions = questions
            .filter(q => q.difficulty === 'advanced')
            .map(q => formatQuestion(q));

        exam.basicQuestions.push(...basicQuestions);
        exam.intermediateQuestions.push(...intermediateQuestions);
        exam.advancedQuestions.push(...advancedQuestions);

        await exam.save();

        res.status(200).json({
            success: true,
            message: 'Questions added successfully',
            data: {
                examId: exam._id,
                examName: exam.examName,
                subject: exam.subject,
                questionsAdded: {
                    basic: basicQuestions.length,
                    intermediate: intermediateQuestions.length,
                    advanced: advancedQuestions.length
                },
                totalQuestions: exam.basicQuestions.length + exam.intermediateQuestions.length + exam.advancedQuestions.length
            }
        });

    } catch (error) {
        console.error('Error adding questions:', error);
        
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Get all exams
export const getAllExams = async (req: Request, res: Response) => {
    try {
        const exams = await Exam.find()
            .select('examName subject basicQuestions intermediateQuestions advancedQuestions createdAt updatedAt')
            .sort({ createdAt: -1 });

        const examsWithCounts = exams.map(exam => ({
            _id: exam._id,
            examName: exam.examName,
            subject: exam.subject,
            totalQuestions: exam.basicQuestions.length + exam.intermediateQuestions.length + exam.advancedQuestions.length,
            breakdown: {
                basic: exam.basicQuestions.length,
                intermediate: exam.intermediateQuestions.length,
                advanced: exam.advancedQuestions.length
            },
            createdAt: exam.createdAt,
            updatedAt: exam.updatedAt
        }));

        res.status(200).json({
            success: true,
            data: examsWithCounts
        });

    } catch (error) {
        console.error('Error fetching exams:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
