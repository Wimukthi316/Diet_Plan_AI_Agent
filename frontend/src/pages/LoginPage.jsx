import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, Mail, Lock, XCircle } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import FaviconIcon from '../components/FaviconIcon';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loginError, setLoginError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear field-specific error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    // Clear field-specific login errors when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    // Clear general login error only when user starts typing in password field or makes substantial changes to email
    if (loginError && ((name === 'password' && value.length > 0) || (name === 'email' && value.length > 3))) {
      setLoginError('');
    }

    // Real-time validation for email
    const newErrors = { ...errors }
    if (name === "email" && value.trim()) {
      if (!value.includes('@')) {
        newErrors.email = "Email must contain @ sign"
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
        newErrors.email = "Please enter a valid email address"
      } else {
        newErrors.email = ""
      }
      setErrors(newErrors)
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Email validation - must contain @ sign and proper format
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!formData.email.includes('@')) {
      newErrors.email = 'Email must contain @ sign';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    // Clear any previous errors
    setLoginError('');
    setFieldErrors({});

    const result = await login(formData.email, formData.password);
    if (result.success) {
      navigate('/dashboard');
    } else {
      // Set field-specific error messages based on the error type
      const errorMessage = result.error;
      
      if (errorMessage.includes('No account found') || errorMessage.includes('email')) {
        setFieldErrors(prev => ({
          ...prev,
          email: 'No account found with this email address'
        }));
      } else if (errorMessage.includes('Incorrect password') || errorMessage.includes('password')) {
        setFieldErrors(prev => ({
          ...prev,
          password: 'Incorrect password. Please try again.'
        }));
      } else {
        // For other errors, show general message
        setLoginError(errorMessage);
      }
    }
  };

  return (
    <div className="bg-white min-h-screen lg:flex lg:h-screen lg:overflow-hidden">
      {/* Left Side - Image (40%) - Fixed on large screens, hidden on mobile */}
      <div className="hidden lg:flex lg:w-2/5 lg:h-screen lg:fixed lg:left-0 lg:top-0 relative overflow-hidden">
        <div className="absolute inset-0"></div>
        <img
          src="/login.jpg"
          alt="Healthy nutrition and wellness"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-center p-8">
          <div className="text-center text-white bg-white/10 backdrop-blur-md rounded-3xl p-4 border border-white/20 max-w-sm">
            <div className="w-16 h-16 backdrop-blur-sm rounded-3xl flex items-center justify-center mx-auto mb-6">
              <FaviconIcon className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Merienda, cursive' }}>Welcome Back to Your Journey</h2>
            <p className="text-sm text-white" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>
              Continue your personalized nutrition experience with AI-powered insights
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Form - Responsive */}
      <div className="w-full lg:w-3/5 lg:h-screen lg:overflow-y-auto lg:ml-[40%] p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-2xl mx-auto">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-6 pt-4">
            <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-emerald-700 rounded-2xl flex items-center justify-center shadow-xl shadow-green-500/25">
              <FaviconIcon className="w-8 h-8" />
            </div>
          </div>

          {/* Header */}
          <div className="text-center mt-4 lg:mt-20 mb-6">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-green-800 via-emerald-800 to-teal-800 bg-clip-text text-transparent mb-3 tracking-tight" style={{ fontFamily: 'Merienda, cursive' }}>
              Welcome Back
            </h1>
            <p className="text-lg sm:text-xl text-black mt-4 lg:mt-12 mb-2 font-medium px-4" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>Sign in to continue your nutrition journey</p>
            <p className="text-gray-500 text-sm px-4" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>
              Don&apos;t have an account?{" "}
              <Link
                to="/register"
                className="font-semibold text-green-600 hover:text-green-700 transition-colors duration-200 underline decoration-2 underline-offset-4 decoration-green-200 hover:decoration-green-300"
              >
                Sign up for free
              </Link>
            </p>
          </div>

          {/* Form Container */}
          <div className="bg-gray-100 backdrop-blur-xl shadow-3xl rounded-2xl lg:rounded-3xl border border-white/20 overflow-hidden mx-2 sm:mx-0">
            <form onSubmit={handleSubmit} className="p-4 sm:p-6 lg:p-8">
              <div className="space-y-6">
                <div className="flex items-center mb-8">
                  <div className="w-12 h-12 bg-green-800 rounded-xl flex items-center justify-center mr-4 shadow-lg shadow-green-500/25">
                    <Lock className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-black" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>Sign In</h2>
                    <p className="text-gray-600" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>Access your personalized nutrition dashboard</p>
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-3" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      id="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 border-2 rounded-xl sm:rounded-2xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-300 bg-white/80 backdrop-blur-sm placeholder-gray-400 text-gray-900 font-medium ${(errors.email || fieldErrors.email)
                        ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
                        : "border-gray-200 hover:border-gray-300"
                        }`}
                      placeholder="Enter your email address"
                      autoComplete="email"
                    />
                  </div>
                  {(errors.email || fieldErrors.email) && (
                    <p className="mt-2 text-sm text-red-600 font-medium flex items-center">
                      <XCircle className="w-4 h-4 mr-1" />
                      {errors.email || fieldErrors.email}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-3" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      id="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`w-full pl-10 sm:pl-12 pr-14 py-3 sm:py-4 border-2 rounded-xl sm:rounded-2xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-300 bg-white/80 backdrop-blur-sm placeholder-gray-400 text-gray-900 font-medium ${(errors.password || fieldErrors.password)
                        ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
                        : "border-gray-200 hover:border-gray-300"
                        }`}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                    </button>
                  </div>
                  {(errors.password || fieldErrors.password) && (
                    <p className="mt-2 text-sm text-red-600 font-medium flex items-center">
                      <XCircle className="w-4 h-4 mr-1" />
                      {errors.password || fieldErrors.password}
                    </p>
                  )}
                </div>

                {/* Login Error Message */}
                {loginError && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl transition-all duration-300 relative">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start flex-1">
                        <XCircle className="w-4 h-4 mr-2 text-red-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm text-red-700 font-medium">
                            {loginError}
                          </p>
                          {loginError.includes('email') && (
                            <p className="text-xs text-red-600 mt-2">
                              💡 Make sure you&apos;re using the same email address you registered with.
                            </p>
                          )}
                          {loginError.includes('password') && (
                            <p className="text-xs text-red-600 mt-2">
                              💡 Passwords are case-sensitive. Check your Caps Lock key.
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setLoginError('')}
                        className="ml-2 text-red-400 hover:text-red-600 transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-600"
                    />
                    <label htmlFor="remember-me" className="ml-3 block text-sm text-gray-700" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>
                      Remember me
                    </label>
                  </div>

                  <div className="text-sm">
                    <a href="#" className="font-semibold text-green-600 hover:text-green-700 transition-colors duration-200" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>
                      Forgot password?
                    </a>
                  </div>
                </div>

                {/* Sign In Button */}
                <div className="pt-6">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 sm:py-4 px-8 rounded-xl sm:rounded-2xl bg-green-800 text-white font-bold text-lg shadow-xl shadow-green-500/25 hover:shadow-2xl hover:shadow-green-500/30 hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    style={{ fontFamily: 'TASA Explorer, sans-serif' }}
                  >
                    {loading ? (
                      <>
                        <LoadingSpinner size="small" />
                        <span>Signing in...</span>
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </button>
                </div>



              </div>
            </form>
          </div>
          {/* Bottom spacing for mobile */}
          <div className="h-8 lg:h-0"></div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
