import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ExamStats {
    totalExams: number;
    totalTests: number;
    totalQuestions: number;
    subjects: string[];
}

function AdminDashboard() {
    const { adminLogout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [stats, setStats] = useState<ExamStats>({
        totalExams: 0,
        totalTests: 0,
        totalQuestions: 0,
        subjects: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await fetch('/api/exams', {
                credentials: 'include'
            });
            
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    // Ensure result.data is an array before operating on it
                    const exams = Array.isArray(result.data) ? (result.data as any[]) : [];

                    const totalQuestions = exams.reduce((sum: number, exam: any) => {
                        const q = Number(exam?.totalQuestions) || 0;
                        return sum + q;
                    }, 0);

                    const subjects = Array.from(new Set(exams.map((exam: any) => String(exam?.subject || '')).filter(Boolean)));

                    setStats({
                        totalExams: exams.length,
                        totalTests: 0, // This will come from tests API later
                        totalQuestions,
                        subjects
                    });
                }
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await adminLogout();
            navigate('/adminPage');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    const menuItems = [
        {
            path: '/admin/dashboard',
            icon: '📊',
            label: 'Dashboard',
            description: 'Overview and statistics'
        },
        {
            path: '/admin/add-exam',
            icon: '📚',
            label: 'Add Exam',
            description: 'Create exam question banks'
        },
        {
            path: '/admin/add-test',
            icon: '➕',
            label: 'Add Test',
            description: 'Create new mock tests'
        },
        {
            path: '/admin/manage-exams',
            icon: '📖',
            label: 'Manage Exams',
            description: 'Edit exam question banks'
        },
        {
            path: '/admin/manage-tests',
            icon: '📝',
            label: 'Manage Tests',
            description: 'Edit existing tests'
        },
        {
            path: '/admin/questions',
            icon: '❓',
            label: 'Question Bank',
            description: 'Browse all questions'
        },
        {
            path: '/admin/students',
            icon: '👥',
            label: 'Students',
            description: 'View student data'
        },
        {
            path: '/admin/analytics',
            icon: '📈',
            label: 'Analytics',
            description: 'Performance insights'
        },
        {
            path: '/admin/settings',
            icon: '⚙️',
            label: 'Settings',
            description: 'System configuration'
        }
    ];

    const isActiveRoute = (path: string) => {
        return location.pathname === path;
    };

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <div className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-white shadow-lg transition-all mx-3 duration-300 ease-in-out relative flex flex-col`}>
                {/* Sidebar Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
                    <div className={`${sidebarOpen ? 'block' : 'hidden'}`}>
                        <h2 className="text-xl font-bold text-gray-800">Law Exam Admin</h2>
                        <p className="text-sm text-gray-600">Mock Test Platform</p>
                    </div>
                    <button
                        onClick={toggleSidebar}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                    >
                        <span className="text-gray-600">☰</span>
                    </button>
                </div>

                {/* Navigation Menu */}
                <nav className="mt-6 flex-1 overflow-y-auto">
                    <ul className="space-y-2 px-3">
                        {menuItems.map((item) => (
                            <li key={item.path}>
                                <Link
                                    to={item.path}
                                    className={`flex items-center p-3 rounded-lg transition-all duration-200 group ${
                                        isActiveRoute(item.path)
                                            ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-700'
                                            : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                                    }`}
                                >
                                    <span className="text-xl mr-3">{item.icon}</span>
                                    <div className={`${sidebarOpen ? 'block' : 'hidden'}`}>
                                        <span className="font-medium">{item.label}</span>
                                        <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                                    </div>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* Sidebar Footer */}
                <div className="p-4 border-t border-gray-200 bg-white flex-shrink-0">
                    <button
                        onClick={handleLogout}
                        className={`flex items-center w-full p-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 ${
                            sidebarOpen ? 'justify-start' : 'justify-center'
                        }`}
                    >
                        <span className="text-xl mr-3">🚪</span>
                        <span className={`font-medium ${sidebarOpen ? 'block' : 'hidden'}`}>
                            Logout
                        </span>
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Header */}
                <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold text-gray-800">Admin Dashboard</h1>
                            <p className="text-gray-600">Manage your law exam mock tests</p>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="text-right">
                                <p className="text-sm text-gray-600">Welcome back!</p>
                                <p className="text-sm font-medium text-gray-800">Administrator</p>
                            </div>
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-sm font-medium">A</span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto p-6">
                    <div className="max-w-7xl mx-auto">
                        {/* Quick Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <div className="bg-white rounded-lg shadow p-6">
                                <div className="flex items-center">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <span className="text-2xl">📚</span>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm text-gray-600">Total Exams</p>
                                        <p className="text-xs text-gray-500">Question Banks</p>
                                        <p className="text-2xl font-semibold text-gray-800">
                                            {loading ? '...' : stats.totalExams}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-white rounded-lg shadow p-6">
                                <div className="flex items-center">
                                    <div className="p-2 bg-green-100 rounded-lg">
                                        <span className="text-2xl">📝</span>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm text-gray-600">Mock Tests</p>
                                        <p className="text-xs text-gray-500">Created Tests</p>
                                        <p className="text-2xl font-semibold text-gray-800">
                                            {loading ? '...' : stats.totalTests}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-white rounded-lg shadow p-6">
                                <div className="flex items-center">
                                    <div className="p-2 bg-yellow-100 rounded-lg">
                                        <span className="text-2xl">❓</span>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm text-gray-600">Questions</p>
                                        <p className="text-xs text-gray-500">Total Available</p>
                                        <p className="text-2xl font-semibold text-gray-800">
                                            {loading ? '...' : stats.totalQuestions}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-white rounded-lg shadow p-6">
                                <div className="flex items-center">
                                    <div className="p-2 bg-purple-100 rounded-lg">
                                        <span className="text-2xl">📖</span>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm text-gray-600">Subjects</p>
                                        <p className="text-xs text-gray-500">Law Categories</p>
                                        <p className="text-2xl font-semibold text-gray-800">
                                            {loading ? '...' : stats.subjects.length}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Content Creation Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                            {/* Exam Management */}
                            <div className="bg-white rounded-lg shadow p-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                    <span className="text-2xl mr-2">📚</span>
                                    Exam Management
                                </h3>
                                <p className="text-gray-600 mb-4 text-sm">
                                    Manage question banks and exam content for your law subjects
                                </p>
                                <div className="space-y-3">
                                    <Link
                                        to="/admin/add-exam"
                                        className="flex items-center justify-between p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-200 group"
                                    >
                                        <div className="flex items-center">
                                            <span className="text-xl mr-3">➕</span>
                                            <div>
                                                <p className="font-medium text-blue-700">Add New Exam</p>
                                                <p className="text-sm text-blue-600">Upload CSV question banks</p>
                                            </div>
                                        </div>
                                        <span className="text-blue-400 group-hover:text-blue-600">→</span>
                                    </Link>
                                    
                                    <Link
                                        to="/admin/manage-exams"
                                        className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200 group"
                                    >
                                        <div className="flex items-center">
                                            <span className="text-xl mr-3">📖</span>
                                            <div>
                                                <p className="font-medium text-gray-700">Manage Exams</p>
                                                <p className="text-sm text-gray-600">Edit question banks</p>
                                            </div>
                                        </div>
                                        <span className="text-gray-400 group-hover:text-gray-600">→</span>
                                    </Link>
                                </div>
                            </div>

                            {/* Test Management */}
                            <div className="bg-white rounded-lg shadow p-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                    <span className="text-2xl mr-2">📝</span>
                                    Test Management
                                </h3>
                                <p className="text-gray-600 mb-4 text-sm">
                                    Create and manage mock tests from your exam question banks
                                </p>
                                <div className="space-y-3">
                                    <Link
                                        to="/admin/add-test"
                                        className="flex items-center justify-between p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors duration-200 group"
                                    >
                                        <div className="flex items-center">
                                            <span className="text-xl mr-3">➕</span>
                                            <div>
                                                <p className="font-medium text-green-700">Create Mock Test</p>
                                                <p className="text-sm text-green-600">Build from question banks</p>
                                            </div>
                                        </div>
                                        <span className="text-green-400 group-hover:text-green-600">→</span>
                                    </Link>
                                    
                                    <Link
                                        to="/admin/manage-tests"
                                        className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200 group"
                                    >
                                        <div className="flex items-center">
                                            <span className="text-xl mr-3">📝</span>
                                            <div>
                                                <p className="font-medium text-gray-700">Manage Tests</p>
                                                <p className="text-sm text-gray-600">Edit existing tests</p>
                                            </div>
                                        </div>
                                        <span className="text-gray-400 group-hover:text-gray-600">→</span>
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-white rounded-lg shadow p-6 mb-8">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Link
                                    to="/admin/questions"
                                    className="flex items-center p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors duration-200"
                                >
                                    <span className="text-2xl mr-3">❓</span>
                                    <div>
                                        <p className="font-medium text-yellow-700">Question Bank</p>
                                        <p className="text-sm text-yellow-600">Browse all questions</p>
                                    </div>
                                </Link>
                                
                                <Link
                                    to="/admin/students"
                                    className="flex items-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors duration-200"
                                >
                                    <span className="text-2xl mr-3">👥</span>
                                    <div>
                                        <p className="font-medium text-purple-700">Students</p>
                                        <p className="text-sm text-purple-600">View student data</p>
                                    </div>
                                </Link>
                                
                                <Link
                                    to="/admin/analytics"
                                    className="flex items-center p-4 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors duration-200"
                                >
                                    <span className="text-2xl mr-3">📈</span>
                                    <div>
                                        <p className="font-medium text-indigo-700">Analytics</p>
                                        <p className="text-sm text-indigo-600">Performance insights</p>
                                    </div>
                                </Link>
                            </div>
                        </div>

                        {/* Available Subjects */}
                        {stats.subjects.length > 0 && (
                            <div className="bg-white rounded-lg shadow p-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Available Law Subjects</h3>
                                <div className="flex flex-wrap gap-2">
                                    {stats.subjects.map((subject, index) => (
                                        <span
                                            key={index}
                                            className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                                        >
                                            {subject.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Help Section */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mt-8">
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">Need Help?</h3>
                            <p className="text-gray-600 mb-4">
                                Understand the difference between Exams and Tests in your law platform:
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div className="bg-white p-4 rounded-lg">
                                    <h4 className="font-medium text-blue-700 mb-2">📚 Exams (Question Banks)</h4>
                                    <ul className="text-gray-600 space-y-1">
                                        <li>• Upload CSV files with questions</li>
                                        <li>• Organize by subject and difficulty</li>
                                        <li>• Serve as source material</li>
                                        <li>• Reusable across multiple tests</li>
                                    </ul>
                                </div>
                                <div className="bg-white p-4 rounded-lg">
                                    <h4 className="font-medium text-green-700 mb-2">📝 Tests (Mock Tests)</h4>
                                    <ul className="text-gray-600 space-y-1">
                                        <li>• Create from exam question banks</li>
                                        <li>• Set specific configurations</li>
                                        <li>• Define time limits and scoring</li>
                                        <li>• Students take these assessments</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

export default AdminDashboard;
