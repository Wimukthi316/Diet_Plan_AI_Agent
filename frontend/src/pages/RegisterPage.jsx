import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Beaker, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    profile: {
      age: '',
      gender: '',
      weight: '',
      height: '',
      activity_level: 'moderately_active',
      dietary_preferences: [],
      health_goals: []
    }
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const { register, loading } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('profile.')) {
      const profileField = name.split('.')[1];
      if (type === 'checkbox') {
        const currentValues = formData.profile[profileField] || [];
        const newValues = checked 
          ? [...currentValues, value]
          : currentValues.filter(item => item !== value);
        
        setFormData(prev => ({
          ...prev,
          profile: {
            ...prev.profile,
            [profileField]: newValues
          }
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          profile: {
            ...prev.profile,
            [profileField]: value
          }
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validatePassword = (password) => {
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    
    return checks;
  };

  const passwordChecks = validatePassword(formData.password);
  const isPasswordValid = Object.values(passwordChecks).every(check => check);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!isPasswordValid) {
      newErrors.password = 'Password does not meet requirements';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const userData = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      password: formData.password,
      profile: {
        ...formData.profile,
        age: formData.profile.age ? parseInt(formData.profile.age) : null,
        weight: formData.profile.weight ? parseFloat(formData.profile.weight) : null,
        height: formData.profile.height ? parseFloat(formData.profile.height) : null,
      }
    };

    const success = await register(userData);
    if (success) {
      navigate('/login');
    }
  };

  const dietaryOptions = [
    'vegetarian', 'vegan', 'pescatarian', 'keto', 'paleo', 
    'mediterranean', 'low_carb', 'gluten_free', 'dairy_free'
  ];

  const healthGoalOptions = [
    'weight_loss', 'weight_gain', 'muscle_gain', 'maintenance',
    'heart_health', 'diabetes_management', 'sports_performance'
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                <Beaker className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold gradient-text">Diet Plan AI</span>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Create your account</h2>
          <p className="mt-2 text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
              Sign in here
            </Link>
          </p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
              
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`mt-1 input-field ${errors.name ? 'border-red-300' : ''}`}
                  placeholder="Enter your full name"
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`mt-1 input-field ${errors.email ? 'border-red-300' : ''}`}
                  placeholder="Enter your email"
                />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1 relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    id="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`input-field pr-10 ${errors.password ? 'border-red-300' : ''}`}
                    placeholder="Create a strong password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                  </button>
                </div>
                
                {/* Password Requirements */}
                {formData.password && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700 mb-2">Password Requirements:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                      {[
                        { key: 'length', label: 'At least 8 characters' },
                        { key: 'uppercase', label: 'One uppercase letter' },
                        { key: 'lowercase', label: 'One lowercase letter' },
                        { key: 'number', label: 'One number' },
                        { key: 'special', label: 'One special character' }
                      ].map(({ key, label }) => (
                        <div key={key} className="flex items-center space-x-2">
                          {passwordChecks[key] ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-gray-300" />
                          )}
                          <span className={`text-xs ${passwordChecks[key] ? 'text-green-600' : 'text-gray-500'}`}>
                            {label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <div className="mt-1 relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    id="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`input-field pr-10 ${errors.confirmPassword ? 'border-red-300' : ''}`}
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
              </div>
            </div>

            {/* Profile Information */}
            <div className="space-y-4 border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900">Profile Information (Optional)</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="profile.age" className="block text-sm font-medium text-gray-700">
                    Age
                  </label>
                  <input
                    type="number"
                    name="profile.age"
                    id="profile.age"
                    value={formData.profile.age}
                    onChange={handleChange}
                    className="mt-1 input-field"
                    placeholder="25"
                    min="13"
                    max="120"
                  />
                </div>

                <div>
                  <label htmlFor="profile.gender" className="block text-sm font-medium text-gray-700">
                    Gender
                  </label>
                  <select
                    name="profile.gender"
                    id="profile.gender"
                    value={formData.profile.gender}
                    onChange={handleChange}
                    className="mt-1 input-field"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="profile.weight" className="block text-sm font-medium text-gray-700">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    name="profile.weight"
                    id="profile.weight"
                    value={formData.profile.weight}
                    onChange={handleChange}
                    className="mt-1 input-field"
                    placeholder="70"
                    min="20"
                    max="500"
                    step="0.1"
                  />
                </div>

                <div>
                  <label htmlFor="profile.height" className="block text-sm font-medium text-gray-700">
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    name="profile.height"
                    id="profile.height"
                    value={formData.profile.height}
                    onChange={handleChange}
                    className="mt-1 input-field"
                    placeholder="170"
                    min="100"
                    max="250"
                    step="0.1"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="profile.activity_level" className="block text-sm font-medium text-gray-700">
                  Activity Level
                </label>
                <select
                  name="profile.activity_level"
                  id="profile.activity_level"
                  value={formData.profile.activity_level}
                  onChange={handleChange}
                  className="mt-1 input-field"
                >
                  <option value="sedentary">Sedentary (little or no exercise)</option>
                  <option value="lightly_active">Lightly Active (light exercise 1-3 days/week)</option>
                  <option value="moderately_active">Moderately Active (moderate exercise 3-5 days/week)</option>
                  <option value="very_active">Very Active (hard exercise 6-7 days/week)</option>
                  <option value="extra_active">Extra Active (very hard exercise, physical job)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dietary Preferences
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {dietaryOptions.map(option => (
                    <label key={option} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        name="profile.dietary_preferences"
                        value={option}
                        checked={formData.profile.dietary_preferences.includes(option)}
                        onChange={handleChange}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-600"
                      />
                      <span className="text-sm text-gray-700 capitalize">
                        {option.replace('_', ' ')}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Health Goals
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {healthGoalOptions.map(goal => (
                    <label key={goal} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        name="profile.health_goals"
                        value={goal}
                        checked={formData.profile.health_goals.includes(goal)}
                        onChange={handleChange}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-600"
                      />
                      <span className="text-sm text-gray-700 capitalize">
                        {goal.replace('_', ' ')}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || !isPasswordValid}
                className="btn-primary w-full justify-center"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="small" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  'Create Account'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
