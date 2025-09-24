"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import {
  MessageCircle,
  TrendingUp,
  Target,
  Calendar,
  Activity,
  Zap,
  Clock,
  ArrowRight,
  Heart,
  Flame,
  Award,
  Brain,
  Sparkles,
} from "lucide-react"
import LoadingSpinner from "../components/LoadingSpinner"

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
      title: "AI Nutrition Chat",
      description: "Get personalized advice from your AI nutritionist",
      icon: Brain,
      href: "/chat",
      gradient: "from-purple-500 via-purple-600 to-indigo-600",
      image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
    },
    {
      title: "Meal Planning",
      description: "Create your perfect weekly meal plan",
      icon: Calendar,
      href: "/meal-plan",
      gradient: "from-emerald-500 via-green-500 to-teal-600",
      image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
    },
    {
      title: "Progress Tracking",
      description: "Monitor your health journey",
      icon: TrendingUp,
      href: "/progress",
      gradient: "from-blue-500 via-cyan-500 to-teal-500",
      image: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
    },
    {
      title: "Healthy Recipes",
      description: "Discover nutritious and delicious meals",
      icon: Heart,
      href: "/recipes",
      gradient: "from-rose-500 via-pink-500 to-red-500",
      image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
    },
  ]

  const recentActivities = [
    { action: "Completed AI nutrition consultation", time: "2 hours ago", icon: Brain, type: "success" },
    { action: "Logged healthy breakfast", time: "5 hours ago", icon: Heart, type: "info" },
    { action: "Achieved daily protein goal", time: "1 day ago", icon: Award, type: "achievement" },
    { action: "Started new meal plan", time: "2 days ago", icon: Calendar, type: "info" },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Modern Hero Welcome Section */}
        <div className="relative overflow-hidden bg-white rounded-3xl shadow-2xl h-96">
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1400&q=80"
              alt="Man working out - healthy fitness lifestyle"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-gray-900/85 via-gray-900/70 to-gray-900/50"></div>
          </div>
          <div className="relative z-10 p-8 md:p-12 lg:p-16">
            <div className="max-w-4xl">
              <div className="flex items-center mb-6">
                <Sparkles className="w-7 h-7 text-emerald-400 mr-3 animate-pulse" />
                <span className="text-emerald-300 text-sm font-semibold uppercase tracking-wider">Your Health Journey</span>
              </div>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight text-white">
                Welcome back, <br />
                <span className="text-emerald-400">{user?.name?.split(" ")[0] || "Champion"}</span>!
              </h1>
              <p className="text-gray-200 text-xl md:text-2xl leading-relaxed mb-8 max-w-2xl">
                Every healthy choice brings you closer to your best self. Let's make today extraordinary!
              </p>

              {/* Achievement Badges */}
              <div className="flex flex-wrap items-center gap-6 mb-8">
                <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 border border-white/20">
                  <Flame className="w-5 h-5 text-orange-400 mr-3" />
                  <div>
                    <span className="text-white font-bold text-lg">{stats.streakDays}</span>
                    <span className="text-gray-300 text-sm ml-2">day streak</span>
                  </div>
                </div>
                <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 border border-white/20">
                  <Award className="w-5 h-5 text-yellow-400 mr-3" />
                  <div>
                    <span className="text-white font-bold text-lg">{stats.goalsAchieved}%</span>
                    <span className="text-gray-300 text-sm ml-2">goals achieved</span>
                  </div>
                </div>
                <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 border border-white/20">
                  <Activity className="w-5 h-5 text-emerald-400 mr-3" />
                  <div>
                    <span className="text-white font-bold text-lg">{stats.todayCalories}</span>
                    <span className="text-gray-300 text-sm ml-2">kcal today</span>
                  </div>
                </div>
              </div>

              {/* Quick CTA */}
              <Link
                to="/chat"
                className="inline-flex items-center bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 group"
              >
                <Brain className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform" />
                Start Your AI Consultation
                <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute top-1/4 right-8 w-24 h-24 bg-emerald-400/20 rounded-full blur-2xl"></div>
          <div className="absolute bottom-1/4 right-16 w-32 h-32 bg-blue-400/20 rounded-full blur-3xl"></div>
        </div>

        {/* Modern Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-emerald-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-emerald-500 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Activity className="w-7 h-7 text-white" />
                </div>
                <span className="text-2xl">🔥</span>
              </div>
              <p className="text-gray-600 text-sm font-medium mb-1">Today's Energy</p>
              <p className="text-3xl font-bold text-gray-900 mb-2">{stats.todayCalories} <span className="text-base text-gray-500">kcal</span></p>
              <div className="flex items-center text-emerald-600 text-sm font-medium">
                <TrendingUp className="w-4 h-4 mr-1" />
                Perfect balance
              </div>
            </div>
          </div>

          <div className="group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-blue-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-500 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="w-7 h-7 text-white" />
                </div>
                <span className="text-2xl">📈</span>
              </div>
              <p className="text-gray-600 text-sm font-medium mb-1">Weekly Progress</p>
              <p className="text-3xl font-bold text-gray-900 mb-2">{stats.weeklyAverage} <span className="text-base text-gray-500">avg</span></p>
              <div className="flex items-center text-blue-600 text-sm font-medium">
                <ArrowRight className="w-4 h-4 mr-1" />
                +5% improvement
              </div>
            </div>
          </div>

          <div className="group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-orange-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-orange-500 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Flame className="w-7 h-7 text-white" />
                </div>
                <span className="text-2xl">⚡</span>
              </div>
              <p className="text-gray-600 text-sm font-medium mb-1">Health Streak</p>
              <p className="text-3xl font-bold text-gray-900 mb-2">{stats.streakDays} <span className="text-base text-gray-500">days</span></p>
              <div className="flex items-center text-orange-600 text-sm font-medium">
                <Flame className="w-4 h-4 mr-1" />
                On fire!
              </div>
            </div>
          </div>

          <div className="group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-purple-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-500 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Target className="w-7 h-7 text-white" />
                </div>
                <span className="text-2xl">🎯</span>
              </div>
              <p className="text-gray-600 text-sm font-medium mb-1">Goals Achieved</p>
              <p className="text-3xl font-bold text-gray-900 mb-2">{stats.goalsAchieved}<span className="text-base text-gray-500">%</span></p>
              <div className="flex items-center text-purple-600 text-sm font-medium">
                <Award className="w-4 h-4 mr-1" />
                Almost there!
              </div>
            </div>
          </div>
        </div>

        {/* Modern Quick Actions with Health Images */}
        <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Your Health Hub</h2>
              <p className="text-gray-600">Choose your path to wellness</p>
            </div>
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              <span className="text-sm text-gray-500 font-medium">Personalized for you</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action) => (
              <Link
                key={action.title}
                to={action.href}
                className="group relative overflow-hidden rounded-2xl hover:scale-105 transform transition-all duration-300 shadow-lg hover:shadow-2xl"
              >
                <div className="aspect-w-16 aspect-h-12 relative">
                  <img
                    src={action.image}
                    alt={action.title}
                    className="w-full h-40 object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-t ${action.gradient} opacity-80 group-hover:opacity-90 transition-opacity duration-300`}></div>
                </div>
                <div className="absolute inset-0 p-6 flex flex-col justify-end text-white">
                  <div className={`w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <action.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-lg mb-2 group-hover:text-yellow-300 transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-white/90 text-sm mb-3 line-clamp-2">{action.description}</p>
                  <div className="flex items-center text-white text-sm font-medium opacity-80 group-hover:opacity-100">
                    Explore now <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Modern Activity Feed */}
        <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Your Journey</h2>
              <p className="text-gray-600">Recent achievements and activities</p>
            </div>
            <div className="p-3 bg-emerald-100 rounded-2xl">
              <Clock className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
          <div className="space-y-4">
            {recentActivities.map((activity, index) => (
              <div
                key={index}
                className={`flex items-start space-x-4 p-6 rounded-2xl transition-all duration-300 hover:scale-102 border-l-4 ${activity.type === 'success' ? 'bg-emerald-50 border-l-emerald-500 hover:bg-emerald-100' :
                    activity.type === 'achievement' ? 'bg-yellow-50 border-l-yellow-500 hover:bg-yellow-100' :
                      'bg-blue-50 border-l-blue-500 hover:bg-blue-100'
                  }`}
              >
                <div className={`p-3 rounded-2xl shadow-md ${activity.type === 'success' ? 'bg-emerald-500' :
                    activity.type === 'achievement' ? 'bg-yellow-500' :
                      'bg-blue-500'
                  }`}>
                  <activity.icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-base font-semibold text-gray-900 mb-1">{activity.action}</p>
                  <p className="text-sm text-gray-500">{activity.time}</p>
                </div>
                {activity.type === 'achievement' && (
                  <div className="flex items-center">
                    <Award className="w-5 h-5 text-yellow-500 mr-1" />
                    <span className="text-xs font-medium text-yellow-600">Achievement!</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Enhanced AI Suggestions with Health Imagery */}
        <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">AI Health Insights</h2>
              <p className="text-gray-600">Personalized recommendations just for you</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex -space-x-2">
                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse delay-75"></div>
                <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse delay-150"></div>
              </div>
              <span className="text-sm text-gray-500 font-medium">AI-Powered</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 group">
              <div className="aspect-w-16 aspect-h-10 relative">
                <img
                  src="https://images.unsplash.com/photo-1506629905607-d7aba5676b67?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
                  alt="Man eating healthy nutrition"
                  className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-blue-600 via-blue-500/80 to-transparent"></div>
              </div>
              <div className="absolute inset-0 p-6 flex flex-col justify-end text-white">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mr-3">
                    <Brain className="text-white w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-lg">Smart Nutrition Tip</h3>
                </div>
                <p className="text-white/90 leading-relaxed">
                  Based on your goals, try adding more omega-3 rich foods like salmon and walnuts.
                  They'll boost your brain health and support your fitness journey! 🧠
                </p>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 group">
              <div className="aspect-w-16 aspect-h-10 relative">
                <img
                  src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
                  alt="Man preparing healthy recipe"
                  className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-600 via-emerald-500/80 to-transparent"></div>
              </div>
              <div className="absolute inset-0 p-6 flex flex-col justify-end text-white">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mr-3">
                    <Heart className="text-white w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-lg">Recipe of the Day</h3>
                </div>
                <p className="text-white/90 leading-relaxed">
                  Mediterranean Power Bowl - packed with quinoa, fresh vegetables, and lean protein.
                  Perfect for your macro goals and absolutely delicious! 🥗
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Motivational Health Quote */}
        <div className="relative overflow-hidden rounded-3xl shadow-2xl h-64">
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
              alt="Man with healthy lifestyle motivation"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-gray-900/80 via-gray-900/60 to-transparent"></div>
          </div>
          <div className="relative z-10 p-8 md:p-12">
            <div className="max-w-2xl">
              <blockquote className="text-2xl md:text-3xl font-bold text-white mb-6 leading-relaxed">
                "Your body is your temple. Keep it pure and clean for the soul to reside in."
              </blockquote>
              <div className="flex items-center text-white/80">
                <div className="w-2 h-2 bg-emerald-400 rounded-full mr-3"></div>
                <p className="text-lg">Take care of your body. It's the only place you have to live. 💚</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
