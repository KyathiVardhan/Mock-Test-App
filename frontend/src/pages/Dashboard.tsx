import { useState, useEffect } from 'react';
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

interface RecentTest {
  _id?: string;
  testName?: string;
  subject?: string;
  difficulty?: string;
  totalQuestions?: number;
  duration?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface RecentExam {
  _id?: string;
  examName?: string;
  totalQuestions?: number;
  practiceAreas?: string[];
  createdAt?: string;
  updatedAt?: string;
}

type TabType = 'subjects' | 'exams';

export default function Dashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('subjects');
  const [testCategories, setTestCategories] = useState<TestCategory[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedExam, setExpandedExam] = useState<string | null>(null);
  const [recent, setRecent] = useState<string>('tests');
  const [recentTestsData, setRecentTestsData] = useState<RecentTest[]>([]);
  const [recentExamsData, setRecentExamsData] = useState<RecentExam[]>([]);

  const navigate = useNavigate();

  useEffect(() => {
    if (activeTab === 'subjects') {
      fetchTestCategories();
    }
  }, [activeTab]);

  const testsRecent = async () => {
    try {
      setError(null);

      const response = await fetch('http://localhost:5000/api/tests/recent-test', {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('token')}`,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.data) {
        setRecentTestsData(data.data);
      }

    } catch (error: any) {
      console.error('Error fetching recent tests:', error);
      setError(error.message || 'Failed to load recent tests');
    }
  };

  const examsRecent = async () => {
    try {
      setError(null);

      const response = await fetch('http://localhost:5000/api/exams/recent-exams', {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('token')}`,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.data) {
        setRecentExamsData(data.data);
      }

    } catch (error: any) {
      console.error('Error fetching recent exams:', error);
      setError(error.message || 'Failed to load recent exams');
    }
  };

  useEffect(() => {
    if (recent === 'tests') {
      testsRecent();
    } else if (recent === 'exams') {
      examsRecent();
    }
  }, [recent]);

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

  const getRelativeTime = (dateString: string): string => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return formatDate(dateString);
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
    return `Comprehensive ${subject.toLowerCase()} questions and concepts`;
  };

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

  return (
    <div className="w-full max-w-8xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 md:mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Ready to advance your academic career? Choose below.
          </p>
        </div>
      </div>

      {/* Subscription Alert */}
      {user?.subscription === 'free' && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4 sm:p-6 mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <Crown className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-500 shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                Upgrade to unlock full potential
              </h3>
              <p className="text-gray-600 text-xs sm:text-sm mt-1">
                Get unlimited tests, detailed explanations, and practice mode
              </p>
            </div>
            <Link
              to="/subscription"
              className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-4 sm:px-6 py-2 rounded-lg font-semibold hover:from-yellow-500 hover:to-orange-500 transition-all text-sm sm:text-base text-center shrink-0"
            >
              Upgrade Now
            </Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-2 order-2 lg:order-1">
          {/* Tabs Navigation */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-4 sm:space-x-8 overflow-x-auto">
                <button
                  onClick={() => {
                    setActiveTab('subjects');
                    setRecent('tests');
                  }}
                  className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
                    activeTab === 'subjects'
                      ? 'border-amber-500 text-amber-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center">
                    <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                    <span>Available Tests</span>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('exams');
                    setRecent('exams');
                  }}
                  className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
                    activeTab === 'exams'
                      ? 'border-amber-500 text-amber-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                    <span>Available Exams</span>
                  </div>
                </button>
              </nav>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="bg-white rounded-lg shadow-sm border border-amber-200 overflow-hidden animate-pulse">
                  <div className="h-2 bg-gray-200"></div>
                  <div className="p-4 sm:p-6">
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
            <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6 sm:p-8 text-center">
              <div className="text-red-600 mb-4">
                <svg className="h-10 w-10 sm:h-12 sm:w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Error Loading Data</h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4">{error}</p>
              <button
                onClick={() => activeTab === 'subjects' ? fetchTestCategories() : fetchExams()}
                className="bg-amber-600 text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-amber-700 transition-colors text-sm sm:text-base"
              >
                Retry
              </button>
            </div>
          )}

          {/* Subjects Tab Content */}
          {!loading && !error && activeTab === 'subjects' && (
            <>
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4 sm:mb-6">Available Tests</h2>
              {testCategories.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm border border-amber-200 p-6 sm:p-8 text-center">
                  <BookOpen className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">No Subjects Available</h3>
                  <p className="text-sm sm:text-base text-gray-600">Check back later for new practice tests.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  {testCategories.map((category) => (
                    <div key={category._id} className="bg-white rounded-lg shadow-sm border border-amber-200 overflow-hidden hover:shadow-md transition-shadow">
                      <div className={`h-2 ${getCategoryColor(category.breakdown)}`}></div>
                      <div className="p-4 sm:p-6">
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">{category.subject}</h3>
                        <p className="text-gray-600 mb-4 text-xs sm:text-sm line-clamp-2">{getCategoryDescription(category.subject)}</p>

                        <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500 mb-4 flex-wrap gap-2">
                          <span>{category.totalQuestions} questions</span>
                          <span>{getDominantDifficulty(category.breakdown)}</span>
                          <span>{category.duration} min</span>
                        </div>

                        <div className="mb-4">
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Difficulty Breakdown</span>
                          </div>
                          <div className="flex flex-wrap gap-1 text-xs">
                            {category.breakdown.BASIC > 0 && (
                              <div className="bg-green-100 text-green-800 px-2 py-1 rounded">
                                Basic: {category.breakdown.BASIC}
                              </div>
                            )}
                            {category.breakdown.INTERMEDIATE > 0 && (
                              <div className="bg-amber-100 text-amber-800 px-2 py-1 rounded">
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
                          className="w-full bg-amber-50 hover:bg-amber-100 text-amber-900 font-medium py-2 sm:py-3 px-3 sm:px-4 rounded-lg transition-colors flex items-center justify-center border border-amber-200 text-sm sm:text-base"
                        >
                          <Play className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
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
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4 sm:mb-6">Available Exams</h2>
              {exams.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm border border-amber-200 p-6 sm:p-8 text-center">
                  <FileText className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">No Exams Available</h3>
                  <p className="text-sm sm:text-base text-gray-600">Check back later for new exams.</p>
                </div>
              ) : (
                <div className="space-y-4 sm:space-y-6">
                  {exams.map((exam) => (
                    <div
                      key={exam._id}
                      className="bg-white rounded-lg shadow-sm border border-amber-200 overflow-hidden hover:shadow-md transition-shadow"
                    >
                      <div className="p-4 sm:p-6 border-b border-gray-200">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                          <div className="flex-1">
                            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                              {exam.examName}
                            </h3>
                            <div className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600">
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
                          {/* <button
                            onClick={() => toggleExpand(exam._id)}
                            className="w-full sm:w-auto px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors text-xs sm:text-sm font-medium"
                          >
                            {expandedExam === exam._id ? 'Hide Details' : 'View Details'}
                          </button> */}
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2 sm:gap-4">
                          <div className="bg-green-50 px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm">
                            <span className="text-green-800 font-semibold">Basic:</span>
                            <span className="ml-2 text-green-900">{exam.breakdown.basic}</span>
                          </div>
                          <div className="bg-yellow-50 px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm">
                            <span className="text-yellow-800 font-semibold">Intermediate:</span>
                            <span className="ml-2 text-yellow-900">{exam.breakdown.intermediate}</span>
                          </div>
                          <div className="bg-red-50 px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm">
                            <span className="text-red-800 font-semibold">Advanced:</span>
                            <span className="ml-2 text-red-900">{exam.breakdown.advanced}</span>
                          </div>
                        </div>

                        <div className="mt-4 text-xs text-gray-500 flex flex-col sm:flex-row gap-2 sm:gap-6">
                          <span>Created: {formatDate(exam.createdAt)}</span>
                          <span>Updated: {formatDate(exam.updatedAt)}</span>
                        </div>
                        
                        <div className='flex flex-row justify-center p-4 sm:p-6'>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              navigate("/ExamQuestions", { state: { exam: exam } });
                            }}
                            className="w-full sm:w-96 bg-amber-600 hover:bg-amber-700 text-white font-medium py-2 sm:py-3 px-3 sm:px-4 rounded-lg transition-colors flex items-center justify-center border-0 shadow-sm text-sm sm:text-base"
                          >
                            <Play className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                            Start Exam
                          </button>
                        </div>
                      </div>

                      {/* {expandedExam === exam._id && (
                        <ShowDetails exam={exam} />
                      )} */}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Sidebar */}
        <div className="order-1 lg:order-2">
          <div className="bg-white rounded-lg shadow-sm border border-amber-200 p-4 sm:p-6 mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
              Recent {recent === 'tests' ? 'Tests' : 'Exams'}
            </h3>
            
            {/* Show Recent Tests */}
            {recent === 'tests' && (
              <>
                {recentTestsData.length > 0 ? (
                  <div className="space-y-3">
                    {recentTestsData.map((test, index) => (
                      <div key={test._id || index} className="p-3 bg-amber-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 text-xs sm:text-sm">
                            {test.testName || test.subject || 'Test'}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            {test.createdAt ? getRelativeTime(test.createdAt) : 'Recently added'}
                          </p>
                          {test.totalQuestions && (
                            <p className="text-xs text-gray-500 mt-1">
                              {test.totalQuestions} questions • {test.duration || 'N/A'} min
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4 text-sm">No recent tests available</p>
                )}
              </>
            )}

            {/* Show Recent Exams */}
            {recent === 'exams' && (
              <>
                {recentExamsData.length > 0 ? (
                  <div className="space-y-3">
                    {recentExamsData.map((exam, index) => (
                      <div key={exam._id || index} className="p-3 bg-amber-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 text-xs sm:text-sm">
                            {exam.examName || 'Exam'}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            {exam.createdAt ? getRelativeTime(exam.createdAt) : 'Recently added'}
                          </p>
                          {exam.totalQuestions && (
                            <p className="text-xs text-gray-500 mt-1">
                              {exam.totalQuestions} questions • {exam.practiceAreas?.length || 0} areas
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4 text-sm">No recent exams available</p>
                )}
              </>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-amber-200 p-4 sm:p-6">
            <div className="flex items-center mb-4">
              <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 mr-2" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Quick Tips</h3>
            </div>
            <ul className="space-y-2 text-xs sm:text-sm text-gray-600">
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
