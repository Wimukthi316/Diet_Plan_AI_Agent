"""
Nutrition Calculator Agent - Simple and reliable food nutrition analysis
"""

import json
import re
from typing import Dict, Any, Optional, Tuple
from backend.agents.base_agent import BaseAgent
import logging

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
            "Portion size estimation"
        ]
        
        # Comprehensive nutrition database for common foods (per 100g unless specified)
        self.nutrition_db = {
            # Proteins
            'egg': {'calories': 155, 'protein': 13, 'carbs': 1.1, 'fat': 11, 'fiber': 0, 'sugar': 1.1, 'sodium': 124, 'unit_weight': 50},  # per egg
            'chicken': {'calories': 165, 'protein': 31, 'carbs': 0, 'fat': 3.6, 'fiber': 0, 'sugar': 0, 'sodium': 74},
            'beef': {'calories': 250, 'protein': 26, 'carbs': 0, 'fat': 15, 'fiber': 0, 'sugar': 0, 'sodium': 72},
            'salmon': {'calories': 208, 'protein': 20, 'carbs': 0, 'fat': 12, 'fiber': 0, 'sugar': 0, 'sodium': 59},
            'tuna': {'calories': 144, 'protein': 23, 'carbs': 0, 'fat': 5, 'fiber': 0, 'sugar': 0, 'sodium': 39},
            'turkey': {'calories': 135, 'protein': 30, 'carbs': 0, 'fat': 1, 'fiber': 0, 'sugar': 0, 'sodium': 1060},
            
            # Fruits
            'banana': {'calories': 89, 'protein': 1.1, 'carbs': 23, 'fat': 0.3, 'fiber': 2.6, 'sugar': 12, 'sodium': 1, 'unit_weight': 120},  # per banana
            'apple': {'calories': 52, 'protein': 0.3, 'carbs': 14, 'fat': 0.2, 'fiber': 2.4, 'sugar': 10, 'sodium': 1, 'unit_weight': 180},  # per apple
            'orange': {'calories': 47, 'protein': 0.9, 'carbs': 12, 'fat': 0.1, 'fiber': 2.4, 'sugar': 9, 'sodium': 0, 'unit_weight': 150},  # per orange
            'strawberry': {'calories': 32, 'protein': 0.7, 'carbs': 8, 'fat': 0.3, 'fiber': 2, 'sugar': 4.9, 'sodium': 1},
            'blueberry': {'calories': 57, 'protein': 0.7, 'carbs': 14, 'fat': 0.3, 'fiber': 2.4, 'sugar': 10, 'sodium': 1},
            'avocado': {'calories': 160, 'protein': 2, 'carbs': 9, 'fat': 15, 'fiber': 7, 'sugar': 0.7, 'sodium': 7},
            
            # Vegetables
            'broccoli': {'calories': 34, 'protein': 2.8, 'carbs': 7, 'fat': 0.4, 'fiber': 2.6, 'sugar': 1.5, 'sodium': 33},
            'spinach': {'calories': 23, 'protein': 2.9, 'carbs': 3.6, 'fat': 0.4, 'fiber': 2.2, 'sugar': 0.4, 'sodium': 79},
            'carrot': {'calories': 41, 'protein': 0.9, 'carbs': 10, 'fat': 0.2, 'fiber': 2.8, 'sugar': 4.7, 'sodium': 69},
            'potato': {'calories': 77, 'protein': 2, 'carbs': 17, 'fat': 0.1, 'fiber': 2.2, 'sugar': 0.8, 'sodium': 6},
            'tomato': {'calories': 18, 'protein': 0.9, 'carbs': 3.9, 'fat': 0.2, 'fiber': 1.2, 'sugar': 2.6, 'sodium': 5},
            
            # Grains & Carbs
            'rice': {'calories': 130, 'protein': 2.7, 'carbs': 28, 'fat': 0.3, 'fiber': 0.4, 'sugar': 0.1, 'sodium': 1},
            'bread': {'calories': 265, 'protein': 9, 'carbs': 49, 'fat': 3.2, 'fiber': 2.7, 'sugar': 5, 'sodium': 491},
            'pasta': {'calories': 131, 'protein': 5, 'carbs': 25, 'fat': 1.1, 'fiber': 1.8, 'sugar': 0.6, 'sodium': 1},
            'oats': {'calories': 389, 'protein': 17, 'carbs': 66, 'fat': 7, 'fiber': 11, 'sugar': 1, 'sodium': 2},
            'quinoa': {'calories': 120, 'protein': 4.4, 'carbs': 22, 'fat': 1.9, 'fiber': 2.8, 'sugar': 0.9, 'sodium': 7},
            
            # Dairy
            'milk': {'calories': 42, 'protein': 3.4, 'carbs': 5, 'fat': 1, 'fiber': 0, 'sugar': 5, 'sodium': 44},
            'cheese': {'calories': 113, 'protein': 7, 'carbs': 1, 'fat': 9, 'fiber': 0, 'sugar': 1, 'sodium': 215},
            'yogurt': {'calories': 59, 'protein': 10, 'carbs': 3.6, 'fat': 0.4, 'fiber': 0, 'sugar': 3.6, 'sodium': 36},
            
            # Nuts & Seeds
            'almond': {'calories': 579, 'protein': 21, 'carbs': 22, 'fat': 50, 'fiber': 12, 'sugar': 4, 'sodium': 1},
            'nuts': {'calories': 579, 'protein': 21, 'carbs': 22, 'fat': 50, 'fiber': 12, 'sugar': 4, 'sodium': 1},  # Default to almonds
        }
    
    async def process_request(self, request: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Process nutrition-related requests"""
        try:
            message = request.get("message", "").strip()
            
            if not message:
                return {
                    "agent": self.name,
                    "response": "Please provide a food item for nutritional analysis.",
                    "status": "error"
                }
            
            # Extract food and quantity from message
            food_name, quantity, unit = self._parse_food_request(message)
            
            if not food_name:
                return await self._general_nutrition_response(message, context)
            
            # Get nutrition data
            nutrition_data = self._get_nutrition_data(food_name, quantity, unit)
            
            # Format response
            response = self._format_nutrition_response(nutrition_data)
            
            return {
                "agent": self.name,
                "response": response,
                "nutrition_data": nutrition_data,
                "status": "success"
            }
            
        except Exception as e:
            self.logger.error(f"Error in nutrition calculator: {e}")
            return {
                "agent": self.name,
                "response": "I encountered an error while analyzing the nutrition. Please try again.",
                "status": "error"
            }
    
    def _parse_food_request(self, message: str) -> Tuple[Optional[str], float, str]:
        """Parse food name, quantity, and unit from message"""
        message_lower = message.lower()
        
        # Find food name
        food_name = None
        for food in self.nutrition_db.keys():
            if food in message_lower:
                food_name = food
                break
        
        if not food_name:
            return None, 0, "g"
        
        # Extract quantity
        quantity, unit = self._extract_quantity(message_lower, food_name)
        
        return food_name, quantity, unit
    
    def _extract_quantity(self, message: str, food_name: str) -> Tuple[float, str]:
        """Extract quantity and unit from message"""
        
        # Handle text numbers
        text_numbers = {
            'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
            'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
            'a': 1, 'an': 1, 'half': 0.5, 'quarter': 0.25
        }
        
        for text_num, value in text_numbers.items():
            if text_num in message:
                if food_name in ['egg', 'banana', 'apple', 'orange'] and 'unit_weight' in self.nutrition_db[food_name]:
                    return value * self.nutrition_db[food_name]['unit_weight'], 'g'
                return value * 100, 'g'  # Default serving size
        
        # Look for numbers
        number_matches = re.findall(r'(\d+(?:\.\d+)?)\s*([a-zA-Z]*)', message)
        
        for num_str, unit_str in number_matches:
            num = float(num_str)
            
            # Handle units
            if 'gram' in unit_str or unit_str == 'g':
                return num, 'g'
            elif 'cup' in unit_str:
                return num * 240, 'g'  # 1 cup ≈ 240g
            elif 'tablespoon' in unit_str or 'tbsp' in unit_str:
                return num * 15, 'g'   # 1 tbsp ≈ 15g
            elif 'teaspoon' in unit_str or 'tsp' in unit_str:
                return num * 5, 'g'    # 1 tsp ≈ 5g
            elif 'ounce' in unit_str or 'oz' in unit_str:
                return num * 28.35, 'g'  # 1 oz ≈ 28.35g
            elif 'pound' in unit_str or 'lb' in unit_str:
                return num * 453.6, 'g'  # 1 lb ≈ 453.6g
            else:
                # Handle pieces
                if food_name in ['egg', 'banana', 'apple', 'orange'] and 'unit_weight' in self.nutrition_db[food_name]:
                    return num * self.nutrition_db[food_name]['unit_weight'], 'g'
                return num * 100, 'g'  # Default serving
        
        # Default fallback
        if food_name in ['egg', 'banana', 'apple', 'orange'] and 'unit_weight' in self.nutrition_db[food_name]:
            return self.nutrition_db[food_name]['unit_weight'], 'g'  # One unit
        return 100, 'g'  # Standard serving
    
    def _get_nutrition_data(self, food_name: str, quantity: float, unit: str) -> Dict[str, Any]:
        """Get nutrition data for specified food and quantity"""
        
        if food_name not in self.nutrition_db:
            # Use default values for unknown foods
            base_nutrition = {
                'calories': 100, 'protein': 5, 'carbs': 15, 'fat': 3,
                'fiber': 2, 'sugar': 5, 'sodium': 50
            }
        else:
            base_nutrition = self.nutrition_db[food_name].copy()
            # Remove unit_weight if it exists
            base_nutrition.pop('unit_weight', None)
        
        # Calculate scaled nutrition based on quantity
        if food_name in self.nutrition_db and 'unit_weight' in self.nutrition_db[food_name]:
            # This food has per-unit nutrition data
            if unit == 'g':
                scale_factor = quantity / self.nutrition_db[food_name]['unit_weight']
            else:
                scale_factor = quantity
        else:
            # Standard per-100g nutrition data
            scale_factor = quantity / 100 if unit == 'g' else quantity
        
        # Scale all nutrients
        scaled_nutrition = {}
        for nutrient, value in base_nutrition.items():
            scaled_nutrition[nutrient] = round(value * scale_factor, 1)
        
        return {
            'food_name': food_name.title(),
            'quantity': quantity,
            'unit': unit,
            'source': 'database',
            **scaled_nutrition
        }
    
    def _format_nutrition_response(self, nutrition_data: Dict[str, Any]) -> str:
        """Format nutrition data into a readable response"""
        
        food_name = nutrition_data['food_name']
        quantity = nutrition_data['quantity']
        unit = nutrition_data['unit']
        
        # Create header
        if unit == 'g' and quantity >= 100:
            quantity_str = f"{int(quantity)}g"
        elif unit == 'g' and quantity < 100:
            # Try to express in pieces if possible
            original_food = food_name.lower()
            if original_food in self.nutrition_db and 'unit_weight' in self.nutrition_db[original_food]:
                pieces = quantity / self.nutrition_db[original_food]['unit_weight']
                if pieces == int(pieces):
                    quantity_str = f"{int(pieces)} {food_name.lower()}{'s' if pieces > 1 else ''}"
                else:
                    quantity_str = f"{quantity}g"
            else:
                quantity_str = f"{int(quantity)}g"
        else:
            quantity_str = f"{quantity} {unit}"
        
        response = f"**🍽️ Nutrition Analysis for {quantity_str} of {food_name}:**\n\n"
        
        # Add nutrition facts
        response += f"🔥 **Calories:** {nutrition_data.get('calories', 0)} kcal\n"
        response += f"🥩 **Protein:** {nutrition_data.get('protein', 0)}g\n"
        response += f"🍞 **Carbohydrates:** {nutrition_data.get('carbs', 0)}g\n"
        response += f"🧈 **Fat:** {nutrition_data.get('fat', 0)}g\n"
        response += f"🌾 **Fiber:** {nutrition_data.get('fiber', 0)}g\n"
        response += f"🍯 **Sugar:** {nutrition_data.get('sugar', 0)}g\n"
        response += f"🧂 **Sodium:** {nutrition_data.get('sodium', 0)}mg\n\n"
        
        # Add quick health insights
        response += "**💡 Quick Insights:**\n"
        
        calories = nutrition_data.get('calories', 0)
        protein = nutrition_data.get('protein', 0)
        carbs = nutrition_data.get('carbs', 0)
        fat = nutrition_data.get('fat', 0)
        
        if calories > 0:
            if protein / calories * 4 > 0.3:  # More than 30% protein
                response += "• High in protein - great for muscle building! 💪\n"
            if carbs / calories * 4 > 0.6:  # More than 60% carbs
                response += "• Good source of energy from carbohydrates ⚡\n"
            if fat / calories * 9 > 0.3:  # More than 30% fat
                response += "• Contains healthy fats for nutrient absorption 🥑\n"
            if nutrition_data.get('fiber', 0) > 3:
                response += "• High in fiber - supports digestive health 🌱\n"
            if calories < 100:
                response += "• Low calorie option - great for weight management 📉\n"
        
        return response
    
    async def _general_nutrition_response(self, message: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Handle general nutrition questions using AI"""
        
        prompt = f"""
        Answer this nutrition question: {message}
        
        Provide accurate, science-based information that's helpful and easy to understand.
        Use emojis and formatting to make the response engaging.
        Keep the response concise but informative.
        
        If the user is asking about a specific food that you don't have data for, 
        provide general nutritional guidance and suggest they try again with a more common food name.
        """
        
        try:
            response = await self.generate_response(prompt, context)
            
            return {
                "agent": self.name,
                "response": response,
                "type": "general_nutrition",
                "status": "success"
            }
        except Exception as e:
            self.logger.error(f"Error generating AI response: {e}")
            return {
                "agent": self.name,
                "response": "I can help you analyze the nutrition of common foods like eggs, chicken, bananas, apples, rice, and more. Try asking something like 'analyze two eggs' or 'nutrition in one banana'.",
                "status": "success"
            }
    
    def get_agent_description(self) -> Dict[str, Any]:
        """Get agent description and capabilities"""
        return {
            "name": self.name,
            "role": self.role,
            "capabilities": self.capabilities,
            "supported_foods": list(self.nutrition_db.keys()),
            "protocols": self.communication_protocols
        }
