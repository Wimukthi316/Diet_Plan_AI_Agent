"""
Recipe Finder Agent - Using Spoonacular API for comprehensive recipe data
"""
import os
import requests
from typing import Dict, Any, List, Optional
from backend.agents.base_agent import BaseAgent
from backend.utils.security import sanitize_input
import re

class RecipeFinderAgent(BaseAgent):
    """Agent specialized in finding recipes using Spoonacular API"""
    
    def __init__(self):
        super().__init__(
            name="RecipeFinder",
            role="Recipe discovery, meal planning, and culinary guidance specialist",
            model_name="gemini-2.0-flash"
        )
        
        self.capabilities = [
            "Recipe search via Spoonacular API",
            "Dietary preference filtering",
            "Ingredient-based recipe discovery",
            "Nutritional recipe analysis",
            "Meal planning suggestions",
            "Ingredient substitution",
            "Recipe instructions and details"
        ]
        
        # Spoonacular API configuration
        self.spoonacular_api_key = os.getenv("SPOONACULAR_API_KEY")
        self.base_url = "https://api.spoonacular.com/recipes"
        
    async def process_request(self, request: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Process recipe-related requests"""
        try:
            message = sanitize_input(request.get("message", ""))
            request_type = request.get("type", "general")
            
            if not message:
                return await self._general_recipe_response("", context)
            
            # Extract recipe query from message
            recipe_query = self._extract_recipe_query(message)
            
            if recipe_query and request_type != "general":
                # Get recipes from Spoonacular API
                recipes = await self._search_spoonacular_recipes(recipe_query, context)
                
                if recipes:
                    response = self._format_recipe_response(recipes, recipe_query)
                    return {
                        "agent": self.name,
                        "response": response,
                        "recipes": recipes,
                        "query": recipe_query,
                        "status": "success"
                    }
            
            # Fallback to AI for general questions or complex requests
            return await self._general_recipe_response(message, context)
                
        except Exception as e:
            self.logger.error(f"Error in recipe finder: {e}")
            return await self._general_recipe_response(message, context)
    
    def _extract_recipe_query(self, message: str) -> Optional[str]:
        """Extract recipe search query from user message"""
        message_lower = message.lower()
        
        # Check for recipe-specific patterns
        patterns = [
            r"(?:find|search|get|show).*?recipes?.*?(?:for|with|using)\s+(.+?)(?:\?|$)",
            r"recipes?.*?(?:for|with|using)\s+(.+?)(?:\?|$)",
            r"(?:recipe|cooking).*?(.+?)(?:\?|$)",
            r"(?:cook|make)\s+(.+?)(?:\?|$)",
            r"(.+?)\s+recipes?(?:\?|$)"
        ]
        
        for pattern in patterns:
            match = re.search(pattern, message_lower)
            if match:
                query = match.group(1).strip()
                # Clean up common words
                query = re.sub(r'\b(the|a|an|some|of|in|with)\b', '', query).strip()
                if query and len(query) > 2:
                    return query
        
        # Check if message looks like ingredients or food names
        food_keywords = ['chicken', 'beef', 'pasta', 'salmon', 'vegetarian', 'vegan', 'soup', 'salad', 'dessert']
        if any(keyword in message_lower for keyword in food_keywords):
            return message.strip()
        
        return None
    
    async def _search_spoonacular_recipes(self, query: str, context: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Search for recipes using Spoonacular API"""
        try:
            # Build API parameters
            params = {
                'apiKey': self.spoonacular_api_key,
                'query': query,
                'number': 6,  # Get 6 recipes
                'addRecipeInformation': True,
                'fillIngredients': True,
                'addRecipeNutrition': True,
                'instructionsRequired': True
            }
            
            # Add dietary filters if available in context
            user_profile = context.get('user_profile', {})
            if 'dietary_preferences' in user_profile:
                diet_map = {
                    'vegetarian': 'vegetarian',
                    'vegan': 'vegan',
                    'gluten-free': 'glutenFree',
                    'dairy-free': 'dairyFree',
                    'keto': 'ketogenic',
                    'paleo': 'paleo'
                }
                
                for pref in user_profile['dietary_preferences']:
                    if pref.lower() in diet_map:
                        params[diet_map[pref.lower()]] = True
            
            # Search recipes
            url = f"{self.base_url}/complexSearch"
            response = requests.get(url, params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                recipes = data.get('results', [])
                
                # Process and simplify recipe data
                processed_recipes = []
                for recipe in recipes[:6]:
                    processed_recipe = {
                        'id': recipe.get('id'),
                        'title': recipe.get('title', 'Unknown Recipe'),
                        'image': recipe.get('image'),
                        'ready_in_minutes': recipe.get('readyInMinutes', 'N/A'),
                        'servings': recipe.get('servings', 'N/A'),
                        'source_url': recipe.get('sourceUrl'),
                        'summary': self._clean_html(recipe.get('summary', ''))[:200] + '...',
                        'ingredients': [ing.get('original', '') for ing in recipe.get('extendedIngredients', [])],
                        'nutrition': self._extract_nutrition(recipe.get('nutrition', {})),
                        'instructions': self._get_recipe_instructions(recipe.get('id')) if recipe.get('id') else [],
                        'health_score': recipe.get('healthScore', 0),
                        'price_per_serving': recipe.get('pricePerServing', 0)
                    }
                    processed_recipes.append(processed_recipe)
                
                return processed_recipes
            else:
                self.logger.warning(f"Spoonacular API error: {response.status_code}")
                
        except Exception as e:
            self.logger.error(f"Error calling Spoonacular API: {e}")
        
        return []
    
    def _get_recipe_instructions(self, recipe_id: int) -> List[str]:
        """Get detailed instructions for a recipe"""
        try:
            url = f"{self.base_url}/{recipe_id}/analyzedInstructions"
            params = {'apiKey': self.spoonacular_api_key}
            
            response = requests.get(url, params=params, timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                instructions = []
                
                for instruction_set in data:
                    for step in instruction_set.get('steps', []):
                        instructions.append(f"{step.get('number', '')}. {step.get('step', '')}")
                
                return instructions[:8]  # Limit to 8 steps
                
        except Exception as e:
            self.logger.error(f"Error getting recipe instructions: {e}")
        
        return []
    
    def _extract_nutrition(self, nutrition_data: Dict) -> Dict[str, Any]:
        """Extract key nutrition information"""
        if not nutrition_data:
            return {}
        
        nutrients = nutrition_data.get('nutrients', [])
        nutrition_info = {}
        
        # Extract key nutrients
        nutrient_map = {
            'Calories': 'calories',
            'Protein': 'protein',
            'Carbohydrates': 'carbs',
            'Fat': 'fat',
            'Fiber': 'fiber',
            'Sugar': 'sugar',
            'Sodium': 'sodium'
        }
        
        for nutrient in nutrients:
            name = nutrient.get('name', '')
            if name in nutrient_map:
                nutrition_info[nutrient_map[name]] = {
                    'amount': nutrient.get('amount', 0),
                    'unit': nutrient.get('unit', '')
                }
        
        return nutrition_info
    
    def _clean_html(self, text: str) -> str:
        """Remove HTML tags from text"""
        import re
        clean = re.compile('<.*?>')
        return re.sub(clean, '', text)
    
    def _format_recipe_response(self, recipes: List[Dict], query: str) -> str:
        """Format recipes into readable response"""
        if not recipes:
            return f"I couldn't find any recipes for '{query}'. Try a different search term!"
        
        response = f"**🍳 Recipe Search Results for '{query.title()}'**\n\n"
        response += f"Found {len(recipes)} delicious recipes:\n\n"
        
        for i, recipe in enumerate(recipes[:3], 1):  # Show top 3 in detail
            response += f"**{i}. {recipe['title']}** ⭐ Health Score: {recipe['health_score']}/100\n"
            response += f"⏱️ **Prep Time:** {recipe['ready_in_minutes']} minutes | 👥 **Serves:** {recipe['servings']}\n\n"
            
            # Nutrition info
            nutrition = recipe.get('nutrition', {})
            if nutrition:
                response += "**📊 Nutrition (per serving):**\n"
                for key, data in nutrition.items():
                    if isinstance(data, dict):
                        response += f"• {key.title()}: {data['amount']:.1f}{data['unit']}\n"
                response += "\n"
            
            # Ingredients (show first 5)
            ingredients = recipe.get('ingredients', [])
            if ingredients:
                response += "**🥘 Key Ingredients:**\n"
                for ing in ingredients[:5]:
                    response += f"• {ing}\n"
                if len(ingredients) > 5:
                    response += f"• ...and {len(ingredients) - 5} more\n"
                response += "\n"
            
            # Brief instructions
            instructions = recipe.get('instructions', [])
            if instructions:
                response += "**👨‍🍳 Quick Instructions:**\n"
                for inst in instructions[:3]:
                    response += f"• {inst}\n"
                if len(instructions) > 3:
                    response += f"• ...{len(instructions) - 3} more steps\n"
            
            response += f"🔗 [Full Recipe]({recipe.get('source_url', '#')})\n\n"
            response += "---\n\n"
        
        # Show remaining recipes briefly
        if len(recipes) > 3:
            response += "**📋 More Recipe Options:**\n"
            for i, recipe in enumerate(recipes[3:], 4):
                response += f"{i}. **{recipe['title']}** ({recipe['ready_in_minutes']} min, Health Score: {recipe['health_score']})\n"
        
        response += "\n💡 *Powered by Spoonacular API - Over 5000+ recipes available!*"
        
        return response
    
    async def _general_recipe_response(self, message: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Handle general recipe questions with AI"""
        
        if not message:
            message = "Tell me about recipe finding and what you can help me with"
        
        # Check for specific recipe types
        message_lower = message.lower()
        is_recipe_request = any(word in message_lower for word in 
                               ['recipe', 'cook', 'meal', 'ingredient', 'dish', 'food'])
        
        if is_recipe_request:
            prompt = f"""
            You are a culinary expert and recipe specialist. Help with this request: {message}
            
            User context: {context}
            
            Provide helpful advice about:
            - Recipe suggestions and cooking tips
            - Ingredient substitutions and alternatives  
            - Meal planning and preparation
            - Cooking techniques and methods
            - Dietary accommodations
            - Nutritional considerations
            
            Be practical, encouraging, and include specific recommendations when possible.
            Use emojis to make it engaging.
            """
        else:
            prompt = f"""
            You are a recipe and cooking expert. Answer this question: {message}
            
            Focus on:
            - Recipe discovery and meal planning
            - Cooking techniques and tips
            - Ingredient knowledge and substitutions
            - Dietary preferences and restrictions
            - Nutritional cooking advice
            
            Keep responses helpful and practical. Use emojis to make it engaging.
            """
        
        try:
            response = await self.generate_response(prompt, context)
            
            return {
                "agent": self.name,
                "response": response,
                "type": "general_recipe",
                "status": "success"
            }
        except Exception as e:
            self.logger.error(f"Error generating AI response: {e}")
            return {
                "agent": self.name,
                "response": "I can help you find recipes and cooking advice! Try asking about specific dishes, ingredients, or meal planning. 🍳",
                "status": "success"
            }
    
    def get_agent_description(self) -> Dict[str, Any]:
        """Get agent description and capabilities"""
        return {
            "name": self.name,
            "role": self.role,
            "capabilities": self.capabilities,
            "protocols": self.communication_protocols,
            "data_sources": ["Spoonacular API", "Google Gemini AI"],
            "api_coverage": "5000+ recipes with nutrition data"
        }