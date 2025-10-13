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
    { value: 'sedentary', label: 'Sedentary (little or no exercise)' },
    { value: 'lightly_active', label: 'Lightly Active (light exercise 1-3 days/week)' },
    { value: 'moderately_active', label: 'Moderately Active (moderate exercise 3-5 days/week)' },
    { value: 'very_active', label: 'Very Active (hard exercise 6-7 days/week)' },
    { value: 'extra_active', label: 'Extra Active (very hard exercise, physical job)' }
  ]

  const dietaryOptions = [
    'vegetarian', 'vegan', 'keto', 'paleo', 'gluten_free', 'dairy_free', 'low_carb', 'mediterranean'
  ]

  const healthGoalOptions = [
    'weight_loss', 'weight_gain', 'muscle_gain', 'maintenance', 'heart_health', 'diabetes_management', 'general_wellness'
  ]

  return (
    <div className="min-h-screen bg-white p-4 md:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Modern Header Section */}
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            <div className="relative">
              <div className="w-28 h-28 bg-gradient-to-br from-green-600 to-emerald-700 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-4xl font-bold text-white" style={{ fontFamily: 'Merienda, cursive' }}>
                  {user?.name?.charAt(0)?.toUpperCase() || "U"}
                </span>
              </div>
              <button className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-xl shadow-md flex items-center justify-center border-2 border-gray-100">
                <Camera className="w-5 h-5 text-green-600" />
              </button>
            </div>
            <div className="text-center md:text-left flex-1">
              <h1 className="text-4xl font-bold text-green-800 mb-3" style={{ fontFamily: 'Merienda, cursive' }}>
                {user?.name || "User"}
              </h1>
              <p className="text-xl text-gray-600 mb-6" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>
                {user?.email}
              </p>
              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                <span className="px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-semibold" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>
                  Premium Member
                </span>
                <span className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-semibold" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>
                  Active User
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-3 py-3 px-4 bg-green-800 text-white rounded-xl font-semibold"
              style={{ fontFamily: 'TASA Explorer, sans-serif' }}
            >
              {isEditing ? <X className="w-5 h-5" /> : <Edit3 className="w-5 h-5" />}
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </button>
            <button
              onClick={logout}
              className="flex items-center gap-3 py-3 px-4 bg-red-600 text-white rounded-xl font-semibold"
              style={{ fontFamily: 'TASA Explorer, sans-serif' }}
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>

        {/* Modern Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 cursor-pointer group">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center">
                <User className="w-7 h-7 text-green-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>Personal Info</h3>
                <p className="text-sm text-gray-600" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>Update details</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 cursor-pointer group">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center">
                <Settings className="w-7 h-7 text-green-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>Settings</h3>
                <p className="text-sm text-gray-600" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>Account options</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 cursor-pointer group">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center">
                <Bell className="w-7 h-7 text-green-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>Notifications</h3>
                <p className="text-sm text-gray-600" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>Manage alerts</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 cursor-pointer group">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center">
                <Shield className="w-7 h-7 text-green-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>Security</h3>
                <p className="text-sm text-gray-600" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>Privacy settings</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modern Profile Information */}
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-green-800 px-8 py-8">
            <h2 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'Merienda, cursive' }}>
              Profile Information
            </h2>
            <p className="text-green-100 text-lg" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>
              Your personal health and nutrition details
            </p>
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
                {/* Modern Basic Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                    <label className="block text-sm font-semibold text-gray-600 mb-3" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>Age</label>
                    <p className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>
                      {user?.profile?.age || "Not set"}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                    <label className="block text-sm font-semibold text-gray-600 mb-3" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>Gender</label>
                    <p className="text-2xl font-bold text-gray-900 capitalize" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>
                      {user?.profile?.gender || "Not Set"}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                    <label className="block text-sm font-semibold text-gray-600 mb-3" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>Weight</label>
                    <p className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>
                      {user?.profile?.weight ? `${user.profile.weight} kg` : "Not set"}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                    <label className="block text-sm font-semibold text-gray-600 mb-3" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>Height</label>
                    <p className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>
                      {user?.profile?.height ? `${user.profile.height} cm` : "Not set"}
                    </p>
                  </div>
                </div>

                {/* Activity Level */}
                <div className="mb-8">
                  <label className="block text-sm font-semibold text-gray-600 mb-4" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>Activity Level</label>
                  <div className="bg-green-50 rounded-2xl p-6 border border-green-200">
                    <p className="text-xl font-bold text-green-800 capitalize" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>
                      {user?.profile?.activity_level?.replace("_", " ") || "Not Specified"}
                    </p>
                  </div>
                </div>

                {/* Dietary Preferences */}
                <div className="mb-8">
                  <label className="block text-sm font-semibold text-gray-600 mb-4" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>Dietary Preferences</label>
                  <div className="flex flex-wrap gap-3">
                    {user?.profile?.dietary_preferences?.length > 0 ? (
                      user.profile.dietary_preferences.map((pref, index) => (
                        <span
                          key={index}
                          className="px-4 py-3 bg-green-100 text-green-800 rounded-full text-sm font-semibold border border-green-200 capitalize"
                          style={{ fontFamily: 'TASA Explorer, sans-serif' }}
                        >
                          {pref.replace("_", " ")}
                        </span>
                      ))
                    ) : (
                      <span className="px-4 py-3 bg-gray-100 text-gray-500 rounded-full text-sm font-semibold border border-gray-200" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>
                        No preferences set
                      </span>
                    )}
                  </div>
                </div>

                {/* Health Goals */}
                <div className="mb-8">
                  <label className="block text-sm font-semibold text-gray-600 mb-4" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>Health Goals</label>
                  <div className="flex flex-wrap gap-3">
                    {user?.profile?.health_goals?.length > 0 ? (
                      user.profile.health_goals.map((goal, index) => (
                        <span
                          key={index}
                          className="px-4 py-3 bg-green-100 text-green-800 rounded-full text-sm font-semibold border border-green-200 capitalize"
                          style={{ fontFamily: 'TASA Explorer, sans-serif' }}
                        >
                          {goal.replace("_", " ")}
                        </span>
                      ))
                    ) : (
                      <span className="px-4 py-3 bg-gray-100 text-gray-500 rounded-full text-sm font-semibold border border-gray-200" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>
                        No health goals set
                      </span>
                    )}
                  </div>
                </div>


              </>
            )}
          </div>
        </div>

        {/* Daily Meal Tracking Section */}
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-green-800 to-emerald-700 px-8 py-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'Merienda, cursive' }}>
                  Daily Food Intake
                </h2>
                <p className="text-green-100 text-lg" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>
                  Track your meals and nutritional information
                </p>
              </div>
              <button
                onClick={() => setShowMealForm(!showMealForm)}
                className="flex items-center gap-3 px-6 py-3 bg-white text-green-800 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
                style={{ fontFamily: 'TASA Explorer, sans-serif' }}
              >
                {showMealForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                {showMealForm ? 'Cancel' : 'Add Meal'}
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
              <h3 className="text-xl font-bold text-gray-900 mb-6" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>
                Today's Meals ({todaysMeals.length})
              </h3>

              {todaysMeals.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                  <Utensils className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg font-medium" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>
                    No meals logged yet today
                  </p>
                  <p className="text-gray-400 text-sm mt-2" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>
                    Click "Add Meal" to start tracking your food intake
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
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage