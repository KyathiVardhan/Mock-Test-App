import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, Clock, Trophy, TrendingUp, Play, Crown, Zap, LogOut } from 'lucide-react';

interface TestCategory {
  _id: string;
  subject: string;
  totalQuestions: number;
  breakdown: {
    BASIC: number;
    INTERMEDIATE: number;
    ADVANCED: number;
  };
  duration: number;
  price: number;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse {
  success: boolean;
  message: string;
  count: number;
  data: TestCategory[];
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [testCategories, setTestCategories] = useState<TestCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch test categories from API
  useEffect(() => {
    const fetchTestCategories = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('http://localhost:5000/api/tests/all-tests', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Include cookies for authentication
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const apiResponse: ApiResponse = await response.json();
        
        if (!apiResponse.success) {
          throw new Error(apiResponse.message || 'Failed to fetch test categories');
        }

        setTestCategories(apiResponse.data);
      } catch (err: any) {
        console.error('Error fetching test categories:', err);
        setError(err.message || 'Failed to load test categories');
      } finally {
        setLoading(false);
      }
    };

    fetchTestCategories();
  }, []);

  // Helper function to get dominant difficulty level
  const getDominantDifficulty = (breakdown: TestCategory['breakdown']) => {
    const { BASIC, INTERMEDIATE, ADVANCED } = breakdown;
    
    if (ADVANCED > BASIC && ADVANCED > INTERMEDIATE) return 'Advanced';
    if (INTERMEDIATE > BASIC) return 'Intermediate';
    return 'Beginner';
  };

  // Helper function to get color based on dominant difficulty
  const getCategoryColor = (breakdown: TestCategory['breakdown']) => {
    const difficulty = getDominantDifficulty(breakdown);
    
    const difficultyColors: { [key: string]: string } = {
      'Beginner': 'bg-green-500',
      'Intermediate': 'bg-amber-500',
      'Advanced': 'bg-red-500'
    };

    return difficultyColors[difficulty];
  };

  // Helper function to convert subject to URL-friendly format
  const getTestUrl = (subject: string) => {
    return subject.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
  };

  // Helper function to get category description based on subject
  const getCategoryDescription = (subject: string) => {
    const descriptions: { [key: string]: string } = {
      'MATHS': 'Mathematical concepts, calculations, and problem-solving techniques',
      'PHYSICS': 'Physical laws, mechanics, thermodynamics, and quantum physics',
      'CHEMISTRY': 'Chemical reactions, organic and inorganic chemistry concepts',
      'BIOLOGY': 'Life sciences, anatomy, genetics, and biological processes',
      'ENGLISH': 'Grammar, literature, comprehension, and language skills',
      'HISTORY': 'Historical events, civilizations, and cultural developments',
      'GEOGRAPHY': 'Physical and human geography, maps, and environmental studies',
      'ECONOMICS': 'Economic theories, market principles, and financial concepts',
      'COMPUTER SCIENCE': 'Programming, algorithms, data structures, and technology',
      'LAW': 'Legal principles, constitutional law, and jurisprudence'
    };

    return descriptions[subject.toUpperCase()] || `Comprehensive ${subject.toLowerCase()} questions and concepts`;
  };

  const recentTests = [
    { id: '1', category: 'MATHS', score: 85, date: '2 days ago' },
    { id: '2', category: 'PHYSICS', score: 92, date: '1 week ago' },
    { id: '3', category: 'CHEMISTRY', score: 78, date: '2 weeks ago' }
  ];

  const getSubscriptionLimits = () => {
    switch (user?.subscription) {
      case 'free':
        return { testsPerMonth: 5, fullExplanations: false, practiceMode: false };
      case 'pro':
        return { testsPerMonth: 25, fullExplanations: true, practiceMode: true };
      case 'premium':
        return { testsPerMonth: -1, fullExplanations: true, practiceMode: true };
      default:
        return { testsPerMonth: 5, fullExplanations: false, practiceMode: false };
    }
  };

  const limits = getSubscriptionLimits();

  const handleLogout = async () => {
    try {
      await logout();
      // Navigation will be handled by the AuthProvider
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header with Logout */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-gray-600">
            Ready to advance your academic career? Choose a subject below.
          </p>
        </div>
        
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-amber-200">
          <div className="flex items-center">
            <div className="bg-amber-100 p-3 rounded-lg">
              <BookOpen className="h-6 w-6 text-amber-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-semibold text-gray-900">{user?.testsCompleted || 0}</p>
              <p className="text-sm text-gray-600">Tests Completed</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-amber-200">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-lg">
              <Trophy className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-semibold text-gray-900">87%</p>
              <p className="text-sm text-gray-600">Average Score</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-amber-200">
          <div className="flex items-center">
            <div className="bg-orange-100 p-3 rounded-lg">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-semibold text-gray-900">
                {limits.testsPerMonth === -1 ? '∞' : Math.max(0, limits.testsPerMonth - (user?.testsCompleted || 0))}
              </p>
              <p className="text-sm text-gray-600">Tests Remaining</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-amber-200">
          <div className="flex items-center">
            <div className="bg-purple-100 p-3 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-semibold text-gray-900">+12%</p>
              <p className="text-sm text-gray-600">This Month</p>
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Alert */}
      {user?.subscription === 'free' && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-6 mb-8">
          <div className="flex items-center">
            <Crown className="h-8 w-8 text-yellow-500 mr-4" />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Upgrade to unlock full potential</h3>
              <p className="text-gray-600">Get unlimited tests, detailed explanations, and practice mode</p>
            </div>
            <Link
              to="/subscription"
              className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-6 py-2 rounded-lg font-semibold hover:from-yellow-500 hover:to-orange-500 transition-all"
            >
              Upgrade Now
            </Link>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Test Categories */}
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Available Subjects</h2>
          
          {/* Loading State */}
          {loading && (
            <div className="grid md:grid-cols-2 gap-6">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="bg-white rounded-lg shadow-sm border border-amber-200 overflow-hidden animate-pulse">
                  <div className="h-2 bg-gray-200"></div>
                  <div className="p-6">
                    <div className="h-6 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded mb-4"></div>
                    <div className="flex justify-between mb-4">
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                      <div className="h-4 bg-gray-200 rounded w-12"></div>
                    </div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-white rounded-lg shadow-sm border border-red-200 p-8 text-center">
              <div className="text-red-600 mb-4">
                <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Tests</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="bg-amber-600 text-white px-6 py-2 rounded-lg hover:bg-amber-700 transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {/* Test Categories Grid */}
          {!loading && !error && (
            <div className="grid md:grid-cols-2 gap-6">
              {testCategories.map((category) => (
                <div key={category._id} className="bg-white rounded-lg shadow-sm border border-amber-200 overflow-hidden hover:shadow-md transition-shadow">
                  <div className={`h-2 ${getCategoryColor(category.breakdown)}`}></div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{category.subject}</h3>
                    <p className="text-gray-600 mb-4 text-sm">{getCategoryDescription(category.subject)}</p>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <span>{category.totalQuestions} questions</span>
                      <span>{getDominantDifficulty(category.breakdown)}</span>
                      <span>{category.duration} min</span>
                    </div>

                    {/* Difficulty Breakdown */}
                    <div className="mb-4">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Difficulty Breakdown</span>
                      </div>
                      <div className="flex text-xs">
                        {category.breakdown.BASIC > 0 && (
                          <div className="bg-green-100 text-green-800 px-2 py-1 rounded mr-1">
                            Basic: {category.breakdown.BASIC}
                          </div>
                        )}
                        {category.breakdown.INTERMEDIATE > 0 && (
                          <div className="bg-amber-100 text-amber-800 px-2 py-1 rounded mr-1">
                            Int: {category.breakdown.INTERMEDIATE}
                          </div>
                        )}
                        {category.breakdown.ADVANCED > 0 && (
                          <div className="bg-red-100 text-red-800 px-2 py-1 rounded">
                            Adv: {category.breakdown.ADVANCED}
                          </div>
                        )}
                      </div>
                    </div>

                    <Link
                      to={`/test/${getTestUrl(category.subject)}`}
                      className="w-full bg-amber-50 hover:bg-amber-100 text-amber-900 font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center border border-amber-200"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      {category.price === 0 ? 'Start Free Test' : `Start Test - ₹${category.price}`}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* No tests available */}
          {!loading && !error && testCategories.length === 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-amber-200 p-8 text-center">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Tests Available</h3>
              <p className="text-gray-600">Check back later for new practice tests.</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div>
          <div className="bg-white rounded-lg shadow-sm border border-amber-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Tests</h3>
            {recentTests.length > 0 ? (
              <div className="space-y-3">
                {recentTests.map((test) => (
                  <div key={test.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{test.category}</p>
                      <p className="text-xs text-gray-600">{test.date}</p>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      test.score >= 80 ? 'bg-green-100 text-green-800' :
                      test.score >= 60 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {test.score}%
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No tests taken yet</p>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-amber-200 p-6">
            <div className="flex items-center mb-4">
              <Zap className="h-5 w-5 text-amber-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Quick Tips</h3>
            </div>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Review explanations carefully</li>
              <li>• Focus on weak areas</li>
              <li>• Take practice tests regularly</li>
              <li>• Time yourself during tests</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
