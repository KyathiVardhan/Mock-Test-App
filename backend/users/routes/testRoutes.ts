import { Router } from 'express';
import { registerTest } from '../controller/testReservation';
import { validateTestRegistration } from '../middleware/testValidation';
import { authenticateToken } from '../middleware/isAuth';
import { getAllTests } from '../controller/getAllTests';
import { getQuestionsByDifficulty, getSubjectDifficulties } from '../controller/testController';
import { isAdminAuth } from '../middleware/adminAuthMiddleware';
// import { authenticateToken } from '../middleware/auth';

const router = Router();

// Test routes
// POST endpoint to create a new test
router.post("/register", isAdminAuth, validateTestRegistration, registerTest);

// Get all tests
router.get("/all-tests", authenticateToken, getAllTests);

// Subject difficulties and questions by difficulty
router.get("/subject/:subject/difficulties", getSubjectDifficulties);
router.get("/subject/:subject/difficulty/:difficulty", getQuestionsByDifficulty);

export default router;
