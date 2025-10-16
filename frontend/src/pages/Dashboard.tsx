import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, Clock, Trophy, TrendingUp, Play, Crown, Zap, LogOut, FileText } from 'lucide-react';
import ShowDetails from './ShowDetails';

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

interface TestApiResponse {
  success: boolean;
  message: string;
  count: number;
  data: TestCategory[];
}

interface Breakdown {
  basic: number;
  intermediate: number;
  advanced: number;
}

interface PracticeAreaDetail {
  practiceArea: string;
  totalQuestions: number;
  breakdown: Breakdown;
}

interface Exam {
  _id: string;
  examName: string;
  practiceAreas: string[];
  totalQuestions: number;
  breakdown: Breakdown;
  practiceAreaDetails: PracticeAreaDetail[];
  createdAt: string;
  updatedAt: string;
}

interface ExamApiResponse {
  success: boolean;
  data: Exam[];
}

type TabType = 'subjects' | 'exams';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('subjects');
  const [testCategories, setTestCategories] = useState<TestCategory[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedExam, setExpandedExam] = useState<string | null>(null);

  const navigate = useNavigate();

  // Fetch test categories (subjects)
  useEffect(() => {
    if (activeTab === 'subjects') {
      fetchTestCategories();
    }
  }, [activeTab]);

  // Fetch exams
  useEffect(() => {
    if (activeTab === 'exams') {
      fetchExams();
    }
  }, [activeTab]);

  const fetchTestCategories = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('http://localhost:5000/api/tests/all-tests', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const apiResponse: TestApiResponse = await response.json();

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

  const fetchExams = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('http://localhost:5000/api/exams/test', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch exams');
      }

      const result: ExamApiResponse = await response.json();

      if (result.success) {
        setExams(result.data);
      } else {
        throw new Error('Failed to load exams');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching exams:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const toggleExpand = (examId: string) => {
    setExpandedExam(expandedExam === examId ? null : examId);
  };

  const getDominantDifficulty = (breakdown: TestCategory['breakdown']) => {
    const { BASIC, INTERMEDIATE, ADVANCED } = breakdown;

    if (ADVANCED > BASIC && ADVANCED > INTERMEDIATE) return 'Advanced';
    if (INTERMEDIATE > BASIC) return 'Intermediate';
    return 'Beginner';
  };

  const getCategoryColor = (breakdown: TestCategory['breakdown']) => {
    const difficulty = getDominantDifficulty(breakdown);

    const difficultyColors: { [key: string]: string } = {
      'Beginner': 'bg-green-500',
      'Intermediate': 'bg-amber-500',
      'Advanced': 'bg-red-500'
    };

    return difficultyColors[difficulty];
  };

  const getTestUrl = (subject: string) => {
    return subject.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
  };

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
    { id: '1', category: 'CrPC LAW', date: '2 days ago' },
    { id: '2', category: 'IPC-LAW', date: '1 week ago' },
    { id: '3', category: 'CRIMINAL-LAW', date: '5 days ago' }
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
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-gray-600">
            Ready to advance your academic career? Choose below.
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
        {/* Main Content Area */}
        <div className="lg:col-span-2">
          {/* Tabs Navigation */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8">
                <button
                  onClick={() => setActiveTab('subjects')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'subjects'
                      ? 'border-amber-500 text-amber-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  <div className="flex items-center">
                    <BookOpen className="h-5 w-5 mr-2" />
                    Available Subjects
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('exams')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'exams'
                      ? 'border-amber-500 text-amber-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Available Exams
                  </div>
                </button>
              </nav>
            </div>
          </div>

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
          {error && !loading && (
            <div className="bg-white rounded-lg shadow-sm border border-red-200 p-8 text-center">
              <div className="text-red-600 mb-4">
                <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Data</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={() => activeTab === 'subjects' ? fetchTestCategories() : fetchExams()}
                className="bg-amber-600 text-white px-6 py-2 rounded-lg hover:bg-amber-700 transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {/* Subjects Tab Content */}
          {!loading && !error && activeTab === 'subjects' && (
            <>
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Available Subjects</h2>
              {testCategories.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm border border-amber-200 p-8 text-center">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Subjects Available</h3>
                  <p className="text-gray-600">Check back later for new practice tests.</p>
                </div>
              ) : (
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
            </>
          )}

          {/* Exams Tab Content */}
          {!loading && !error && activeTab === 'exams' && (
            <>
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Available Exams</h2>
              {exams.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm border border-amber-200 p-8 text-center">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Exams Available</h3>
                  <p className="text-gray-600">Check back later for new exams.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {exams.map((exam) => (
                    <div
                      key={exam._id}
                      className="bg-white rounded-lg shadow-sm border border-amber-200 overflow-hidden hover:shadow-md transition-shadow"
                    >
                      <div className="p-6 border-b border-gray-200">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                              {exam.examName}
                            </h3>
                            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                              <span className="flex items-center">
                                <span className="font-semibold mr-1">Practice Areas:</span>
                                {exam.practiceAreas.length}
                              </span>
                              <span className="flex items-center">
                                <span className="font-semibold mr-1">Total Questions:</span>
                                {exam.totalQuestions}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => toggleExpand(exam._id)}
                            className="ml-4 px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors text-sm font-medium"
                          >
                            {expandedExam === exam._id ? 'Hide Details' : 'View Details'}
                          </button>
                        </div>


                        <div className="mt-4 flex flex-wrap gap-4">
                          <div className="bg-green-50 px-4 py-2 rounded-md">
                            <span className="text-green-800 font-semibold">Basic:</span>
                            <span className="ml-2 text-green-900">{exam.breakdown.basic}</span>
                          </div>
                          <div className="bg-yellow-50 px-4 py-2 rounded-md">
                            <span className="text-yellow-800 font-semibold">Intermediate:</span>
                            <span className="ml-2 text-yellow-900">{exam.breakdown.intermediate}</span>
                          </div>
                          <div className="bg-red-50 px-4 py-2 rounded-md">
                            <span className="text-red-800 font-semibold">Advanced:</span>
                            <span className="ml-2 text-red-900">{exam.breakdown.advanced}</span>
                          </div>
                        </div>

                        <div className="mt-4 text-xs text-gray-500 flex gap-6">
                          <span>Created: {formatDate(exam.createdAt)}</span>
                          <span>Updated: {formatDate(exam.updatedAt)}</span>
                        </div>
                        {/* Start Test button - outside the border-b container */}
                        <div className='flex flex-row justify-center p-6'>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              console.log('Navigating with exam:', exam);
                              navigate("/ExamQuestions", { state: { exam: exam } });
                            }}
                            className="w-96 bg-amber-600 hover:bg-amber-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center border-0 shadow-sm"
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Start Exam
                          </button>
                        </div>
                      </div>


                      {expandedExam === exam._id && (

                        <ShowDetails exam={exam} />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
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
