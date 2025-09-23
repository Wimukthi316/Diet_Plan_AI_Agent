"""
Nutrition Calculator Agent - Using Nutritionix API for comprehensive food data
"""
import os
import requests
from typing import Dict, Any, Optional
from backend.agents.base_agent import BaseAgent
import re

class NutritionCalculatorAgent(BaseAgent):
    """Agent specialized in nutritional analysis using Nutritionix API"""
    
    def __init__(self):
        super().__init__(
            name="NutritionCalculator",
            role="Nutritional analysis, calorie counting, and nutrient breakdown specialist",
            model_name="gemini-2.0-flash"
        )
        
        self.capabilities = [
            "Food nutritional analysis via Nutritionix API",
            "Calorie calculation", 
            "Comprehensive nutrient breakdown",
            "Portion size estimation",
            "Brand-specific food data"
        ]
        
        # Nutritionix API configuration
        self.nutritionix_app_id = os.getenv("NUTRITIONIX_APP_ID")
        self.nutritionix_api_key = os.getenv("NUTRITIONIX_API_KEY")
        self.nutritionix_url = "https://trackapi.nutritionix.com/v2/natural/nutrients"
        
        self.headers = {
            'x-app-id': self.nutritionix_app_id,
            'x-app-key': self.nutritionix_api_key,
            'Content-Type': 'application/json'
        }
    
    async def process_request(self, request: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Process nutrition analysis requests"""
        try:
            message = request.get("message", "").strip()
            
            if not message:
                return await self._general_nutrition_response("", context)
            
            # Extract food query from message
            food_query = self._extract_food_query(message)
            
            if food_query:
                # Get nutrition data from Nutritionix API
                nutrition_data = await self._get_nutritionix_data(food_query)
                
                if nutrition_data:
                    response = self._format_nutrition_response(nutrition_data)
                    return {
                        "agent": self.name,
                        "response": response,
                        "food_analysis": nutrition_data,
                        "status": "success"
                    }
                else:
                    # Fallback to AI response if API fails
                    return await self._general_nutrition_response(message, context)
            else:
                return await self._general_nutrition_response(message, context)
                
        except Exception as e:
            self.logger.error(f"Error in nutrition calculator: {e}")
            return await self._general_nutrition_response(message, context)
    
    def _extract_food_query(self, message: str) -> Optional[str]:
        """Extract food query from user message"""
        message_lower = message.lower()
        
        # Check for multi-food queries (contains "and" or commas)
        if ('and' in message_lower or ',' in message) and any(word in message_lower for word in 
                                                             ['had', 'ate', 'consumed', 'calculate', 'total']):
            # This is a multi-food query, let AI handle it
            return None
        
        # Common patterns for single food queries
        patterns = [
            r"analyze.*?(?:nutrition|nutrients).*?(?:in|of)\s+(.+?)(?:\?|$)",
            r"(?:nutrition|nutrients|calories).*?(?:in|of)\s+(.+?)(?:\?|$)",
            r"what.*?(?:nutrition|nutrients|calories).*?(.+?)(?:\?|$)",
            r"(?:analyze|calculate|tell me about)\s+(.+?)(?:\?|$)",
            r"(.+?)(?:\s+nutrition|\s+nutrients|\s+calories)(?:\?|$)",
        ]
        
        for pattern in patterns:
            match = re.search(pattern, message_lower)
            if match:
                food_query = match.group(1).strip()
                # Clean up common words
                food_query = re.sub(r'\b(the|a|an|some|of|in)\b', '', food_query).strip()
                if food_query and len(food_query) > 2:
                    return food_query
        
        # If no pattern matches, check if message looks like a simple food name
        if len(message.split()) <= 4 and not any(word in message_lower for word in 
                                                ['how', 'what', 'why', 'when', 'where', 'help']):
            return message.strip()
        
        return None
    
    async def _get_nutritionix_data(self, food_query: str) -> Optional[Dict[str, Any]]:
        """Get nutrition data from Nutritionix API"""
        try:
            payload = {
                "query": food_query,
                "timezone": "US/Eastern"
            }
            
            response = requests.post(
                self.nutritionix_url,
                headers=self.headers,
                json=payload,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                foods = data.get('foods', [])
                
                if foods:
                    food = foods[0]  # Get first result
                    
                    # Extract key nutrition data
                    nutrition_data = {
                        'food_name': food.get('food_name', food_query),
                        'brand_name': food.get('brand_name'),
                        'serving_qty': food.get('serving_qty', 1),
                        'serving_unit': food.get('serving_unit', 'serving'),
                        'serving_weight_grams': food.get('serving_weight_grams', 0),
                        'calories': food.get('nf_calories', 0),
                        'protein': food.get('nf_protein', 0),
                        'carbs': food.get('nf_total_carbohydrate', 0),
                        'fat': food.get('nf_total_fat', 0),
                        'fiber': food.get('nf_dietary_fiber', 0),
                        'sugar': food.get('nf_sugars', 0),
                        'sodium': food.get('nf_sodium', 0),
                        'cholesterol': food.get('nf_cholesterol', 0),
                        'saturated_fat': food.get('nf_saturated_fat', 0),
                        'photo_url': food.get('photo', {}).get('thumb') if food.get('photo') else None
                    }
                    
                    return nutrition_data
                    
            else:
                self.logger.warning(f"Nutritionix API error: {response.status_code}")
                
        except Exception as e:
            self.logger.error(f"Error calling Nutritionix API: {e}")
        
        return None
    
    def _format_nutrition_response(self, nutrition_data: Dict[str, Any]) -> str:
        """Format nutrition data into readable response"""
        food_name = nutrition_data['food_name']
        serving = f"{nutrition_data['serving_qty']} {nutrition_data['serving_unit']}"
        
        response = f"**🍎 Nutrition Analysis: {food_name.title()}**\n\n"
        
        if nutrition_data.get('brand_name'):
            response += f"**Brand:** {nutrition_data['brand_name']}\n"
        
        response += f"**Serving Size:** {serving}"
        
        if nutrition_data.get('serving_weight_grams'):
            response += f" ({nutrition_data['serving_weight_grams']:.0f}g)"
        
        response += "\n\n**📊 Nutrition Facts:**\n"
        response += f"🔥 **Calories:** {nutrition_data['calories']:.0f} kcal\n"
        response += f"🥩 **Protein:** {nutrition_data['protein']:.1f}g\n"
        response += f"🍞 **Carbohydrates:** {nutrition_data['carbs']:.1f}g\n"
        response += f"🧈 **Fat:** {nutrition_data['fat']:.1f}g\n"
        
        if nutrition_data['fiber'] > 0:
            response += f"🌾 **Fiber:** {nutrition_data['fiber']:.1f}g\n"
        
        if nutrition_data['sugar'] > 0:
            response += f"🍯 **Sugar:** {nutrition_data['sugar']:.1f}g\n"
        
        if nutrition_data['sodium'] > 0:
            response += f"🧂 **Sodium:** {nutrition_data['sodium']:.0f}mg\n"
        
        # Add health insights
        response += "\n**💡 Health Insights:**\n"
        
        # Calorie density
        weight = nutrition_data.get('serving_weight_grams', 100)
        if weight > 0:
            cal_density = nutrition_data['calories'] / weight * 100
            if cal_density < 150:
                response += "• Low calorie density - great for weight management\n"
            elif cal_density > 400:
                response += "• High calorie density - enjoy in moderation\n"
        
        # Protein content
        protein_pct = (nutrition_data['protein'] * 4 / max(nutrition_data['calories'], 1)) * 100
        if protein_pct > 20:
            response += "• High protein content - excellent for muscle building\n"
        elif protein_pct < 5:
            response += "• Low protein content - consider pairing with protein sources\n"
        
        # Fiber content
        if nutrition_data['fiber'] >= 3:
            response += "• Good source of fiber - supports digestive health\n"
        
        # Sodium warning
        if nutrition_data['sodium'] > 400:
            response += "• High sodium content - monitor if watching salt intake\n"
        
        response += f"\n*Data provided by Nutritionix API*"
        
        return response
    
    async def _general_nutrition_response(self, message: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Handle general nutrition questions with AI"""
        
        if not message:
            message = "Tell me about nutrition analysis and what you can help me with"
        
        # Check if this is a multi-food calculation request
        message_lower = message.lower()
        is_multi_food = ('and' in message_lower or ',' in message) and any(word in message_lower for word in 
                                                                           ['had', 'ate', 'consumed', 'calculate', 'total'])
        
        if is_multi_food:
            prompt = f"""
            You are a nutrition expert and calculator. The user is asking about multiple foods they consumed.
            
            User's question: {message}
            
            Please:
            1. Identify each food item and its quantity mentioned
            2. Calculate nutrition for each item (calories, protein, carbs, fat)
            3. Provide a clear breakdown for each food
            4. Calculate and show the total nutrition summary
            5. Use this format:
            
            **🍽️ Multi-Food Nutrition Analysis**
            
            **Individual Items:**
            • [Food 1] → [calories] kcal, [protein]g protein, [carbs]g carbs, [fat]g fat
            • [Food 2] → [calories] kcal, [protein]g protein, [carbs]g carbs, [fat]g fat
            
            **📊 Total Summary:**
            🔥 **Total Calories:** [total] kcal
            🥩 **Total Protein:** [total]g
            🍞 **Total Carbs:** [total]g  
            🧈 **Total Fat:** [total]g
            
            Use accurate nutrition data for common foods. Be precise with calculations.
            """
        else:
            prompt = f"""
            You are a nutrition expert. Answer this question: {message}
            
            Focus on:
            - Accurate, science-based nutrition information
            - Practical advice for healthy eating
            - Food analysis and recommendations
            - Calorie and nutrient information
            
            Keep responses informative but concise. Use emojis to make it engaging.
            """
        
        try:
            response = await self.generate_response(prompt, context)
            
            return {
                "agent": self.name,
                "response": response,
                "type": "multi_food_calculation" if is_multi_food else "general_nutrition",
                "status": "success"
            }
        except Exception as e:
            self.logger.error(f"Error generating AI response: {e}")
            return {
                "agent": self.name,
                "response": "I can help you analyze the nutrition content of foods! Try asking about specific foods like 'analyze nutrition in banana' or 'calories in chicken breast'.",
                "status": "success"
            }
    
    def get_agent_description(self) -> Dict[str, Any]:
        """Get agent description and capabilities"""
        return {
            "name": self.name,
            "role": self.role,
            "capabilities": self.capabilities,
            "protocols": self.communication_protocols,
            "data_sources": ["Nutritionix API", "Google Gemini AI"]
        }