import express from 'express';
import { loginAdmin } from '../controller/adminLogin';
import { isAdminAuth } from '../middleware/adminAuthMiddleware';

const router = express.Router();

// Public admin routes
router.post('/login', loginAdmin);

// Protected admin routes
router.use(isAdminAuth); // Apply admin auth to all routes below

// router.post('/logout', logoutAdmin);
router.get('/dashboard', (req, res) => {
    res.json({
        success: true,
        message: 'Admin dashboard access granted',
        // admin: req.admin
    });
});

export default router;
