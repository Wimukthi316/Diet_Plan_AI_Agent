"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import {
  MessageCircle,
  BookOpen,
  BarChart3,
  TrendingUp,
  Target,
  Calendar,
  Activity,
  Zap,
  Clock,
  ArrowRight,
} from "lucide-react"
import LoadingSpinner from "../components/LoadingSpinner"
import FaviconIcon from "../components/FaviconIcon"

const Dashboard = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    todayCalories: 0,
    weeklyAverage: 0,
    streakDays: 0,
    goalsAchieved: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate loading dashboard data
    setTimeout(() => {
      setStats({
        todayCalories: 1850,
        weeklyAverage: 2100,
        streakDays: 7,
        goalsAchieved: 85,
      })
      setLoading(false)
    }, 1000)
  }, [])

  const quickActions = [
    {
      title: "Chat with AI",
      description: "Get instant nutrition advice and guidance",
      icon: MessageCircle,
      href: "/chat",
      gradient: "from-emerald-500 to-emerald-600",
    },
    {
      title: "Analyze Food",
      description: "Check nutritional content of your meals",
      icon: ({ className }) => <FaviconIcon className={className} />,
      href: "/nutrition",
      gradient: "from-blue-500 to-blue-600",
    },
    {
      title: "Find Recipes",
      description: "Discover healthy recipes for your goals",
      icon: BookOpen,
      href: "/recipes",
      gradient: "from-purple-500 to-purple-600",
    },
    {
      title: "Track Progress",
      description: "Monitor your daily intake and goals",
      icon: BarChart3,
      href: "/tracking",
      gradient: "from-amber-500 to-amber-600",
    },
  ]

  const recentActivities = [
    { action: "Logged breakfast: Oatmeal with berries", time: "2 hours ago", icon: Activity },
    { action: "Found recipe: Quinoa Buddha Bowl", time: "5 hours ago", icon: BookOpen },
    { action: "Completed weekly goal", time: "1 day ago", icon: Target },
    { action: "Analyzed nutrition for lunch", time: "2 days ago", icon: BarChart3 },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Welcome Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 rounded-2xl p-8 text-white shadow-xl">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-3">
                  Welcome back, {user?.name?.split(" ")[0] || "there"}! 👋
                </h1>
                <p className="text-emerald-100 text-lg max-w-2xl">
                  Ready to continue your health journey? Let's make today count and achieve your nutrition goals!
                </p>
              </div>
              <div className="hidden lg:block">
                <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <Zap className="w-12 h-12 text-white" />
                </div>
              </div>
            </div>
          </div>
          <div className="absolute -top-4 -right-4 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
          <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Today's Calories</p>
                <p className="text-3xl font-bold text-gray-900">{stats.todayCalories}</p>
                <p className="text-xs text-emerald-600 font-medium mt-1">↗ On track</p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-xl">
                <Activity className="w-7 h-7 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Weekly Average</p>
                <p className="text-3xl font-bold text-gray-900">{stats.weeklyAverage}</p>
                <p className="text-xs text-blue-600 font-medium mt-1">↗ +5% from last week</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <TrendingUp className="w-7 h-7 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Streak Days</p>
                <p className="text-3xl font-bold text-gray-900">{stats.streakDays}</p>
                <p className="text-xs text-amber-600 font-medium mt-1">🔥 Keep it up!</p>
              </div>
              <div className="p-3 bg-amber-100 rounded-xl">
                <Calendar className="w-7 h-7 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Goals Achieved</p>
                <p className="text-3xl font-bold text-gray-900">{stats.goalsAchieved}%</p>
                <p className="text-xs text-purple-600 font-medium mt-1">Almost there!</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-xl">
                <Target className="w-7 h-7 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Quick Actions</h2>
            <div className="text-sm text-gray-500">Choose your next step</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action) => (
              <Link
                key={action.title}
                to={action.href}
                className="group relative p-6 border border-gray-200 rounded-xl hover:border-emerald-300 hover:shadow-lg transition-all duration-300 overflow-hidden"
              >
                <div className="relative z-10">
                  <div
                    className={`w-12 h-12 bg-gradient-to-r ${action.gradient} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <action.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-emerald-600 transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">{action.description}</p>
                  <div className="flex items-center text-emerald-600 text-sm font-medium">
                    Get started <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Recent Activity</h2>
            <Clock className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {recentActivities.map((activity, index) => (
              <div
                key={index}
                className="flex items-start space-x-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200"
              >
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <activity.icon className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 mb-1">{activity.action}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-6 py-3 text-emerald-600 font-medium hover:bg-emerald-50 rounded-xl transition-colors duration-200">
            View all activities
          </button>
        </div>

        {/* AI Suggestions */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">AI Suggestions for You</h2>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-500">Powered by AI</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center mb-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-white text-sm">💡</span>
                  </div>
                  <h3 className="font-semibold text-blue-900">Nutrition Tip</h3>
                </div>
                <p className="text-sm text-blue-800 leading-relaxed">
                  Based on your recent intake, try adding more protein to your breakfast. Consider Greek yogurt or eggs
                  to help you feel fuller longer.
                </p>
              </div>
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-blue-200/50 rounded-full blur-xl"></div>
            </div>

            <div className="relative p-6 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl border border-emerald-200 overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center mb-3">
                  <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-white text-sm">🍽️</span>
                  </div>
                  <h3 className="font-semibold text-emerald-900">Recipe Suggestion</h3>
                </div>
                <p className="text-sm text-emerald-800 leading-relaxed">
                  Perfect for your goals: Mediterranean Quinoa Bowl with grilled chicken. High in protein and packed
                  with nutrients you need.
                </p>
              </div>
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-emerald-200/50 rounded-full blur-xl"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
