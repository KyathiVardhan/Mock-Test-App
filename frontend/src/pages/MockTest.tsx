import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useBeforeUnload } from 'react-router-dom';
import { Clock, CheckCircle, ArrowLeft, AlertTriangle, X, BookOpen } from 'lucide-react';


interface Question {
  id: string;
  questionNumber: number;
  question: string;
  options: string[];
  originalIndex?: number;
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
  const [originalQuestions, setOriginalQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number }>({});
  const [visitedQuestions, setVisitedQuestions] = useState<Set<number>>(new Set([0]));
  const [timeLeft, setTimeLeft] = useState(0);
  const [testStarted, setTestStarted] = useState(false);
  const [testStartTime, setTestStartTime] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showNavigationWarning, setShowNavigationWarning] = useState(false);
  const [userLimit, setUserLimit] = useState<number | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<string | null>(null);


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
        window.history.pushState(null, '', window.location.href);
        setShowNavigationWarning(true);
      }
    };


    if (testStarted && !submitting) {
      window.history.pushState(null, '', window.location.href);
      window.addEventListener('popstate', handlePopState);


      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [testStarted, submitting]);


  // Fisher-Yates shuffle algorithm
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };


  // Fetch test data from API (with limit verification)
  useEffect(() => {
    const verifyAndFetchTest = async () => {
      if (!subject || !difficulty) {
        setError('Invalid test parameters');
        setLoading(false);
        return;
      }


      try {
        setLoading(true);
        setError(null);


        // Step 1: Verify user limit
        const limitResponse = await fetch('http://localhost:5000/api/verify-limit', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });


        const limitData = await limitResponse.json();


        if (!limitData.success || limitData.limit === 0) {
          setError(
            limitData.message ||
            'You have exhausted your test attempts. Please upgrade your subscription to continue.'
          );
          setUserLimit(0);
          setUserName(limitData.userName);
          setSubscription(limitData.subscription);
          setLoading(false);
          return;
        }


        // Store user info
        setUserLimit(limitData.limit);
        setUserName(limitData.userName);
        setSubscription(limitData.subscription);


        // Step 2: Fetch test data
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
        
        setTimeLeft(apiResponse.data.duration * 60);


      } catch (err: any) {
        console.error('Error fetching test data:', err);
        setError(err.message || 'Failed to load test data');
      } finally {
        setLoading(false);
      }
    };


    verifyAndFetchTest();
  }, [subject, difficulty]);


  // Timer effect
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (testStarted && timeLeft > 0) {
      timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    } else if (timeLeft === 0 && testStarted) {
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
    setTestStartTime(new Date().toISOString());
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
      setVisitedQuestions(prev => new Set([...prev, nextQuestion]));
    }
  };


  const handlePrevious = () => {
    if (currentQuestion > 0) {
      const prevQuestion = currentQuestion - 1;
      setCurrentQuestion(prevQuestion);
      setVisitedQuestions(prev => new Set([...prev, prevQuestion]));
    }
  };


  const handleQuestionNavigation = (questionIndex: number) => {
    setCurrentQuestion(questionIndex);
    setVisitedQuestions(prev => new Set([...prev, questionIndex]));
  };


  const handleSubmitTest = () => {
    setShowConfirmModal(true);
  };


  const handleBackToDifficulty = () => {
    if (testStarted && !submitting) {
      setShowNavigationWarning(true);
    } else {
      navigate(`/test/${subject}`);
    }
  };


  const handleCancelSubmit = () => {
    setShowConfirmModal(false);
  };


  const handleConfirmNavigation = () => {
    setShowNavigationWarning(false);
    navigate(`/test/${subject}`, { replace: true });
  };


  const handleCancelNavigation = () => {
    setShowNavigationWarning(false);
  };


  // Submit test with credit decrease
  const handleConfirmSubmit = async () => {
    setShowConfirmModal(false);
    setShowNavigationWarning(false);
    
    if (submitting) return;
    
    setSubmitting(true);
    
    try {
      const endTime = new Date().toISOString();
      
      // Convert selectedAnswers to match the original question order
      const answersInOriginalOrder: { [key: number]: number } = {};
      
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
        answers: answersInOriginalOrder,
        startTime: testStartTime,
        endTime: endTime
      };


      console.log('Submitting test:', submissionData);


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
        // Decrease credit after successful submission
        const creditResponse = await fetch('http://localhost:5000/api/credit-decrease', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });


        const creditResult = await creditResponse.json();
        if (!creditResult.success) {
          console.error('Failed to decrease credit:', creditResult.message);
        }


        // Navigate to results page
        navigate(`/results/test-${Date.now()}`, { 
          state: { 
            ...result.data,
            shuffledQuestions: questions,
            originalQuestions: originalQuestions,
            userAnswers: selectedAnswers
          },
          replace: true
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


  const handleShuffleQuestions = () => {
    const shuffled = shuffleArray(originalQuestions);
    setQuestions(shuffled);
    setCurrentQuestion(0);
    setSelectedAnswers({});
    setVisitedQuestions(new Set([0]));
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


  const getQuestionButtonStyle = (index: number) => {
    const isAnswered = selectedAnswers[index] !== undefined;
    const isCurrent = index === currentQuestion;
    const isVisited = visitedQuestions.has(index);


    if (isCurrent) {
      return 'bg-amber-600 text-white';
    } else if (isAnswered) {
      return 'bg-green-500 text-white hover:bg-green-600';
    } else if (isVisited) {
      return 'bg-red-600 text-white hover:bg-red-700';
    } else {
      return 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50';
    }
  };


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
          <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Test</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          {userLimit === 0 ? (
            <>
              <p className="text-sm text-gray-500 mb-4">
                {subscription ?
                  `Current subscription: ${subscription}` :
                  'No active subscription'}
              </p>
              <div className="space-x-4">
                <button
                  onClick={() => navigate('/subscription')}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Upgrade Subscription
                </button>
                <button
                  onClick={handleBackToDifficulty}
                  className="bg-amber-600 text-white px-6 py-2 rounded-lg hover:bg-amber-700 transition-colors"
                >
                  Back to Difficulty Selection
                </button>
              </div>
            </>
          ) : (
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
          )}
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
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-amber-200 p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4 flex-1">
            <span className="text-sm font-medium text-gray-600">
              Question {currentQuestion + 1} of {questions.length}
            </span>
            <div className="flex-1 max-w-md bg-gray-200 rounded-full h-2">
              <div 
                className="bg-amber-600 h-2 rounded-full transition-all"
                style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
              ></div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 ${timeLeft < 300 ? 'text-red-600' : 'text-orange-600'}`}>
              <Clock className="h-5 w-5" />
              <span className="font-mono font-semibold">{formatTime(timeLeft)}</span>
            </div>
            {userLimit !== null && (
              <div className="flex items-center space-x-2 text-green-600">
                <BookOpen className="h-5 w-5" />
                <span className="font-medium text-sm">Tests remaining: {userLimit}</span>
              </div>
            )}
          </div>
        </div>
        
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


      {/* Main Content - Split Layout */}
      <div className="flex gap-6 items-start">
        {/* Left Side - Question and Navigation */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Question */}
          <div className="bg-white rounded-lg shadow-sm border border-amber-200 p-8 mb-6 flex-grow">
            <div className="mb-4 flex justify-between items-center">
              <div>
                <span className="text-sm text-gray-500">Question {currentQuestion + 1}</span>
                <span className={`ml-4 text-xs px-2 py-1 rounded-full font-semibold capitalize ${getDifficultyColor(testData.difficulty)} bg-opacity-10`}>
                  {testData.subject} • {testData.difficulty}
                </span>
              </div>
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


          {/* Navigation Buttons */}
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


              <button
                onClick={handleSubmitTest}
                disabled={submitting}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Test
              </button>
            </div>
          </div>
        </div>


        {/* Right Side - Question Grid */}
        <div className="w-80 flex-shrink-0">
          <div className="bg-white rounded-lg shadow-sm border border-amber-200 p-6 sticky top-4 flex flex-col" style={{ height: 'calc(100vh - 200px)', maxHeight: '800px' }}>
            <h3 className="font-semibold text-gray-900 mb-4">Question Navigator</h3>
            
            {/* Question Grid - Scrollable */}
            <div className="flex-grow overflow-y-auto mb-4 pr-2">
              <div className="flex flex-wrap gap-2">
                {questions.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuestionNavigation(index)}
                    className={`w-10 h-10 rounded-lg text-sm font-semibold transition-colors flex-shrink-0 ${getQuestionButtonStyle(index)}`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            </div>


            {/* Legend */}
            <div className="space-y-2 mb-4 pb-4 border-b border-amber-200">
              <div className="flex items-center text-xs text-gray-600">
                <div className="w-4 h-4 bg-green-500 rounded mr-2 flex-shrink-0"></div>
                <span>Answered</span>
              </div>
              <div className="flex items-center text-xs text-gray-600">
                <div className="w-4 h-4 bg-amber-600 rounded mr-2 flex-shrink-0"></div>
                <span>Current</span>
              </div>
              <div className="flex items-center text-xs text-gray-600">
                <div className="w-4 h-4 bg-red-600 rounded mr-2 flex-shrink-0"></div>
                <span>Visited</span>
              </div>
              <div className="flex items-center text-xs text-gray-600">
                <div className="w-4 h-4 bg-white border border-gray-300 rounded mr-2 flex-shrink-0"></div>
                <span>Not Visited</span>
              </div>
            </div>


            {/* Stats */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Answered:</span>
                <span className="font-semibold text-green-600">{answeredCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Unanswered:</span>
                <span className="font-semibold text-red-600">{unansweredCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Visited:</span>
                <span className="font-semibold text-blue-600">{visitedQuestions.size}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Remaining:</span>
                <span className="font-semibold text-gray-600">
                  {questions.length - visitedQuestions.size}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Navigation Warning Modal */}
      {showNavigationWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-red-100 rounded-full p-3">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">Leave Test?</h3>
            <p className="text-gray-700 mb-4 text-center">
              Your progress will be lost forever.
            </p>
            
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-amber-700">Answered:</span>
                  <span className="font-medium text-amber-900">{answeredCount} of {questions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-amber-700">Time Left:</span>
                  <span className="font-medium text-amber-900">{formatTime(timeLeft)}</span>
                </div>
              </div>
            </div>


            <div className="flex space-x-3">
              <button
                onClick={handleCancelNavigation}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Continue Test
              </button>
              <button
                onClick={handleConfirmNavigation}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Submit Confirmation Modal */}
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
            
            <div className="flex items-center justify-center mb-4">
              <div className="bg-green-100 rounded-full p-3">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>


            <p className="text-gray-700 mb-4 text-center">
              Once submitted, you cannot change your answers.
            </p>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-gray-900 mb-2">Summary:</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total:</span>
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
                    {unansweredCount} question{unansweredCount !== 1 ? 's' : ''} unanswered
                  </p>
                </div>
              </div>
            )}


            <div className="flex space-x-3">
              <button
                onClick={handleCancelSubmit}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Review
              </button>
              <button
                onClick={handleConfirmSubmit}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Low Time Warning */}
      {timeLeft < 300 && timeLeft > 0 && (
        <div className="fixed top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg animate-pulse z-40">
          <div className="flex items-center">
            <AlertTriangle className="h-4 w-4 mr-2" />
            <span className="text-sm font-semibold">Less than 5 minutes!</span>
          </div>
        </div>
      )}


      {/* Submitting Overlay */}
      {submitting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
            <p className="text-gray-700 font-semibold">Submitting your test...</p>
          </div>
        </div>
      )}
    </div>
  );
}
