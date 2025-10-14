import express from 'express';
import { addExamFromCSV, addQuestionsToExam, getAllExams, addQuestionsToSubject, addNewSubjectToExam, upload } from '../controller/AddExam';
import { isAdminAuth } from '../middleware/adminAuthMiddleware';
import { authenticateToken } from '../middleware/isAuth';

const router = express.Router();

// Routes - Order matters! More specific routes first
router.post('/add-to-subject', isAdminAuth, upload.single('csvFile'), addQuestionsToSubject);
router.post('/add-new-subject', isAdminAuth, upload.single('csvFile'), addNewSubjectToExam);
router.post('/:examId/add-questions', isAdminAuth, upload.single('csvFile'), addQuestionsToExam);
router.post('/create', isAdminAuth, upload.single('csvFile'), addExamFromCSV);
router.get('/test', getAllExams); // Test route without auth
router.get('/', isAdminAuth, getAllExams);

export default router;
