"use client"
import { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"
import { User, Settings, Bell, Shield, Edit3, Camera, Save, X } from "lucide-react"
import toast from 'react-hot-toast'

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
              className="flex items-center gap-3 px-6 py-3 bg-green-800 text-white rounded-xl shadow-lg font-semibold"
              style={{ fontFamily: 'TASA Explorer, sans-serif' }}
            >
              {isEditing ? <X className="w-5 h-5" /> : <Edit3 className="w-5 h-5" />}
              {isEditing ? 'Cancel' : 'Edit Profile'}
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
                    className="flex items-center gap-3 px-8 py-4 bg-green-800 text-white rounded-2xl font-bold text-lg shadow-lg"
                    style={{ fontFamily: 'TASA Explorer, sans-serif' }}
                  >
                    <Save className="w-5 h-5" />
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-8 py-4 bg-gray-100 text-gray-700 rounded-2xl font-bold text-lg"
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

                {/* Action Buttons */}
                <div className="flex space-x-6 pt-8">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex-1 bg-green-800 text-white py-4 px-8 rounded-2xl hover:bg-green-900 transition duration-200 font-bold text-lg shadow-lg"
                    style={{ fontFamily: 'TASA Explorer, sans-serif' }}
                  >
                    Edit Profile
                  </button>
                  <button
                    onClick={logout}
                    className="flex-1 bg-red-600 text-white py-4 px-8 rounded-2xl hover:bg-red-700 transition duration-200 font-bold text-lg shadow-lg"
                    style={{ fontFamily: 'TASA Explorer, sans-serif' }}
                  >
                    Logout
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