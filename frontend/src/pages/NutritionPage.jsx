import React from 'react';
import { Beaker, Search, Calculator, TrendingUp } from 'lucide-react';

const NutritionPage = () => {
  return (
    <div className="space-y-6">
      <div className="card">
        <div className="text-center">
          <Beaker className="w-16 h-16 text-primary-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Nutrition Analysis</h1>
          <p className="text-gray-600">
            Advanced nutritional analysis powered by AI and USDA database
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card-hover text-center">
          <Search className="w-12 h-12 text-blue-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Food Search</h3>
          <p className="text-gray-600 mb-4">
            Search our comprehensive food database for nutritional information
          </p>
          <button className="btn-primary">Search Foods</button>
        </div>

        <div className="card-hover text-center">
          <Calculator className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Nutrition Calculator</h3>
          <p className="text-gray-600 mb-4">
            Calculate detailed nutrition facts for your meals and recipes
          </p>
          <button className="btn-primary">Calculate Nutrition</button>
        </div>

        <div className="card-hover text-center">
          <TrendingUp className="w-12 h-12 text-purple-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Daily Analysis</h3>
          <p className="text-gray-600 mb-4">
            Get insights on your daily nutritional intake and patterns
          </p>
          <button className="btn-primary">View Analysis</button>
        </div>
      </div>

      <div className="card">
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            🚧 Detailed nutrition features coming soon!
          </p>
          <p className="text-gray-400 mt-2">
            For now, try the AI Chat to analyze nutrition
          </p>
        </div>
      </div>
    </div>
  );
};

export default NutritionPage;
