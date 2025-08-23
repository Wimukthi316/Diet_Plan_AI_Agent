"""
Nutrition Calculator Agent - Analyzes food nutritional content using USDA API and AI
"""

import httpx
import json
from typing import Dict, Any, List, Optional
from backend.agents.base_agent import BaseAgent
from backend.utils.security import sanitize_input, validate_nutrition_data
import os
from dotenv import load_dotenv

load_dotenv()

class NutritionCalculatorAgent(BaseAgent):
    """Agent specialized in nutritional analysis and calculations"""
    
    def __init__(self):
        super().__init__(
            name="NutritionCalculator",
            role="Nutritional analysis, calorie counting, and nutrient breakdown specialist",
            model_name="gemini-2.0-flash"
        )
        
        self.capabilities = [
            "Food nutritional analysis",
            "Calorie calculation",
            "Nutrient breakdown",
            "Portion size estimation",
            "Nutritional goal tracking",
            "Food database search",
            "Recipe nutrition analysis"
        ]
        
        self.usda_api_key = os.getenv("USDA_API_KEY")
        self.usda_base_url = "https://api.nal.usda.gov/fdc/v1"
    
    async def process_request(self, request: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Process nutrition-related requests"""
        validation = self.validate_request(request)
        if not validation["valid"]:
            return {"error": validation["error"], "agent": self.name}
        
        message = sanitize_input(request["message"])
        request_type = request.get("type", "general")
        
        try:
            if request_type == "analyze_food":
                return await self._analyze_food_item(request.get("food_data", {}), context)
            elif request_type == "search_food":
                return await self._search_food_database(request.get("query", ""), context)
            elif request_type == "calculate_recipe":
                return await self._calculate_recipe_nutrition(request.get("recipe", {}), context)
            elif request_type == "daily_analysis":
                return await self._analyze_daily_intake(request.get("food_log", []), context)
            else:
                return await self._general_nutrition_query(message, context)
                
        except Exception as e:
            self.logger.error(f"Error processing request: {e}")
            return {
                "error": "I encountered an error while processing your nutrition request.",
                "agent": self.name,
                "status": "error"
            }
    
    async def _analyze_food_item(self, food_data: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze a specific food item's nutrition"""
        food_name = food_data.get("name", "")
        quantity = food_data.get("quantity", 100)
        unit = food_data.get("unit", "g")
        
        if not food_name:
            return {"error": "Food name is required", "agent": self.name}
        
        # Search USDA database first
        usda_data = await self._search_usda_food(food_name)
        
        if usda_data and usda_data.get("foods") and len(usda_data["foods"]) > 0:
            # Use USDA data as primary source
            nutrition_info = await self._process_usda_data(usda_data["foods"][0], quantity, unit)
            data_source = "USDA"
        else:
            # Fallback to AI estimation
            nutrition_info = await self._ai_nutrition_estimation(food_name, quantity, unit, context)
            data_source = "AI_Estimation"
        
        # Add AI insights and recommendations
        ai_insights = await self._generate_nutrition_insights(nutrition_info, context)
        
        return {
            "agent": self.name,
            "food_analysis": nutrition_info,
            "ai_insights": ai_insights,
            "data_source": data_source,
            "status": "success"
        }
    
    async def _search_food_database(self, query: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Search food database for matching items"""
        if not query:
            return {"error": "Search query is required", "agent": self.name}
        
        usda_results = await self._search_usda_food(query, limit=10)
        
        if usda_results and usda_results.get("foods"):
            foods = []
            for food in usda_results["foods"]:
                foods.append({
                    "fdc_id": food.get("fdcId"),
                    "description": food.get("description"),
                    "brand": food.get("brandOwner"),
                    "category": food.get("foodCategory"),
                    "data_type": food.get("dataType")
                })
            
            return {
                "agent": self.name,
                "search_results": foods,
                "total_results": len(foods),
                "status": "success"
            }
        else:
            # AI-powered food suggestions
            ai_suggestions = await self._ai_food_suggestions(query, context)
            return {
                "agent": self.name,
                "ai_suggestions": ai_suggestions,
                "status": "success"
            }
    
    async def _calculate_recipe_nutrition(self, recipe: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate total nutrition for a recipe"""
        ingredients = recipe.get("ingredients", [])
        servings = recipe.get("servings", 1)
        
        if not ingredients:
            return {"error": "Recipe ingredients are required", "agent": self.name}
        
        total_nutrition = {
            "calories": 0,
            "protein": 0,
            "carbs": 0,
            "fat": 0,
            "fiber": 0,
            "sugar": 0,
            "sodium": 0
        }
        
        ingredient_breakdown = []
        
        for ingredient in ingredients:
            ingredient_nutrition = await self._analyze_food_item(ingredient, context)
            if ingredient_nutrition.get("food_analysis"):
                nutrition = ingredient_nutrition["food_analysis"]
                ingredient_breakdown.append({
                    "ingredient": ingredient.get("name"),
                    "nutrition": nutrition
                })
                
                # Add to totals
                for nutrient in total_nutrition:
                    total_nutrition[nutrient] += nutrition.get(nutrient, 0)
        
        # Calculate per serving
        per_serving = {k: v / servings for k, v in total_nutrition.items()}
        
        # Generate AI insights for the recipe
        recipe_insights = await self._generate_recipe_insights(total_nutrition, per_serving, context)
        
        return {
            "agent": self.name,
            "recipe_nutrition": {
                "total": total_nutrition,
                "per_serving": per_serving,
                "servings": servings,
                "ingredient_breakdown": ingredient_breakdown
            },
            "ai_insights": recipe_insights,
            "status": "success"
        }
    
    async def _analyze_daily_intake(self, food_log: List[Dict], context: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze daily food intake"""
        daily_totals = {
            "calories": 0,
            "protein": 0,
            "carbs": 0,
            "fat": 0,
            "fiber": 0,
            "sugar": 0,
            "sodium": 0
        }
        
        meal_breakdown = {}
        
        for entry in food_log:
            meal_type = entry.get("meal_type", "unknown")
            if meal_type not in meal_breakdown:
                meal_breakdown[meal_type] = {"calories": 0, "items": []}
            
            # Analyze each food item
            food_analysis = await self._analyze_food_item(entry, context)
            if food_analysis.get("food_analysis"):
                nutrition = food_analysis["food_analysis"]
                
                # Add to daily totals
                for nutrient in daily_totals:
                    daily_totals[nutrient] += nutrition.get(nutrient, 0)
                
                # Add to meal breakdown
                meal_breakdown[meal_type]["calories"] += nutrition.get("calories", 0)
                meal_breakdown[meal_type]["items"].append({
                    "food": entry.get("name"),
                    "calories": nutrition.get("calories", 0)
                })
        
        # Generate daily insights
        daily_insights = await self._generate_daily_insights(daily_totals, meal_breakdown, context)
        
        return {
            "agent": self.name,
            "daily_analysis": {
                "totals": daily_totals,
                "meal_breakdown": meal_breakdown,
                "insights": daily_insights
            },
            "status": "success"
        }
    
    async def _search_usda_food(self, query: str, limit: int = 5) -> Optional[Dict]:
        """Search USDA FoodData Central API"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.usda_base_url}/foods/search",
                    params={
                        "query": query,
                        "pageSize": limit,
                        "api_key": self.usda_api_key
                    }
                )
                
                if response.status_code == 200:
                    return response.json()
                else:
                    self.logger.warning(f"USDA API error: {response.status_code}")
                    return None
                    
        except Exception as e:
            self.logger.error(f"Error searching USDA database: {e}")
            return None
    
    async def _process_usda_data(self, food_data: Dict, quantity: float, unit: str) -> Dict[str, Any]:
        """Process USDA food data into standardized format"""
        nutrients = {}
        
        # Extract nutrients from USDA data
        food_nutrients = food_data.get("foodNutrients", [])
        
        # Map USDA nutrient IDs to our standard names
        nutrient_mapping = {
            1008: "calories",  # Energy
            1003: "protein",   # Protein
            1005: "carbs",     # Carbohydrates
            1004: "fat",       # Total lipid (fat)
            1079: "fiber",     # Fiber, total dietary
            2000: "sugar",     # Sugars, total
            1093: "sodium"     # Sodium
        }
        
        for nutrient in food_nutrients:
            nutrient_id = nutrient.get("nutrientId")
            if nutrient_id in nutrient_mapping:
                value = nutrient.get("value", 0)
                # Convert to per-quantity value (USDA data is per 100g)
                adjusted_value = (value * quantity) / 100 if unit == "g" else value
                nutrients[nutrient_mapping[nutrient_id]] = round(adjusted_value, 2)
        
        # Fill in missing nutrients with 0
        for standard_nutrient in ["calories", "protein", "carbs", "fat", "fiber", "sugar", "sodium"]:
            if standard_nutrient not in nutrients:
                nutrients[standard_nutrient] = 0
        
        return {
            "food_name": food_data.get("description", "Unknown"),
            "quantity": quantity,
            "unit": unit,
            "fdc_id": food_data.get("fdcId"),
            **nutrients
        }
    
    async def _ai_nutrition_estimation(self, food_name: str, quantity: float, unit: str, context: Dict) -> Dict[str, Any]:
        """Use AI to estimate nutrition when USDA data is unavailable"""
        
        # Provide known nutrition data for common foods
        common_foods_nutrition = {
            'egg': {'calories': 70, 'protein': 6, 'carbs': 0.6, 'fat': 5, 'fiber': 0, 'sugar': 0.6, 'sodium': 65},
            'banana': {'calories': 89, 'protein': 1.1, 'carbs': 23, 'fat': 0.3, 'fiber': 2.6, 'sugar': 12, 'sodium': 1},
            'apple': {'calories': 52, 'protein': 0.3, 'carbs': 14, 'fat': 0.2, 'fiber': 2.4, 'sugar': 10, 'sodium': 1},
            'chicken': {'calories': 165, 'protein': 31, 'carbs': 0, 'fat': 3.6, 'fiber': 0, 'sugar': 0, 'sodium': 74},
            'rice': {'calories': 130, 'protein': 2.7, 'carbs': 28, 'fat': 0.3, 'fiber': 0.4, 'sugar': 0.1, 'sodium': 1},
            'bread': {'calories': 265, 'protein': 9, 'carbs': 49, 'fat': 3.2, 'fiber': 2.7, 'sugar': 5, 'sodium': 491},
            'milk': {'calories': 42, 'protein': 3.4, 'carbs': 5, 'fat': 1, 'fiber': 0, 'sugar': 5, 'sodium': 44}
        }
        
        # Check if we have predefined data for this food
        if food_name.lower() in common_foods_nutrition:
            base_nutrition = common_foods_nutrition[food_name.lower()]
            
            # Scale based on quantity (base values are per 100g or per piece for eggs)
            scale_factor = quantity / 100 if unit == 'g' else quantity
            if food_name.lower() == 'egg' and unit == 'g':
                scale_factor = quantity / 50  # One egg is about 50g
            
            scaled_nutrition = {k: round(v * scale_factor, 1) for k, v in base_nutrition.items()}
            
            return {
                "food_name": food_name,
                "quantity": quantity,
                "unit": unit,
                "source": "database",
                **scaled_nutrition
            }
        
        # If not in our database, use AI
        prompt = f"""
        Estimate the nutritional content for {quantity} {unit} of {food_name}.
        
        Please provide values for:
        - Calories
        - Protein (g)
        - Carbohydrates (g)
        - Fat (g)
        - Fiber (g)
        - Sugar (g)
        - Sodium (mg)
        
        Respond in JSON format with these exact keys: calories, protein, carbs, fat, fiber, sugar, sodium.
        Base your estimates on standard nutritional databases and be as accurate as possible.
        """
        
        try:
            response = await self.generate_response(prompt, context)
            # Try to parse JSON from response
            import re
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if json_match:
                nutrition_data = json.loads(json_match.group())
                return {
                    "food_name": food_name,
                    "quantity": quantity,
                    "unit": unit,
                    "source": "AI_estimation",
                    **nutrition_data
                }
        except Exception as e:
            self.logger.error(f"Error in AI nutrition estimation: {e}")
        
        # Fallback default values
        return {
            "food_name": food_name,
            "quantity": quantity,
            "unit": unit,
            "calories": 100,
            "protein": 5,
            "carbs": 15,
            "fat": 3,
            "fiber": 2,
            "sugar": 5,
            "sodium": 50,
            "source": "default"
        }
    
    async def _generate_nutrition_insights(self, nutrition_info: Dict, context: Dict) -> str:
        """Generate AI insights about nutrition"""
        prompt = f"""
        Analyze this nutritional information and provide helpful insights:
        {json.dumps(nutrition_info, indent=2)}
        
        Consider the user's context: {json.dumps(context, indent=2)}
        
        Provide insights about:
        1. Nutritional quality
        2. Health implications
        3. Recommendations for improvement
        4. How it fits into daily nutritional goals
        
        Keep it concise and actionable.
        """
        
        return await self.generate_response(prompt, context)
    
    def _extract_food_from_message(self, message: str) -> Optional[str]:
        """Extract food name from user message"""
        import re
        
        # Common food items with variations
        food_patterns = {
            r'banana[s]?': 'banana',
            r'apple[s]?': 'apple',
            r'chicken': 'chicken',
            r'rice': 'rice',
            r'bread': 'bread',
            r'egg[s]?': 'egg',
            r'milk': 'milk',
            r'cheese': 'cheese',
            r'salmon': 'salmon',
            r'spinach': 'spinach',
            r'beef': 'beef',
            r'pork': 'pork',
            r'turkey': 'turkey',
            r'tuna': 'tuna',
            r'broccoli': 'broccoli',
            r'carrot[s]?': 'carrot',
            r'potato[es]?': 'potato',
            r'tomato[es]?': 'tomato',
            r'orange[s]?': 'orange',
            r'strawberr(?:y|ies)': 'strawberry',
            r'blueberr(?:y|ies)': 'blueberry',
            r'yogurt': 'yogurt',
            r'oat[s]?': 'oats',
            r'quinoa': 'quinoa',
            r'pasta': 'pasta',
            r'nuts?': 'nuts',
            r'almond[s]?': 'almond',
            r'avocado[s]?': 'avocado'
        }
        
        message_lower = message.lower()
        
        for pattern, food_name in food_patterns.items():
            if re.search(pattern, message_lower):
                return food_name
        
        # If no specific food found, try to extract using AI
        return self._ai_extract_food_name(message)
    
    def _extract_quantity_from_message(self, message: str, food_name: str) -> tuple:
        """Extract quantity and unit from message"""
        import re
        
        # Look for numbers in the message
        number_patterns = [
            r'(\d+)\s*(?:pieces?|items?|units?)',
            r'(\d+)\s*(?:cups?)',
            r'(\d+)\s*(?:tablespoons?|tbsp)',
            r'(\d+)\s*(?:teaspoons?|tsp)',
            r'(\d+)\s*(?:grams?|g)',
            r'(\d+)\s*(?:ounces?|oz)',
            r'(\d+)\s*(?:pounds?|lbs?)',
            r'(\d+)',  # Just a number
        ]
        
        message_lower = message.lower()
        
        # Handle specific cases
        if 'two' in message_lower or '2' in message:
            if food_name == 'egg':
                return 100, 'g'  # 2 large eggs ≈ 100g
            return 2, 'pieces'
        
        if 'one' in message_lower or '1' in message:
            if food_name == 'egg':
                return 50, 'g'  # 1 large egg ≈ 50g
            return 1, 'piece'
        
        # Look for explicit quantities
        for pattern in number_patterns:
            match = re.search(pattern, message_lower)
            if match:
                quantity = int(match.group(1))
                if 'cup' in pattern:
                    return quantity * 240, 'g'  # 1 cup ≈ 240g
                elif 'tablespoon' in pattern or 'tbsp' in pattern:
                    return quantity * 15, 'g'   # 1 tbsp ≈ 15g
                elif 'teaspoon' in pattern or 'tsp' in pattern:
                    return quantity * 5, 'g'    # 1 tsp ≈ 5g
                elif 'gram' in pattern or 'g' == pattern.split()[-1]:
                    return quantity, 'g'
                elif 'ounce' in pattern or 'oz' in pattern:
                    return quantity * 28.35, 'g'  # 1 oz ≈ 28.35g
                elif 'pound' in pattern or 'lb' in pattern:
                    return quantity * 453.6, 'g'  # 1 lb ≈ 453.6g
                else:
                    # Default for pieces
                    if food_name == 'egg':
                        return quantity * 50, 'g'  # Each egg ≈ 50g
                    elif food_name in ['banana', 'apple', 'orange']:
                        return quantity * 150, 'g'  # Medium fruit ≈ 150g
                    else:
                        return quantity * 100, 'g'  # Default serving
        
        # Default fallback
        return 100, 'g'
    
    def _ai_extract_food_name(self, message: str) -> Optional[str]:
        """Use AI to extract food name when pattern matching fails"""
        try:
            # Simple extraction - look for food-related words
            words = message.lower().split()
            
            # Skip common words
            skip_words = {'the', 'a', 'an', 'in', 'of', 'analyze', 'nutrition', 'calculate', 'calories', 'nutrients'}
            
            for word in words:
                word = word.strip('.,!?')
                if word not in skip_words and len(word) > 2:
                    # This is likely a food name
                    return word
            
            return None
            
        except Exception:
            return None
    
    async def _generate_daily_insights(self, daily_totals: Dict, meal_breakdown: Dict, context: Dict) -> str:
        """Generate insights for daily intake analysis"""
        prompt = f"""
        Analyze this daily nutrition intake and provide insights:
        
        Daily Totals: {json.dumps(daily_totals, indent=2)}
        Meal Breakdown: {json.dumps(meal_breakdown, indent=2)}
        User Context: {json.dumps(context, indent=2)}
        
        Provide insights about:
        1. Overall nutrition quality
        2. Macronutrient balance
        3. Meal distribution
        4. Areas for improvement
        5. Recommendations for tomorrow
        
        Be encouraging and provide actionable advice.
        """
        
        return await self.generate_response(prompt, context)
    
    async def _general_nutrition_query(self, message: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Handle general nutrition questions"""
        
        # Check if this is a simple food analysis request
        if any(keyword in message.lower() for keyword in ["analyze", "nutrition", "calories", "nutrients", "calculate"]):
            # Extract food name from the message using improved logic
            detected_food = self._extract_food_from_message(message)
            
            if detected_food:
                # Handle quantity extraction
                quantity, unit = self._extract_quantity_from_message(message, detected_food)
                
                # Perform detailed food analysis
                food_analysis = await self._analyze_food_item({
                    "name": detected_food,
                    "quantity": quantity,
                    "unit": unit
                }, context)
                
                if food_analysis.get("food_analysis"):
                    nutrition = food_analysis["food_analysis"]
                    
                    # Format the response nicely
                    response = f"**Nutrition Analysis for {quantity} {unit} of {nutrition['food_name']}:**\n\n"
                    response += f"🔥 **Calories:** {nutrition.get('calories', 0)} kcal\n"
                    response += f"🥩 **Protein:** {nutrition.get('protein', 0)}g\n"
                    response += f"🍞 **Carbohydrates:** {nutrition.get('carbs', 0)}g\n"
                    response += f"🧈 **Fat:** {nutrition.get('fat', 0)}g\n"
                    response += f"🌾 **Fiber:** {nutrition.get('fiber', 0)}g\n"
                    response += f"🍯 **Sugar:** {nutrition.get('sugar', 0)}g\n"
                    response += f"🧂 **Sodium:** {nutrition.get('sodium', 0)}mg\n\n"
                    
                    # Add AI insights
                    insights_prompt = f"""
                    Provide brief health insights about {detected_food} based on this nutrition data:
                    {json.dumps(nutrition, indent=2)}
                    
                    Include:
                    1. Key nutritional benefits
                    2. Health considerations
                    3. Best ways to consume it
                    
                    Keep it concise and positive.
                    """
                    
                    insights = await self.generate_response(insights_prompt, context)
                    response += f"**Health Insights:**\n{insights}"
                    
                    return {
                        "agent": self.name,
                        "response": response,
                        "food_analysis": nutrition,
                        "type": "food_analysis",
                        "status": "success"
                    }
        
        # Default general nutrition response
        prompt = f"""
        Answer this nutrition question: {message}
        
        User context: {json.dumps(context, indent=2)}
        
        Provide accurate, science-based information that's helpful and easy to understand.
        Use emojis and formatting to make the response engaging.
        If analyzing food, provide specific nutritional values when possible.
        """
        
        response = await self.generate_response(prompt, context)
        
        return {
            "agent": self.name,
            "response": response,
            "type": "general_nutrition",
            "status": "success"
        }
    
    def get_agent_description(self) -> Dict[str, Any]:
        """Get agent description and capabilities"""
        return {
            "name": self.name,
            "role": self.role,
            "capabilities": self.capabilities,
            "supported_requests": [
                "analyze_food",
                "search_food", 
                "calculate_recipe",
                "daily_analysis",
                "general"
            ],
            "data_sources": ["USDA FoodData Central", "AI Estimation"],
            "protocols": self.communication_protocols
        }
