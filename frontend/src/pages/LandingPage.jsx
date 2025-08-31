import React from 'react';
import { Link } from 'react-router-dom';
import {
  Brain,
  Target,
  Users,
  Shield,
  Zap,
  CheckCircle,
  ArrowRight,
  Star
} from 'lucide-react';
import FaviconIcon from '../components/FaviconIcon';

const LandingPage = () => {
  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Nutrition Analysis',
      description: 'Advanced AI analyzes your food choices and provides detailed nutritional insights using USDA database and machine learning.'
    },
    {
      icon: Target,
      title: 'Personalized Diet Plans',
      description: 'Get custom meal plans tailored to your health goals, dietary restrictions, and preferences.'
    },
    {
      icon: ({ className }) => <FaviconIcon className={className} />,
      title: 'Smart Recipe Finder',
      description: 'Discover healthy recipes that match your nutritional needs and taste preferences.'
    },
    {
      icon: Users,
      title: 'Multi-Agent Intelligence',
      description: 'Three specialized AI agents work together to provide comprehensive diet and nutrition guidance.'
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your data is protected with enterprise-grade security and privacy measures.'
    },
    {
      icon: Zap,
      title: 'Real-time Tracking',
      description: 'Track your daily intake, progress, and get instant feedback on your nutrition goals.'
    }
  ];

  const agents = [
    {
      name: 'Nutrition Calculator',
      description: 'Analyzes food nutritional content using USDA API and provides detailed breakdowns.',
      capabilities: ['Food analysis', 'Calorie counting', 'Nutrient breakdown', 'Portion estimation']
    },
    {
      name: 'Recipe Finder',
      description: 'Discovers and suggests recipes based on your dietary preferences and health goals.',
      capabilities: ['Recipe search', 'Meal planning', 'Ingredient substitution', 'Cooking guidance']
    },
    {
      name: 'Diet Tracker',
      description: 'Monitors your daily intake and provides insights on your eating patterns.',
      capabilities: ['Progress tracking', 'Goal monitoring', 'Behavioral insights', 'Recommendations']
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="relative bg-gradient-to-br from-primary-50 to-primary-100">
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <FaviconIcon className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold gradient-text">Diet Plan AI</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="btn-primary"
              >
                Get Started
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Your Personal{' '}
              <span className="gradient-text">AI Nutrition</span>{' '}
              Assistant
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-600">
              Transform your diet with the power of AI. Get personalized nutrition analysis,
              smart recipe recommendations, and comprehensive diet tracking all in one platform.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link to="/register" className="btn-primary text-lg px-8 py-3">
                Start Your Journey
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link to="/login" className="btn-outline text-lg px-8 py-3">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-24 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Powerful Features for Your Health Journey
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Advanced AI technology meets personalized nutrition guidance
            </p>
          </div>

          <div className="mt-20 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.title} className="card-hover text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg bg-primary-100">
                  <feature.icon className="h-8 w-8 text-primary-600" />
                </div>
                <h3 className="mt-6 text-xl font-semibold text-gray-900">
                  {feature.title}
                </h3>
                <p className="mt-2 text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Agents Section */}
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Meet Your AI Nutrition Team
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Three specialized AI agents working together for your health
            </p>
          </div>

          <div className="mt-20 grid grid-cols-1 gap-8 lg:grid-cols-3">
            {agents.map((agent, index) => (
              <div key={agent.name} className="card relative">
                <div className="absolute -top-4 left-6">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 text-white text-sm font-bold">
                    {index + 1}
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mt-4">
                  {agent.name}
                </h3>
                <p className="mt-2 text-gray-600">
                  {agent.description}
                </p>
                <ul className="mt-4 space-y-2">
                  {agent.capabilities.map((capability) => (
                    <li key={capability} className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-primary-600" />
                      <span className="text-sm text-gray-600">{capability}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="gradient-bg py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to Transform Your Diet?
            </h2>
            <p className="mt-4 text-lg text-primary-100">
              Join thousands of users who've already improved their health with AI-powered nutrition guidance.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                to="/register"
                className="bg-white text-primary-600 hover:bg-primary-50 font-medium py-3 px-8 rounded-lg transition-colors duration-200 flex items-center space-x-2"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
            <div className="mt-6 flex items-center justify-center space-x-4 text-primary-100">
              <div className="flex items-center space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <span className="text-sm">Trusted by 10,000+ users</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <FaviconIcon className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold text-white">Diet Plan AI</span>
            </div>
            <p className="text-gray-400 text-sm">
              © 2025 Diet Plan AI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
