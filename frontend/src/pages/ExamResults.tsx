import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Trophy, 
  ArrowLeft, 
  ChevronDown, 
  ChevronUp,
  BarChart3,
  AlertCircle
} from 'lucide-react';

interface ResultQuestion {
  questionHash: string;
  question: string;
  options: {
    option1: string;
    option2: string;
    option3: string;
    option4: string;
  };
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  difficulty: string;
  explanation: string;
  practiceArea: string;
}

interface BreakdownByDifficulty {
  basic: { total: number; correct: number; percentage: number };
  intermediate: { total: number; correct: number; percentage: number };
  advanced: { total: number; correct: number; percentage: number };
}

interface BreakdownByArea {
  areaName: string;
  total: number;
  correct: number;
  incorrect: number;
  percentage: number;
}

interface ExamResultsData {
  examId: string;
  examName: string;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  notAnswered: number;
  score: number;
  passed: boolean;
  totalMarks: number;
  passingMarks: number;
  timeTaken: number;
  timeTakenFormatted: string;
  startTime: string;
  endTime: string;
  results: ResultQuestion[];
  breakdownByDifficulty: BreakdownByDifficulty;
  breakdownByArea: BreakdownByArea[];
}

export default function ExamResults() {
  const location = useLocation();
  const navigate = useNavigate();
  const resultsData = location.state as ExamResultsData;

  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  if (!resultsData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md">
          <AlertCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Results Found</h2>
          <p className="text-gray-600 mb-4">Unable to load exam results.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-amber-600 text-white px-6 py-2 rounded-lg hover:bg-amber-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const toggleQuestion = (index: number) => {
    setExpandedQuestion(expandedQuestion === index ? null : index);
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      basic: 'bg-green-100 text-green-800 border-green-300',
      intermediate: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      advanced: 'bg-red-100 text-red-800 border-red-300',
    };
    return colors[difficulty as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 45) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Filter questions
  const filteredResults = resultsData.results.filter(result => {
    const difficultyMatch = filterDifficulty === 'all' || result.difficulty === filterDifficulty;
    const statusMatch = filterStatus === 'all' || 
      (filterStatus === 'correct' && result.isCorrect) ||
      (filterStatus === 'incorrect' && !result.isCorrect && result.userAnswer !== 'Not Answered') ||
      (filterStatus === 'unanswered' && result.userAnswer === 'Not Answered');
    return difficultyMatch && statusMatch;
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center text-amber-600 hover:text-amber-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </button>
        </div>

        {/* Results Summary Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="text-center mb-8">
            <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full mb-4 ${
              resultsData.passed ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {resultsData.passed ? (
                <Trophy className="h-12 w-12 text-green-600" />
              ) : (
                <XCircle className="h-12 w-12 text-red-600" />
              )}
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {resultsData.examName}
            </h1>
            
            <div className={`text-5xl font-bold mb-2 ${getScoreColor(resultsData.score)}`}>
              {resultsData.score}%
            </div>
            
            <p className={`text-xl font-semibold ${resultsData.passed ? 'text-green-600' : 'text-red-600'}`}>
              {resultsData.passed ? '✓ Passed' : '✗ Failed'}
            </p>
            
            <p className="text-gray-600 mt-2">
              Passing Score: {resultsData.passingMarks}% • Time Taken: {resultsData.timeTakenFormatted}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{resultsData.totalQuestions}</div>
              <div className="text-sm text-gray-600">Total Questions</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center border border-green-200">
              <div className="text-2xl font-bold text-green-600">{resultsData.correctAnswers}</div>
              <div className="text-sm text-green-700">Correct</div>
            </div>
            <div className="bg-red-50 rounded-lg p-4 text-center border border-red-200">
              <div className="text-2xl font-bold text-red-600">{resultsData.incorrectAnswers}</div>
              <div className="text-sm text-red-700">Incorrect</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-300">
              <div className="text-2xl font-bold text-gray-600">{resultsData.notAnswered}</div>
              <div className="text-sm text-gray-600">Not Answered</div>
            </div>
          </div>

          {/* Difficulty Breakdown */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Performance by Difficulty
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              {Object.entries(resultsData.breakdownByDifficulty).map(([difficulty, data]) => (
                <div key={difficulty} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold capitalize text-gray-900">{difficulty}</span>
                    <span className={`text-sm font-semibold ${
                      data.percentage >= 70 ? 'text-green-600' : 
                      data.percentage >= 50 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {data.percentage}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div
                      className={`h-2 rounded-full ${
                        data.percentage >= 70 ? 'bg-green-600' : 
                        data.percentage >= 50 ? 'bg-yellow-600' : 'bg-red-600'
                      }`}
                      style={{ width: `${data.percentage}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-600">
                    {data.correct} / {data.total} correct
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Practice Area Breakdown */}
          {resultsData.breakdownByArea && resultsData.breakdownByArea.length > 0 && (
            <div className="border-t border-gray-200 pt-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Performance by Practice Area
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {resultsData.breakdownByArea.map((area, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900 text-sm">{area.areaName}</span>
                      <span className={`text-sm font-semibold ${
                        area.percentage >= 70 ? 'text-green-600' : 
                        area.percentage >= 50 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {area.percentage}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                      <div
                        className={`h-2 rounded-full ${
                          area.percentage >= 70 ? 'bg-green-600' : 
                          area.percentage >= 50 ? 'bg-yellow-600' : 'bg-red-600'
                        }`}
                        style={{ width: `${area.percentage}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-600">
                      {area.correct} correct, {area.incorrect} incorrect ({area.total} total)
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Filter by Difficulty:
              </label>
              <select
                value={filterDifficulty}
                onChange={(e) => setFilterDifficulty(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="all">All Difficulties</option>
                <option value="basic">Basic</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Filter by Status:
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="all">All Questions</option>
                <option value="correct">Correct Only</option>
                <option value="incorrect">Incorrect Only</option>
                <option value="unanswered">Unanswered Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Questions Review */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Detailed Review ({filteredResults.length} questions)
          </h2>
          
          <div className="space-y-4">
            {filteredResults.map((result, index) => (
              <div
                key={index}
                className={`border-2 rounded-lg overflow-hidden ${
                  result.isCorrect ? 'border-green-200' : 
                  result.userAnswer === 'Not Answered' ? 'border-gray-200' : 'border-red-200'
                }`}
              >
                <div
                  className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleQuestion(index)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-gray-700">Question {index + 1}</span>
                        <span className={`text-xs px-2 py-1 rounded capitalize border ${getDifficultyColor(result.difficulty)}`}>
                          {result.difficulty}
                        </span>
                        <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">
                          {result.practiceArea}
                        </span>
                      </div>
                      <p className="text-gray-900">{result.question}</p>
                    </div>
                    <div className="flex items-center ml-4">
                      {result.isCorrect ? (
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      ) : result.userAnswer === 'Not Answered' ? (
                        <div className="w-6 h-6 rounded-full border-2 border-gray-400" />
                      ) : (
                        <XCircle className="h-6 w-6 text-red-600" />
                      )}
                      {expandedQuestion === index ? (
                        <ChevronUp className="h-5 w-5 text-gray-400 ml-2" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400 ml-2" />
                      )}
                    </div>
                  </div>
                </div>

                {expandedQuestion === index && (
                  <div className="border-t border-gray-200 p-4 bg-gray-50">
                    <div className="space-y-3 mb-4">
                      {Object.entries(result.options).map(([key, value], optIndex) => {
                        const isUserAnswer = result.userAnswer === value;
                        const isCorrectAnswer = result.correctAnswer === value;
                        
                        return (
                          <div
                            key={key}
                            className={`p-3 rounded-lg border-2 ${
                              isCorrectAnswer
                                ? 'bg-green-50 border-green-500'
                                : isUserAnswer
                                ? 'bg-red-50 border-red-500'
                                : 'bg-white border-gray-200'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <span className="font-medium mr-3">
                                  {String.fromCharCode(65 + optIndex)}.
                                </span>
                                <span className={isCorrectAnswer || isUserAnswer ? 'font-medium' : ''}>
                                  {value}
                                </span>
                              </div>
                              {isCorrectAnswer && (
                                <span className="text-green-600 font-semibold text-sm flex items-center">
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Correct
                                </span>
                              )}
                              {isUserAnswer && !isCorrectAnswer && (
                                <span className="text-red-600 font-semibold text-sm flex items-center">
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Your Answer
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {result.explanation && result.explanation !== 'null' && result.explanation !== 'No explanation available' && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
                          <AlertCircle className="h-4 w-4 mr-2" />
                          Explanation:
                        </h4>
                        <p className="text-blue-800 text-sm">{result.explanation}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-semibold"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
