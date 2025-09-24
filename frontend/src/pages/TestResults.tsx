import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Home, RotateCcw, Share2 } from 'lucide-react';

export default function TestResults() {
  const location = useLocation();
  const { score, total, answers, questions } = location.state || {};

  if (!score && score !== 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <p>No test results found.</p>
        <Link to="/dashboard" className="text-blue-600 hover:text-blue-700">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const percentage = Math.round((score / total) * 100);
  
  const getScoreColor = () => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBackground = () => {
    if (percentage >= 80) return 'bg-green-50 border-green-200';
    if (percentage >= 60) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Results Header */}
      <div className={`rounded-lg border-2 p-8 mb-8 ${getScoreBackground()}`}>
        <div className="text-center">
          <div className="mb-4">
            {percentage >= 80 ? (
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            ) : (
              <XCircle className="h-16 w-16 text-red-500 mx-auto" />
            )}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Test Complete!</h1>
          <p className="text-gray-600 mb-6">Here are your results</p>
          
          <div className="flex items-center justify-center space-x-8 mb-6">
            <div className="text-center">
              <p className={`text-4xl font-bold ${getScoreColor()}`}>{percentage}%</p>
              <p className="text-sm text-gray-600">Overall Score</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-gray-900">{score}/{total}</p>
              <p className="text-sm text-gray-600">Correct Answers</p>
            </div>
          </div>

          {percentage >= 80 ? (
            <p className="text-green-700 font-semibold">Excellent work! You have a strong understanding of this area.</p>
          ) : percentage >= 60 ? (
            <p className="text-yellow-700 font-semibold">Good effort! Review the explanations to improve further.</p>
          ) : (
            <p className="text-red-700 font-semibold">Keep studying! Focus on the areas where you struggled.</p>
          )}
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
        <button className="flex items-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
          <RotateCcw className="h-5 w-5 mr-2" />
          Retake Test
        </button>
        <button className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
          <Share2 className="h-5 w-5 mr-2" />
          Share Results
        </button>
      </div>

      {/* Question Review */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-900">Question Review</h2>
          <p className="text-gray-600">Review your answers and learn from explanations</p>
        </div>

        <div className="divide-y divide-gray-200">
          {questions?.map((question: any, index: number) => {
            const userAnswer = answers[index];
            const isCorrect = userAnswer === question.correctAnswer;
            
            return (
              <div key={question.id} className="p-6">
                <div className="flex items-start space-x-4 mb-4">
                  <div className={`p-2 rounded-full ${isCorrect ? 'bg-green-100' : 'bg-red-100'}`}>
                    {isCorrect ? (
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    ) : (
                      <XCircle className="h-6 w-6 text-red-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Question {index + 1}
                    </h3>
                    <p className="text-gray-700 mb-4">{question.question}</p>
                    
                    <div className="space-y-2 mb-4">
                      {question.options.map((option: string, optionIndex: number) => (
                        <div
                          key={optionIndex}
                          className={`p-3 rounded-lg border ${
                            optionIndex === question.correctAnswer
                              ? 'border-green-500 bg-green-50 text-green-900'
                              : optionIndex === userAnswer && !isCorrect
                                ? 'border-red-500 bg-red-50 text-red-900'
                                : 'border-gray-200 bg-gray-50'
                          }`}
                        >
                          <span className="font-medium mr-2">
                            {String.fromCharCode(65 + optionIndex)}.
                          </span>
                          {option}
                          {optionIndex === question.correctAnswer && (
                            <span className="ml-2 text-green-600 font-semibold">✓ Correct</span>
                          )}
                          {optionIndex === userAnswer && !isCorrect && (
                            <span className="ml-2 text-red-600 font-semibold">✗ Your answer</span>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-900 mb-2">Explanation:</h4>
                      <p className="text-blue-800">{question.explanation}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}