import { Router } from 'express';
import { registerTest } from '../controller/testReservation';
import { validateTestRegistration } from '../middleware/testValidation';
import { authenticateToken } from '../middleware/isAuth';
import { getAllTests } from '../controller/getAllTests';
// import { authenticateToken } from '../middleware/auth';

const router = Router();

// Test routes
// POST endpoint to create a new test
router.post("/register", validateTestRegistration, registerTest);
// GET endpoint to get all tests
// router.get("/", async (req, res) => {
//     res.status(200).json({ message: "Get all tests endpoint" });
// });

// Get all tests
router.get("/all-tests", authenticateToken, getAllTests);

// Get test by subject
router.get("/:subject", (req, res) => {
    // Your get test by subject logic here
});

export default router;
