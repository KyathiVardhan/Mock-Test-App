import { Request, Response } from 'express';
import { Exam } from '../models/LawExamsCollection';
import crypto from 'crypto';
import mongoose from 'mongoose';

// ✅ Configuration
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
  'law of contract': 9,
  'specific relief act': 3,
  'property laws': 2,
  'land acquisition act': 2,
  'intellectual property laws': 2,
};

const normalizeString = (str: string): string => {
  return str
    .toLowerCase()
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/[()]/g, '')
    .replace(/\./g, '')
    .replace(/&/g, 'and')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Generate unique hash for question identification (secure)
// Uses question content + position as unique identifier
const generateQuestionHash = (
  examId: string,
  practiceArea: string,
  difficulty: string,
  questionIndex: number,
  questionText: string
): string => {
  const uniqueString = `${examId}-${practiceArea}-${difficulty}-${questionIndex}-${questionText.substring(0, 50)}`;
  return crypto.createHash('sha256')
    .update(`${uniqueString}-${process.env.SECRET_KEY || 'default-secret'}`)
    .digest('hex');
};

const getIdAsString = (id: any): string => {
  if (!id) return '';
  if (typeof id === 'string') return id;
  if (id instanceof mongoose.Types.ObjectId) return id.toString();
  if (id._id) return getIdAsString(id._id);
  return String(id);
};

// Helper function to get random questions WITHOUT answers/explanations
const getRandomQuestionsSecure = (
  basicQuestions: any[] = [],
  intermediateQuestions: any[] = [],
  advancedQuestions: any[] = [],
  count: number,
  examId: string,
  practiceArea: string
) => {
  const allQuestions = [
    ...(basicQuestions || []).map((q, index) => ({ 
      difficulty: 'basic',
      question: q.question || '',
      options: {
        option1: q.options?.[0] || '',
        option2: q.options?.[1] || '',
        option3: q.options?.[2] || '',
        option4: q.options?.[3] || '',
      },
      questionHash: generateQuestionHash(examId, practiceArea, 'basic', index, q.question || ''),
      questionIndex: index,
    })),
    ...(intermediateQuestions || []).map((q, index) => ({ 
      difficulty: 'intermediate',
      question: q.question || '',
      options: {
        option1: q.options?.[0] || '',
        option2: q.options?.[1] || '',
        option3: q.options?.[2] || '',
        option4: q.options?.[3] || '',
      },
      questionHash: generateQuestionHash(examId, practiceArea, 'intermediate', index, q.question || ''),
      questionIndex: index,
    })),
    ...(advancedQuestions || []).map((q, index) => ({ 
      difficulty: 'advanced',
      question: q.question || '',
      options: {
        option1: q.options?.[0] || '',
        option2: q.options?.[1] || '',
        option3: q.options?.[2] || '',
        option4: q.options?.[3] || '',
      },
      questionHash: generateQuestionHash(examId, practiceArea, 'advanced', index, q.question || ''),
      questionIndex: index,
    }))
  ];

  const shuffled = shuffleArray(allQuestions);
  return shuffled.slice(0, Math.min(count, shuffled.length));
};

// ✅ GET EXAM QUESTIONS (WITHOUT ANSWERS/EXPLANATIONS)
export const getExamQuestions = async (req: Request, res: Response) => {
  try {
    const { examName } = req.body;

    if (!examName) {
      return res.status(400).json({
        success: false,
        message: 'Exam name is required',
      });
    }

    const exam = await Exam.findOne({ examName: examName });

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: `Exam "${examName}" not found`,
      });
    }

    if (!exam.practiceArea || exam.practiceArea.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No practice areas defined for this exam',
      });
    }

    const examId = getIdAsString(exam._id);

    const practiceAreasWithQuestions = exam.practiceArea
      .map((area, index) => {
        const areaName = area.practiceArea;
        const normalizedAreaName = normalizeString(areaName);
        
        let configuredCount = 0;
        
        if (SYLLABUS_CONFIG[normalizedAreaName] !== undefined) {
          configuredCount = SYLLABUS_CONFIG[normalizedAreaName];
        } else {
          const configKeys = Object.keys(SYLLABUS_CONFIG);
          for (const key of configKeys) {
            const normalizedKey = normalizeString(key);
            if (normalizedKey === normalizedAreaName) {
              configuredCount = SYLLABUS_CONFIG[key];
              break;
            }
          }
        }
        
        if (configuredCount === 0) {
          return null;
        }

        const totalAvailable =
          (area.basicQuestions?.length || 0) +
          (area.intermediateQuestions?.length || 0) +
          (area.advancedQuestions?.length || 0);

        if (totalAvailable === 0) {
          return null;
        }

        const randomQuestions = getRandomQuestionsSecure(
          area.basicQuestions,
          area.intermediateQuestions,
          area.advancedQuestions,
          configuredCount,
          examId,
          areaName
        );

        return {
          serialNo: index + 1,
          areaName: areaName,
          selectedQuestionCount: randomQuestions.length,
          questions: randomQuestions.map((q, qIndex) => ({
            questionNo: qIndex + 1,
            questionHash: q.questionHash,
            question: q.question,
            options: q.options,
            difficulty: q.difficulty,
            practiceArea: areaName,
          })),
        };
      })
      .filter(area => area !== null && area.questions && area.questions.length > 0);

    const totalSelectedQuestions = practiceAreasWithQuestions.reduce(
      (sum, area) => sum + (area?.selectedQuestionCount || 0),
      0
    );

    const totalRequiredQuestions = Object.values(SYLLABUS_CONFIG)
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
      message: 'Exam questions retrieved successfully',
      data: syllabus,
    });
  } catch (err) {
    console.error('Error fetching exam questions:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// ✅ SUBMIT EXAM AND GET RESULTS (WITH ANSWERS/EXPLANATIONS)
export const submitExamResults = async (req: Request, res: Response) => {
  try {
    const { 
      examName, 
      userAnswers, // Array of { questionHash, userAnswer }
      startTime,
      endTime 
    } = req.body;

    if (!examName || !userAnswers || !Array.isArray(userAnswers)) {
      return res.status(400).json({
        success: false,
        message: 'Exam name and user answers are required',
      });
    }

    const exam = await Exam.findOne({ examName: examName });

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: `Exam "${examName}" not found`,
      });
    }

    const examId = getIdAsString(exam._id);

    // Build a map of questionHash -> question details
    const questionMap = new Map<string, any>();
    
    exam.practiceArea.forEach(area => {
      // Process basic questions
      if (area.basicQuestions && area.basicQuestions.length > 0) {
        area.basicQuestions.forEach((q, index) => {
          const hash = generateQuestionHash(examId, area.practiceArea, 'basic', index, q.question || '');
          questionMap.set(hash, {
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            difficulty: 'basic',
            practiceArea: area.practiceArea
          });
        });
      }

      // Process intermediate questions
      if (area.intermediateQuestions && area.intermediateQuestions.length > 0) {
        area.intermediateQuestions.forEach((q, index) => {
          const hash = generateQuestionHash(examId, area.practiceArea, 'intermediate', index, q.question || '');
          questionMap.set(hash, {
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            difficulty: 'intermediate',
            practiceArea: area.practiceArea
          });
        });
      }

      // Process advanced questions
      if (area.advancedQuestions && area.advancedQuestions.length > 0) {
        area.advancedQuestions.forEach((q, index) => {
          const hash = generateQuestionHash(examId, area.practiceArea, 'advanced', index, q.question || '');
          questionMap.set(hash, {
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            difficulty: 'advanced',
            practiceArea: area.practiceArea
          });
        });
      }
    });

    // Process user answers and calculate results
    const results = userAnswers.map(({ questionHash, userAnswer }: { questionHash: string; userAnswer: string }) => {
      const question = questionMap.get(questionHash);
      
      if (!question) {
        console.warn(`Question not found for hash: ${questionHash}`);
        return null;
      }

      const isCorrect = userAnswer === question.correctAnswer;

      return {
        questionHash,
        question: question.question,
        options: {
          option1: question.options?.[0] || '',
          option2: question.options?.[1] || '',
          option3: question.options?.[2] || '',
          option4: question.options?.[3] || '',
        },
        userAnswer: userAnswer || 'Not Answered',
        correctAnswer: question.correctAnswer,
        isCorrect,
        difficulty: question.difficulty,
        explanation: question.explanation || 'No explanation available',
        practiceArea: question.practiceArea,
      };
    }).filter(result => result !== null);

    // Calculate scores
    const totalQuestions = results.length;
    const correctAnswers = results.filter(r => r && r.isCorrect).length;
    const incorrectAnswers = results.filter(r => r && !r.isCorrect && r.userAnswer !== 'Not Answered').length;
    const notAnswered = results.filter(r => r && r.userAnswer === 'Not Answered').length;
    const score = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
    const passed = score >= 45;

    const timeTaken = startTime && endTime 
      ? Math.floor((new Date(endTime).getTime() - new Date(startTime).getTime()) / 1000) 
      : 0;

    const breakdownByDifficulty = {
      basic: {
        total: results.filter(r => r && r.difficulty === 'basic').length,
        correct: results.filter(r => r && r.difficulty === 'basic' && r.isCorrect).length,
        percentage: 0,
      },
      intermediate: {
        total: results.filter(r => r && r.difficulty === 'intermediate').length,
        correct: results.filter(r => r && r.difficulty === 'intermediate' && r.isCorrect).length,
        percentage: 0,
      },
      advanced: {
        total: results.filter(r => r && r.difficulty === 'advanced').length,
        correct: results.filter(r => r && r.difficulty === 'advanced' && r.isCorrect).length,
        percentage: 0,
      },
    };

    breakdownByDifficulty.basic.percentage = breakdownByDifficulty.basic.total > 0
      ? parseFloat(((breakdownByDifficulty.basic.correct / breakdownByDifficulty.basic.total) * 100).toFixed(2))
      : 0;
    breakdownByDifficulty.intermediate.percentage = breakdownByDifficulty.intermediate.total > 0
      ? parseFloat(((breakdownByDifficulty.intermediate.correct / breakdownByDifficulty.intermediate.total) * 100).toFixed(2))
      : 0;
    breakdownByDifficulty.advanced.percentage = breakdownByDifficulty.advanced.total > 0
      ? parseFloat(((breakdownByDifficulty.advanced.correct / breakdownByDifficulty.advanced.total) * 100).toFixed(2))
      : 0;

    const practiceAreas = [...new Set(results.filter(r => r).map(r => r!.practiceArea))];
    const breakdownByArea = practiceAreas.map(areaName => {
      const areaResults = results.filter(r => r && r.practiceArea === areaName);
      const correct = areaResults.filter(r => r && r.isCorrect).length;
      const total = areaResults.length;
      
      return {
        areaName,
        total,
        correct,
        incorrect: total - correct,
        percentage: total > 0 ? parseFloat(((correct / total) * 100).toFixed(2)) : 0,
      };
    }).sort((a, b) => b.percentage - a.percentage);

    const resultData = {
      examId: exam._id,
      examName: exam.examName,
      totalQuestions,
      correctAnswers,
      incorrectAnswers,
      notAnswered,
      score: parseFloat(score.toFixed(2)),
      passed,
      totalMarks: 100,
      passingMarks: 45,
      timeTaken,
      timeTakenFormatted: formatTime(timeTaken),
      startTime,
      endTime,
      results,
      breakdownByDifficulty,
      breakdownByArea,
    };

    return res.status(200).json({
      success: true,
      message: 'Exam submitted successfully',
      data: resultData,
    });
  } catch (err) {
    console.error('Error submitting exam:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
};
