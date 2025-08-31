"use client"

import { useState } from "react"
import { useAuth } from "../contexts/AuthContext"
import {
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  User,
  Mail,
  Lock,
  Activity,
  Target,
  Heart,
  ArrowRight,
  ArrowLeft,
} from "lucide-react"
import LoadingSpinner from "../components/LoadingSpinner"
import FaviconIcon from "../components/FaviconIcon"

// Mock Link and useNavigate for demo purposes
const Link = ({ to, children, className }) => (
  <a
    href="#"
    className={className}
    onClick={(e) => {
      e.preventDefault()
      console.log(`Navigate to: ${to}`)
    }}
  >
    {children}
  </a>
)

const useNavigate = () => {
  return (path) => {
    console.log(`Navigate to: ${path}`)
  }
}

const RegisterPage = () => {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    profile: {
      age: "",
      gender: "",
      weight: "",
      height: "",
      activity_level: "moderately_active",
      dietary_preferences: [],
      health_goals: [],
    },
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const { register, loading } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target

    if (name.includes("profile.")) {
      const profileField = name.split(".")[1]
      if (type === "checkbox") {
        const currentValues = formData.profile[profileField] || []
        const newValues = checked ? [...currentValues, value] : currentValues.filter((item) => item !== value)

        setFormData((prev) => ({
          ...prev,
          profile: {
            ...prev.profile,
            [profileField]: newValues,
          },
        }))
      } else {
        setFormData((prev) => ({
          ...prev,
          profile: {
            ...prev.profile,
            [profileField]: value,
          },
        }))
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }))
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }))
    }
  }

  const validatePassword = (password) => {
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    }

    return checks
  }

  const passwordChecks = validatePassword(formData.password)
  const isPasswordValid = Object.values(passwordChecks).every((check) => check)

  const nextStep = () => {
    if (currentStep === 1) {
      // Validate step 1 before proceeding
      const step1Valid = validateStep1()
      if (step1Valid) {
        setCurrentStep(2)
      }
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const validateStep1 = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = "Full name is required"
    }

    if (!formData.email) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email"
    }

    if (!formData.password) {
      newErrors.password = "Password is required"
    } else if (!isPasswordValid) {
      newErrors.password = "Password does not meet requirements"
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateForm = () => {
    return validateStep1() // Profile info is optional
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (currentStep === 1) {
      nextStep()
      return
    }

    if (!validateForm()) return

    const userData = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      password: formData.password,
      profile: {
        ...formData.profile,
        age: formData.profile.age ? Number.parseInt(formData.profile.age) : null,
        weight: formData.profile.weight ? Number.parseFloat(formData.profile.weight) : null,
        height: formData.profile.height ? Number.parseFloat(formData.profile.height) : null,
      },
    }

    const success = await register(userData)
    if (success) {
      navigate("/login")
    }
  }

  const dietaryOptions = [
    "vegetarian",
    "vegan",
    "pescatarian",
    "keto",
    "paleo",
    "mediterranean",
    "low_carb",
    "gluten_free",
    "dairy_free",
  ]

  const healthGoalOptions = [
    "weight_loss",
    "weight_gain",
    "muscle_gain",
    "maintenance",
    "heart_health",
    "diabetes_management",
    "sports_performance",
  ]

  return (
    <div className="bg-white lg:flex lg:h-screen lg:overflow-hidden">
      {/* Left Side - Image (40%) - Fixed */}
      <div className="hidden lg:flex lg:w-2/5 lg:h-screen lg:fixed lg:left-0 lg:top-0 relative overflow-hidden">
        <div className="absolute inset-0"></div>
        <img
          src="/src/public/register.jpg"
          alt="Healthy nutrition and wellness"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-center p-8">
          <div className="text-center text-white bg-white/10 backdrop-blur-md rounded-3xl p-4 border border-white/20 max-w-sm">
            <div className="w-16 h-16 backdrop-blur-sm rounded-3xl flex items-center justify-center mx-auto mb-6">
              <FaviconIcon className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Merienda, cursive' }}>Transform Your Health Journey</h2>
            <p className="text-sm text-white" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>
              Join thousands who've discovered personalized nutrition with AI-powered meal planning
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Form (60%) - Scrollable */}
      <div className="flex-1 lg:w-3/5 lg:h-screen lg:overflow-y-auto lg:ml-[40%] p-8">
        <div className="w-full max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mt-20 mb-6">
            <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-green-800 via-emerald-800 to-teal-800 bg-clip-text text-transparent mb-3 tracking-tight" style={{ fontFamily: 'Merienda, cursive' }}>
              Nutri - Your Diet Companion
            </h1>
            <p className="text-xl text-black mt-12 mb-2 font-medium" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>Create your personalized nutrition journey</p>
            <p className="text-gray-500 text-sm" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-semibold text-green-600 hover:text-green-700 transition-colors duration-200 underline decoration-2 underline-offset-4 decoration-green-200 hover:decoration-green-300"
              >
                Sign in here
              </Link>
            </p>
          </div>



          {/* Form Container */}
          <div className="bg-gray-100 backdrop-blur-xl shadow-3xl rounded-3xl border border-white/20 overflow-hidden">
            <form onSubmit={handleSubmit} className="p-8">
              {/* Step 1: Account Information */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="flex items-center mb-8">
                    <div className="w-12 h-12 bg-green-800 rounded-xl flex items-center justify-center mr-4 shadow-lg shadow-green-500/25">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-black" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>Account Information</h2>
                      <p className="text-gray-600" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>Set up your login credentials</p>
                    </div>
                  </div>

                  {/* Full Name */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-3" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        name="name"
                        id="name"
                        value={formData.name}
                        onChange={handleChange}
                        className={`w-full pl-12 pr-4 py-4 border-2 rounded-2xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-300 bg-white/80 backdrop-blur-sm placeholder-gray-400 text-gray-900 font-medium ${errors.name
                          ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
                          : "border-gray-200 hover:border-gray-300"
                          }`}
                        placeholder="Enter your full name"
                        autoComplete="name"
                      />
                    </div>
                    {errors.name && (
                      <p className="mt-2 text-sm text-red-600 font-medium flex items-center">
                        <XCircle className="w-4 h-4 mr-1" />
                        {errors.name}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-3">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        name="email"
                        id="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={`w-full pl-12 pr-4 py-4 border-2 rounded-2xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-300 bg-white/80 backdrop-blur-sm placeholder-gray-400 text-gray-900 font-medium ${errors.email
                          ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
                          : "border-gray-200 hover:border-gray-300"
                          }`}
                        placeholder="Enter your email address"
                        autoComplete="email"
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-2 text-sm text-red-600 font-medium flex items-center">
                        <XCircle className="w-4 h-4 mr-1" />
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Password */}
                    <div>
                      <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-3">
                        Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type={showPassword ? "text" : "password"}
                          name="password"
                          id="password"
                          value={formData.password}
                          onChange={handleChange}
                          className={`w-full pl-12 pr-14 py-4 border-2 rounded-2xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-300 bg-white/80 backdrop-blur-sm placeholder-gray-400 text-gray-900 font-medium ${errors.password
                            ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
                            : "border-gray-200 hover:border-gray-300"
                            }`}
                          placeholder="Create a strong password"
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {errors.password && (
                        <p className="mt-2 text-sm text-red-600 font-medium flex items-center">
                          <XCircle className="w-4 h-4 mr-1" />
                          {errors.password}
                        </p>
                      )}
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-3">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          name="confirmPassword"
                          id="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          className={`w-full pl-12 pr-14 py-4 border-2 rounded-2xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-300 bg-white/80 backdrop-blur-sm placeholder-gray-400 text-gray-900 font-medium ${errors.confirmPassword
                            ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
                            : "border-gray-200 hover:border-gray-300"
                            }`}
                          placeholder="Confirm your password"
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {errors.confirmPassword && (
                        <p className="mt-2 text-sm text-red-600 font-medium flex items-center">
                          <XCircle className="w-4 h-4 mr-1" />
                          {errors.confirmPassword}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Password Requirements */}
                  {formData.password && (
                    <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-100">
                      <p className="text-sm font-semibold text-gray-700 mb-3">Password Requirements:</p>
                      <div className="grid grid-cols-1 gap-2">
                        {[
                          { key: "length", label: "At least 8 characters" },
                          { key: "uppercase", label: "One uppercase letter" },
                          { key: "lowercase", label: "One lowercase letter" },
                          { key: "number", label: "One number" },
                          { key: "special", label: "One special character" },
                        ].map(({ key, label }) => (
                          <div key={key} className="flex items-center space-x-3">
                            {passwordChecks[key] ? (
                              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                            ) : (
                              <XCircle className="w-4 h-4 text-gray-300 flex-shrink-0" />
                            )}
                            <span
                              className={`text-sm font-medium ${passwordChecks[key] ? "text-green-600" : "text-gray-500"
                                }`}
                            >
                              {label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Next Button */}
                  <div className="pt-6">
                    <button
                      type="submit"
                      disabled={!isPasswordValid}
                      className="w-full py-2 px-4 rounded-2xl bg-green-800 text-white text-sm flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                      style={{ fontFamily: 'TASA Explorer, sans-serif' }}
                    >
                      <span>Continue to Profile</span>
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Profile Information */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="flex items-center mb-8">
                    <div className="w-12 h-12 bg-green-800 rounded-xl flex items-center justify-center mr-4 shadow-lg shadow-emerald-500/25">
                      <Activity className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-black" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>Profile Information</h2>
                      <p className="text-gray-600" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>
                        Help us personalize your experience{" "}
                        <span className="text-sm text-emerald-500 font-medium">(Optional)</span>
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Age */}
                    <div>
                      <label htmlFor="profile.age" className="block text-sm font-semibold text-gray-700 mb-4">
                        Age
                      </label>
                      <input
                        type="number"
                        name="profile.age"
                        id="profile.age"
                        value={formData.profile.age}
                        onChange={handleChange}
                        className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300 bg-white/80 backdrop-blur-sm placeholder-gray-400 text-gray-900 font-medium hover:border-gray-300"
                        placeholder="25"
                        min="13"
                        max="120"
                      />
                    </div>

                    {/* Gender */}
                    <div>
                      <label htmlFor="profile.gender" className="block text-sm font-semibold text-gray-700 mb-3">
                        Gender
                      </label>
                      <select
                        name="profile.gender"
                        id="profile.gender"
                        value={formData.profile.gender}
                        onChange={handleChange}
                        className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300 bg-white/80 backdrop-blur-sm text-gray-900 font-medium hover:border-gray-300"
                      >
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    {/* Weight */}
                    <div>
                      <label htmlFor="profile.weight" className="block text-sm font-semibold text-gray-700 mb-3">
                        Weight (kg)
                      </label>
                      <input
                        type="number"
                        name="profile.weight"
                        id="profile.weight"
                        value={formData.profile.weight}
                        onChange={handleChange}
                        className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300 bg-white/80 backdrop-blur-sm placeholder-gray-400 text-gray-900 font-medium hover:border-gray-300"
                        placeholder="70"
                        min="20"
                        max="500"
                        step="0.1"
                      />
                    </div>

                    {/* Height */}
                    <div>
                      <label htmlFor="profile.height" className="block text-sm font-semibold text-gray-700 mb-3">
                        Height (cm)
                      </label>
                      <input
                        type="number"
                        name="profile.height"
                        id="profile.height"
                        value={formData.profile.height}
                        onChange={handleChange}
                        className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300 bg-white/80 backdrop-blur-sm placeholder-gray-400 text-gray-900 font-medium hover:border-gray-300"
                        placeholder="170"
                        min="100"
                        max="250"
                        step="0.1"
                      />
                    </div>
                  </div>

                  {/* Activity Level */}
                  <div>
                    <label htmlFor="profile.activity_level" className="block text-sm font-semibold text-gray-700 mt-12 mb-4">
                      Activity Level
                    </label>
                    <select
                      name="profile.activity_level"
                      id="profile.activity_level"
                      value={formData.profile.activity_level}
                      onChange={handleChange}
                      className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300 bg-white/80 backdrop-blur-sm text-gray-900 font-medium hover:border-gray-300"
                    >
                      <option value="sedentary">Sedentary (little or no exercise)</option>
                      <option value="lightly_active">Lightly Active (light exercise 1-3 days/week)</option>
                      <option value="moderately_active">Moderately Active (moderate exercise 3-5 days/week)</option>
                      <option value="very_active">Very Active (hard exercise 6-7 days/week)</option>
                      <option value="extra_active">Extra Active (very hard exercise, physical job)</option>
                    </select>
                  </div>

                  {/* Dietary Preferences */}
                  <div>
                    <div className="flex items-center mt-12 mb-4">
                      <Heart className="w-5 h-5 text-green-500 mr-2" />
                      <label className="text-sm font-semibold text-gray-700">Dietary Preferences</label>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {dietaryOptions.map((option) => (
                        <label
                          key={option}
                          className="group flex items-center space-x-3 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-green-50 hover:to-emerald-50 rounded-xl px-4 py-3 cursor-pointer transition-all duration-200 border-2 border-transparent hover:border-green-200"
                        >
                          <input
                            type="checkbox"
                            name="profile.dietary_preferences"
                            value={option}
                            checked={formData.profile.dietary_preferences.includes(option)}
                            onChange={handleChange}
                            className="w-4 h-4 text-green-600 bg-white border-2 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                          />
                          <span className="text-sm font-medium text-gray-700 group-hover:text-green-700 capitalize">
                            {option.replace("_", " ")}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Health Goals */}
                  <div>
                    <div className="flex items-center mt-12 mb-4">
                      <Target className="w-5 h-5 text-emerald-500 mr-2" />
                      <label className="text-sm font-semibold text-gray-700">Health Goals</label>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {healthGoalOptions.map((goal) => (
                        <label
                          key={goal}
                          className="group flex items-center space-x-3 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-emerald-50 hover:to-green-50 rounded-xl px-4 py-3 cursor-pointer transition-all duration-200 border-2 border-transparent hover:border-emerald-200"
                        >
                          <input
                            type="checkbox"
                            name="profile.health_goals"
                            value={goal}
                            checked={formData.profile.health_goals.includes(goal)}
                            onChange={handleChange}
                            className="w-4 h-4 text-emerald-600 bg-white border-2 border-gray-300 rounded focus:ring-emerald-500 focus:ring-2"
                          />
                          <span className="text-sm font-medium text-gray-700 group-hover:text-emerald-700 capitalize">
                            {goal.replace("_", " ")}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Navigation Buttons */}
                  <div className="flex gap-4 pt-6">
                    <button
                      type="button"
                      onClick={prevStep}
                      className="flex-1 py-2 px-4 rounded-2xl bg-green-800 text-white text-sm border-2 border-gray-300 flex items-center justify-center gap-3"
                    >
                      <span>Back</span>
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 py-2 px-4 rounded-2xl bg-green-800 text-white text-sm flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <LoadingSpinner size="small" />
                          <span>Creating Account...</span>
                        </>
                      ) : (
                        <>
                          <span>Create Account</span>

                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage
