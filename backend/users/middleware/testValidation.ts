import { body } from 'express-validator';

export const validateTestRegistration = [
    body('subject')
        .exists({ checkFalsy: true })
        .withMessage('Subject is required')
        .bail()
        .trim()
        .toLowerCase()
        .isIn([
            'constitutional-law', 'criminal-law', 'civil-law', 'corporate-law',
            'contract-law', 'property-law', 'family-law', 'administrative-law',
            'environmental-law', 'international-law', 'ipc-law', 'crpc-law', 'labor-law', 'tax-law'
        ])
        .withMessage('Invalid subject'),
    
    body('difficulty')
        .exists({ checkFalsy: true })
        .withMessage('Difficulty is required')
        .bail()
        .trim()
        .toLowerCase()
        .isIn(['basic', 'intermediate', 'advanced'])
        .withMessage('Difficulty must be basic, intermediate, or advanced'),
    
    body('duration')
        .exists({ checkFalsy: true })
        .withMessage('Duration is required')
        .bail()
        .trim()
        .toInt()
        .isInt({ min: 1, max: 180 })
        .withMessage('Duration must be between 1-180 minutes'),
    
    // CSV provides questions; no body questions validation is required here
    
    body('price')
        .optional()
        .isNumeric()
        .isFloat({ min: 0 })
        .withMessage('Price must be a positive number')
];
