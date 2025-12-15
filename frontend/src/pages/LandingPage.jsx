"use client"

import { useState, useEffect } from "react"
import { Brain, Target, Users, Shield, Zap, Award, Heart } from "lucide-react"
import FaviconIcon from '../components/FaviconIcon'

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-white">
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? "bg-white/95 backdrop-blur-md shadow-lg" : "bg-white/80 backdrop-blur-sm"
          }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-emerald-700 rounded-lg flex items-center justify-center">
                <FaviconIcon className="w-6 h-6" />
              </div>
              <span className="text-2xl font-bold text-green-800" style={{ fontFamily: 'Merienda, cursive' }}>Nutri</span>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <a href="/login" className="bg-green-800 text-white px-8 py-2 rounded-full hover:bg-emerald-700 transition-colors font-medium">
                Login
              </a>
              <a href="/register" className="bg-green-800 text-white px-6 py-2 rounded-full hover:bg-emerald-700 transition-colors font-medium">
                Sign Up
              </a>
            </div>
          </div>
        </div>
      </nav>

      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1490645935967-10de6ba17061?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2053&q=80')",
          }}
        />
        <div className="absolute inset-0 bg-black/50" />

        <div className="relative z-10 text-center text-white max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight" style={{ fontFamily: 'Merienda, cursive' }}>
            Transform Your Health with
            <span className="text-green-400 block" style={{ fontFamily: 'Merienda, cursive' }}>AI-Powered Nutrition</span>
          </h1>
          <p className="text-sm md:text-lg mb-8 text-gray-200 max-w-2xl mx-auto leading-relaxed" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>
            Get personalized meal plans, track your progress, and achieve your health goals with our intelligent
            nutrition assistant.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">

            <a href="/register" className="border-2 border-white text-white px-4 py-2 rounded-full text-lg font-semibold hover:bg-white hover:text-gray-900 transition-all duration-300 flex items-center gap-2">

              Start Journey
            </a>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white rounded-full mt-2 animate-pulse" />
          </div>
        </div>
      </section>

      <section className="py-16 bg-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-green-800 mb-2">50K+</div>
              <div className="text-gray-600">Happy Users</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-800 mb-2">1M+</div>
              <div className="text-gray-600">Meals Planned</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-800 mb-2">95%</div>
              <div className="text-gray-600">Success Rate</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-800 mb-2">24/7</div>
              <div className="text-gray-600">AI Support</div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>Powerful Features</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>
              Everything you need to transform your nutrition and achieve your health goals
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Brain,
                title: "AI-Powered Meal Planning",
                description:
                  "Get personalized meal plans based on your preferences, dietary restrictions, and health goals.",
              },
              {
                icon: Target,
                title: "Goal Tracking",
                description: "Set and track your nutrition goals with detailed analytics and progress reports.",
              },
              {
                icon: Users,
                title: "Community Support",
                description: "Connect with like-minded individuals and share your journey towards better health.",
              },
              {
                icon: Shield,
                title: "Safe & Secure",
                description: "Your health data is protected with enterprise-grade security and privacy measures.",
              },
              {
                icon: Zap,
                title: "Quick Results",
                description: "See improvements in your energy levels and overall health within weeks.",
              },
              {
                icon: Award,
                title: "Expert Approved",
                description: "All meal plans are reviewed and approved by certified nutritionists.",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-emerald-200 group"
              >
                <div className="bg-emerald-100 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-emerald-200 transition-colors">
                  <feature.icon className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="agents" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>Meet Your AI Nutrition Team</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>
              Specialized AI agents working together to optimize your nutrition journey
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "NutriPlan",
                role: "Meal Planning Specialist",
                description:
                  "Creates personalized meal plans based on your dietary preferences, restrictions, and health goals.",
                image: "https://images.unsplash.com/photo-1547496502-affa22d38842?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80",
              },
              {
                name: "HealthTracker",
                role: "Progress Monitor",
                description:
                  "Tracks your nutrition intake, monitors progress, and provides insights for continuous improvement.",
                image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80",
              },
              {
                name: "WellnessCoach",
                role: "Lifestyle Advisor",
                description:
                  "Provides motivation, tips, and guidance to help you maintain healthy eating habits long-term.",
                image: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80",
              },
            ].map((agent, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 text-center group border border-gray-100 hover:border-emerald-200 overflow-hidden"
              >
                <div className="relative h-48 w-full mb-6">
                  <img
                    src={agent.image}
                    alt={agent.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>
                <div className="p-8 pt-0">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>{agent.name}</h3>
                  <p className="text-emerald-600 font-semibold mb-4" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>{agent.role}</p>
                  <p className="text-gray-600 leading-relaxed" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>{agent.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>



      <section className="py-20 bg-gradient-to-r from-green-700 to-green-800">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-6" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>Ready to Transform Your Health?</h2>
          <p className="text-xl text-emerald-100 mb-8 max-w-2xl mx-auto" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>
            Join thousands of users who have already started their journey to better health with AI-powered nutrition.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">

            <a href="/register" className="border-2 border-white text-white px-4 py-2 rounded-full text-lg font-semibold hover:bg-white hover:text-gray-900 transition-all duration-300 flex items-center gap-2" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>

              Start Journey
            </a>
          </div>
        </div>
      </section>

      <footer className="bg-gray-50 border-t border-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-4">

          {/* Bottom Section */}
          <div className="border-t border-gray-200 pt-6 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 text-sm mb-4 md:mb-0" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>
              © 2024 Nutri. All rights reserved.
            </p>
            <p className="text-gray-500 text-sm flex items-center justify-center md:justify-end" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>
              Made with <Heart className="w-4 h-4 mx-1 text-green-600 fill-green-600" /> for healthier living
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
