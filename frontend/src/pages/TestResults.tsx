import React, { useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { 
  CheckCircle, 
  XCircle, 
  Home, 
  RotateCcw, 
  Share2, 
  Clock, 
  Trophy, 
  Target, 
  BookOpen,
  Eye,
  EyeOff,
  ArrowLeft
} from 'lucide-react';

interface QuestionResult {
  questionId: string;
  questionNumber: number;
  question: string;
  options: string[];
  correctAnswer: number;
  userAnswer: number | undefined;
  isCorrect: boolean;
  explanation: string;
}

interface TestResults {
  testId: string;
  subject: string;
  difficulty: string;
  score: {
    correct: number;
    total: number;
    percentage: number;
    
  };
  timing: {
    startTime: string;
    endTime: string;
    timeTaken: string;
  };
  results: QuestionResult[];
}

export default function TestResults() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showExplanations, setShowExplanations] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'correct' | 'incorrect' | 'unanswered'>('all');

  // Get results data from navigation state (new secure API format)
  const resultsData = location.state as TestResults;

  // Handle missing data
  if (!resultsData || !resultsData.results) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <p className="text-gray-600 mb-4">No test results found.</p>
        <Link 
          to="/dashboard" 
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const { score, timing, results, subject, difficulty } = resultsData;

  // Filter results based on selected filter
  const filteredResults = results.filter(result => {
    switch (selectedFilter) {
      case 'correct':
        return result.isCorrect;
      case 'incorrect':
        return !result.isCorrect && result.userAnswer !== undefined;
      case 'unanswered':
        return result.userAnswer === undefined;
      default:
        return true;
    }
  });

  const getScoreColor = () => {
    if (score.percentage >= 80) return 'text-green-600';
    if (score.percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBackground = () => {
    if (score.percentage >= 80) return 'bg-green-50 border-green-200';
    if (score.percentage >= 60) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  

  const unansweredCount = results.filter(r => r.userAnswer === undefined).length;
  const incorrectCount = results.filter(r => !r.isCorrect && r.userAnswer !== undefined).length;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <Link
            to="/dashboard"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Test Results</h1>
          <p className="text-gray-600">
            {subject} • {difficulty} Level • {new Date(timing.endTime).toLocaleDateString()}
          </p>
        </div>

        {/* Results Header */}
        <div className={`rounded-lg border-2 p-8 mb-8 ${getScoreBackground()}`}>
          <div className="text-center">
            <div className="mb-4">
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Test Complete!</h2>
            <p className="text-gray-600 mb-6">Here are your results</p>
            
            <div className="grid grid-cols-1  md:grid-cols-3 gap-6 mb-6">
              
              <div className="text-center">
                <p className={`text-4xl font-bold ${getScoreColor()}`}>{score.percentage}%</p>
                <p className="text-sm text-gray-600">Overall Score</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold text-gray-900">{score.correct}/{score.total}</p>
                <p className="text-sm text-gray-600">Correct Answers</p>
              </div>
              <div className="text-center">
                
                <p className="text-4xl font-bold text-gray-900">{timing.timeTaken || 'N/A'}</p>
                <p className="text-sm text-gray-600">Time Taken</p>
              </div>
            </div>

            {/* Performance Message */}
            {score.percentage >= 80 ? (
              <p className="text-green-700 font-semibold">
                🎉 Excellent work! You have a strong understanding of this area.
              </p>
            ) : score.percentage >= 60 ? (
              <p className="text-yellow-700 font-semibold">
                👍 Good effort! Review the explanations to improve further.
              </p>
            ) : (
              <p className="text-red-700 font-semibold">
                📚 Keep studying! Focus on the areas where you struggled.
              </p>
            )}
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{score.correct}</div>
            <div className="text-sm text-gray-600">Correct</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{incorrectCount}</div>
            <div className="text-sm text-gray-600">Incorrect</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
            <div className="text-2xl font-bold text-gray-600">{unansweredCount}</div>
            <div className="text-sm text-gray-600">Unanswered</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{results.length}</div>
            <div className="text-sm text-gray-600">Total Questions</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 justify-center mb-8">
          <Link
            to="/dashboard"
            className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Home className="h-5 w-5 mr-2" />
            Back to Dashboard
          </Link>
          <Link
            to={`/test/${subject.toLowerCase()}`}
            className="flex items-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <RotateCcw className="h-5 w-5 mr-2" />
            Retake Test
          </Link>
          <button 
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: 'My Test Results',
                  text: `I scored ${score.percentage}% on the ${subject} ${difficulty} test!`,
                  url: window.location.href
                });
              } else {
                navigator.clipboard.writeText(`I scored ${score.percentage}% on the ${subject} ${difficulty} test!`);
                alert('Results copied to clipboard!');
              }
            }}
            className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Share2 className="h-5 w-5 mr-2" />
            Share Results
          </button>
        </div>

        {/* Filter and Controls */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedFilter === 'all'
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All ({results.length})
              </button>
              <button
                onClick={() => setSelectedFilter('correct')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedFilter === 'correct'
                    ? 'bg-green-100 text-green-700 border border-green-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Correct ({score.correct})
              </button>
              <button
                onClick={() => setSelectedFilter('incorrect')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedFilter === 'incorrect'
                    ? 'bg-red-100 text-red-700 border border-red-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Incorrect ({incorrectCount})
              </button>
              <button
                onClick={() => setSelectedFilter('unanswered')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedFilter === 'unanswered'
                    ? 'bg-gray-100 text-gray-700 border border-gray-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Unanswered ({unansweredCount})
              </button>
            </div>
            
            <button
              onClick={() => setShowExplanations(!showExplanations)}
              className="inline-flex items-center bg-purple-100 text-purple-700 px-4 py-2 rounded-lg hover:bg-purple-200 transition-colors"
            >
              {showExplanations ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              {showExplanations ? 'Hide' : 'Show'} Explanations
            </button>
          </div>
        </div>

        {/* Question Review */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-semibold text-gray-900">Question Review</h2>
            <p className="text-gray-600">Review your answers and learn from explanations</p>
          </div>

          <div className="divide-y divide-gray-200">
            {filteredResults.map((result) => {
              const isCorrect = result.isCorrect;
              const wasAnswered = result.userAnswer !== undefined;
              
              return (
                <div key={result.questionId} className="p-6">
                  <div className="flex items-start space-x-4 mb-4">
                    <div className={`p-2 rounded-full ${
                      isCorrect 
                        ? 'bg-green-100' 
                        : wasAnswered 
                          ? 'bg-red-100' 
                          : 'bg-gray-100'
                    }`}>
                      {isCorrect ? (
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      ) : wasAnswered ? (
                        <XCircle className="h-6 w-6 text-red-600" />
                      ) : (
                        <Clock className="h-6 w-6 text-gray-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Question {result.questionNumber}
                        </h3>
                        <div className="flex items-center space-x-2">
                          {isCorrect ? (
                            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                              Correct
                            </span>
                          ) : wasAnswered ? (
                            <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
                              Incorrect
                            </span>
                          ) : (
                            <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                              Not Answered
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-gray-700 mb-4">{result.question}</p>
                      
                      <div className="space-y-2 mb-4">
                        {result.options.map((option: string, optionIndex: number) => {
                          const isCorrectOption = optionIndex === result.correctAnswer;
                          const isUserAnswer = optionIndex === result.userAnswer;

                          return (
                            <div
                              key={optionIndex}
                              className={`p-3 rounded-lg border-2 ${
                                isCorrectOption
                                  ? 'border-green-500 bg-green-50'
                                  : isUserAnswer && !isCorrectOption
                                    ? 'border-red-500 bg-red-50'
                                    : 'border-gray-200 bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <div
                                    className={`w-6 h-6 rounded-full border-2 mr-3 flex items-center justify-center ${
                                      isCorrectOption
                                        ? 'border-green-500 bg-green-500'
                                        : isUserAnswer && !isCorrectOption
                                          ? 'border-red-500 bg-red-500'
                                          : 'border-gray-300'
                                    }`}
                                  >
                                    {isCorrectOption && <CheckCircle className="h-4 w-4 text-white" />}
                                    {isUserAnswer && !isCorrectOption && <XCircle className="h-4 w-4 text-white" />}
                                  </div>
                                  <span className="font-medium mr-3">
                                    {String.fromCharCode(65 + optionIndex)}.
                                  </span>
                                  <span className={isCorrectOption ? 'font-semibold' : ''}>
                                    {option}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  {isCorrectOption && (
                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                                      Correct Answer
                                    </span>
                                  )}
                                  {isUserAnswer && !isCorrectOption && (
                                    <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">
                                      Your Answer
                                    </span>
                                  )}
                                  {isUserAnswer && isCorrectOption && (
                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                                      Your Answer ✓
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {showExplanations && result.explanation && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <h4 className="font-semibold text-blue-900 mb-2">Explanation:</h4>
                          <p className="text-blue-800">{result.explanation}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 mb-4">
            Keep practicing to improve your score! 
            {score.percentage < 80 && ' Focus on the questions you got wrong.'}
          </p>
        </div>
      </div>
    </div>
  );
}
