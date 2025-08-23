import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  MessageCircle, 
  Beaker, 
  BookOpen, 
  BarChart3,
  TrendingUp,
  Target,
  Calendar,
  Activity
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    todayCalories: 0,
    weeklyAverage: 0,
    streakDays: 0,
    goalsAchieved: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading dashboard data
    setTimeout(() => {
      setStats({
        todayCalories: 1850,
        weeklyAverage: 2100,
        streakDays: 7,
        goalsAchieved: 85
      });
      setLoading(false);
    }, 1000);
  }, []);

  const quickActions = [
    {
      title: 'Chat with AI',
      description: 'Get instant nutrition advice and guidance',
      icon: MessageCircle,
      href: '/chat',
      color: 'bg-blue-500'
    },
    {
      title: 'Analyze Food',
      description: 'Check nutritional content of your meals',
      icon: Beaker,
      href: '/nutrition',
      color: 'bg-green-500'
    },
    {
      title: 'Find Recipes',
      description: 'Discover healthy recipes for your goals',
      icon: BookOpen,
      href: '/recipes',
      color: 'bg-purple-500'
    },
    {
      title: 'Track Progress',
      description: 'Monitor your daily intake and goals',
      icon: BarChart3,
      href: '/tracking',
      color: 'bg-orange-500'
    }
  ];

  const recentActivities = [
    { action: 'Logged breakfast: Oatmeal with berries', time: '2 hours ago' },
    { action: 'Found recipe: Quinoa Buddha Bowl', time: '5 hours ago' },
    { action: 'Completed weekly goal', time: '1 day ago' },
    { action: 'Analyzed nutrition for lunch', time: '2 days ago' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="gradient-bg rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          Welcome back, {user?.name?.split(' ')[0] || 'there'}! 👋
        </h1>
        <p className="text-primary-100">
          Ready to continue your health journey? Let's make today count!
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Today's Calories</p>
              <p className="text-2xl font-bold text-gray-900">{stats.todayCalories}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Weekly Average</p>
              <p className="text-2xl font-bold text-gray-900">{stats.weeklyAverage}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Streak Days</p>
              <p className="text-2xl font-bold text-gray-900">{stats.streakDays}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <Calendar className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Goals Achieved</p>
              <p className="text-2xl font-bold text-gray-900">{stats.goalsAchieved}%</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Target className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              to={action.href}
              className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:shadow-md transition-all duration-200 group"
            >
              <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200`}>
                <action.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-medium text-gray-900 mb-1">{action.title}</h3>
              <p className="text-sm text-gray-600">{action.description}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity & Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {recentActivities.map((activity, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-primary-600 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm text-gray-900">{activity.action}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Progress Chart Placeholder */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Weekly Progress</h2>
          <div className="h-48 bg-gray-50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Progress chart coming soon</p>
            </div>
          </div>
        </div>
      </div>

      {/* AI Suggestions */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">AI Suggestions for You</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-medium text-blue-900 mb-2">💡 Nutrition Tip</h3>
            <p className="text-sm text-blue-800">
              Based on your recent intake, try adding more protein to your breakfast. 
              Consider Greek yogurt or eggs to help you feel fuller longer.
            </p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <h3 className="font-medium text-green-900 mb-2">🍽️ Recipe Suggestion</h3>
            <p className="text-sm text-green-800">
              Perfect for your goals: Mediterranean Quinoa Bowl with grilled chicken. 
              High in protein and packed with nutrients you need.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
