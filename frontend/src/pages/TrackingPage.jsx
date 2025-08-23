import React from 'react';
import { BarChart3, Target, Calendar, TrendingUp } from 'lucide-react';

const TrackingPage = () => {
  return (
    <div className="space-y-6">
      <div className="card">
        <div className="text-center">
          <BarChart3 className="w-16 h-16 text-primary-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Diet Tracking</h1>
          <p className="text-gray-600">
            Monitor your progress and get insights on your eating habits
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card-hover text-center">
          <Calendar className="w-12 h-12 text-blue-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Daily Logging</h3>
          <p className="text-gray-600 mb-4">
            Log your meals, water intake, and exercise activities
          </p>
          <button className="btn-primary">Log Today</button>
        </div>

        <div className="card-hover text-center">
          <Target className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Goal Tracking</h3>
          <p className="text-gray-600 mb-4">
            Track your progress towards your health and nutrition goals
          </p>
          <button className="btn-primary">View Goals</button>
        </div>

        <div className="card-hover text-center">
          <TrendingUp className="w-12 h-12 text-purple-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Progress Insights</h3>
          <p className="text-gray-600 mb-4">
            Get AI-powered insights on your eating patterns and progress
          </p>
          <button className="btn-primary">View Insights</button>
        </div>
      </div>

      <div className="card">
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            🚧 Tracking features coming soon!
          </p>
          <p className="text-gray-400 mt-2">
            For now, try the AI Chat to track your progress
          </p>
        </div>
      </div>
    </div>
  );
};

export default TrackingPage;
