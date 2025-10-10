import express from 'express';
import { addExamFromCSV, addQuestionsToExam, getAllExams, upload } from '../controller/AddExam';
import { isAdminAuth } from '../middleware/adminAuthMiddleware';
import { authenticateToken } from '../middleware/isAuth';

const router = express.Router();

// Routes
router.post('/create', isAdminAuth, upload.single('csvFile'), addExamFromCSV);
router.post('/:examId/add-questions', isAdminAuth, upload.single('csvFile'), addQuestionsToExam);
router.get('/', authenticateToken, getAllExams);

export default router;
