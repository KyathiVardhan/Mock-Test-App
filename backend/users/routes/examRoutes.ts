import express from 'express';
import { addExamFromCSV, addQuestionsToExam, getAllExams, addQuestionsToPracticeArea, addNewPracticeAreaToExam, upload } from '../controller/AddExam';
import { isAdminAuth } from '../middleware/adminAuthMiddleware';
import { authenticateToken } from '../middleware/isAuth';
import { getExamQuestions, submitExamResults } from '../controller/ExamQuestionController';

const router = express.Router();

// Routes - Order matters! More specific routes first
router.post('/add-to-subject', isAdminAuth, upload.single('csvFile'), addQuestionsToPracticeArea);
router.post('/add-new-subject', isAdminAuth, upload.single('csvFile'), addNewPracticeAreaToExam);
router.post('/:examId/add-questions', isAdminAuth, upload.single('csvFile'), addQuestionsToExam);
router.post('/create', isAdminAuth, upload.single('csvFile'), addExamFromCSV);
router.post('/get-exam',authenticateToken, getExamQuestions);
router.post('/submit-exam',authenticateToken, submitExamResults);
router.get('/test', authenticateToken, getAllExams); // Test route without auth
router.get('/', isAdminAuth, getAllExams);

export default router;
