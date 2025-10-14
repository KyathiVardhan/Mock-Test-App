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
        explanation: csvQuestion.explanation,
        subject: csvQuestion.subject.toUpperCase()
    };
}

// Controller for adding exam via CSV
export const addExamFromCSV = async (req: Request, res: Response) => {
    try {
        console.log('=== addExamFromCSV called ===');
        console.log('Request body:', req.body);
        console.log('File:', req.file ? req.file.filename : 'No file');
        
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

        // Create new exam with subjects array
        const newExam = new Exam({
            examName,
            subjects: [{
                subject: subject.toUpperCase(),
                basicQuestions,
                intermediateQuestions,
                advancedQuestions
            }]
        });

        await newExam.save();

        res.status(201).json({
            success: true,
            message: 'Exam created successfully',
            data: {
                examId: newExam._id,
                examName: newExam.examName,
                subjects: newExam.subjects.map(s => ({
                    subject: s.subject,
                    totalQuestions: s.basicQuestions.length + s.intermediateQuestions.length + s.advancedQuestions.length,
                    breakdown: {
                        basic: s.basicQuestions.length,
                        intermediate: s.intermediateQuestions.length,
                        advanced: s.advancedQuestions.length
                    }
                }))
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
        
        console.log('=== addQuestionsToExam called ===');
        console.log('Exam ID:', examId);
        console.log('Request body:', req.body);
        console.log('File:', req.file ? req.file.filename : 'No file');
        
        // Validate exam ID format (MongoDB ObjectId is 24 hex characters)
        if (!examId || !/^[0-9a-fA-F]{24}$/.test(examId)) {
            console.log('Invalid exam ID format:', examId);
            return res.status(400).json({
                success: false,
                message: 'Invalid exam ID format'
            });
        }
        
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'CSV file is required'
            });
        }

        const exam = await Exam.findById(examId);
        if (!exam) {
            console.log('Exam not found for ID:', examId);
            return res.status(404).json({
                success: false,
                message: 'Exam not found'
            });
        }

        console.log('Found exam:', exam.examName, 'Subjects:', exam.subjects.map(s => s.subject));

        const filePath = req.file.path;
        const questions: CSVQuestion[] = [];
        const csvSubjects = new Set<string>();

        await new Promise<void>((resolve, reject) => {
            fs.createReadStream(filePath)
                .pipe(csv())
                .on('data', (row: any) => {
                    try {
                        const cleanRow = cleanCSVRow(row);
                        questions.push(cleanRow);
                        
                        // Track subjects from CSV
                        if (cleanRow.subject) {
                            csvSubjects.add(cleanRow.subject.toUpperCase());
                        }
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

        // Group questions by subject and difficulty
        const questionsBySubject: { [subject: string]: { basic: any[], intermediate: any[], advanced: any[] } } = {};
        
        questions.forEach(q => {
            const subject = q.subject.toUpperCase();
            if (!questionsBySubject[subject]) {
                questionsBySubject[subject] = { basic: [], intermediate: [], advanced: [] };
            }
            
            const formattedQ = formatQuestion(q);
            if (q.difficulty === 'basic') {
                questionsBySubject[subject].basic.push(formattedQ);
            } else if (q.difficulty === 'intermediate') {
                questionsBySubject[subject].intermediate.push(formattedQ);
            } else {
                questionsBySubject[subject].advanced.push(formattedQ);
            }
        });

        // Add questions to existing subjects or create new subjects
        Object.keys(questionsBySubject).forEach(subject => {
            const subjectData = questionsBySubject[subject];
            const existingSubjectIndex = exam.subjects.findIndex(s => s.subject === subject);
            
            if (existingSubjectIndex >= 0) {
                // Add to existing subject
                exam.subjects[existingSubjectIndex].basicQuestions.push(...subjectData.basic);
                exam.subjects[existingSubjectIndex].intermediateQuestions.push(...subjectData.intermediate);
                exam.subjects[existingSubjectIndex].advancedQuestions.push(...subjectData.advanced);
            } else {
                // Create new subject
                exam.subjects.push({
                    subject,
                    basicQuestions: subjectData.basic,
                    intermediateQuestions: subjectData.intermediate,
                    advancedQuestions: subjectData.advanced
                });
            }
        });

        await exam.save();

        // Prepare response with subject information
        const csvSubjectsArray = Array.from(csvSubjects);
        const subjectInfo = csvSubjectsArray.length > 0 
            ? ` Questions from subjects: ${csvSubjectsArray.join(', ')}.`
            : '';

        // Calculate total questions added
        const totalQuestionsAdded = questions.length;
        const totalQuestionsInExam = exam.subjects.reduce((total, subject) => 
            total + subject.basicQuestions.length + subject.intermediateQuestions.length + subject.advancedQuestions.length, 0);

        res.status(200).json({
            success: true,
            message: `Questions added successfully to "${exam.examName}".${subjectInfo}`,
            data: {
                examId: exam._id,
                examName: exam.examName,
                csvSubjects: csvSubjectsArray,
                questionsAdded: totalQuestionsAdded,
                totalQuestions: totalQuestionsInExam,
                subjects: exam.subjects.map(s => ({
                    subject: s.subject,
                    totalQuestions: s.basicQuestions.length + s.intermediateQuestions.length + s.advancedQuestions.length,
                    breakdown: {
                        basic: s.basicQuestions.length,
                        intermediate: s.intermediateQuestions.length,
                        advanced: s.advancedQuestions.length
                    }
                }))
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

// Controller for adding questions to existing subject (finds first exam with that subject)
export const addQuestionsToSubject = async (req: Request, res: Response) => {
    try {
        const { subject } = req.body;
        
        if (!subject) {
            return res.status(400).json({
                success: false,
                message: 'Subject is required'
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'CSV file is required'
            });
        }

        // Find the first exam that contains the specified subject
        const exam = await Exam.findOne({ 'subjects.subject': subject.toUpperCase() });
        if (!exam) {
            return res.status(404).json({
                success: false,
                message: `No exam found for subject: ${subject}. Please create an exam for this subject first.`
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

        // Find the subject in the exam and add questions to it
        const subjectIndex = exam.subjects.findIndex(s => s.subject === subject.toUpperCase());
        if (subjectIndex >= 0) {
            exam.subjects[subjectIndex].basicQuestions.push(...basicQuestions);
            exam.subjects[subjectIndex].intermediateQuestions.push(...intermediateQuestions);
            exam.subjects[subjectIndex].advancedQuestions.push(...advancedQuestions);
        }

        await exam.save();

        // Calculate total questions in exam
        const totalQuestionsInExam = exam.subjects.reduce((total, subject) => 
            total + subject.basicQuestions.length + subject.intermediateQuestions.length + subject.advancedQuestions.length, 0);

        res.status(200).json({
            success: true,
            message: 'Questions added successfully to subject',
            data: {
                examId: exam._id,
                examName: exam.examName,
                subject: subject.toUpperCase(),
                questionsAdded: {
                    basic: basicQuestions.length,
                    intermediate: intermediateQuestions.length,
                    advanced: advancedQuestions.length
                },
                totalQuestions: totalQuestionsInExam
            }
        });

    } catch (error) {
        console.error('Error adding questions to subject:', error);
        
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Controller for adding a new subject to existing exam (creates new exam with new subject)
export const addNewSubjectToExam = async (req: Request, res: Response) => {
    try {
        const { examId, newSubject } = req.body;
        
        console.log('=== addNewSubjectToExam called ===');
        console.log('Exam ID:', examId);
        console.log('New Subject:', newSubject);
        
        if (!examId || !newSubject) {
            return res.status(400).json({
                success: false,
                message: 'Exam ID and new subject are required'
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'CSV file is required'
            });
        }

        // Find the original exam
        const originalExam = await Exam.findById(examId);
        if (!originalExam) {
            return res.status(404).json({
                success: false,
                message: 'Original exam not found'
            });
        }

        // Check if subject already exists in this exam
        const subjectExists = originalExam.subjects.some(s => s.subject === newSubject.toUpperCase());
        if (subjectExists) {
            return res.status(400).json({
                success: false,
                message: `Subject "${newSubject}" already exists in this exam`
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

        // Add new subject to existing exam
        originalExam.subjects.push({
            subject: newSubject.toUpperCase(),
            basicQuestions,
            intermediateQuestions,
            advancedQuestions
        });

        await originalExam.save();

        // Calculate total questions in exam
        const totalQuestionsInExam = originalExam.subjects.reduce((total, subject) => 
            total + subject.basicQuestions.length + subject.intermediateQuestions.length + subject.advancedQuestions.length, 0);

        res.status(200).json({
            success: true,
            message: `New subject "${newSubject}" added successfully to exam "${originalExam.examName}"`,
            data: {
                examId: originalExam._id,
                examName: originalExam.examName,
                newSubject: newSubject.toUpperCase(),
                questionsAdded: {
                    basic: basicQuestions.length,
                    intermediate: intermediateQuestions.length,
                    advanced: advancedQuestions.length
                },
                totalQuestions: totalQuestionsInExam,
                subjects: originalExam.subjects.map(s => ({
                    subject: s.subject,
                    totalQuestions: s.basicQuestions.length + s.intermediateQuestions.length + s.advancedQuestions.length,
                    breakdown: {
                        basic: s.basicQuestions.length,
                        intermediate: s.intermediateQuestions.length,
                        advanced: s.advancedQuestions.length
                    }
                }))
            }
        });

    } catch (error) {
        console.error('Error adding new subject to exam:', error);
        
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
        console.log('=== getAllExams called ===');
        console.log('Request headers:', req.headers);
        console.log('Request cookies:', req.cookies);
        
        const exams = await Exam.find()
            .select('examName subjects createdAt updatedAt')
            .sort({ createdAt: -1 });

        console.log('Found exams in DB:', exams.length);
        console.log('Exam names:', exams.map(e => e.examName));

        const examsWithCounts = exams.map(exam => {
            const totalQuestions = exam.subjects.reduce((total, subject) => 
                total + subject.basicQuestions.length + subject.intermediateQuestions.length + subject.advancedQuestions.length, 0);
            
            const totalBreakdown = exam.subjects.reduce((breakdown, subject) => ({
                basic: breakdown.basic + subject.basicQuestions.length,
                intermediate: breakdown.intermediate + subject.intermediateQuestions.length,
                advanced: breakdown.advanced + subject.advancedQuestions.length
            }), { basic: 0, intermediate: 0, advanced: 0 });

            return {
                _id: exam._id,
                examName: exam.examName,
                subjects: exam.subjects.map(s => s.subject),
                totalQuestions,
                breakdown: totalBreakdown,
                subjectDetails: exam.subjects.map(s => ({
                    subject: s.subject,
                    totalQuestions: s.basicQuestions.length + s.intermediateQuestions.length + s.advancedQuestions.length,
                    breakdown: {
                        basic: s.basicQuestions.length,
                        intermediate: s.intermediateQuestions.length,
                        advanced: s.advancedQuestions.length
                    }
                })),
                createdAt: exam.createdAt,
                updatedAt: exam.updatedAt
            };
        });

        console.log('Processed exams:', examsWithCounts);

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
