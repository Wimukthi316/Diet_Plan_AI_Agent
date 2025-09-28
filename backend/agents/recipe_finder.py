"""
Recipe Finder Agent - Using Spoonacular API for comprehensive recipe data
This file contains the RecipeFinderAgent class which searches recipes using the
Spoonacular API and provides formatted responses. Below each line or logical
block has an inline comment explaining what it does.
"""
import os # used for reading environment variables (API key)
import requests # synchronous HTTP client used to call Spoonacular endpoints
from typing import Dict, Any, List, Optional # typing hints for readability and static analysis
from backend.agents.base_agent import BaseAgent # base class provided by the project
from backend.models.user import User # ORM / model to fetch user profile data
from backend.utils.security import sanitize_input # helper to sanitize user-provided input
import re # regex utilities used for parsing user messages

class RecipeFinderAgent(BaseAgent):
    """Agent specialized in finding recipes using Spoonacular API"""
    
    # The class inherits from BaseAgent to reuse common agent behavior (logging, model calls, etc.)
    def __init__(self):
        super().__init__(
            name="RecipeFinder",
            role="Recipe discovery, meal planning, and culinary guidance specialist",
            model_name="gemini-2.0-flash"
        )

        # List of capabilities this agent advertises
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
        self.spoonacular_api_key = os.getenv("SPOONACULAR_API_KEY") # read API key from environment (keep secret)
        self.base_url = "https://api.spoonacular.com/recipes" # base endpoint for Spoonacular API
        
    async def process_request(self, request: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Process recipe-related requests
        This is the main entrypoint for incoming requests to the agent. It:
        - sanitizes input,
        - attempts to extract a recipe query,
        - queries Spoonacular if appropriate, and
        - falls back to AI-generated guidance for general questions.
        """
        try:
            # Sanitize the incoming message text to prevent injection attacks
            message = sanitize_input(request.get("message", ""))
            # Determine request type, default to 'general' if not provided
            request_type = request.get("type", "general")
            
            # If the message is empty, provide a general recipe help response
            if not message:
                return await self._general_recipe_response("", context)
            
            # Extract recipe query from message (e.g., "chicken curry" or "recipes with potatoes")
            recipe_query = self._extract_recipe_query(message)
            
            # If we found a query and the request is not explicitly 'general', call the Spoonacular API
            if recipe_query and request_type != "general":
                # Calls an async wrapper that actually uses synchronous requests (note: blocking)
                recipes = await self._search_spoonacular_recipes(recipe_query, context)
                
                if recipes:
                    # Format a human-friendly response and return structured payload
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
            # Log unexpected errors and return a helpful general response
            self.logger.error(f"Error in recipe finder: {e}")
            return await self._general_recipe_response(message, context)
    
    def _extract_recipe_query(self, message: str) -> Optional[str]:
        """Extract recipe search query from user message
        Uses a set of regex patterns to capture likely user queries. If nothing
        matches, falls back to checking for common food keywords.
        Returns a cleaned query string or None.
        """
        # Normalize message for case-insensitive matching
        message_lower = message.lower()
        
        # Patterns to match various natural-language ways of asking for recipes
        patterns = [
            r"(?:find|search|get|show).*?recipes?.*?(?:for|with|using)\s+(.+?)(?:\?|$)",
            r"recipes?.*?(?:for|with|using)\s+(.+?)(?:\?|$)",
            r"(?:recipe|cooking).*?(.+?)(?:\?|$)",
            r"(?:cook|make)\s+(.+?)(?:\?|$)",
            r"(.+?)\s+recipes?(?:\?|$)"
        ]
        
        # Try each pattern in order and return the first meaningful capture group
        for pattern in patterns:
            match = re.search(pattern, message_lower)
            if match:
                query = match.group(1).strip()
                # Clean up common words
                query = re.sub(r'\b(the|a|an|some|of|in|with)\b', '', query).strip()
                # Only accept queries longer than 2 characters to avoid nonsense captures
                if query and len(query) > 2:
                    return query
        
        # Check if message looks like ingredients or food names
        food_keywords = ['chicken', 'beef', 'pasta', 'salmon', 'vegetarian', 'vegan', 'soup', 'salad', 'dessert']
        if any(keyword in message_lower for keyword in food_keywords):
            # Return the original message as a fallback (unmodified casing)
            return message.strip()
        #If not query is found return none
        return None
    
    async def _search_spoonacular_recipes(self, query: str, context: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Search for recipes using Spoonacular API
        
        Note: This method is declared `async` but uses the synchronous `requests`
        library which will block the event loop. Consider switching to an async
        HTTP client (aiohttp or httpx) when using this in a real async app.
        """
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
                    # Map generic preference names to Spoonacular parameter names
                    'vegetarian': 'vegetarian',
                    'vegan': 'vegan',
                    'gluten-free': 'glutenFree',
                    'dairy-free': 'dairyFree',
                    'keto': 'ketogenic',
                    'paleo': 'paleo'
                }
                
                for pref in user_profile['dietary_preferences']:
                    # If the user's preference exists in the map, add it as a boolean param
                    if pref.lower() in diet_map:
                        params[diet_map[pref.lower()]] = True
            
            # Search recipes using the complexSearch endpoint
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
                        # Short summary: clean HTML and truncate to 200 chars
                        'summary': self._clean_html(recipe.get('summary', ''))[:200] + '...',
                        # Ingredients: use human-readable "original" description
                        'ingredients': [ing.get('original', '') for ing in recipe.get('extendedIngredients', [])],
                        # Nutrition extraction delegated to helper
                        'nutrition': self._extract_nutrition(recipe.get('nutrition', {})),
                        # Instructions fetched via separate helper (note: extra HTTP call)
                        'instructions': self._get_recipe_instructions(recipe.get('id')) if recipe.get('id') else [],
                        'health_score': recipe.get('healthScore', 0),
                        'price_per_serving': recipe.get('pricePerServing', 0)
                    }
                    processed_recipes.append(processed_recipe)
                
                return processed_recipes
            else:
                # Log non-200 responses for debugging
                self.logger.warning(f"Spoonacular API error: {response.status_code}")
                
        except Exception as e:
            # Catch and log network or parsing errors
            self.logger.error(f"Error calling Spoonacular API: {e}")
        
        # On failure return empty list to indicate no results
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
        """Handle general recipe questions with AI and personalized user context"""
        
        if not message:
            message = "Tell me about recipe finding and what you can help me with"
        
        # Get user profile for personalized responses
        user_profile = await self._get_user_profile(context.get("user_id"))
        
        # Check for specific recipe types
        message_lower = message.lower()
        is_recipe_request = any(word in message_lower for word in 
                               ['recipe', 'cook', 'meal', 'ingredient', 'dish', 'food'])
        
        # Create personalized prompt based on user profile
        user_context = ""
        greeting = "👋 Hi there! "
        
        if user_profile:
            user_context = f"""
            User Profile Context:
            - Name: {user_profile.get('name', 'User')}
            - Health Goals: {', '.join(user_profile.get('health_goals', [])) if user_profile.get('health_goals') else 'Not set'}
            - Dietary Preferences: {', '.join(user_profile.get('dietary_preferences', [])) if user_profile.get('dietary_preferences') else 'None specified'}
            - Activity Level: {user_profile.get('activity_level', 'Not set')}
            - Allergies: {', '.join(user_profile.get('allergies', [])) if user_profile.get('allergies') else 'None'}
            
            """
            greeting = f"👋 Hi {user_profile.get('name', 'there')}! "
        
        if is_recipe_request:
            prompt = f"""
            {user_context}
            You are a culinary expert and recipe specialist helping this user. Handle this request: {message}
            
            Start your response with: "{greeting}"
            
            Consider their personal profile when giving advice. Provide helpful advice about:
            - Recipe suggestions tailored to their dietary preferences and goals
            - Ingredient substitutions respecting their allergies and restrictions
            - Meal planning appropriate for their activity level and health goals
            - Cooking techniques and methods suitable for their lifestyle
            - Dietary accommodations for their specific needs
            - Nutritional considerations aligned with their health goals
            
            Be practical, encouraging, and include specific recommendations when possible.
            Use emojis to make it engaging. Reference their preferences when relevant.
            If they haven't set dietary preferences, encourage them to update their profile.
            """
        else:
            prompt = f"""
            {user_context}
            You are a recipe and cooking expert helping this user. Answer their question: {message}
            
            Start your response with: "{greeting}"
            
            Consider their profile when giving advice. Focus on:
            - Recipe discovery and meal planning suited to their preferences
            - Cooking techniques and tips appropriate for their lifestyle  
            - Ingredient knowledge respecting their allergies and restrictions
            - Dietary preferences and health goal alignment
            - Nutritional cooking advice for their specific needs
            
            Keep responses helpful and practical. Use emojis to make it engaging.
            Be personal and reference their goals/preferences when relevant.
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
            fallback_greeting = f"Hi {user_profile.get('name', 'there')}! " if user_profile and user_profile.get('name') else "Hi there! "
            return {
                "agent": self.name,
                "response": f"{fallback_greeting}I can help you find recipes and cooking advice! Try asking about specific dishes, ingredients, or meal planning. 🍳",
                "status": "success"
            }
    
    async def _get_user_profile(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user profile information for personalized responses"""
        try:
            if not user_id:
                return None
                
            user = await User.get(user_id)
            if not user:
                return None
            
            return {
                "name": user.name,
                "health_goals": user.profile.health_goals or [],
                "dietary_preferences": user.profile.dietary_preferences or [],
                "activity_level": user.profile.activity_level,
                "age": user.profile.age,
                "weight": user.profile.weight,
                "height": user.profile.height,
                "allergies": user.profile.allergies or [],
                "gender": user.profile.gender
            }
        except Exception as e:
            self.logger.error(f"Error fetching user profile: {e}")
            return None
    
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