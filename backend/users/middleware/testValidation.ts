import { body } from 'express-validator';

export const validateTestRegistration = [
    body('subject')
        .isString()
        .notEmpty()
        .withMessage('Subject is required')
        .isLength({ min: 2, max: 50 })
        .withMessage('Subject must be between 2-50 characters'),
    
    body('questions')
        .isArray({ min: 1 })
        .withMessage('Questions array is required with at least one question'),
    
    body('questions.*.question')
        .isString()
        .notEmpty()
        .withMessage('Question text is required'),
    
    body('questions.*.options')
        .isArray({ min: 2, max: 6 })
        .withMessage('Each question must have 2-6 options'),
    
    body('questions.*.correctAnswer')
        .notEmpty()
        .withMessage('Correct answer is required'),
    
    body('questions.*.explanation')
        .isString()
        .notEmpty()
        .withMessage('Explanation is required'),
    
    body('duration')
        .optional()
        .isNumeric()
        .isFloat({ min: 0.5, max: 10 })
        .withMessage('Duration must be between 0.5-10 minutes per question'),
    
    body('price')
        .optional()
        .isNumeric()
        .isFloat({ min: 0 })
        .withMessage('Price must be a positive number')
];
