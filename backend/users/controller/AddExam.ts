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
    practiceArea: string; // Changed from subject to practiceArea
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
        practiceArea: row.practiceArea?.trim() || row.subject?.trim() || '' // Support both practiceArea and subject columns
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
        practiceArea: csvQuestion.practiceArea.toUpperCase()
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
        let practiceArea = '';

        // Parse CSV file
        await new Promise<void>((resolve, reject) => {
            fs.createReadStream(filePath)
                .pipe(csv())
                .on('data', (row: any) => {
                    try {
                        const cleanRow = cleanCSVRow(row);
                        questions.push(cleanRow);
                        
                        if (!practiceArea && cleanRow.practiceArea) {
                            practiceArea = cleanRow.practiceArea.toUpperCase();
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

        // Group questions by practiceArea and difficulty
        const questionsByPracticeArea: { [practiceArea: string]: { basic: any[], intermediate: any[], advanced: any[] } } = {};
        
        questions.forEach(q => {
            const area = q.practiceArea.toUpperCase();
            if (!questionsByPracticeArea[area]) {
                questionsByPracticeArea[area] = { basic: [], intermediate: [], advanced: [] };
            }
            
            const formattedQ = formatQuestion(q);
            if (q.difficulty === 'basic') {
                questionsByPracticeArea[area].basic.push(formattedQ);
            } else if (q.difficulty === 'intermediate') {
                questionsByPracticeArea[area].intermediate.push(formattedQ);
            } else {
                questionsByPracticeArea[area].advanced.push(formattedQ);
            }
        });

        // Create practiceArea array for the exam
        const practiceAreaArray = Object.keys(questionsByPracticeArea).map(area => ({
            practiceArea: area,
            basicQuestions: questionsByPracticeArea[area].basic,
            intermediateQuestions: questionsByPracticeArea[area].intermediate,
            advancedQuestions: questionsByPracticeArea[area].advanced
        }));

        // Create new exam with practiceArea array
        const newExam = new Exam({
            examName,
            practiceArea: practiceAreaArray
        });

        await newExam.save();

        res.status(201).json({
            success: true,
            message: 'Exam created successfully',
            data: {
                examId: newExam._id,
                examName: newExam.examName,
                practiceAreas: newExam.practiceArea.map(pa => ({
                    practiceArea: pa.practiceArea,
                    totalQuestions: pa.basicQuestions.length + pa.intermediateQuestions.length + pa.advancedQuestions.length,
                    breakdown: {
                        basic: pa.basicQuestions.length,
                        intermediate: pa.intermediateQuestions.length,
                        advanced: pa.advancedQuestions.length
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

        console.log('Found exam:', exam.examName, 'Practice Areas:', exam.practiceArea.map(pa => pa.practiceArea));

        const filePath = req.file.path;
        const questions: CSVQuestion[] = [];
        const csvPracticeAreas = new Set<string>();

        await new Promise<void>((resolve, reject) => {
            fs.createReadStream(filePath)
                .pipe(csv())
                .on('data', (row: any) => {
                    try {
                        const cleanRow = cleanCSVRow(row);
                        questions.push(cleanRow);
                        
                        // Track practice areas from CSV
                        if (cleanRow.practiceArea) {
                            csvPracticeAreas.add(cleanRow.practiceArea.toUpperCase());
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

        // Group questions by practiceArea and difficulty
        const questionsByPracticeArea: { [practiceArea: string]: { basic: any[], intermediate: any[], advanced: any[] } } = {};
        
        questions.forEach(q => {
            const area = q.practiceArea.toUpperCase();
            if (!questionsByPracticeArea[area]) {
                questionsByPracticeArea[area] = { basic: [], intermediate: [], advanced: [] };
            }
            
            const formattedQ = formatQuestion(q);
            if (q.difficulty === 'basic') {
                questionsByPracticeArea[area].basic.push(formattedQ);
            } else if (q.difficulty === 'intermediate') {
                questionsByPracticeArea[area].intermediate.push(formattedQ);
            } else {
                questionsByPracticeArea[area].advanced.push(formattedQ);
            }
        });

        // Add questions to existing practice areas or create new practice areas
        Object.keys(questionsByPracticeArea).forEach(area => {
            const areaData = questionsByPracticeArea[area];
            const existingAreaIndex = exam.practiceArea.findIndex(pa => pa.practiceArea === area);
            
            if (existingAreaIndex >= 0) {
                // Add to existing practice area
                exam.practiceArea[existingAreaIndex].basicQuestions.push(...areaData.basic);
                exam.practiceArea[existingAreaIndex].intermediateQuestions.push(...areaData.intermediate);
                exam.practiceArea[existingAreaIndex].advancedQuestions.push(...areaData.advanced);
            } else {
                // Create new practice area
                exam.practiceArea.push({
                    practiceArea: area,
                    basicQuestions: areaData.basic,
                    intermediateQuestions: areaData.intermediate,
                    advancedQuestions: areaData.advanced
                });
            }
        });

        await exam.save();

        // Prepare response with practice area information
        const csvPracticeAreasArray = Array.from(csvPracticeAreas);
        const practiceAreaInfo = csvPracticeAreasArray.length > 0 
            ? ` Questions from practice areas: ${csvPracticeAreasArray.join(', ')}.`
            : '';

        // Calculate total questions added
        const totalQuestionsAdded = questions.length;
        const totalQuestionsInExam = exam.practiceArea.reduce((total, area) => 
            total + area.basicQuestions.length + area.intermediateQuestions.length + area.advancedQuestions.length, 0);

        res.status(200).json({
            success: true,
            message: `Questions added successfully to "${exam.examName}".${practiceAreaInfo}`,
            data: {
                examId: exam._id,
                examName: exam.examName,
                csvPracticeAreas: csvPracticeAreasArray,
                questionsAdded: totalQuestionsAdded,
                totalQuestions: totalQuestionsInExam,
                practiceAreas: exam.practiceArea.map(pa => ({
                    practiceArea: pa.practiceArea,
                    totalQuestions: pa.basicQuestions.length + pa.intermediateQuestions.length + pa.advancedQuestions.length,
                    breakdown: {
                        basic: pa.basicQuestions.length,
                        intermediate: pa.intermediateQuestions.length,
                        advanced: pa.advancedQuestions.length
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

// Controller for adding questions to existing practice area (finds first exam with that practice area)
export const addQuestionsToPracticeArea = async (req: Request, res: Response) => {
    try {
        const { practiceArea } = req.body;
        
        if (!practiceArea) {
            return res.status(400).json({
                success: false,
                message: 'Practice area is required'
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'CSV file is required'
            });
        }

        // Find the first exam that contains the specified practice area
        const exam = await Exam.findOne({ 'practiceArea.practiceArea': practiceArea.toUpperCase() });
        if (!exam) {
            return res.status(404).json({
                success: false,
                message: `No exam found for practice area: ${practiceArea}. Please create an exam for this practice area first.`
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

        // Find the practice area in the exam and add questions to it
        const areaIndex = exam.practiceArea.findIndex(pa => pa.practiceArea === practiceArea.toUpperCase());
        if (areaIndex >= 0) {
            exam.practiceArea[areaIndex].basicQuestions.push(...basicQuestions);
            exam.practiceArea[areaIndex].intermediateQuestions.push(...intermediateQuestions);
            exam.practiceArea[areaIndex].advancedQuestions.push(...advancedQuestions);
        }

        await exam.save();

        // Calculate total questions in exam
        const totalQuestionsInExam = exam.practiceArea.reduce((total, area) => 
            total + area.basicQuestions.length + area.intermediateQuestions.length + area.advancedQuestions.length, 0);

        res.status(200).json({
            success: true,
            message: 'Questions added successfully to practice area',
            data: {
                examId: exam._id,
                examName: exam.examName,
                practiceArea: practiceArea.toUpperCase(),
                questionsAdded: {
                    basic: basicQuestions.length,
                    intermediate: intermediateQuestions.length,
                    advanced: advancedQuestions.length
                },
                totalQuestions: totalQuestionsInExam
            }
        });

    } catch (error) {
        console.error('Error adding questions to practice area:', error);
        
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Controller for adding a new practice area to existing exam
export const addNewPracticeAreaToExam = async (req: Request, res: Response) => {
    try {
        const { examId, newPracticeArea } = req.body;
        
        console.log('=== addNewPracticeAreaToExam called ===');
        console.log('Exam ID:', examId);
        console.log('New Practice Area:', newPracticeArea);
        
        if (!examId || !newPracticeArea) {
            return res.status(400).json({
                success: false,
                message: 'Exam ID and new practice area are required'
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

        // Check if practice area already exists in this exam
        const areaExists = originalExam.practiceArea.some(pa => pa.practiceArea === newPracticeArea.toUpperCase());
        if (areaExists) {
            return res.status(400).json({
                success: false,
                message: `Practice area "${newPracticeArea}" already exists in this exam`
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

        // Add new practice area to existing exam
        originalExam.practiceArea.push({
            practiceArea: newPracticeArea.toUpperCase(),
            basicQuestions,
            intermediateQuestions,
            advancedQuestions
        });

        await originalExam.save();

        // Calculate total questions in exam
        const totalQuestionsInExam = originalExam.practiceArea.reduce((total, area) => 
            total + area.basicQuestions.length + area.intermediateQuestions.length + area.advancedQuestions.length, 0);

        res.status(200).json({
            success: true,
            message: `New practice area "${newPracticeArea}" added successfully to exam "${originalExam.examName}"`,
            data: {
                examId: originalExam._id,
                examName: originalExam.examName,
                newPracticeArea: newPracticeArea.toUpperCase(),
                questionsAdded: {
                    basic: basicQuestions.length,
                    intermediate: intermediateQuestions.length,
                    advanced: advancedQuestions.length
                },
                totalQuestions: totalQuestionsInExam,
                practiceAreas: originalExam.practiceArea.map(pa => ({
                    practiceArea: pa.practiceArea,
                    totalQuestions: pa.basicQuestions.length + pa.intermediateQuestions.length + pa.advancedQuestions.length,
                    breakdown: {
                        basic: pa.basicQuestions.length,
                        intermediate: pa.intermediateQuestions.length,
                        advanced: pa.advancedQuestions.length
                    }
                }))
            }
        });

    } catch (error) {
        console.error('Error adding new practice area to exam:', error);
        
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
            .select('examName practiceArea createdAt updatedAt')
            .sort({ createdAt: -1 });

        console.log('Found exams in DB:', exams.length);
        console.log('Exam names:', exams.map(e => e.examName));

        const examsWithCounts = exams.map(exam => {
            const totalQuestions = exam.practiceArea.reduce((total, area) => 
                total + area.basicQuestions.length + area.intermediateQuestions.length + area.advancedQuestions.length, 0);
            
            const totalBreakdown = exam.practiceArea.reduce((breakdown, area) => ({
                basic: breakdown.basic + area.basicQuestions.length,
                intermediate: breakdown.intermediate + area.intermediateQuestions.length,
                advanced: breakdown.advanced + area.advancedQuestions.length
            }), { basic: 0, intermediate: 0, advanced: 0 });

            return {
                _id: exam._id,
                examName: exam.examName,
                practiceAreas: exam.practiceArea.map(pa => pa.practiceArea),
                totalQuestions,
                breakdown: totalBreakdown,
                practiceAreaDetails: exam.practiceArea.map(pa => ({
                    practiceArea: pa.practiceArea,
                    totalQuestions: pa.basicQuestions.length + pa.intermediateQuestions.length + pa.advancedQuestions.length,
                    breakdown: {
                        basic: pa.basicQuestions.length,
                        intermediate: pa.intermediateQuestions.length,
                        advanced: pa.advancedQuestions.length
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
