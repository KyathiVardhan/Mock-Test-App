import { Router } from 'express';
import { registerTest, uploadCSV } from '../controller/testReservation';
import { validateTestRegistration } from '../middleware/testValidation';
import { authenticateToken } from '../middleware/isAuth';
import { getAllTests } from '../controller/getAllTests';
// import { getQuestionsByDifficulty, getSubjectDifficulties } from '../controller/testController';
import { isAdminAuth } from '../middleware/adminAuthMiddleware';
import { Request, Response, NextFunction } from 'express';
import { getQuestionsForTest, getSubjectDifficulties, submitTest } from '../controller/testController';

// Error handling middleware
const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('Route error:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error'
    });
};

const router = Router();

// Admin routes for test management
router.post("/register", 
    isAdminAuth,           // Verify admin authentication
    uploadCSV,             // Handle CSV file upload
    validateTestRegistration, // Validate test data
    registerTest           // Process test registration
);

// Admin route to get all tests (for management)
router.get("/admin/tests", isAdminAuth, getAllTests);

// User routes for accessing tests
router.get("/all-tests", authenticateToken, getAllTests);

// // Public routes for subject information
// router.get("/subject/:subject/difficulties",
//     authenticateToken,    // User must be authenticated
//     getSubjectDifficulties
// );

// // Protected route for accessing test questions
// router.get("/subject/:subject/difficulty/:difficulty",
//     authenticateToken,    // User must be authenticated
//     getQuestionsByDifficulty
// );

// Get questions for test (without answers/explanations)
router.get('/subject/:subject/difficulty/:difficulty', authenticateToken, getQuestionsForTest);

// Submit test and get results
router.post('/submit', submitTest);

// Get available difficulties for subject
router.get('/subject/:subject/difficulties', authenticateToken, getSubjectDifficulties);

// Apply error handling middleware
router.use(errorHandler);

export default router;
