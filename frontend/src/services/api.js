import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: '/api', // This will be proxied to http://localhost:8000 by Vite
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API methods for different functionalities
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/user/profile'),
  updateProfile: (profileData) => api.put('/user/profile', profileData),
};

export const chatAPI = {
  sendMessage: (message, context = {}, sessionId = null) => 
    api.post('/chat', { message, context, session_id: sessionId }),
  getChatHistory: (limit = 50) => 
    api.get(`/chat/history?limit=${limit}`),
  clearChatHistory: () => 
    api.delete('/chat/history'),
  
  // Session management
  getSessions: () => 
    api.get('/chat/sessions'),
  createSession: (title = 'New Chat') => 
    api.post('/chat/sessions', { title }),
  getSessionMessages: (sessionId) => 
    api.get(`/chat/sessions/${sessionId}/messages`),
  activateSession: (sessionId) => 
    api.put(`/chat/sessions/${sessionId}/activate`),
  deleteSession: (sessionId) => 
    api.delete(`/chat/sessions/${sessionId}`),
  updateSessionTitle: (sessionId, title) => 
    api.put(`/chat/sessions/${sessionId}/title`, { title }),
};

// Nutrition Calculator Agent API
export const nutritionAPI = {
  analyzeFood: (foodData) => 
    api.post('/chat', {
      message: `Analyze the nutrition of ${foodData.name}`,
      type: 'analyze_food',
      food_data: foodData
    }),
  
  searchFood: (query) => 
    api.post('/chat', {
      message: `Search for food: ${query}`,
      type: 'search_food',
      query
    }),
  
  calculateRecipe: (recipe) => 
    api.post('/chat', {
      message: 'Calculate nutrition for this recipe',
      type: 'calculate_recipe',
      recipe
    }),
  
  analyzeDailyIntake: (foodLog) => 
    api.post('/chat', {
      message: 'Analyze my daily food intake',
      type: 'daily_analysis',
      food_log: foodLog
    }),
};

// Recipe Finder Agent API
export const recipeAPI = {
  findRecipes: (criteria) => 
    api.post('/chat', {
      message: 'Find recipes for me',
      type: 'find_recipes',
      criteria
    }),
  
  getRecipeSuggestions: (goals) => 
    api.post('/chat', {
      message: 'Suggest recipes for my goals',
      type: 'recipe_suggestions',
      goals
    }),
  
  getIngredientSubstitutes: (ingredient) => 
    api.post('/chat', {
      message: `Find substitutes for ${ingredient}`,
      type: 'ingredient_substitute',
      ingredient
    }),
  
  createMealPlan: (planCriteria) => 
    api.post('/chat', {
      message: 'Create a meal plan for me',
      type: 'meal_plan',
      plan_criteria: planCriteria
    }),
  
  analyzeRecipe: (recipe) => 
    api.post('/chat', {
      message: 'Analyze this recipe',
      type: 'recipe_analysis',
      recipe
    }),
};

// Diet Tracker Agent API
export const trackerAPI = {
  logFood: (foodData) => 
    api.post('/chat', {
      message: `Log food: ${foodData.name}`,
      type: 'log_food',
      food_data: foodData
    }),
  
  logWater: (amount) => 
    api.post('/chat', {
      message: `Log water intake: ${amount}ml`,
      type: 'log_water',
      water_data: { amount }
    }),
  
  logExercise: (exerciseData) => 
    api.post('/chat', {
      message: `Log exercise: ${exerciseData.activity}`,
      type: 'log_exercise',
      exercise_data: exerciseData
    }),
  
  getDailySummary: (date = null) => 
    api.post('/chat', {
      message: 'Get my daily summary',
      type: 'daily_summary',
      date
    }),
  
  getWeeklyProgress: () => 
    api.post('/chat', {
      message: 'Show my weekly progress',
      type: 'weekly_progress'
    }),
  
  trackGoals: () => 
    api.post('/chat', {
      message: 'Track my goals progress',
      type: 'goal_tracking'
    }),
  
  getInsights: (timeframe = 'week') => 
    api.post('/chat', {
      message: 'Give me insights about my eating habits',
      type: 'insights',
      timeframe
    }),
  
  getRecommendations: () => 
    api.post('/chat', {
      message: 'Give me personalized recommendations',
      type: 'recommendations'
    }),
};

export default api;
