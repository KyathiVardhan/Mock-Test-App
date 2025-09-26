import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Clock, BookOpen, Target, Zap, Trophy } from 'lucide-react';

interface Difficulty {
  level: string;
  count: number;
  description: string;
}

interface SubjectData {
  subject: string;
  totalDuration: number;
  difficulties: Difficulty[];
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: SubjectData;
}

export default function DifficultySelection() {
  const { subject } = useParams<{ subject: string }>();
  const navigate = useNavigate();
  const [subjectData, setSubjectData] = useState<SubjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDifficulties = async () => {
      if (!subject) return;

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`http://localhost:5000/api/tests/subject/${subject}/difficulties`, {
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
          throw new Error(apiResponse.message || 'Failed to fetch difficulties');
        }

        setSubjectData(apiResponse.data);
      } catch (err: any) {
        console.error('Error fetching difficulties:', err);
        setError(err.message || 'Failed to load difficulty options');
      } finally {
        setLoading(false);
      }
    };

    fetchDifficulties();
  }, [subject]);

  const getDifficultyColor = (level: string) => {
    const colors = {
      'BASIC': 'from-green-500 to-green-600',
      'INTERMEDIATE': 'from-amber-500 to-amber-600', 
      'ADVANCED': 'from-red-500 to-red-600'
    };
    return colors[level as keyof typeof colors] || 'from-gray-500 to-gray-600';
  };

  const getDifficultyIcon = (level: string) => {
    const icons = {
      'BASIC': BookOpen,
      'INTERMEDIATE': Target,
      'ADVANCED': Trophy
    };
    return icons[level as keyof typeof icons] || BookOpen;
  };

  const handleDifficultySelect = (difficulty: string) => {
    navigate(`/test/${subject}/difficulty/${difficulty.toLowerCase()}`);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-amber-200 p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading difficulty options...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-red-200 p-8 text-center">
          <div className="text-red-600 mb-4">
            <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Difficulties</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link
            to="/dashboard"
            className="bg-amber-600 text-white px-6 py-2 rounded-lg hover:bg-amber-700 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          to="/dashboard"
          className="inline-flex items-center text-amber-600 hover:text-amber-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Link>
        
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {subjectData?.subject} Test
          </h1>
          <p className="text-gray-600 mb-2">
            Choose your difficulty level to begin the test
          </p>
          <div className="flex items-center justify-center text-sm text-gray-500">
            <Clock className="h-4 w-4 mr-1" />
            <span>Total Duration: {subjectData?.totalDuration} minutes</span>
          </div>
        </div>
      </div>

      {/* Difficulty Options */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {subjectData?.difficulties.map((difficulty) => {
          const Icon = getDifficultyIcon(difficulty.level);
          
          return (
            <div
              key={difficulty.level}
              className="bg-white rounded-xl shadow-sm border border-amber-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer"
              onClick={() => handleDifficultySelect(difficulty.level)}
            >
              <div className={`h-2 bg-gradient-to-r ${getDifficultyColor(difficulty.level)}`}></div>
              
              <div className="p-8 text-center">
                <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${getDifficultyColor(difficulty.level)} flex items-center justify-center mx-auto mb-4`}>
                  <Icon className="h-8 w-8 text-white" />
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-2 capitalize">
                  {difficulty.level.toLowerCase()}
                </h3>
                
                <p className="text-gray-600 text-sm mb-4">
                  {difficulty.description}
                </p>
                
                <div className="bg-gray-50 rounded-lg p-3 mb-6">
                  <div className="flex items-center justify-center text-2xl font-bold text-gray-900 mb-1">
                    {difficulty.count}
                  </div>
                  <div className="text-xs text-gray-500">Questions Available</div>
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDifficultySelect(difficulty.level);
                  }}
                  className={`w-full bg-gradient-to-r ${getDifficultyColor(difficulty.level)} text-white py-3 px-6 rounded-lg font-semibold hover:opacity-90 transition-opacity flex items-center justify-center`}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Start {difficulty.level.toLowerCase()} Test
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Additional Info */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-3">Test Guidelines</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-center">
            <div className="w-2 h-2 bg-amber-500 rounded-full mr-3"></div>
            Choose the difficulty level that matches your current knowledge
          </li>
          <li className="flex items-center">
            <div className="w-2 h-2 bg-amber-500 rounded-full mr-3"></div>
            You can take tests at different difficulty levels multiple times
          </li>
          <li className="flex items-center">
            <div className="w-2 h-2 bg-amber-500 rounded-full mr-3"></div>
            Start with Basic if you're new to the subject
          </li>
          <li className="flex items-center">
            <div className="w-2 h-2 bg-amber-500 rounded-full mr-3"></div>
            Advanced level is recommended for experienced learners
          </li>
        </ul>
      </div>
    </div>
  );
}
