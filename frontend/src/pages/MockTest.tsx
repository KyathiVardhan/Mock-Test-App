import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useBeforeUnload } from 'react-router-dom';
import { Clock, CheckCircle, ArrowLeft, AlertTriangle, X } from 'lucide-react';

interface Question {
  id: string;
  questionNumber: number;
  question: string;
  options: string[];
  originalIndex?: number; // To track original position for scoring
}

interface TestData {
  testId: string;
  subject: string;
  difficulty: string;
  totalQuestions: number;
  duration: number;
  questions: Question[];
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: TestData;
}

export default function MockTest() {
  const { subject, difficulty } = useParams<{ subject: string; difficulty: string }>();
  const navigate = useNavigate();
  
  const [testData, setTestData] = useState<TestData | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [originalQuestions, setOriginalQuestions] = useState<Question[]>([]); // Store original order
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number }>({});
  const [visitedQuestions, setVisitedQuestions] = useState<Set<number>>(new Set([0])); // Track visited questions, start with question 0
  const [timeLeft, setTimeLeft] = useState(0);
  const [testStarted, setTestStarted] = useState(false);
  const [testStartTime, setTestStartTime] = useState<string | null>(null); // Track test start time
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false); // Track submission state
  const [showConfirmModal, setShowConfirmModal] = useState(false); // Track confirmation modal
  const [showNavigationWarning, setShowNavigationWarning] = useState(false); // Track navigation warning

  // Prevent page refresh/close during test
  useBeforeUnload(
    React.useCallback(() => {
      if (testStarted && !submitting) {
        return "Are you sure you want to leave? Your test progress will be lost.";
      }
    }, [testStarted, submitting])
  );

  // Handle browser back button and navigation
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (testStarted && !submitting) {
        event.preventDefault();
        // Push the current state back to prevent actual navigation
        window.history.pushState(null, '', window.location.href);
        setShowNavigationWarning(true);
      }
    };

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (testStarted && !submitting) {
        const message = "Are you sure you want to leave? Your test progress will be lost.";
        event.returnValue = message;
        return message;
      }
    };

    if (testStarted && !submitting) {
      // Push initial state to history stack
      window.history.pushState(null, '', window.location.href);
      window.addEventListener('popstate', handlePopState);
      window.addEventListener('beforeunload', handleBeforeUnload);

      return () => {
        window.removeEventListener('popstate', handlePopState);
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }
  }, [testStarted, submitting]);

  // Fisher-Yates shuffle algorithm
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array]; // Create a copy to avoid mutating original
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Fetch test data from API (without correct answers)
  useEffect(() => {
    const fetchTestData = async () => {
      if (!subject || !difficulty) {
        setError('Invalid test parameters');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`http://localhost:5000/api/tests/subject/${subject}/difficulty/${difficulty}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const apiResponse: ApiResponse = await response.json();
        
        if (!apiResponse.success) {
          throw new Error(apiResponse.message || 'Failed to fetch test data');
        }

        setTestData(apiResponse.data);
        
        // Store original questions and add original index
        const questionsWithIndex = apiResponse.data.questions.map((q, index) => ({
          ...q,
          originalIndex: index
        }));
        
        setOriginalQuestions(questionsWithIndex);
        
        // Shuffle questions randomly
        const shuffledQuestions = shuffleArray(questionsWithIndex);
        setQuestions(shuffledQuestions);
        
        setTimeLeft(apiResponse.data.duration * 60); // Convert minutes to seconds

      } catch (err: any) {
        console.error('Error fetching test data:', err);
        setError(err.message || 'Failed to load test data');
      } finally {
        setLoading(false);
      }
    };

    fetchTestData();
  }, [subject, difficulty]);

  // Timer effect
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (testStarted && timeLeft > 0) {
      timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    } else if (timeLeft === 0 && testStarted) {
      // Auto-submit when time runs out (no confirmation needed)
      handleConfirmSubmit();
    }
    return () => clearTimeout(timer);
  }, [testStarted, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartTest = () => {
    setTestStarted(true);
    setTestStartTime(new Date().toISOString()); // Record start time
  };

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestion]: answerIndex
    });
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      const nextQuestion = currentQuestion + 1;
      setCurrentQuestion(nextQuestion);
      // Mark the new question as visited
      setVisitedQuestions(prev => new Set([...prev, nextQuestion]));
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      const prevQuestion = currentQuestion - 1;
      setCurrentQuestion(prevQuestion);
      // Mark the previous question as visited
      setVisitedQuestions(prev => new Set([...prev, prevQuestion]));
    }
  };

  const handleQuestionNavigation = (questionIndex: number) => {
    setCurrentQuestion(questionIndex);
    // Mark the question as visited
    setVisitedQuestions(prev => new Set([...prev, questionIndex]));
  };

  // Show confirmation modal for test submission
  const handleSubmitTest = () => {
    setShowConfirmModal(true);
  };

  // Handle "Back to Difficulty Selection" button click
  const handleBackToDifficulty = () => {
    if (testStarted && !submitting) {
      setShowNavigationWarning(true);
    } else {
      navigate(`/test/${subject}`);
    }
  };

  // Cancel submission
  const handleCancelSubmit = () => {
    setShowConfirmModal(false);
  };

  // Handle navigation warning responses
  const handleConfirmNavigation = () => {
    setShowNavigationWarning(false);
    // Navigate back to difficulty selection
    navigate(`/test/${subject}`, { replace: true });
  };

  const handleCancelNavigation = () => {
    setShowNavigationWarning(false);
    // Stay on the test page - do nothing
  };

  // Actual submit test function after confirmation
  const handleConfirmSubmit = async () => {
    setShowConfirmModal(false); // Close modal
    setShowNavigationWarning(false); // Close navigation warning if open
    
    if (submitting) return; // Prevent double submission
    
    setSubmitting(true);
    
    try {
      const endTime = new Date().toISOString();
      
      // Convert selectedAnswers to match the original question order
      const answersInOriginalOrder: { [key: number]: number } = {};
      
      // Map answers back to original question indices
      Object.keys(selectedAnswers).forEach(shuffledIndex => {
        const shuffledQuestionIndex = parseInt(shuffledIndex);
        const originalIndex = questions[shuffledQuestionIndex]?.originalIndex;
        if (originalIndex !== undefined) {
          answersInOriginalOrder[originalIndex] = selectedAnswers[shuffledQuestionIndex];
        }
      });

      const submissionData = {
        testId: testData?.testId,
        difficulty: testData?.difficulty,
        answers: answersInOriginalOrder, // Send answers mapped to original indices
        startTime: testStartTime,
        endTime: endTime
      };

      console.log('Submitting test:', submissionData); // Debug log

      const response = await fetch('http://localhost:5000/api/tests/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(submissionData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // Navigate to results page with the complete results from server
        navigate(`/results/test-${Date.now()}`, { 
          state: { 
            ...result.data, // This now includes score, results with correct answers and explanations
            shuffledQuestions: questions, // Keep track of shuffled order for reference
            originalQuestions: originalQuestions,
            userAnswers: selectedAnswers // Keep track of user's answers in shuffled order
          },
          replace: true // Use replace to prevent back navigation to test
        });
      } else {
        throw new Error(result.message || 'Failed to submit test');
      }

    } catch (error: any) {
      console.error('Error submitting test:', error);
      alert(`Failed to submit test: ${error.message}. Please try again.`);
    } finally {
      setSubmitting(false);
    }
  };

  // Shuffle questions again if user wants to restart
  const handleShuffleQuestions = () => {
    const shuffled = shuffleArray(originalQuestions);
    setQuestions(shuffled);
    setCurrentQuestion(0);
    setSelectedAnswers({});
    setVisitedQuestions(new Set([0])); // Reset visited questions
    console.log('Questions reshuffled!');
  };

  const getDifficultyColor = (level: string) => {
    const colors = {
      'basic': 'text-green-600',
      'intermediate': 'text-amber-600',
      'advanced': 'text-red-600'
    };
    return colors[level?.toLowerCase() as keyof typeof colors] || 'text-gray-600';
  };

  const getDifficultyBg = (level: string) => {
    const colors = {
      'basic': 'bg-green-50 border-green-200',
      'intermediate': 'bg-amber-50 border-amber-200',
      'advanced': 'bg-red-50 border-red-200'
    };
    return colors[level?.toLowerCase() as keyof typeof colors] || 'bg-gray-50 border-gray-200';
  };

  // Function to get question button styling
  const getQuestionButtonStyle = (index: number) => {
    const isAnswered = selectedAnswers[index] !== undefined;
    const isCurrent = index === currentQuestion;
    const isVisited = visitedQuestions.has(index);

    if (isCurrent) {
      return 'bg-amber-600 text-white'; // Current question (amber)
    } else if (isAnswered) {
      return 'bg-green-500 text-white hover:bg-green-600'; // Answered (green)
    } else if (isVisited) {
      return 'bg-red-600 text-white hover:bg-red-700'; // Visited but not answered (red)
    } else {
      return 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'; // Not visited (white)
    }
  };

  // Calculate stats for confirmation modal
  const answeredCount = Object.keys(selectedAnswers).length;
  const unansweredCount = questions.length - answeredCount;

  // Loading state
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-amber-200 p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading test questions...</p>
          <p className="text-sm text-gray-500 mt-2">
            Preparing {subject?.toUpperCase()} • {difficulty?.toUpperCase()} level
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-red-200 p-8 text-center">
          <div className="text-red-600 mb-4">
            <AlertTriangle className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Test</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-x-4">
            <button
              onClick={handleBackToDifficulty}
              className="bg-amber-600 text-white px-6 py-2 rounded-lg hover:bg-amber-700 transition-colors"
            >
              Back to Difficulty Selection
            </button>
            <button
              onClick={() => window.location.reload()}
              className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Pre-test screen
  if (!testStarted && testData) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <button
            onClick={handleBackToDifficulty}
            className="inline-flex items-center text-amber-600 hover:text-amber-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Difficulty Selection
          </button>
        </div>

        <div className={`bg-white rounded-lg shadow-sm border p-8 ${getDifficultyBg(testData.difficulty)}`}>
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {testData.subject} Test
            </h1>
            <div className={`inline-block px-4 py-2 rounded-full text-sm font-semibold capitalize ${getDifficultyColor(testData.difficulty)} bg-opacity-10`}>
              {testData.difficulty} Level
            </div>
            <p className="text-gray-600 mt-4">
              You're about to start a {testData.difficulty.toLowerCase()} level test. Questions will appear in random order.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className={`p-6 rounded-lg border ${getDifficultyBg(testData.difficulty)}`}>
              <h3 className="font-semibold text-gray-900 mb-3">Test Information</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• {testData.totalQuestions} multiple choice questions</li>
                <li>• {testData.duration} minutes time limit</li>
                <li>• {testData.difficulty} difficulty level</li>
                <li>• <strong>Questions appear in random order</strong></li>
                <li>• You can navigate between questions</li>
              </ul>
            </div>

            <div className={`p-6 rounded-lg border ${getDifficultyBg(testData.difficulty)}`}>
              <h3 className="font-semibold text-gray-900 mb-3">Instructions</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Read each question carefully</li>
                <li>• Select only one answer per question</li>
                <li>• You can review and change answers</li>
                <li>• Submit when finished or time expires</li>
                <li>• Questions are shuffled for fairness</li>
              </ul>
            </div>
          </div>

          <div className="text-center space-y-4">
            <button
              onClick={handleStartTest}
              className="bg-amber-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-amber-700 transition-colors shadow-lg"
            >
              Start {testData.difficulty} Test
            </button>
            
            {/* Optional: Add shuffle button for practice */}
            <div className="text-sm text-gray-500">
              <button
                onClick={handleShuffleQuestions}
                className="text-amber-600 hover:text-amber-700 underline"
              >
                Shuffle questions again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Test interface
  if (!testData) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-amber-200 p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4">
              <span className="text-sm font-medium text-gray-600">
                Question {currentQuestion + 1} of {questions.length}
              </span>
              <div className="text-xs text-gray-500">
                (Randomized Order)
              </div>
              <div className={`text-xs px-2 py-1 rounded-full font-semibold capitalize ${getDifficultyColor(testData.difficulty)} bg-opacity-10`}>
                {testData.subject} • {testData.difficulty}
              </div>
            </div>
            <div className="w-48 sm:w-64 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-amber-600 h-2 rounded-full transition-all"
                style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
              ></div>
            </div>
          </div>
          <div className={`flex items-center space-x-2 ${timeLeft < 300 ? 'text-red-600' : 'text-orange-600'}`}>
            <Clock className="h-5 w-5" />
            <span className="font-mono font-semibold">{formatTime(timeLeft)}</span>
          </div>
        </div>
        
        {/* Back button */}
        <div className="border-t border-amber-200 pt-4">
          <button
            onClick={handleBackToDifficulty}
            className="inline-flex items-center text-amber-600 hover:text-amber-700 text-sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Difficulty Selection
          </button>
        </div>
      </div>

      {/* Question */}
      <div className="bg-white rounded-lg shadow-sm border border-amber-200 p-8 mb-6">
        <div className="mb-4 flex justify-between items-center">
          <span className="text-sm text-gray-500">
            Question {currentQuestion + 1}
          </span>
          {/* Conditionally show ID only in development */}
          {process.env.NODE_ENV === 'development' && (
            <span className="text-xs text-gray-400">
              ID: {questions[currentQuestion]?.id?.slice(-6) || 'N/A'}
            </span>
          )}
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          {questions[currentQuestion]?.question}
        </h2>

        <div className="space-y-3">
          {questions[currentQuestion]?.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswerSelect(index)}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                selectedAnswers[currentQuestion] === index
                  ? 'border-amber-500 bg-amber-50 text-amber-900'
                  : 'border-gray-200 hover:border-amber-300 hover:bg-amber-50'
              }`}
            >
              <div className="flex items-center">
                <div className={`w-6 h-6 rounded-full border-2 mr-3 flex items-center justify-center ${
                  selectedAnswers[currentQuestion] === index
                    ? 'border-amber-500 bg-amber-500'
                    : 'border-gray-300'
                }`}>
                  {selectedAnswers[currentQuestion] === index && (
                    <CheckCircle className="h-4 w-4 text-white" />
                  )}
                </div>
                <span className="font-medium mr-3">{String.fromCharCode(65 + index)}.</span>
                <span>{option}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-amber-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex space-x-3">
            <button
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={handleNext}
              disabled={currentQuestion === questions.length - 1}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleSubmitTest}
              disabled={submitting}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Submit Test
            </button>
          </div>
        </div>

        {/* Question indicators */}
        <div className="mt-4 pt-4 border-t border-amber-200">
          <div className="flex flex-wrap gap-2">
            {questions.map((_, index) => (
              <button
                key={index}
                onClick={() => handleQuestionNavigation(index)}
                className={`w-10 h-10 rounded-lg text-sm font-semibold transition-colors ${getQuestionButtonStyle(index)}`}
              >
                {index + 1}
              </button>
            ))}
          </div>
          <div className="flex items-center space-x-4 mt-3 text-xs text-gray-500">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded mr-1"></div>
              <span>Answered</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-amber-600 rounded mr-1"></div>
              <span>Current</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-600 rounded mr-1"></div>
              <span>Visited but Unanswered</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-white border border-gray-300 rounded mr-1"></div>
              <span>Not Visited</span>
            </div>
          </div>

          {/* Progress Stats */}
          <div className="mt-4 pt-4 border-t border-amber-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex justify-between md:justify-start md:space-x-2">
                <span className="text-gray-500">Answered:</span>
                <span className="font-semibold text-green-600">
                  {Object.keys(selectedAnswers).length}
                </span>
              </div>
              <div className="flex justify-between md:justify-start md:space-x-2">
                <span className="text-gray-500">Visited:</span>
                <span className="font-semibold text-blue-600">
                  {visitedQuestions.size}
                </span>
              </div>
              <div className="flex justify-between md:justify-start md:space-x-2">
                <span className="text-gray-500">Skipped:</span>
                <span className="font-semibold text-red-600">
                  {visitedQuestions.size - Object.keys(selectedAnswers).length}
                </span>
              </div>
              <div className="flex justify-between md:justify-start md:space-x-2">
                <span className="text-gray-500">Remaining:</span>
                <span className="font-semibold text-gray-600">
                  {questions.length - visitedQuestions.size}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Navigation Warning Modal */}
      {showNavigationWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-red-100 rounded-full p-3">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </div>
            
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Leave Test?</h3>
              <p className="text-gray-700 mb-4">
                Are you sure you want to leave the test? Your current progress will be <strong>lost forever</strong>.
              </p>
              
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-left">
                <h4 className="font-semibold text-amber-900 mb-2">Current Progress:</h4>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-amber-700">Questions Answered:</span>
                    <span className="font-medium text-amber-900">{answeredCount} of {questions.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-amber-700">Time Remaining:</span>
                    <span className="font-medium text-amber-900">{formatTime(timeLeft)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-red-700 font-medium">
                  ⚠️ Warning: Leaving now will <strong>NOT</strong> save your answers. All progress will be lost!
                </p>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleCancelNavigation}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Stay & Continue Test
              </button>
              <button
                onClick={handleConfirmNavigation}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Leave Test
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Test Submission Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Submit Test?</h3>
              <button
                onClick={handleCancelSubmit}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="mb-6">
              <div className="flex items-center justify-center mb-4">
                <div className="bg-green-100 rounded-full p-3">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>

              <p className="text-gray-700 mb-4 text-center">
                Are you sure you want to submit your test? Once submitted, you <strong>cannot make any changes</strong> to your answers.
              </p>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-gray-900 mb-2">Test Summary:</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Questions:</span>
                    <span className="font-medium">{questions.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Time Left:</span>
                    <span className="font-medium text-orange-600">{formatTime(timeLeft)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-600">Answered:</span>
                    <span className="font-medium text-green-600">{answeredCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-600">Unanswered:</span>
                    <span className="font-medium text-red-600">{unansweredCount}</span>
                  </div>
                </div>
              </div>

              {unansweredCount > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-amber-600 mr-2" />
                    <p className="text-amber-800 text-sm">
                      <strong>Warning:</strong> You have {unansweredCount} unanswered question{unansweredCount !== 1 ? 's' : ''}. 
                      These will be marked as <strong>incorrect</strong>.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleCancelSubmit}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Review Answers
              </button>
              <button
                onClick={handleConfirmSubmit}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Submit Test
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Warning for low time */}
      {timeLeft < 300 && timeLeft > 0 && (
        <div className="fixed top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg animate-pulse z-40">
          <div className="flex items-center">
            <AlertTriangle className="h-4 w-4 mr-2" />
            <span className="text-sm font-semibold">Less than 5 minutes remaining!</span>
          </div>
        </div>
      )}

      {/* Submission overlay */}
      {submitting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
            <p className="text-gray-700 font-semibold">Submitting your test...</p>
            <p className="text-gray-500 text-sm mt-2">Please don't close this window</p>
          </div>
        </div>
      )}
    </div>
  );
}
