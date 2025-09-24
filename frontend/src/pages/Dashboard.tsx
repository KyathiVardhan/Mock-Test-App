import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, Clock, Trophy, TrendingUp, Play, Crown, Zap } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();

  const testCategories = [
    {
      id: 'constitutional',
      title: 'Constitutional Law',
      description: 'Fundamental principles and constitutional interpretation',
      questions: 150,
      difficulty: 'Advanced',
      timeEstimate: '45 min',
      color: 'bg-blue-500'
    },
    {
      id: 'criminal',
      title: 'Criminal Law',
      description: 'Criminal procedures, evidence, and defense strategies',
      questions: 200,
      difficulty: 'Intermediate',
      timeEstimate: '60 min',
      color: 'bg-red-500'
    },
    {
      id: 'corporate',
      title: 'Corporate Law',
      description: 'Business law, mergers, acquisitions, and governance',
      questions: 180,
      difficulty: 'Advanced',
      timeEstimate: '50 min',
      color: 'bg-green-500'
    },
    {
      id: 'family',
      title: 'Family Law',
      description: 'Marriage, divorce, custody, and domestic relations',
      questions: 120,
      difficulty: 'Beginner',
      timeEstimate: '35 min',
      color: 'bg-purple-500'
    },
    {
      id: 'immigration',
      title: 'Immigration Law',
      description: 'Visa processes, citizenship, and immigration procedures',
      questions: 100,
      difficulty: 'Intermediate',
      timeEstimate: '40 min',
      color: 'bg-orange-500'
    },
    {
      id: 'tax',
      title: 'Tax Law',
      description: 'Federal and state taxation, compliance, and planning',
      questions: 160,
      difficulty: 'Advanced',
      timeEstimate: '55 min',
      color: 'bg-yellow-500'
    }
  ];

  const recentTests = [
    { id: '1', category: 'Constitutional Law', score: 85, date: '2 days ago' },
    { id: '2', category: 'Criminal Law', score: 92, date: '1 week ago' },
    { id: '3', category: 'Corporate Law', score: 78, date: '2 weeks ago' }
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-gray-600">
          Ready to advance your legal career? Choose a practice area below.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-lg">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-semibold text-gray-900">{user?.testsCompleted || 0}</p>
              <p className="text-sm text-gray-600">Tests Completed</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
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

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="bg-orange-100 p-3 rounded-lg">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-semibold text-gray-900">
                {limits.testsPerMonth === -1 ? '∞' : limits.testsPerMonth - (user?.testsCompleted || 0)}
              </p>
              <p className="text-sm text-gray-600">Tests Remaining</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
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
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Practice Areas</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {testCategories.map((category) => (
              <div key={category.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className={`h-2 ${category.color}`}></div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{category.title}</h3>
                  <p className="text-gray-600 mb-4 text-sm">{category.description}</p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span>{category.questions} questions</span>
                    <span>{category.difficulty}</span>
                    <span>{category.timeEstimate}</span>
                  </div>

                  <Link
                    to={`/test/${category.id}`}
                    className="w-full bg-gray-50 hover:bg-gray-100 text-gray-900 font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start Test
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Tests</h3>
            {recentTests.length > 0 ? (
              <div className="space-y-3">
                {recentTests.map((test) => (
                  <div key={test.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
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

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <Zap className="h-5 w-5 text-blue-600 mr-2" />
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