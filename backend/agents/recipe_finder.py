"""
Recipe Finder Agent - Finds and suggests recipes based on dietary preferences and goals
"""

import httpx
import json
from typing import Dict, Any, List, Optional
from backend.agents.base_agent import BaseAgent
from backend.utils.security import sanitize_input
from langchain.agents import Tool
from langchain.utilities import SerpAPIWrapper
import os
from dotenv import load_dotenv
import re

load_dotenv()

class RecipeFinderAgent(BaseAgent):
    """Agent specialized in finding and suggesting recipes"""
    
    def __init__(self):
        super().__init__(
            name="RecipeFinder",
            role="Recipe discovery, meal planning, and culinary guidance specialist",
            model_name="gemini-2.0-flash"
        )
        
        self.capabilities = [
            "Recipe search and discovery",
            "Dietary preference filtering",
            "Meal planning suggestions",
            "Ingredient substitution",
            "Cooking time estimation",
            "Difficulty level assessment",
            "Nutritional recipe optimization",
            "Cultural cuisine exploration"
        ]
    
    async def process_request(self, request: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Process recipe-related requests"""
        validation = self.validate_request(request)
        if not validation["valid"]:
            return {"error": validation["error"], "agent": self.name}
        
        message = sanitize_input(request["message"])
        request_type = request.get("type", "general")
        
        try:
            if request_type == "find_recipes":
                return await self._find_recipes(request.get("criteria", {}), context)
            elif request_type == "recipe_suggestions":
                return await self._suggest_recipes_for_goals(request.get("goals", {}), context)
            elif request_type == "ingredient_substitute":
                return await self._suggest_ingredient_substitutes(request.get("ingredient", ""), context)
            elif request_type == "meal_plan":
                return await self._create_meal_plan(request.get("plan_criteria", {}), context)
            elif request_type == "recipe_analysis":
                return await self._analyze_recipe(request.get("recipe", {}), context)
            else:
                return await self._general_recipe_query(message, context)
                
        except Exception as e:
            self.logger.error(f"Error processing request: {e}")
            return {
                "error": "I encountered an error while searching for recipes.",
                "agent": self.name,
                "status": "error"
            }
    
    async def _find_recipes(self, criteria: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Find recipes based on specific criteria"""
        # Extract search criteria
        ingredients = criteria.get("ingredients", [])
        dietary_restrictions = criteria.get("dietary_restrictions", [])
        cuisine_type = criteria.get("cuisine_type", "")
        prep_time = criteria.get("prep_time", "")
        difficulty = criteria.get("difficulty", "")
        meal_type = criteria.get("meal_type", "")
        
        # Build search query
        search_query = self._build_recipe_search_query(criteria)
        
        # Search for recipes using web search and AI
        web_recipes = await self._search_recipes_online(search_query)
        ai_recipes = await self._generate_ai_recipes(criteria, context)
        
        # Combine and rank results
        all_recipes = self._combine_and_rank_recipes(web_recipes, ai_recipes, criteria)
        
        return {
            "agent": self.name,
            "search_criteria": criteria,
            "recipes": all_recipes[:10],  # Top 10 results
            "total_found": len(all_recipes),
            "status": "success"
        }
    
    async def _suggest_recipes_for_goals(self, goals: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Suggest recipes aligned with specific health/dietary goals"""
        goal_type = goals.get("type", "")  # weight_loss, muscle_gain, heart_healthy, etc.
        calorie_target = goals.get("calorie_target", "")
        protein_target = goals.get("protein_target", "")
        restrictions = goals.get("restrictions", [])
        
        prompt = f"""
        Suggest 5 recipes that align with these goals:
        - Goal Type: {goal_type}
        - Calorie Target: {calorie_target}
        - Protein Target: {protein_target}
        - Dietary Restrictions: {restrictions}
        - User Context: {json.dumps(context, indent=2)}
        
        For each recipe, provide:
        1. Recipe name
        2. Main ingredients (list)
        3. Estimated prep time
        4. Estimated calories per serving
        5. Why it fits the goals
        6. Brief cooking instructions
        
        Format as JSON array with these fields: name, ingredients, prep_time, calories, goal_alignment, instructions
        """
        
        response = await self.generate_response(prompt, context)
        recipes = self._parse_ai_recipe_response(response)
        
        return {
            "agent": self.name,
            "goal_based_recipes": recipes,
            "goals": goals,
            "status": "success"
        }
    
    async def _suggest_ingredient_substitutes(self, ingredient: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Suggest ingredient substitutions"""
        if not ingredient:
            return {"error": "Ingredient name is required", "agent": self.name}
        
        dietary_prefs = context.get("user_profile", {}).get("dietary_preferences", [])
        allergies = context.get("user_profile", {}).get("allergies", [])
        
        prompt = f"""
        Suggest healthy substitutes for: {ingredient}
        
        Consider these dietary preferences: {dietary_prefs}
        Avoid these allergens: {allergies}
        
        For each substitute, provide:
        1. Substitute name
        2. Substitution ratio (e.g., "1:1" or "use half amount")
        3. Nutritional benefits
        4. Taste/texture differences
        5. Best use cases
        
        Provide 3-5 good alternatives in JSON format.
        """
        
        response = await self.generate_response(prompt, context)
        substitutes = self._parse_substitute_response(response)
        
        return {
            "agent": self.name,
            "original_ingredient": ingredient,
            "substitutes": substitutes,
            "status": "success"
        }
    
    async def _create_meal_plan(self, plan_criteria: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Create a meal plan based on criteria"""
        duration = plan_criteria.get("duration", 7)  # days
        meals_per_day = plan_criteria.get("meals_per_day", 3)
        calorie_target = plan_criteria.get("daily_calories", 2000)
        dietary_prefs = plan_criteria.get("dietary_preferences", [])
        
        prompt = f"""
        Create a {duration}-day meal plan with {meals_per_day} meals per day.
        
        Requirements:
        - Daily calorie target: {calorie_target}
        - Dietary preferences: {dietary_prefs}
        - User context: {json.dumps(context, indent=2)}
        
        For each day, provide:
        - Breakfast, lunch, dinner (and snacks if >3 meals)
        - Recipe names with brief descriptions
        - Estimated calories per meal
        - Shopping list items needed
        - Prep time estimates
        
        Ensure variety and nutritional balance across the week.
        Format as JSON with days array containing meal details.
        """
        
        response = await self.generate_response(prompt, context)
        meal_plan = self._parse_meal_plan_response(response)
        
        return {
            "agent": self.name,
            "meal_plan": meal_plan,
            "criteria": plan_criteria,
            "status": "success"
        }
    
    async def _analyze_recipe(self, recipe: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze a recipe for nutrition, difficulty, and improvements"""
        recipe_name = recipe.get("name", "")
        ingredients = recipe.get("ingredients", [])
        instructions = recipe.get("instructions", "")
        
        prompt = f"""
        Analyze this recipe and provide insights:
        
        Recipe: {recipe_name}
        Ingredients: {ingredients}
        Instructions: {instructions}
        
        Provide analysis on:
        1. Estimated nutritional content
        2. Difficulty level (1-5)
        3. Estimated prep + cook time
        4. Health benefits
        5. Potential improvements or substitutions
        6. Dietary categories it fits (vegetarian, keto, etc.)
        
        Consider user context: {json.dumps(context, indent=2)}
        """
        
        analysis = await self.generate_response(prompt, context)
        
        return {
            "agent": self.name,
            "recipe_analysis": analysis,
            "recipe": recipe,
            "status": "success"
        }
    
    async def _search_recipes_online(self, query: str) -> List[Dict[str, Any]]:
        """Search for recipes online using web search"""
        try:
            # Use web search to find recipes
            # This is a simplified implementation - in production, you'd use APIs like Spoonacular
            search_results = await self._web_search_recipes(query)
            return search_results
        except Exception as e:
            self.logger.error(f"Error searching recipes online: {e}")
            return []
    
    async def _web_search_recipes(self, query: str) -> List[Dict[str, Any]]:
        """Perform web search for recipes"""
        # Simplified web search - in production, integrate with recipe APIs
        recipes = []
        
        # Mock recipe data for demonstration
        mock_recipes = [
            {
                "name": "Healthy Quinoa Bowl",
                "source": "web",
                "ingredients": ["quinoa", "vegetables", "protein"],
                "prep_time": "30 minutes",
                "calories": 450,
                "difficulty": "easy"
            },
            {
                "name": "Grilled Chicken Salad",
                "source": "web", 
                "ingredients": ["chicken breast", "mixed greens", "vinaigrette"],
                "prep_time": "25 minutes",
                "calories": 350,
                "difficulty": "easy"
            }
        ]
        
        return mock_recipes
    
    async def _generate_ai_recipes(self, criteria: Dict[str, Any], context: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate recipe suggestions using AI"""
        prompt = f"""
        Create 3 original recipe suggestions based on these criteria:
        {json.dumps(criteria, indent=2)}
        
        User context: {json.dumps(context, indent=2)}
        
        For each recipe, provide:
        - Name
        - Ingredients list
        - Step-by-step instructions
        - Prep time
        - Cook time
        - Estimated calories per serving
        - Difficulty level (easy/medium/hard)
        - Nutritional highlights
        
        Make recipes realistic, healthy, and delicious.
        Format as JSON array.
        """
        
        response = await self.generate_response(prompt, context)
        return self._parse_ai_recipe_response(response)
    
    def _build_recipe_search_query(self, criteria: Dict[str, Any]) -> str:
        """Build search query from criteria"""
        query_parts = []
        
        if criteria.get("ingredients"):
            query_parts.append(" ".join(criteria["ingredients"]))
        
        if criteria.get("cuisine_type"):
            query_parts.append(criteria["cuisine_type"])
        
        if criteria.get("meal_type"):
            query_parts.append(criteria["meal_type"])
        
        if criteria.get("dietary_restrictions"):
            query_parts.extend(criteria["dietary_restrictions"])
        
        query_parts.append("healthy recipe")
        
        return " ".join(query_parts)
    
    def _combine_and_rank_recipes(self, web_recipes: List, ai_recipes: List, criteria: Dict) -> List[Dict]:
        """Combine and rank recipes based on criteria match"""
        all_recipes = []
        
        # Add web recipes with source tag
        for recipe in web_recipes:
            recipe["source"] = "web"
            recipe["score"] = self._calculate_recipe_score(recipe, criteria)
            all_recipes.append(recipe)
        
        # Add AI recipes with source tag
        for recipe in ai_recipes:
            recipe["source"] = "ai"
            recipe["score"] = self._calculate_recipe_score(recipe, criteria)
            all_recipes.append(recipe)
        
        # Sort by score
        all_recipes.sort(key=lambda x: x.get("score", 0), reverse=True)
        
        return all_recipes
    
    def _calculate_recipe_score(self, recipe: Dict, criteria: Dict) -> float:
        """Calculate recipe relevance score"""
        score = 0.0
        
        # Ingredient matching
        recipe_ingredients = recipe.get("ingredients", [])
        criteria_ingredients = criteria.get("ingredients", [])
        
        if criteria_ingredients:
            matches = sum(1 for ing in criteria_ingredients 
                         if any(ing.lower() in recipe_ing.lower() 
                               for recipe_ing in recipe_ingredients))
            score += (matches / len(criteria_ingredients)) * 30
        
        # Dietary restrictions compliance
        dietary_restrictions = criteria.get("dietary_restrictions", [])
        if dietary_restrictions:
            # This would need more sophisticated matching logic
            score += 20  # Base score for dietary compliance
        
        # Prep time preference
        if criteria.get("prep_time") and recipe.get("prep_time"):
            # Add logic to compare prep times
            score += 10
        
        return score
    
    def _parse_ai_recipe_response(self, response: str) -> List[Dict[str, Any]]:
        """Parse AI response for recipe data"""
        try:
            # Try to extract JSON from response
            json_match = re.search(r'\[.*\]', response, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
        except Exception as e:
            self.logger.error(f"Error parsing AI recipe response: {e}")
        
        # Fallback: parse text response into structured data
        return self._parse_text_recipes(response)
    
    def _parse_text_recipes(self, text: str) -> List[Dict[str, Any]]:
        """Parse text response into recipe structure"""
        # Simplified parsing - in production, use more sophisticated NLP
        recipes = []
        
        # Split by recipe sections and extract data
        # This is a simplified implementation
        recipe_sections = text.split('\n\n')
        
        for section in recipe_sections:
            if len(section.strip()) > 50:  # Likely a recipe
                recipes.append({
                    "name": "AI Generated Recipe",
                    "description": section[:200] + "...",
                    "source": "ai_generated",
                    "ingredients": ["Various ingredients"],
                    "instructions": section,
                    "prep_time": "30 minutes",
                    "calories": 400
                })
        
        return recipes[:3]  # Return max 3 recipes
    
    def _parse_substitute_response(self, response: str) -> List[Dict[str, Any]]:
        """Parse ingredient substitute response"""
        try:
            json_match = re.search(r'\[.*\]', response, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
        except Exception:
            pass
        
        # Fallback parsing
        return [{"substitute": "Alternative ingredient", "ratio": "1:1", "notes": response[:100]}]
    
    def _parse_meal_plan_response(self, response: str) -> Dict[str, Any]:
        """Parse meal plan response"""
        try:
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
        except Exception:
            pass
        
        # Fallback
        return {
            "days": [],
            "total_recipes": 0,
            "shopping_list": [],
            "notes": response[:200]
        }
    
    async def _general_recipe_query(self, message: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Handle general recipe questions"""
        prompt = f"""
        Answer this recipe/cooking question: {message}
        
        User context: {json.dumps(context, indent=2)}
        
        Provide helpful, practical cooking advice.
        Include specific recommendations when possible.
        """
        
        response = await self.generate_response(prompt, context)
        
        return {
            "agent": self.name,
            "response": response,
            "type": "general_recipe",
            "status": "success"
        }
    
    def get_agent_description(self) -> Dict[str, Any]:
        """Get agent description and capabilities"""
        return {
            "name": self.name,
            "role": self.role,
            "capabilities": self.capabilities,
            "supported_requests": [
                "find_recipes",
                "recipe_suggestions",
                "ingredient_substitute",
                "meal_plan",
                "recipe_analysis",
                "general"
            ],
            "data_sources": ["Web Search", "AI Generation", "Recipe Databases"],
            "protocols": self.communication_protocols
        }
