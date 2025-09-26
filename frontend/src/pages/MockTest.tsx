import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Clock, CheckCircle, ArrowLeft, AlertTriangle } from 'lucide-react';

interface Question {
  id: string;
  questionNumber: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
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
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number }>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [testStarted, setTestStarted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch test data from API
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
        setQuestions(apiResponse.data.questions);
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
      handleSubmitTest();
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
  };

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestion]: answerIndex
    });
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmitTest = () => {
    const score = calculateScore();
    navigate(`/results/test-${Date.now()}`, { 
      state: { 
        score, 
        total: questions.length, 
        answers: selectedAnswers, 
        questions,
        testData,
        subject,
        difficulty
      } 
    });
  };

  const calculateScore = () => {
    let score = 0;
    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] !== undefined && selectedAnswers[idx] === q.correctAnswer) {
        score += 1;
      }
    });
    return score;
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
            <Link
              to={`/test/${subject}`}
              className="bg-amber-600 text-white px-6 py-2 rounded-lg hover:bg-amber-700 transition-colors"
            >
              Back to Difficulty Selection
            </Link>
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
          <Link
            to={`/test/${subject}`}
            className="inline-flex items-center text-amber-600 hover:text-amber-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Difficulty Selection
          </Link>
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
              You're about to start a {testData.difficulty.toLowerCase()} level test. Please read the instructions carefully.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className={`p-6 rounded-lg border ${getDifficultyBg(testData.difficulty)}`}>
              <h3 className="font-semibold text-gray-900 mb-3">Test Information</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• {testData.totalQuestions} multiple choice questions</li>
                <li>• {testData.duration} minutes time limit</li>
                <li>• {testData.difficulty} difficulty level</li>
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
              </ul>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={handleStartTest}
              className="bg-amber-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-amber-700 transition-colors shadow-lg"
            >
              Start {testData.difficulty} Test
            </button>
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
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4">
              <span className="text-sm font-medium text-gray-600">
                Question {currentQuestion + 1} of {questions.length}
              </span>
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
      </div>

      {/* Question */}
      <div className="bg-white rounded-lg shadow-sm border border-amber-200 p-8 mb-6">
        <div className="mb-4">
          <span className="text-sm text-gray-500">Question {questions[currentQuestion]?.questionNumber}</span>
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
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
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
                onClick={() => setCurrentQuestion(index)}
                className={`w-10 h-10 rounded-lg text-sm font-semibold transition-colors ${
                  selectedAnswers[index] !== undefined
                    ? index === currentQuestion
                      ? 'bg-green-600 text-white'
                      : 'bg-green-100 text-green-800'
                    : index === currentQuestion
                      ? 'bg-amber-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
          <div className="flex items-center space-x-4 mt-3 text-xs text-gray-500">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-100 rounded mr-1"></div>
              <span>Answered</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-amber-600 rounded mr-1"></div>
              <span>Current</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-gray-100 rounded mr-1"></div>
              <span>Unanswered</span>
            </div>
          </div>

          {/* Progress Stats */}
          <div className="mt-4 pt-4 border-t border-amber-200">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Answered: {Object.keys(selectedAnswers).length}/{questions.length}</span>
              <span>Remaining: {questions.length - Object.keys(selectedAnswers).length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Warning for low time */}
      {timeLeft < 300 && timeLeft > 0 && (
        <div className="fixed top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg animate-pulse">
          <div className="flex items-center">
            <AlertTriangle className="h-4 w-4 mr-2" />
            <span className="text-sm font-semibold">Less than 5 minutes remaining!</span>
          </div>
        </div>
      )}
    </div>
  );
}
