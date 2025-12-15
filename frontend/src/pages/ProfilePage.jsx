"use client"
import { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"
import { User, Settings, Bell, Shield, Edit3, Camera, Save, X, LogOut, Plus, Trash2, Utensils } from "lucide-react"
import toast from 'react-hot-toast'
import api from '../services/api'

const ProfilePage = () => {
  const { user, updateProfile, logout } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    age: '',
    gender: '',
    weight: '',
    height: '',
    activity_level: '',
    dietary_preferences: [],
    health_goals: []
  })

  // Meal tracking state
  const [showMealForm, setShowMealForm] = useState(false)
  const [mealData, setMealData] = useState({
    meal_name: '',
    meal_type: 'breakfast',
    calories: '',
    protein: '',
    carbs: '',
    fats: '',
    fiber: '',
    serving_size: '',
    notes: ''
  })
  const [todaysMeals, setTodaysMeals] = useState([])
  const [aiAnalysis, setAiAnalysis] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  // Load profile data when component mounts or user changes
  useEffect(() => {
    if (user?.profile) {
      setFormData({
        age: user.profile.age || '',
        gender: user.profile.gender || '',
        weight: user.profile.weight || '',
        height: user.profile.height || '',
        activity_level: user.profile.activity_level || '',
        dietary_preferences: user.profile.dietary_preferences || [],
        health_goals: user.profile.health_goals || []
      })
    }
    // Load today's meals
    fetchTodaysMeals()
  }, [user])

  const fetchTodaysMeals = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const response = await api.get(`/nutrition/meals?date=${today}`)
      setTodaysMeals(response.data || [])
    } catch (error) {
      console.error('Error fetching meals:', error)
    }
  }

  const handleMealInputChange = (e) => {
    const { name, value } = e.target
    setMealData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleAddMeal = async (e) => {
    e.preventDefault()
    try {
      const submitData = {
        ...mealData,
        calories: mealData.calories ? parseFloat(mealData.calories) : 0,
        protein: mealData.protein ? parseFloat(mealData.protein) : 0,
        carbs: mealData.carbs ? parseFloat(mealData.carbs) : 0,
        fats: mealData.fats ? parseFloat(mealData.fats) : 0,
        fiber: mealData.fiber ? parseFloat(mealData.fiber) : 0,
        date: new Date().toISOString().split('T')[0]
      }

      await api.post('/nutrition/meals', submitData)
      toast.success('Meal added successfully!')
      
      // Reset form
      setMealData({
        meal_name: '',
        meal_type: 'breakfast',
        calories: '',
        protein: '',
        carbs: '',
        fats: '',
        fiber: '',
        serving_size: '',
        notes: ''
      })
      setShowMealForm(false)
      
      // Refresh meals list
      fetchTodaysMeals()
    } catch (error) {
      toast.error('Failed to add meal')
      console.error('Error adding meal:', error)
    }
  }

  const handleDeleteMeal = async (mealId) => {
    try {
      await api.delete(`/nutrition/meals/${mealId}`)
      toast.success('Meal deleted successfully!')
      fetchTodaysMeals()
    } catch (error) {
      toast.error('Failed to delete meal')
      console.error('Error deleting meal:', error)
    }
  }

  const handleAnalyzeIntake = async () => {
    try {
      setIsAnalyzing(true)
      const today = new Date().toISOString().split('T')[0]
      const response = await api.post('/nutrition/analyze-and-suggest', { date: today })
      setAiAnalysis(response.data)
      toast.success('AI analysis complete!')
    } catch (error) {
      toast.error('Failed to analyze intake')
      console.error('Error analyzing intake:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleArrayChange = (field, value, isChecked) => {
    setFormData(prev => ({
      ...prev,
      [field]: isChecked
        ? [...prev[field], value]
        : prev[field].filter(item => item !== value)
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      // Convert string numbers to numbers
      const submitData = {
        ...formData,
        age: formData.age ? parseInt(formData.age) : null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        height: formData.height ? parseFloat(formData.height) : null
      }

      const success = await updateProfile(submitData)
      if (success) {
        setIsEditing(false)
        toast.success('Profile updated successfully!')
      }
    } catch (error) {
      toast.error('Failed to update profile')
    }
  }

  const activityLevels = [
    { value: 'sedentary', label: 'Sedentary - Little to no exercise, desk job' },
    { value: 'lightly_active', label: 'Lightly Active - Light exercise 1-3 days/week' },
    { value: 'moderately_active', label: 'Moderately Active - Moderate exercise 3-5 days/week' },
    { value: 'very_active', label: 'Very Active - Hard exercise 6-7 days/week' },
    { value: 'extra_active', label: 'Extra Active - Very hard exercise & physical job' },
    { value: 'athlete', label: 'Athlete - Professional or competitive athlete training' }
  ]

  const dietaryOptions = [
    'vegetarian',
    'vegan',
    'pescatarian',
    'keto',
    'paleo',
    'mediterranean',
    'low_carb',
    'low_fat',
    'gluten_free',
    'dairy_free',
    'nut_free',
    'soy_free',
    'halal',
    'kosher',
    'whole_30',
    'dash_diet',
    'intermittent_fasting',
    'carnivore',
    'flexitarian',
    'raw_food'
  ]

  const healthGoalOptions = [
    'weight_loss',
    'weight_gain',
    'muscle_gain',
    'muscle_definition',
    'maintenance',
    'heart_health',
    'diabetes_management',
    'blood_pressure_control',
    'cholesterol_management',
    'digestive_health',
    'immune_support',
    'energy_boost',
    'better_sleep',
    'stress_reduction',
    'anti_aging',
    'sports_performance',
    'endurance_training',
    'flexibility_mobility',
    'bone_health',
    'skin_health',
    'general_wellness'
  ]

  const formatMessageContent = (content) => {
    if (!content) return '';
    
    let html = content;
    
    // Convert ### headings to styled h3 with emoji support and blue theme
    html = html.replace(/###\s+\*\*(.+?)\*\*/g, '<h3 class="text-2xl font-bold text-blue-800 mb-4 mt-6 pb-2 border-b-2 border-blue-200 flex items-center gap-2">$1</h3>');
    html = html.replace(/###\s+(.+?)$/gm, '<h3 class="text-2xl font-bold text-blue-800 mb-4 mt-6 pb-2 border-b-2 border-blue-200">$1</h3>');
    
    // Convert ## headings to styled h2
    html = html.replace(/##\s+\*\*(.+?)\*\*/g, '<h2 class="text-3xl font-bold text-blue-900 mb-5 mt-7 pb-3 border-b-4 border-blue-300">$1</h2>');
    html = html.replace(/##\s+(.+?)$/gm, '<h2 class="text-3xl font-bold text-blue-900 mb-5 mt-7 pb-3 border-b-4 border-blue-300">$1</h2>');
    
    // Convert # headings to styled h1
    html = html.replace(/#\s+\*\*(.+?)\*\*/g, '<h1 class="text-4xl font-bold text-blue-900 mb-6 mt-8 pb-3 border-b-4 border-blue-400">$1</h1>');
    html = html.replace(/#\s+(.+?)$/gm, '<h1 class="text-4xl font-bold text-blue-900 mb-6 mt-8 pb-3 border-b-4 border-blue-400">$1</h1>');
    
    // Convert **text** to bold with blue accent
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-blue-900 bg-blue-50 px-1 rounded">$1</strong>');
    
    // Convert *text* to italic
    html = html.replace(/\*([^*]+?)\*/g, '<em class="italic text-gray-700">$1</em>');
    
    // Convert bullet points • to styled list items with better spacing
    html = html.replace(/^[•*]\s+(.+?)$/gm, '<li class="ml-6 mb-3 pl-2 flex items-start leading-relaxed"><span class="text-blue-600 mr-3 mt-1 text-lg">●</span><span class="flex-1">$1</span></li>');
    
    // Wrap consecutive list items in ul with better styling
    html = html.replace(/(<li class="ml-6[^>]*>[\s\S]+?<\/li>)(?!\s*<li)/g, '<ul class="space-y-2 my-5 bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">$1</ul>');
    
    // Convert horizontal rules
    html = html.replace(/^---$/gm, '<hr class="my-6 border-t-2 border-gray-300" />');
    
    // Convert line breaks to <br> with proper spacing
    html = html.replace(/\n\n/g, '</p><p class="mb-4 leading-relaxed text-base">');
    html = html.replace(/\n/g, '<br />');
    
    // Wrap in paragraph with better spacing
    html = `<div class="formatted-content space-y-2"><p class="mb-4 leading-relaxed text-base">${html}</p></div>`;
    
    // Clean up empty paragraphs
    html = html.replace(/<p class="mb-4 leading-relaxed text-base"><\/p>/g, '');
    html = html.replace(/<p class="mb-4 leading-relaxed text-base"><br \/><\/p>/g, '');
    
    return html;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
        {/* Simplified Hero Header Section */}
        <div className="bg-white rounded-2xl md:rounded-3xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-green-700 to-green-600 p-4 sm:p-6 md:p-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 bg-green-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-3xl sm:text-4xl md:text-5xl font-bold text-white" style={{ fontFamily: 'Merienda, cursive' }}>
                    {user?.name?.charAt(0)?.toUpperCase() || "U"}
                  </span>
                </div>
                <button className="absolute -bottom-2 -right-2 w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-xl shadow-md flex items-center justify-center border-2 border-green-600 hover:scale-105 transition-transform">
                  <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-green-700" />
                </button>
                <div className="absolute top-1 right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-green-700 shadow-sm"></div>
              </div>
              
              {/* User Info */}
              <div className="text-center sm:text-left flex-1 min-w-0">
                <div className="inline-block mb-2 px-3 py-1 bg-green-600 rounded-full">
                  <span className="text-green-100 text-xs font-semibold uppercase tracking-wide" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>
                    ✨ Nutrition Expert
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2 truncate" style={{ fontFamily: 'Merienda, cursive' }}>
                  {user?.name || "User"}
                </h1>
                <p className="text-sm sm:text-base md:text-lg text-green-50 mb-4 truncate" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>
                  {user?.email}
                </p>
                <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                  <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-green-600 text-white rounded-full text-xs sm:text-sm font-semibold" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>
                    💎 Premium Member
                  </span>
                  <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-green-600 text-white rounded-full text-xs sm:text-sm font-semibold" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>
                    🔥 Active Streak: 15 days
                  </span>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex items-center justify-center gap-2 py-2.5 px-4 sm:px-5 bg-white text-green-700 rounded-xl font-semibold shadow-md hover:shadow-lg hover:bg-gray-50 transition-all text-sm sm:text-base"
                  style={{ fontFamily: 'TASA Explorer, sans-serif' }}
                >
                  {isEditing ? <X className="w-4 h-4 sm:w-5 sm:h-5" /> : <Edit3 className="w-4 h-4 sm:w-5 sm:h-5" />}
                  <span className="whitespace-nowrap">{isEditing ? 'Cancel' : 'Edit Profile'}</span>
                </button>
                <button
                  onClick={logout}
                  className="flex items-center justify-center gap-2 py-2.5 px-4 sm:px-5 bg-red-600 text-white rounded-xl font-semibold shadow-md hover:bg-red-700 hover:shadow-lg transition-all text-sm sm:text-base"
                  style={{ fontFamily: 'TASA Explorer, sans-serif' }}
                >
                  <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="whitespace-nowrap">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Simplified Quick Actions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          <div className="bg-white rounded-xl p-4 sm:p-5 shadow-md hover:shadow-lg border border-gray-200 cursor-pointer transition-all">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <User className="w-6 h-6 sm:w-7 sm:h-7 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 text-sm sm:text-base mb-1 truncate" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>Personal Info</h3>
                <p className="text-xs sm:text-sm text-gray-600" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>Update details</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-5 shadow-md hover:shadow-lg border border-gray-200 cursor-pointer transition-all">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Settings className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 text-sm sm:text-base mb-1 truncate" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>Settings</h3>
                <p className="text-xs sm:text-sm text-gray-600" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>Account options</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-5 shadow-md hover:shadow-lg border border-gray-200 cursor-pointer transition-all">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Bell className="w-6 h-6 sm:w-7 sm:h-7 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 text-sm sm:text-base mb-1 truncate" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>Notifications</h3>
                <p className="text-xs sm:text-sm text-gray-600" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>Manage alerts</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-5 shadow-md hover:shadow-lg border border-gray-200 cursor-pointer transition-all">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6 sm:w-7 sm:h-7 text-orange-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 text-sm sm:text-base mb-1 truncate" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>Security</h3>
                <p className="text-xs sm:text-sm text-gray-600" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>Privacy settings</p>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Profile Information */}
        <div className="relative bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
          {/* Decorative Header with Gradient */}
          <div className="relative bg-gradient-to-r from-green-800 via-green-700 to-emerald-800 px-8 py-10 overflow-hidden">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 right-0 w-64 h-64 bg-green-400 rounded-full filter blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-400 rounded-full filter blur-2xl"></div>
            </div>
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <div className="inline-block mb-3 px-4 py-1.5 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full">
                  <span className="text-green-100 text-xs font-bold uppercase tracking-wider" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>
                    📋 Your Health Profile
                  </span>
                </div>
                <h2 className="text-4xl font-bold text-white mb-2 drop-shadow-lg" style={{ fontFamily: 'Merienda, cursive' }}>
                  Profile Information
                </h2>
                <p className="text-green-100 text-lg" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>
                  Manage your personal health and nutrition details
                </p>
              </div>
              <div className="hidden lg:block">
                <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 flex items-center justify-center">
                  <User className="w-10 h-10 text-white" />
                </div>
              </div>
            </div>
          </div>

          <div className="p-8">
            {isEditing ? (
              // Edit Form
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Modern Basic Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>Age</label>
                    <input
                      type="number"
                      name="age"
                      value={formData.age}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 bg-white font-medium"
                      placeholder="Enter age"
                      style={{ fontFamily: 'TASA Explorer, sans-serif' }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>Gender</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 bg-white font-medium"
                      style={{ fontFamily: 'TASA Explorer, sans-serif' }}
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>Weight (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      name="weight"
                      value={formData.weight}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 bg-white font-medium"
                      placeholder="Enter weight"
                      style={{ fontFamily: 'TASA Explorer, sans-serif' }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>Height (cm)</label>
                    <input
                      type="number"
                      step="0.1"
                      name="height"
                      value={formData.height}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 bg-white font-medium"
                      placeholder="Enter height"
                      style={{ fontFamily: 'TASA Explorer, sans-serif' }}
                    />
                  </div>
                </div>

                {/* Activity Level */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>Activity Level</label>
                  <select
                    name="activity_level"
                    value={formData.activity_level}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 bg-white font-medium"
                    style={{ fontFamily: 'TASA Explorer, sans-serif' }}
                  >
                    <option value="">Select activity level</option>
                    {activityLevels.map(level => (
                      <option key={level.value} value={level.value}>{level.label}</option>
                    ))}
                  </select>
                </div>

                {/* Dietary Preferences */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-4" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>Dietary Preferences</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {dietaryOptions.map(option => (
                      <label key={option} className="flex items-center space-x-3 p-3 rounded-xl border-2 border-gray-200 cursor-pointer hover:border-green-300">
                        <input
                          type="checkbox"
                          checked={formData.dietary_preferences.includes(option)}
                          onChange={(e) => handleArrayChange('dietary_preferences', option, e.target.checked)}
                          className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        <span className="text-sm font-medium capitalize" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>
                          {option.replace('_', ' ')}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Health Goals */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-4" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>Health Goals</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {healthGoalOptions.map(goal => (
                      <label key={goal} className="flex items-center space-x-3 p-3 rounded-xl border-2 border-gray-200 cursor-pointer hover:border-green-300">
                        <input
                          type="checkbox"
                          checked={formData.health_goals.includes(goal)}
                          onChange={(e) => handleArrayChange('health_goals', goal, e.target.checked)}
                          className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        <span className="text-sm font-medium capitalize" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>
                          {goal.replace('_', ' ')}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-4 pt-8 border-t border-gray-200">
                  <button
                    type="submit"
                    className="flex items-center gap-3 px-2 py-2 bg-green-800 text-white rounded-2xl font-bold text-lg shadow-lg"
                    style={{ fontFamily: 'TASA Explorer, sans-serif' }}
                  >
                    <Save className="w-5 h-5" />
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-2 py-2 bg-gray-200 text-gray-700 rounded-2xl font-bold text-lg"
                    style={{ fontFamily: 'TASA Explorer, sans-serif' }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              // Display View
              <>
                {/* Enhanced Stats Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="group relative overflow-hidden bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border-2 border-blue-200 hover:border-blue-400 transition-all duration-300 hover:shadow-xl">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-200/30 rounded-full -translate-y-12 translate-x-12"></div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                          <span className="text-white text-lg">🎂</span>
                        </div>
                        <label className="block text-sm font-bold text-blue-900" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>Age</label>
                      </div>
                      <p className="text-3xl font-bold text-blue-900 mb-1" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>
                        {user?.profile?.age || "—"}
                      </p>
                      <p className="text-xs text-blue-600 font-medium">years old</p>
                    </div>
                  </div>

                  <div className="group relative overflow-hidden bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200 hover:border-purple-400 transition-all duration-300 hover:shadow-xl">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-purple-200/30 rounded-full -translate-y-12 translate-x-12"></div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                          <span className="text-white text-lg">👤</span>
                        </div>
                        <label className="block text-sm font-bold text-purple-900" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>Gender</label>
                      </div>
                      <p className="text-3xl font-bold text-purple-900 capitalize mb-1" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>
                        {user?.profile?.gender || "—"}
                      </p>
                      <p className="text-xs text-purple-600 font-medium">identity</p>
                    </div>
                  </div>

                  <div className="group relative overflow-hidden bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 border-2 border-orange-200 hover:border-orange-400 transition-all duration-300 hover:shadow-xl">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-orange-200/30 rounded-full -translate-y-12 translate-x-12"></div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                          <span className="text-white text-lg">⚖️</span>
                        </div>
                        <label className="block text-sm font-bold text-orange-900" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>Weight</label>
                      </div>
                      <p className="text-3xl font-bold text-orange-900 mb-1" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>
                        {user?.profile?.weight || "—"}
                      </p>
                      <p className="text-xs text-orange-600 font-medium">kilograms</p>
                    </div>
                  </div>

                  <div className="group relative overflow-hidden bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border-2 border-emerald-200 hover:border-emerald-400 transition-all duration-300 hover:shadow-xl">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-200/30 rounded-full -translate-y-12 translate-x-12"></div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                          <span className="text-white text-lg">📏</span>
                        </div>
                        <label className="block text-sm font-bold text-emerald-900" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>Height</label>
                      </div>
                      <p className="text-3xl font-bold text-emerald-900 mb-1" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>
                        {user?.profile?.height || "—"}
                      </p>
                      <p className="text-xs text-emerald-600 font-medium">centimeters</p>
                    </div>
                  </div>
                </div>

                {/* Activity Level - Enhanced */}
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                      <span className="text-white text-xl">🏃</span>
                    </div>
                    <label className="block text-lg font-bold text-gray-800" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>Activity Level</label>
                  </div>
                  <div className="relative overflow-hidden bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 rounded-2xl p-6 border-2 border-green-300 shadow-md">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-green-300/20 rounded-full -translate-y-16 translate-x-16"></div>
                    <div className="relative z-10 flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold text-green-900 capitalize mb-1" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>
                          {user?.profile?.activity_level?.replace("_", " ") || "Not Specified"}
                        </p>
                        <p className="text-sm text-green-700 font-medium">Your current fitness activity level</p>
                      </div>
                      <div className="hidden md:flex w-16 h-16 bg-white/50 backdrop-blur-sm rounded-2xl border border-green-200 items-center justify-center">
                        <span className="text-3xl">💪</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dietary Preferences - Enhanced */}
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
                      <span className="text-white text-xl">🥗</span>
                    </div>
                    <label className="block text-lg font-bold text-gray-800" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>Dietary Preferences</label>
                  </div>
                  <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 border-2 border-orange-200">
                    <div className="flex flex-wrap gap-3">
                      {user?.profile?.dietary_preferences?.length > 0 ? (
                        user.profile.dietary_preferences.map((pref, index) => (
                          <span
                            key={index}
                            className="group px-5 py-2.5 bg-white hover:bg-orange-100 text-orange-800 rounded-xl text-sm font-bold border-2 border-orange-300 capitalize shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105"
                            style={{ fontFamily: 'TASA Explorer, sans-serif' }}
                          >
                            <span className="mr-2">🍽️</span>
                            {pref.replace("_", " ")}
                          </span>
                        ))
                      ) : (
                        <div className="text-center w-full py-4">
                          <span className="px-6 py-3 bg-white text-gray-500 rounded-xl text-sm font-semibold border-2 border-gray-200 inline-flex items-center gap-2" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>
                            <span>📝</span>
                            No preferences set yet
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Health Goals - Enhanced */}
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                      <span className="text-white text-xl">🎯</span>
                    </div>
                    <label className="block text-lg font-bold text-gray-800" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>Health Goals</label>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-200">
                    <div className="flex flex-wrap gap-3">
                      {user?.profile?.health_goals?.length > 0 ? (
                        user.profile.health_goals.map((goal, index) => (
                          <span
                            key={index}
                            className="group px-5 py-2.5 bg-white hover:bg-blue-100 text-blue-800 rounded-xl text-sm font-bold border-2 border-blue-300 capitalize shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105"
                            style={{ fontFamily: 'TASA Explorer, sans-serif' }}
                          >
                            <span className="mr-2">✨</span>
                            {goal.replace("_", " ")}
                          </span>
                        ))
                      ) : (
                        <div className="text-center w-full py-4">
                          <span className="px-6 py-3 bg-white text-gray-500 rounded-xl text-sm font-semibold border-2 border-gray-200 inline-flex items-center gap-2" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>
                            <span>🎯</span>
                            No health goals set yet
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </>
            )}
          </div>
        </div>

        {/* Daily Meal Tracking Section - Enhanced */}
        <div className="relative bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
          <div className="relative bg-gradient-to-r from-green-800 via-emerald-700 to-teal-800 px-8 py-10 overflow-hidden">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 left-0 w-64 h-64 bg-green-400 rounded-full filter blur-3xl"></div>
              <div className="absolute bottom-0 right-0 w-48 h-48 bg-teal-400 rounded-full filter blur-2xl"></div>
            </div>
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="inline-block mb-3 px-4 py-1.5 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full">
                  <span className="text-green-100 text-xs font-bold uppercase tracking-wider" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>
                    🍽️ Nutrition Tracker
                  </span>
                </div>
                <h2 className="text-4xl font-bold text-white mb-2 drop-shadow-lg" style={{ fontFamily: 'Merienda, cursive' }}>
                  Daily Food Intake
                </h2>
                <p className="text-green-100 text-lg flex items-center gap-2" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>
                  <span className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></span>
                  Track your meals and reach your nutrition goals
                </p>
              </div>
              <button
                onClick={() => setShowMealForm(!showMealForm)}
                className="group flex items-center gap-3 px-6 py-3.5 bg-white text-green-900 rounded-2xl font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200"
                style={{ fontFamily: 'TASA Explorer, sans-serif' }}
              >
                {showMealForm ? (
                  <>
                    <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
                    Cancel
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
                    Add Meal
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="p-8">
            {/* Add Meal Form */}
            {showMealForm && (
              <form onSubmit={handleAddMeal} className="mb-8 bg-gray-50 rounded-2xl p-6 border-2 border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-6" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>
                  Add New Meal
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Meal Name */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-3" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>
                      Meal Name *
                    </label>
                    <input
                      type="text"
                      name="meal_name"
                      value={mealData.meal_name}
                      onChange={handleMealInputChange}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 bg-white font-medium"
                      placeholder="e.g., Grilled Chicken Salad"
                      style={{ fontFamily: 'TASA Explorer, sans-serif' }}
                    />
                  </div>

                  {/* Meal Type */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>
                      Meal Type *
                    </label>
                    <select
                      name="meal_type"
                      value={mealData.meal_type}
                      onChange={handleMealInputChange}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 bg-white font-medium"
                      style={{ fontFamily: 'TASA Explorer, sans-serif' }}
                    >
                      <option value="breakfast">Breakfast</option>
                      <option value="lunch">Lunch</option>
                      <option value="dinner">Dinner</option>
                      <option value="snack">Snack</option>
                    </select>
                  </div>

                  {/* Serving Size */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>
                      Serving Size
                    </label>
                    <input
                      type="text"
                      name="serving_size"
                      value={mealData.serving_size}
                      onChange={handleMealInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 bg-white font-medium"
                      placeholder="e.g., 1 cup, 200g"
                      style={{ fontFamily: 'TASA Explorer, sans-serif' }}
                    />
                  </div>

                  {/* Nutritional Information */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>
                      Calories (kcal) *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      name="calories"
                      value={mealData.calories}
                      onChange={handleMealInputChange}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 bg-white font-medium"
                      placeholder="e.g., 350"
                      style={{ fontFamily: 'TASA Explorer, sans-serif' }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>
                      Protein (g) *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      name="protein"
                      value={mealData.protein}
                      onChange={handleMealInputChange}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 bg-white font-medium"
                      placeholder="e.g., 25"
                      style={{ fontFamily: 'TASA Explorer, sans-serif' }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>
                      Carbohydrates (g) *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      name="carbs"
                      value={mealData.carbs}
                      onChange={handleMealInputChange}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 bg-white font-medium"
                      placeholder="e.g., 40"
                      style={{ fontFamily: 'TASA Explorer, sans-serif' }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>
                      Fats (g) *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      name="fats"
                      value={mealData.fats}
                      onChange={handleMealInputChange}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 bg-white font-medium"
                      placeholder="e.g., 15"
                      style={{ fontFamily: 'TASA Explorer, sans-serif' }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>
                      Fiber (g)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      name="fiber"
                      value={mealData.fiber}
                      onChange={handleMealInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 bg-white font-medium"
                      placeholder="e.g., 5"
                      style={{ fontFamily: 'TASA Explorer, sans-serif' }}
                    />
                  </div>

                  {/* Notes */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-3" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>
                      Notes (Optional)
                    </label>
                    <textarea
                      name="notes"
                      value={mealData.notes}
                      onChange={handleMealInputChange}
                      rows={3}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 bg-white font-medium"
                      placeholder="Any additional information about this meal..."
                      style={{ fontFamily: 'TASA Explorer, sans-serif' }}
                    />
                  </div>
                </div>

                <div className="flex gap-4 mt-6">
                  <button
                    type="submit"
                    className="flex items-center gap-3 px-6 py-3 bg-green-800 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
                    style={{ fontFamily: 'TASA Explorer, sans-serif' }}
                  >
                    <Save className="w-5 h-5" />
                    Save Meal
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowMealForm(false)}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold"
                    style={{ fontFamily: 'TASA Explorer, sans-serif' }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Today's Meals List */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>
                  Today&apos;s Meals ({todaysMeals.length})
                </h3>
                {todaysMeals.length > 0 && (
                  <button
                    onClick={handleAnalyzeIntake}
                    disabled={isAnalyzing}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ fontFamily: 'TASA Explorer, sans-serif' }}
                  >
                    {isAnalyzing ? (
                      <>
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Analyzing...
                      </>
                    ) : (
                      <>
                        🤖 AI Analyze & Suggest
                      </>
                    )}
                  </button>
                )}
              </div>

              {todaysMeals.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                  <Utensils className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg font-medium" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>
                    No meals logged yet today
                  </p>
                  <p className="text-gray-400 text-sm mt-2" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>
                    Click &quot;Add Meal&quot; to start tracking your food intake
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {todaysMeals.map((meal) => (
                    <div key={meal.id || meal._id} className="bg-gray-50 rounded-2xl p-6 border border-gray-200 hover:border-green-300 transition-all">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold uppercase" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>
                              {meal.meal_type}
                            </span>
                            <h4 className="text-lg font-bold text-gray-900" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>
                              {meal.meal_name}
                            </h4>
                          </div>
                          {meal.serving_size && (
                            <p className="text-sm text-gray-600" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>
                              Serving: {meal.serving_size}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteMeal(meal.id || meal._id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="bg-white rounded-xl p-3 border border-gray-200">
                          <p className="text-xs text-gray-600 mb-1" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>Calories</p>
                          <p className="text-lg font-bold text-gray-900" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>
                            {meal.calories} <span className="text-xs font-normal">kcal</span>
                          </p>
                        </div>
                        <div className="bg-white rounded-xl p-3 border border-gray-200">
                          <p className="text-xs text-gray-600 mb-1" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>Protein</p>
                          <p className="text-lg font-bold text-gray-900" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>
                            {meal.protein} <span className="text-xs font-normal">g</span>
                          </p>
                        </div>
                        <div className="bg-white rounded-xl p-3 border border-gray-200">
                          <p className="text-xs text-gray-600 mb-1" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>Carbs</p>
                          <p className="text-lg font-bold text-gray-900" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>
                            {meal.carbs} <span className="text-xs font-normal">g</span>
                          </p>
                        </div>
                        <div className="bg-white rounded-xl p-3 border border-gray-200">
                          <p className="text-xs text-gray-600 mb-1" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>Fats</p>
                          <p className="text-lg font-bold text-gray-900" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>
                            {meal.fats} <span className="text-xs font-normal">g</span>
                          </p>
                        </div>
                        <div className="bg-white rounded-xl p-3 border border-gray-200">
                          <p className="text-xs text-gray-600 mb-1" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>Fiber</p>
                          <p className="text-lg font-bold text-gray-900" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>
                            {meal.fiber || 0} <span className="text-xs font-normal">g</span>
                          </p>
                        </div>
                      </div>

                      {meal.notes && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <p className="text-sm text-gray-600" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>
                            <span className="font-semibold">Notes:</span> {meal.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* AI Analysis & Suggestions */}
            {aiAnalysis && aiAnalysis.response && (
              <div className="mt-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-bold text-blue-900" style={{ fontFamily: 'Merienda, cursive' }}>
                    🤖 AI Diet Analysis & Suggestions
                  </h3>
                  <button
                    onClick={() => setAiAnalysis(null)}
                    className="text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="prose prose-sm max-w-none">
                    <div 
                      className="text-gray-800 leading-relaxed" 
                      style={{ fontFamily: 'TASA Explorer, sans-serif' }}
                      dangerouslySetInnerHTML={{ __html: formatMessageContent(aiAnalysis.response) }}
                    />
                  </div>
                  
                  {aiAnalysis.analysis_data && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h4 className="font-bold text-gray-900 mb-4" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>
                        📊 Progress Summary
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Object.entries(aiAnalysis.analysis_data.progress || {}).map(([nutrient, percentage]) => (
                          <div key={nutrient} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                            <p className="text-xs text-gray-600 mb-1 capitalize" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>
                              {nutrient}
                            </p>
                            <div className="flex items-baseline gap-1">
                              <p className="text-lg font-bold text-gray-900" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>
                                {percentage}%
                              </p>
                              <p className="text-xs text-gray-500">of goal</p>
                            </div>
                            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all ${
                                  percentage >= 90 && percentage <= 110
                                    ? 'bg-green-500'
                                    : percentage < 90
                                    ? 'bg-yellow-500'
                                    : 'bg-orange-500'
                                }`}
                                style={{ width: `${Math.min(percentage, 100)}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage