import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function AdminDashboard() {
    const { adminLogout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(true);

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
            path: '/admin/add-test',
            icon: '➕',
            label: 'Add Test',
            description: 'Create new mock tests'
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
            description: 'Manage questions'
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

    const isActiveRoute = (path: any) => {
        return location.pathname === path;
    };

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <div className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-white shadow-lg transition-all duration-300 ease-in-out`}>
                {/* Sidebar Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
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
                <nav className="mt-6">
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
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
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
                                        <span className="text-2xl">📝</span>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm text-gray-600">Total Tests</p>
                                        <p className="text-2xl font-semibold text-gray-800">24</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-white rounded-lg shadow p-6">
                                <div className="flex items-center">
                                    <div className="p-2 bg-green-100 rounded-lg">
                                        <span className="text-2xl">👥</span>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm text-gray-600">Active Students</p>
                                        <p className="text-2xl font-semibold text-gray-800">156</p>
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
                                        <p className="text-2xl font-semibold text-gray-800">1,247</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-white rounded-lg shadow p-6">
                                <div className="flex items-center">
                                    <div className="p-2 bg-purple-100 rounded-lg">
                                        <span className="text-2xl">📊</span>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm text-gray-600">Avg Score</p>
                                        <p className="text-2xl font-semibold text-gray-800">78%</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Link
                                    to="/admin/add-test"
                                    className="flex items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-200"
                                >
                                    <span className="text-2xl mr-3">➕</span>
                                    <div>
                                        <p className="font-medium text-blue-700">Add New Test</p>
                                        <p className="text-sm text-blue-600">Create a new mock test</p>
                                    </div>
                                </Link>
                                
                                <Link
                                    to="/admin/questions"
                                    className="flex items-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors duration-200"
                                >
                                    <span className="text-2xl mr-3">❓</span>
                                    <div>
                                        <p className="font-medium text-green-700">Question Bank</p>
                                        <p className="text-sm text-green-600">Manage questions</p>
                                    </div>
                                </Link>
                                
                                <Link
                                    to="/admin/analytics"
                                    className="flex items-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors duration-200"
                                >
                                    <span className="text-2xl mr-3">📈</span>
                                    <div>
                                        <p className="font-medium text-purple-700">View Analytics</p>
                                        <p className="text-sm text-purple-600">Student performance</p>
                                    </div>
                                </Link>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

export default AdminDashboard;
