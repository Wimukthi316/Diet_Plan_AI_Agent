"use client"
import { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"
import { User, Settings, Bell, Shield, Edit3, Camera, Save, X } from "lucide-react"
import toast from 'react-hot-toast'

const ProfilePage = () => {
  const { user, updateProfile } = useAuth()
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
  }, [user])

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
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-8 shadow-sm border border-emerald-200">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-3xl font-bold text-white">{user?.name?.charAt(0)?.toUpperCase() || "U"}</span>
              </div>
              <button className="absolute -bottom-2 -right-2 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center border-2 border-emerald-100 hover:bg-emerald-50 transition-colors">
                <Camera className="w-4 h-4 text-emerald-600" />
              </button>
            </div>
            <div className="text-center md:text-left flex-1">
              <h1 className="text-3xl font-bold text-emerald-900 mb-2">{user?.name || "User"}</h1>
              <p className="text-emerald-700 text-lg mb-4">{user?.email}</p>
              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                <span className="px-3 py-1 bg-emerald-200 text-emerald-800 rounded-full text-sm font-medium">
                  Premium Member
                </span>
                <span className="px-3 py-1 bg-amber-200 text-amber-800 rounded-full text-sm font-medium">
                  Active User
                </span>
              </div>
            </div>
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors shadow-md"
            >
              {isEditing ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-emerald-200 transition-all cursor-pointer group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Personal Info</h3>
                <p className="text-sm text-gray-600">Update details</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-emerald-200 transition-all cursor-pointer group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                <Settings className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Settings</h3>
                <p className="text-sm text-gray-600">Account options</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-emerald-200 transition-all cursor-pointer group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                <Bell className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Notifications</h3>
                <p className="text-sm text-gray-600">Manage alerts</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-emerald-200 transition-all cursor-pointer group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center group-hover:bg-red-200 transition-colors">
                <Shield className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Security</h3>
                <p className="text-sm text-gray-600">Privacy settings</p>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Information */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-8 py-6">
            <h2 className="text-2xl font-bold text-white">Profile Information</h2>
            <p className="text-emerald-100 mt-1">Your personal health and nutrition details</p>
          </div>

          <div className="p-8">
            {isEditing ? (
              // Edit Form
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Age</label>
                    <input
                      type="number"
                      name="age"
                      value={formData.age}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="Enter age"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Gender</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Weight (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      name="weight"
                      value={formData.weight}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="Enter weight"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Height (cm)</label>
                    <input
                      type="number"
                      step="0.1"
                      name="height"
                      value={formData.height}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="Enter height"
                    />
                  </div>
                </div>

                {/* Activity Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-3">Activity Level</label>
                  <select
                    name="activity_level"
                    value={formData.activity_level}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="">Select activity level</option>
                    {activityLevels.map(level => (
                      <option key={level.value} value={level.value}>{level.label}</option>
                    ))}
                  </select>
                </div>

                {/* Dietary Preferences */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-3">Dietary Preferences</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {dietaryOptions.map(option => (
                      <label key={option} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.dietary_preferences.includes(option)}
                          onChange={(e) => handleArrayChange('dietary_preferences', option, e.target.checked)}
                          className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-sm capitalize">{option.replace('_', ' ')}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Health Goals */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-3">Health Goals</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {healthGoalOptions.map(goal => (
                      <label key={goal} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.health_goals.includes(goal)}
                          onChange={(e) => handleArrayChange('health_goals', goal, e.target.checked)}
                          className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-sm capitalize">{goal.replace('_', ' ')}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex gap-4 pt-6 border-t border-gray-200">
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium shadow-md"
                  >
                    <Save className="w-4 h-4" />
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              // Display View
              <>
                {/* Basic Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <label className="block text-sm font-medium text-gray-600 mb-2">Age</label>
                    <p className="text-xl font-semibold text-gray-900">{user?.profile?.age || "Not set"}</p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <label className="block text-sm font-medium text-gray-600 mb-2">Gender</label>
                    <p className="text-xl font-semibold text-gray-900 capitalize">{user?.profile?.gender || "Not Set"}</p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <label className="block text-sm font-medium text-gray-600 mb-2">Weight</label>
                    <p className="text-xl font-semibold text-gray-900">
                      {user?.profile?.weight ? `${user.profile.weight} kg` : "Not set"}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <label className="block text-sm font-medium text-gray-600 mb-2">Height</label>
                    <p className="text-xl font-semibold text-gray-900">
                      {user?.profile?.height ? `${user.profile.height} cm` : "Not set"}
                    </p>
                  </div>
                </div>

                {/* Activity Level */}
                <div className="mb-8">
                  <label className="block text-sm font-medium text-gray-600 mb-3">Activity Level</label>
                  <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                    <p className="text-lg font-semibold text-emerald-800 capitalize">
                      {user?.profile?.activity_level?.replace("_", " ") || "Not Specified"}
                    </p>
                  </div>
                </div>

                {/* Dietary Preferences */}
                <div className="mb-8">
                  <label className="block text-sm font-medium text-gray-600 mb-3">Dietary Preferences</label>
                  <div className="flex flex-wrap gap-3">
                    {user?.profile?.dietary_preferences?.length > 0 ? (
                      user.profile.dietary_preferences.map((pref, index) => (
                        <span
                          key={index}
                          className="px-4 py-2 bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-800 rounded-full text-sm font-medium border border-emerald-300 capitalize"
                        >
                          {pref.replace("_", " ")}
                        </span>
                      ))
                    ) : (
                      <div className="bg-gray-100 rounded-xl p-4 w-full">
                        <p className="text-gray-500 text-center">No dietary preferences specified</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Health Goals */}
                <div className="mb-8">
                  <label className="block text-sm font-medium text-gray-600 mb-3">Health Goals</label>
                  <div className="flex flex-wrap gap-3">
                    {user?.profile?.health_goals?.length > 0 ? (
                      user.profile.health_goals.map((goal, index) => (
                        <span
                          key={index}
                          className="px-4 py-2 bg-gradient-to-r from-amber-100 to-amber-200 text-amber-800 rounded-full text-sm font-medium border border-amber-300 capitalize"
                        >
                          {goal.replace("_", " ")}
                        </span>
                      ))
                    ) : (
                      <div className="bg-gray-100 rounded-xl p-4 w-full">
                        <p className="text-gray-500 text-center">No health goals specified</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="flex-1 bg-emerald-600 text-white px-6 py-3 rounded-xl hover:bg-emerald-700 transition-colors font-medium shadow-md"
                  >
                    Update Profile Information
                  </button>
                  <button className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-200 transition-colors font-medium">
                    Download Profile Data
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage