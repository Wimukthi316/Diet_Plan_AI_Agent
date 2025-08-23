import React from 'react';
import { BookOpen, Search, ChefHat, Heart } from 'lucide-react';

const RecipesPage = () => {
  return (
    <div className="space-y-6">
      <div className="card">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-primary-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Recipe Finder</h1>
          <p className="text-gray-600">
            Discover healthy recipes tailored to your dietary preferences and goals
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card-hover text-center">
          <Search className="w-12 h-12 text-blue-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Recipe Search</h3>
          <p className="text-gray-600 mb-4">
            Find recipes by ingredients, cuisine type, or dietary restrictions
          </p>
          <button className="btn-primary">Search Recipes</button>
        </div>

        <div className="card-hover text-center">
          <ChefHat className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Meal Planning</h3>
          <p className="text-gray-600 mb-4">
            Create personalized meal plans for your health goals
          </p>
          <button className="btn-primary">Create Meal Plan</button>
        </div>

        <div className="card-hover text-center">
          <Heart className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Healthy Suggestions</h3>
          <p className="text-gray-600 mb-4">
            Get AI-powered recipe recommendations based on your profile
          </p>
          <button className="btn-primary">Get Suggestions</button>
        </div>
      </div>

      <div className="card">
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            🚧 Recipe features coming soon!
          </p>
          <p className="text-gray-400 mt-2">
            For now, try the AI Chat to find recipes
          </p>
        </div>
      </div>
    </div>
  );
};

export default RecipesPage;
