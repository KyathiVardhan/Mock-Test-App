import { Request, Response } from "express";
import { Test } from "../models/TestCollection"; // Adjust path to your Test model
import { Exam } from "../models/LawExamsCollection";


// Get 3 most recent tests from the entire Test collection
export const recentTests = async (req: Request, res: Response) => {
    try {
        
        // Get token from Authorization header (Bearer Token)
        const authHeader = req.headers.authorization;

        // Check if Authorization header exists
        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: 'No authorization header provided'
            });
        }

        // Fetch 3 most recent tests from entire collection (not filtered by user)
        const recentTests = await Test.find()
            .sort({ createdAt: -1 }) // Sort by most recent first
            .limit(3)
            .select('subject createdAt updatedAt')
            .lean();

        // Format the response
        const formattedTests = recentTests.map(test => ({
            id: test._id,
            testName: test.subject,
            createdAt: test.createdAt,
            updatedAt: test.updatedAt
        }));

        return res.status(200).json({
            success: true,
            message: "Recent tests fetched successfully",
            data: formattedTests
        });

    } catch (error: any) {
        console.error("Error fetching recent tests:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch recent tests",
            error: error.message
        });
    }
};

export const recentExams = async(req:Request,res:Response)=>{
    try {
        const authHeader = req.headers.authorization;
    
    if (!authHeader) {
        return res.status(401).json({
            success: false,
            message: "No authorization header provided."
        })
    }

    //Get recent 3 exams from Exam collection
    const recentExams = await Exam.find()
        .sort({createdAt: -1})
        .limit(3)
        .select('examName createdAt updatedAt')
        .lean();
    
    const fromatedExams = recentExams.map(exam => ({
        exam_id: exam._id,
        examName: exam.examName,
        createdAt: exam.createdAt,
        updatedAt: exam.updatedAt
    }));

    res.status(200).json({
        success: true,
        message: "Recent exams fetched successfully",
        data: fromatedExams
    });
    } catch (error: any) {
        console.error("Error fetching recent tests:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch recent tests",
            error: error.message
        });
    }
}