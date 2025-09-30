import express from 'express';
import { loginAdmin } from '../controller/adminLogin';
import { isAdminAuth } from '../middleware/adminAuthMiddleware';
import { logoutAdmin } from '../controller/adminLogin';

const router = express.Router();

// Public admin routes
router.post('/login', loginAdmin);
router.post('/logout', logoutAdmin);
// Protected admin routes
router.use(isAdminAuth); // Apply admin auth to all routes below




export default router;
