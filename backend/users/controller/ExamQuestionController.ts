import { Request, Response } from 'express';
import { Exam } from '../models/LawExamsCollection';

// ✅ Configuration - Updated to match EXACT database names
const SYLLABUS_CONFIG: Record<string, number> = {
  'constitutional law': 10,
  'i. p. c. (indian penal code)': 8,
  'cr. p. c. (criminal procedure code)': 10,
  'c. p. c. (code of civil procedure)': 10,
  'evidence act': 8,
  'alternative dispute redressal including arbitration act': 4,
  'family law': 8,
  'administration law': 3,
  'professional ethics & cases of professional misconduct under bar council of india rules': 4,
  'company law': 2,
  'environmental law': 2,
  'cyber law': 2,
  'labour & industrial law': 4,
  'law of tort': 5,
  'law related to taxation': 2,
  'law of contract': 9, //added 1 extra for completing 100
  // 'specific relief': 2,
  'specific relief act': 3,//added 1 extra for completing 100
  'property laws': 2,
  'land acquisition act': 2,
  'intellectual property laws': 2,
};

// Helper function to normalize string for comparison - ENHANCED
const normalizeString = (str: string): string => {
  return str
    .toLowerCase()
    .replace(/\n/g, ' ') // Replace newlines with spaces
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/[()]/g, '') // Remove parentheses
    .replace(/\./g, '') // Remove periods
    .replace(/&/g, 'and') // Replace & with 'and'
    .replace(/-/g, ' ') // Replace hyphens with spaces
    .replace(/\s+/g, ' ') // Collapse multiple spaces again
    .trim(); // Remove leading/trailing spaces
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
    ...(basicQuestions || []).map(q => ({ 
      difficulty: 'basic',
      question: q.question || '',
      options: q.options || [],
      option1: q.options?.[0] || '',
      option2: q.options?.[1] || '',
      option3: q.options?.[2] || '',
      option4: q.options?.[3] || '',
      correctAnswer: q.correctAnswer || '',
      explanation: q.explanation || 'null'
    })),
    ...(intermediateQuestions || []).map(q => ({ 
      difficulty: 'intermediate',
      question: q.question || '',
      options: q.options || [],
      option1: q.options?.[0] || '',
      option2: q.options?.[1] || '',
      option3: q.options?.[2] || '',
      option4: q.options?.[3] || '',
      correctAnswer: q.correctAnswer || '',
      explanation: q.explanation || 'null'
    })),
    ...(advancedQuestions || []).map(q => ({ 
      difficulty: 'advanced',
      question: q.question || '',
      options: q.options || [],
      option1: q.options?.[0] || '',
      option2: q.options?.[1] || '',
      option3: q.options?.[2] || '',
      option4: q.options?.[3] || '',
      correctAnswer: q.correctAnswer || '',
      explanation: q.explanation || 'null'
    }))
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
        const normalizedAreaName = normalizeString(areaName);
        
        // Try to find a match in SYLLABUS_CONFIG
        let configuredCount = 0;
        
        // First try exact match
        if (SYLLABUS_CONFIG[normalizedAreaName] !== undefined) {
          configuredCount = SYLLABUS_CONFIG[normalizedAreaName];
        } else {
          // Try to find a partial match
          const configKeys = Object.keys(SYLLABUS_CONFIG);
          for (const key of configKeys) {
            const normalizedKey = normalizeString(key);
            if (normalizedKey === normalizedAreaName) {
              configuredCount = SYLLABUS_CONFIG[key];
              break;
            }
          }
        }
        
        // Debug: Log what we're matching
        console.log(`Area: "${areaName}" -> Normalized: "${normalizedAreaName}" -> Count: ${configuredCount}`);
        
        // Skip areas with no configured count (not in syllabus)
        if (configuredCount === 0) {
          return null;
        }

        // Check if area has any questions
        const totalAvailable =
          (area.basicQuestions?.length || 0) +
          (area.intermediateQuestions?.length || 0) +
          (area.advancedQuestions?.length || 0);

        if (totalAvailable === 0) {
          return {
            serialNo: index + 1,
            areaName: areaName,
            requiredQuestions: configuredCount,
            totalAvailableQuestions: 0,
            selectedQuestionCount: 0,
            status: 'No Questions Available',
            questions: []
          };
        }

        // Get random questions from this area using the configured count
        const randomQuestions = getRandomQuestions(
          area.basicQuestions,
          area.intermediateQuestions,
          area.advancedQuestions,
          configuredCount
        );

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
            options: {
              option1: q.option1,
              option2: q.option2,
              option3: q.option3,
              option4: q.option4,
            },
            correctAnswer: q.correctAnswer,
            difficulty: q.difficulty,
            explanation: q.explanation,
          })),
        };
      })
      .filter(area => area !== null);

    // Calculate actual totals based on available questions
    const totalSelectedQuestions = practiceAreasWithQuestions.reduce(
      (sum, area) => sum + area.selectedQuestionCount,
      0
    );

    const totalRequiredQuestions = Object.values(SYLLABUS_CONFIG)
      .filter(count => count > 0)
      .reduce((sum, count) => sum + count, 0);

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
