import { Request, Response } from 'express';
import { Exam } from '../models/LawExamsCollection';

// ✅ Configuration - Define questions per practice area based on syllabus
const SYLLABUS_CONFIG: Record<string, number> = {
  'Constitutional law': 10,
  'Indian Penal Code-IPC': 8,
  'Cr. P. C.-Criminal Procedure Code': 10,
  'C. P. C.-Code of Civil Procedure': 10,
  'Alternative Dispute Redressal including Arbitration Act': 4,
  'Family Law': 8,
  'Administration Law': 3,
  'Professional Ethics & Cases of Professional Misconduct under Bar Council of India Rules': 4,
  'Company Law': 2,
  'Environmental Law': 2,
  'Labour & Industrial Law': 4,
  'Law of Tort': 5,
  'Law related to Taxation': 2,
  'Law of Contract': 8,
  'Specific Relief': 2,
  'Property Laws': 2,
  'Land Acquisition Act': 2,
  'Intellectual Property Laws': 2,
};

// Helper function to shuffle array using Fisher-Yates algorithm
const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Helper function to get random questions from an area
const getRandomQuestions = (
  basicQuestions: any[] = [],
  intermediateQuestions: any[] = [],
  advancedQuestions: any[] = [],
  count: number
) => {
  // Combine all questions from different difficulty levels
  const allQuestions = [
    ...(basicQuestions || []).map(q => ({ ...q, difficulty: 'basic' })),
    ...(intermediateQuestions || []).map(q => ({ ...q, difficulty: 'intermediate' })),
    ...(advancedQuestions || []).map(q => ({ ...q, difficulty: 'advanced' }))
  ];

  // Shuffle the combined array
  const shuffled = shuffleArray(allQuestions);

  // Return specified count (or all if less available)
  return shuffled.slice(0, Math.min(count, shuffled.length));
};

export const getExamSyllabus = async (req: Request, res: Response) => {
  try {
    const { examName } = req.body;

    // Validation
    if (!examName) {
      return res.status(400).json({
        success: false,
        message: 'Exam name is required',
      });
    }

    // Find exam
    const exam = await Exam.findOne({ examName: examName });

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: `Exam "${examName}" not found in the collection`,
      });
    }

    // Check if practiceAreas exist
    if (!exam.practiceArea || exam.practiceArea.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No practice areas defined for this exam',
      });
    }

    // ✅ Build syllabus with random questions based on configured counts
    const practiceAreasWithQuestions = exam.practiceArea
      .map((area, index) => {
        const areaName = area.practiceArea;
        
        // Get the configured question count for this area
        const configuredCount = SYLLABUS_CONFIG[areaName];
        
        // Skip areas not in syllabus (like Public Interest Litigation, Negotiable Instrument Act)
        if (configuredCount === undefined) {
          return null;
        }

        // Get random questions from this area using the configured count
        const randomQuestions = getRandomQuestions(
          area.basicQuestions,
          area.intermediateQuestions,
          area.advancedQuestions,
          configuredCount
        );

        const totalAvailable =
          (area.basicQuestions?.length || 0) +
          (area.intermediateQuestions?.length || 0) +
          (area.advancedQuestions?.length || 0);

        return {
          serialNo: index + 1,
          areaName: areaName,
          requiredQuestions: configuredCount,
          totalAvailableQuestions: totalAvailable,
          selectedQuestionCount: randomQuestions.length,
          status: randomQuestions.length >= configuredCount ? 'Complete' : 'Insufficient',
          questions: randomQuestions.map((q, qIndex) => ({
            questionNo: qIndex + 1,
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            difficulty: q.difficulty,
            explanation: q.explanation || '',
          })),
        };
      })
      .filter(area => area !== null); // Remove areas not in syllabus

    const totalSelectedQuestions = practiceAreasWithQuestions.reduce(
      (sum, area) => sum + area.selectedQuestionCount,
      0
    );

    const totalRequiredQuestions = Object.values(SYLLABUS_CONFIG).reduce(
      (sum, count) => sum + count,
      0
    );

    const syllabus = {
      examId: exam._id,
      examName: exam.examName,
      totalPracticeAreas: practiceAreasWithQuestions.length,
      totalRequiredQuestions,
      totalSelectedQuestions,
      practiceAreas: practiceAreasWithQuestions,
      examDetails: {
        duration: 180,
        totalMarks: 100,
        passingMarks: 45,
      },
      createdAt: exam.createdAt,
      updatedAt: exam.updatedAt,
    };

    return res.status(200).json({
      success: true,
      message: 'Syllabus with random questions retrieved successfully',
      data: syllabus,
    });
  } catch (err) {
    console.error('Error fetching exam syllabus:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
