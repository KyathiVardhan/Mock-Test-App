import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Settings, Trophy, BookOpen, Clock } from 'lucide-react';

export default function Profile() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  const stats = [
    {
      icon: BookOpen,
      label: 'Tests Completed',
      value: user?.testsCompleted || 0,
      color: 'bg-blue-100 text-blue-600'
    },
    {
      icon: Trophy,
      label: 'Average Score',
      value: '87%',
      color: 'bg-green-100 text-green-600'
    },
    {
      icon: Clock,
      label: 'Time Studied',
      value: '24h',
      color: 'bg-purple-100 text-purple-600'
    }
  ];

  const recentActivity = [
    { date: '2024-01-15', test: 'Constitutional Law', score: 85 },
    { date: '2024-01-12', test: 'Criminal Law', score: 92 },
    { date: '2024-01-08', test: 'Corporate Law', score: 78 },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center space-x-6">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 rounded-full">
              <User className="h-12 w-12 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{user?.name}</h1>
              <p className="text-gray-600">{user?.email}</p>
              <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium mt-2 ${
                user?.subscription === 'premium' ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900' :
                user?.subscription === 'pro' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-600'
              }`}>
                {user?.subscription?.toUpperCase()} Member
              </div>
            </div>
          </div>
        </div>

        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'profile', label: 'Profile', icon: User },
              { id: 'stats', label: 'Statistics', icon: Trophy },
              { id: 'settings', label: 'Settings', icon: Settings }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-2 flex items-center space-x-2 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={user?.name || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      readOnly
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  {stats.map((stat, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${stat.color}`}>
                          <stat.icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                          <p className="text-sm text-gray-600">{stat.label}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Performance Statistics</h2>
              
              <div className="grid md:grid-cols-3 gap-6">
                {stats.map((stat, index) => (
                  <div key={index} className="bg-gray-50 p-6 rounded-lg text-center">
                    <div className={`inline-flex p-3 rounded-full ${stat.color} mb-3`}>
                      <stat.icon className="h-6 w-6" />
                    </div>
                    <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
                    <p className="text-gray-600">{stat.label}</p>
                  </div>
                ))}
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{activity.test}</p>
                        <p className="text-sm text-gray-600">{activity.date}</p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                        activity.score >= 80 ? 'bg-green-100 text-green-800' :
                        activity.score >= 60 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {activity.score}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Account Settings</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Email Notifications</h3>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300 mr-2" defaultChecked />
                      <span className="text-sm text-gray-700">Test reminders</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300 mr-2" defaultChecked />
                      <span className="text-sm text-gray-700">Weekly progress reports</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300 mr-2" />
                      <span className="text-sm text-gray-700">Marketing emails</span>
                    </label>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Privacy Settings</h3>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300 mr-2" defaultChecked />
                      <span className="text-sm text-gray-700">Show profile in leaderboards</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300 mr-2" />
                      <span className="text-sm text-gray-700">Allow others to see my progress</span>
                    </label>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors mr-4">
                    Save Changes
                  </button>
                  <button className="text-gray-600 hover:text-gray-800 transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}