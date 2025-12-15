"""
Diet Tracker Agent - Streamlined diet tracking and progress analysis
"""
import json
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from backend.agents.base_agent import BaseAgent
from backend.models.nutrition_log import NutritionLog
from backend.models.meal import Meal
from backend.models.user import User

class DietTrackerAgent(BaseAgent):
    """Agent specialized in diet tracking, progress monitoring, and behavioral insights"""
    
    def __init__(self):
        super().__init__(
            name="DietTracker",
            role="Diet tracking, progress monitoring, and behavioral analysis specialist",
            model_name="gemini-2.5-flash"
        )
        
        self.capabilities = [
            "Daily nutrition tracking", "Progress analysis", "Goal monitoring",
            "Trend identification", "Behavioral insights", "Recommendation generation",
            "Weekly/monthly summaries"
        ]
    
    async def process_request(self, request: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Process diet tracking requests with comprehensive analysis"""
        try:
            message = request.get("message", "").strip().lower()
            user_id = context.get("user_id", "")
            
            if not message:
                return await self._provide_tracking_overview(user_id, context)
            
            # Route to appropriate analysis method
            if any(kw in message for kw in ["track", "daily", "progress", "today"]):
                return await self._analyze_progress(user_id, context, "daily")
            elif any(kw in message for kw in ["week", "weekly", "7 days"]):
                return await self._analyze_progress(user_id, context, "weekly")
            elif any(kw in message for kw in ["month", "monthly", "30 days"]):
                return await self._analyze_progress(user_id, context, "monthly")
            elif any(kw in message for kw in ["goal", "target", "objective"]):
                return await self._analyze_goals(user_id, context)
            elif any(kw in message for kw in ["trend", "pattern", "habit"]):
                return await self._analyze_trends(user_id, context)
            elif any(kw in message for kw in ["log", "add", "record"]):
                return await self._log_food_helper(message, context)
            else:
                return await self._general_tracking_response(message, user_id, context)
                
        except Exception as e:
            self.logger.error(f"Error in diet tracker: {e}")
            return {
                "agent": self.name,
                "response": "I encountered an error while analyzing your diet data. Please try again.",
                "status": "error"
            }
    
    async def _provide_tracking_overview(self, user_id: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Provide comprehensive tracking overview with personalized greeting"""
        recent_logs = await self._get_nutrition_logs(user_id, days=7)
        today_logs = await self._get_nutrition_logs(user_id, days=1)
        user_profile = await self._get_user_profile(user_id)
        
        today_totals = self._calculate_totals(today_logs)
        
        # Personalized greeting
        name = user_profile.get('name', 'there') if user_profile else 'there'
        response = f"**📊 Diet Tracking Overview for {name} - {datetime.now().strftime('%B %d, %Y')}**\n\n"
        
        if today_logs:
            response += f"**Today's Progress:**\n"
            response += f"🔥 Calories: {today_totals['calories']:.0f} kcal\n"
            response += f"🥩 Protein: {today_totals['protein']:.1f}g\n"
            response += f"📝 Meals logged: {len(today_logs)}\n\n"
        else:
            response += "**Today's Progress:**\nNo meals logged yet today. Start tracking!\n\n"
        
        if recent_logs:
            avg_calories = sum(log.calories for log in recent_logs) / max(1, len(set(log.date.date() for log in recent_logs)))
            response += f"**7-Day Average:** {avg_calories:.0f} kcal/day ({len(recent_logs)} entries)\n\n"
        
        # Generate personalized AI insights
        if recent_logs:
            user_context = ""
            if user_profile:
                goals = ', '.join(user_profile.get('health_goals', [])) if user_profile.get('health_goals') else 'Not set'
                user_context = f" (Goals: {goals})"
            
            insights = await self._generate_insights(
                f"User {name} tracking overview: {today_totals['calories']:.0f} calories today, {len(recent_logs)} entries in 7 days{user_context}",
                context, "overview"
            )
            response += f"**💡 Personalized Insights:**\n{insights}\n\n"
        
        response += "**Available Commands:**\n• 'Show daily/weekly/monthly progress'\n• 'Analyze my goals'\n• 'What are my eating patterns?'"
        
        return {
            "agent": self.name,
            "response": response,
            "tracking_data": {
                "today_calories": today_totals['calories'],
                "today_protein": today_totals['protein'],
                "meals_today": len(today_logs),
                "recent_entries": len(recent_logs)
            },
            "status": "success"
        }
    
    async def _analyze_progress(self, user_id: str, context: Dict[str, Any], period: str) -> Dict[str, Any]:
        """Unified progress analysis for daily/weekly/monthly periods"""
        days_map = {"daily": 1, "weekly": 7, "monthly": 30}
        days = days_map.get(period, 7)
        
        logs = await self._get_nutrition_logs(user_id, days=days)
        
        if not logs:
            return {
                "agent": self.name,
                "response": f"**📊 {period.title()} Progress - No Data**\n\nNo nutrition data found. Start logging your meals to see {period} trends!",
                "status": "no_data"
            }
        
        # Calculate statistics based on period
        if period == "daily":
            return await self._daily_analysis(logs, context)
        elif period == "weekly":
            return await self._weekly_analysis(logs, context)
        else:  # monthly
            return await self._monthly_analysis(logs, context)
    
    async def _daily_analysis(self, logs: List, context: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze daily progress"""
        totals = self._calculate_totals(logs)
        meal_breakdown = self._group_by_meal(logs)
        
        response = f"**📅 Daily Progress - {datetime.now().strftime('%A, %B %d')}**\n\n"
        response += f"**🍽️ Today's Intake:**\n"
        response += f"🔥 Calories: {totals['calories']:.0f} kcal\n"
        response += f"🥩 Protein: {totals['protein']:.1f}g | 🍞 Carbs: {totals['carbs']:.1f}g | 🧈 Fat: {totals['fat']:.1f}g\n\n"
        
        if meal_breakdown:
            response += f"**🍽️ Meals ({len(logs)} entries):**\n"
            for meal, meal_logs in meal_breakdown.items():
                meal_cals = sum(log.calories for log in meal_logs)
                response += f"• {meal.title()}: {meal_cals:.0f} kcal ({len(meal_logs)} items)\n"
            response += "\n"
        
        insights = await self._generate_insights(
            f"Daily nutrition: {json.dumps(totals)} with {len(logs)} entries", 
            context, "daily"
        )
        response += f"**💡 Daily Insights:**\n{insights}"
        
        return {"agent": self.name, "response": response, "daily_data": totals, "status": "success"}
    
    async def _weekly_analysis(self, logs: List, context: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze weekly progress"""
        daily_data = self._group_by_day(logs)
        total_days = len(daily_data)
        
        if total_days == 0:
            return {"agent": self.name, "response": "No weekly data available.", "status": "no_data"}
        
        weekly_avg = {
            'calories': sum(day['calories'] for day in daily_data.values()) / total_days,
            'protein': sum(day['protein'] for day in daily_data.values()) / total_days
        }
        
        response = f"**📊 Weekly Progress ({total_days} days tracked)**\n\n"
        response += f"**📈 Daily Averages:**\n"
        response += f"🔥 Calories: {weekly_avg['calories']:.0f} kcal/day\n"
        response += f"🥩 Protein: {weekly_avg['protein']:.1f}g/day\n\n"
        
        response += f"**📅 Daily Breakdown:**\n"
        for date_str, data in sorted(daily_data.items()):
            day_name = datetime.strptime(date_str, '%Y-%m-%d').strftime('%A')
            response += f"• {day_name}: {data['calories']:.0f} kcal ({data['entries']} entries)\n"
        
        insights = await self._generate_insights(
            f"Weekly data: {json.dumps(weekly_avg)} over {total_days} days",
            context, "weekly"
        )
        response += f"\n**💡 Weekly Insights:**\n{insights}"
        
        return {
            "agent": self.name, "response": response,
            "weekly_data": {"averages": weekly_avg, "tracking_consistency": f"{total_days}/7 days"},
            "status": "success"
        }
    
    async def _monthly_analysis(self, logs: List, context: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze monthly progress"""
        unique_days = len(set(log.date.date() for log in logs))
        total_entries = len(logs)
        
        if unique_days == 0:
            return {"agent": self.name, "response": "No monthly data available.", "status": "no_data"}
        
        monthly_avg = {
            'calories': sum(log.calories for log in logs) / unique_days,
            'protein': sum(log.protein for log in logs) / unique_days,
            'entries_per_day': total_entries / unique_days
        }
        
        response = f"**📊 Monthly Progress (30 days)**\n\n"
        response += f"**📈 Summary:**\n"
        response += f"📝 Total entries: {total_entries} | 📅 Days tracked: {unique_days}/30\n"
        response += f"🔥 Daily avg: {monthly_avg['calories']:.0f} kcal | 🥩 Protein: {monthly_avg['protein']:.1f}g\n\n"
        
        insights = await self._generate_insights(
            f"Monthly data: {json.dumps(monthly_avg)} over {unique_days} days",
            context, "monthly"
        )
        response += f"**💡 Monthly Insights:**\n{insights}"
        
        return {
            "agent": self.name, "response": response,
            "monthly_data": {"averages": monthly_avg, "tracking_days": f"{unique_days}/30"},
            "status": "success"
        }
    
    async def _analyze_goals(self, user_id: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze progress toward user's personal nutrition goals"""
        logs = await self._get_nutrition_logs(user_id, days=7)
        user_profile = await self._get_user_profile(user_id)
        
        # Get personalized goals based on user profile
        personalized_goals = await self._calculate_personalized_goals(user_profile)
        
        # Use personalized goals or defaults
        daily_goals = personalized_goals if personalized_goals else {'calories': 2000, 'protein': 150, 'carbs': 250, 'fat': 65}
        
        # Create personalized response header
        name = user_profile.get('name', 'User') if user_profile else 'User'
        health_goals = user_profile.get('health_goals', []) if user_profile else []
        
        if not logs:
            response = f"**🎯 Goal Analysis for {name}**\n\n"
            
            if health_goals:
                response += f"**Your Health Goals:** {', '.join(health_goals)}\n\n"
            
            response += f"**Personalized Daily Targets:**\n"
            for nutrient, goal in daily_goals.items():
                response += f"🔥 {nutrient.title()}: {goal} {'kcal' if nutrient == 'calories' else 'g'}\n"
            response += "\nStart logging your meals to track progress toward your goals!"
            
            if user_profile:
                weight = user_profile.get('weight')
                activity = user_profile.get('activity_level')
                if weight and activity:
                    response += f"\n💡 *Goals calculated based on your profile: {weight}kg, {activity} activity level*"
            
            return {"agent": self.name, "response": response, "status": "no_data"}
        
        daily_data = self._group_by_day(logs)
        avg_daily = {k: sum(day[k] for day in daily_data.values()) / len(daily_data) for k in daily_goals.keys()}
        
        response = f"**🎯 Goal Analysis for {name} (7-day average)**\n\n"
        
        if health_goals:
            response += f"**Your Health Goals:** {', '.join(health_goals)}\n\n"
        
        response += f"**Progress Toward Your Targets:**\n"
        for nutrient, goal in daily_goals.items():
            current = avg_daily[nutrient]
            percentage = (current / goal) * 100
            status = "🎯" if 90 <= percentage <= 110 else "📈" if percentage < 90 else "📉"
            response += f"{status} **{nutrient.title()}:** {current:.0f}/{goal} ({percentage:.0f}%)\n"
        
        # Add goal-specific insights
        goal_context = f"User {name} with goals: {', '.join(health_goals) if health_goals else 'general health'}"
        insights = await self._generate_insights(
            f"{goal_context}. Current progress: {json.dumps(avg_daily)} vs personalized targets {json.dumps(daily_goals)}",
            context, "goals"
        )
        response += f"\n**💡 Personalized Goal Insights:**\n{insights}"
        
        return {"agent": self.name, "response": response, "goal_data": {"targets": daily_goals, "current_averages": avg_daily, "health_goals": health_goals}, "status": "success"}
    
    async def _calculate_personalized_goals(self, user_profile: Optional[Dict[str, Any]]) -> Optional[Dict[str, float]]:
        """Calculate personalized nutrition goals based on user profile"""
        if not user_profile:
            return None
        
        age = user_profile.get('age')
        weight = user_profile.get('weight')  # kg
        height = user_profile.get('height')  # cm
        gender = user_profile.get('gender')
        activity_level = user_profile.get('activity_level')
        health_goals = user_profile.get('health_goals', [])
        
        # Need at least weight and activity level for calculation
        if not weight or not activity_level:
            return None
        
        try:
            # Calculate BMR using Mifflin-St Jeor equation
            if gender and gender.lower() == 'female':
                bmr = 10 * weight + 6.25 * (height or 165) - 5 * (age or 25) - 161
            else:  # male or unspecified
                bmr = 10 * weight + 6.25 * (height or 175) - 5 * (age or 25) + 5
            
            # Activity multipliers
            activity_multipliers = {
                'sedentary': 1.2,
                'lightly_active': 1.375,
                'moderately_active': 1.55,
                'very_active': 1.725,
                'extremely_active': 1.9
            }
            
            multiplier = activity_multipliers.get(activity_level, 1.375)
            maintenance_calories = bmr * multiplier
            
            # Adjust based on health goals
            target_calories = maintenance_calories
            if any(goal in ['weight_loss', 'lose_weight', 'fat_loss'] for goal in health_goals):
                target_calories = maintenance_calories - 500  # 500 cal deficit
            elif any(goal in ['weight_gain', 'muscle_gain', 'bulk'] for goal in health_goals):
                target_calories = maintenance_calories + 300  # 300 cal surplus
            
            # Calculate macros
            if any(goal in ['muscle_gain', 'bulk', 'strength'] for goal in health_goals):
                # Higher protein for muscle gain
                protein = weight * 2.2  # 2.2g per kg
                fat = target_calories * 0.25 / 9  # 25% of calories from fat
                carbs = (target_calories - (protein * 4) - (fat * 9)) / 4
            else:
                # Standard macro distribution
                protein = weight * 1.6  # 1.6g per kg
                fat = target_calories * 0.25 / 9  # 25% of calories from fat
                carbs = (target_calories - (protein * 4) - (fat * 9)) / 4
            
            return {
                'calories': round(target_calories),
                'protein': round(protein),
                'carbs': round(carbs),
                'fat': round(fat)
            }
            
        except Exception as e:
            self.logger.error(f"Error calculating personalized goals: {e}")
            return None
    """
        Returns agent's description, role, capabilities, and protocols.
        Useful for system introspection and documentation.
        """
    async def _analyze_trends(self, user_id: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze eating patterns and trends"""
        logs = await self._get_nutrition_logs(user_id, days=14)
        
        if not logs:
            return {"agent": self.name, "response": "**📈 Trend Analysis - Need 2+ weeks of data**", "status": "no_data"}
        
        patterns = self._identify_patterns(logs)
        
        response = f"**📈 Eating Patterns & Trends (14 days)**\n\n"
        
        if patterns['meal_distribution']:
            response += f"**🕐 Meal Patterns:**\n"
            for meal, count in patterns['meal_distribution'].items():
                response += f"• {meal.title()}: {count} entries\n"
            response += "\n"
        
        if patterns.get('week1_avg') and patterns.get('week2_avg'):
            diff = patterns['week2_avg'] - patterns['week1_avg']
            trend = "📈" if diff > 0 else "📉"
            response += f"**📅 Weekly Comparison:**\n"
            response += f"Week 1: {patterns['week1_avg']:.0f} kcal/day\n"
            response += f"Week 2: {patterns['week2_avg']:.0f} kcal/day\n"
            response += f"{trend} Change: {diff:+.0f} kcal/day\n\n"
        
        insights = await self._generate_insights(
            f"Eating patterns: {json.dumps(patterns)} over {len(logs)} entries",
            context, "trends"
        )
        response += f"**💡 Pattern Insights:**\n{insights}"
        
        return {"agent": self.name, "response": response, "trend_data": patterns, "status": "success"}
    
    async def _log_food_helper(self, message: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Help user with food logging"""
        return {
            "agent": self.name,
            "response": "**📝 Food Logging Assistant**\n\nTo log foods accurately:\n1. Ask me to *'analyze nutrition in [food]'* first\n2. Data gets automatically saved\n3. Check progress with *'track my daily progress'*\n\n**Examples:**\n• 'Analyze nutrition in banana'\n• 'Calories in chicken breast'\n• 'What's in two eggs?'\n\nTry asking about a specific food!",
            "status": "info"
        }
    
    async def _general_tracking_response(self, message: str, user_id: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Handle general tracking questions with AI and personalized user context"""
        recent_logs = await self._get_nutrition_logs(user_id, days=7)
        user_profile = await self._get_user_profile(user_id)
        
        # Create personalized prompt
        user_context = ""
        greeting = "👋 Hi there! "
        
        if user_profile:
            user_context = f"""
            User Profile Context:
            - Name: {user_profile.get('name', 'User')}
            - Health Goals: {', '.join(user_profile.get('health_goals', [])) if user_profile.get('health_goals') else 'Not set'}
            - Activity Level: {user_profile.get('activity_level', 'Not set')}
            - Weight: {user_profile.get('weight', 'Not set')} kg
            - Recent tracking: {len(recent_logs)} entries in past 7 days
            
            """
            greeting = f"👋 Hi {user_profile.get('name', 'there')}! "
        
        prompt = f"""
        {user_context}
        You are a diet tracking expert helping this user. Answer their question: {message}
        
        Start your response with: "{greeting}"
        
        Consider their personal profile when giving advice. Provide helpful, personalized advice about:
        - Diet tracking specific to their health goals
        - Nutrition monitoring aligned with their activity level
        - Progress analysis relevant to their objectives
        - Behavioral insights based on their tracking patterns
        
        Use emojis and be encouraging. Keep responses concise but informative.
        Reference their goals and progress when relevant.
        """
        
        try:
            response = await self.generate_response(prompt, context)
            return {"agent": self.name, "response": response, "type": "general_tracking", "status": "success"}
        except Exception as e:
            self.logger.error(f"Error generating AI response: {e}")
            fallback_greeting = f"Hi {user_profile.get('name', 'there')}! " if user_profile and user_profile.get('name') else "Hi there! "
            return {"agent": self.name, "response": f"{fallback_greeting}I can help you track your diet progress! Try asking about daily progress, weekly trends, or nutrition goals.", "status": "success"}
    
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
    
    # Helper methods - streamlined and consolidated
    
    async def _get_nutrition_logs(self, user_id: str, days: int = 7) -> List:
        """Get nutrition logs for specified days from both NutritionLog and Meal models"""
        try:
            from bson import ObjectId
            start_date = datetime.now() - timedelta(days=days)
            
            # Get nutrition logs (old format)
            nutrition_logs = await NutritionLog.find(
                NutritionLog.user_id == user_id,
                NutritionLog.date >= start_date
            ).sort(-NutritionLog.date).to_list()
            
            # Get meals (new format) and convert them to log-like objects
            start_date_str = start_date.strftime("%Y-%m-%d")
            meals = await Meal.find({
                "user_id": ObjectId(user_id),
                "date": {"$gte": start_date_str}
            }).to_list()
            
            # Convert Meal objects to a compatible format with NutritionLog
            converted_meals = []
            for meal in meals:
                # Create a mock NutritionLog-like object from Meal
                class MealAsLog:
                    def __init__(self, meal):
                        self.calories = meal.calories
                        self.protein = meal.protein
                        self.carbs = meal.carbs
                        self.fat = meal.fats  # Note: Meal uses 'fats' but NutritionLog uses 'fat'
                        self.fiber = meal.fiber or 0
                        self.sodium = 0  # Meal doesn't track sodium
                        self.meal_type = meal.meal_type
                        # Convert date string to datetime for consistency
                        try:
                            self.date = datetime.strptime(meal.date, "%Y-%m-%d")
                        except:
                            self.date = datetime.now()
                        self.created_at = meal.created_at
                
                converted_meals.append(MealAsLog(meal))
            
            # Combine and sort by date
            all_logs = nutrition_logs + converted_meals
            all_logs.sort(key=lambda x: x.date, reverse=True)
            
            return all_logs
        except Exception as e:
            self.logger.error(f"Error getting nutrition logs: {e}")
            return []
    
    def _calculate_totals(self, logs: List) -> Dict[str, float]:
        """Calculate nutrition totals from logs"""
        return {
            'calories': sum(log.calories for log in logs),
            'protein': sum(log.protein for log in logs),
            'carbs': sum(log.carbs for log in logs),
            'fat': sum(log.fat for log in logs),
            'fiber': sum(log.fiber for log in logs),
            'sodium': sum(log.sodium for log in logs)
        }
    
    def _group_by_meal(self, logs: List) -> Dict[str, List]:
        """Group logs by meal type"""
        meal_groups = {}
        for log in logs:
            meal_type = log.meal_type or 'snack'
            meal_groups.setdefault(meal_type, []).append(log)
        return meal_groups
    
    def _group_by_day(self, logs: List) -> Dict[str, Dict[str, Any]]:
        """Group logs by day and calculate daily totals"""
        daily_data = {}
        for log in logs:
            date_str = log.date.strftime('%Y-%m-%d')
            if date_str not in daily_data:
                daily_data[date_str] = {'calories': 0, 'protein': 0, 'carbs': 0, 'fat': 0, 'entries': 0}
            
            daily_data[date_str]['calories'] += log.calories
            daily_data[date_str]['protein'] += log.protein
            daily_data[date_str]['carbs'] += log.carbs
            daily_data[date_str]['fat'] += log.fat
            daily_data[date_str]['entries'] += 1
        
        return daily_data
    
    def _identify_patterns(self, logs: List) -> Dict[str, Any]:
        """Identify eating patterns from logs"""
        if not logs:
            return {}
        
        # Meal distribution
        meal_dist = {}
        for log in logs:
            meal_type = log.meal_type or 'snack'
            meal_dist[meal_type] = meal_dist.get(meal_type, 0) + 1
        
        # Daily calories for trend analysis
        daily_calories = {}
        for log in logs:
            date_str = log.date.strftime('%Y-%m-%d')
            daily_calories[date_str] = daily_calories.get(date_str, 0) + log.calories
        
        # Weekly comparison
        week1_avg = week2_avg = 0
        if len(daily_calories) >= 14:
            sorted_dates = sorted(daily_calories.keys())
            week1_dates = sorted_dates[:7]
            week2_dates = sorted_dates[7:14]
            
            week1_avg = sum(daily_calories[d] for d in week1_dates) / 7
            week2_avg = sum(daily_calories[d] for d in week2_dates) / 7
        
        return {
            'meal_distribution': meal_dist,
            'week1_avg': week1_avg,
            'week2_avg': week2_avg,
            'total_days': len(daily_calories)
        }
    
    async def _generate_insights(self, data_summary: str, context: Dict[str, Any], analysis_type: str) -> str:
        """Generate AI insights based on data and analysis type"""
        insight_prompts = {
            "overview": "Provide 3 encouraging insights about their tracking progress and suggestions for improvement.",
            "daily": "Analyze today's nutrition and provide 3 actionable insights.",
            "weekly": "Identify weekly patterns and provide consistency and nutrition balance insights.",
            "monthly": "Analyze monthly trends and provide long-term progress insights.",
            "goals": "Provide specific recommendations for reaching nutrition goals.",
            "trends": "Identify eating patterns and behavioral observations with recommendations."
        }
        
        prompt = f"""
        Analyze this nutrition data: {data_summary}
        
        {insight_prompts.get(analysis_type, "Provide helpful nutrition insights.")}
        Keep it concise, encouraging, and actionable. Use bullet points.
        """
        
        try:
            return await self.generate_response(prompt, context)
        except Exception as e:
            self.logger.error(f"Error generating insights: {e}")
            return "Continue tracking consistently for better insights!"
    
    async def analyze_daily_intake_and_suggest(self, user_id: str, date: str = None) -> Dict[str, Any]:
        """
        Analyze user's daily food intake against their health goals and dietary preferences.
        Provide personalized feedback and meal suggestions.
        """
        try:
            # Use today's date if not specified
            if not date:
                date = datetime.now().strftime("%Y-%m-%d")
            
            # Get user profile for goals and preferences
            user_profile = await self._get_user_profile(user_id)
            if not user_profile:
                return {
                    "agent": self.name,
                    "response": "Unable to retrieve user profile. Please ensure your profile is set up.",
                    "status": "error"
                }
            
            # Get today's meals
            from bson import ObjectId
            meals = await Meal.find({
                "user_id": ObjectId(user_id),
                "date": date
            }).to_list()
            
            # Calculate personalized goals
            personalized_goals = await self._calculate_personalized_goals(user_profile)
            if not personalized_goals:
                personalized_goals = {'calories': 2000, 'protein': 150, 'carbs': 250, 'fat': 65}
            
            # Calculate today's totals
            totals = {
                'calories': sum(meal.calories for meal in meals),
                'protein': sum(meal.protein for meal in meals),
                'carbs': sum(meal.carbs for meal in meals),
                'fats': sum(meal.fats for meal in meals),
                'fiber': sum(meal.fiber or 0 for meal in meals)
            }
            
            # Extract user information
            name = user_profile.get('name', 'there')
            health_goals = user_profile.get('health_goals', [])
            dietary_prefs = user_profile.get('dietary_preferences', [])
            
            # Build comprehensive analysis prompt
            analysis_prompt = f"""
            You are a professional nutrition advisor analyzing a user's daily food intake.
            
            **User Profile:**
            - Name: {name}
            - Health Goals: {', '.join(health_goals) if health_goals else 'General wellness'}
            - Dietary Preferences: {', '.join(dietary_prefs) if dietary_prefs else 'None specified'}
            - Activity Level: {user_profile.get('activity_level', 'Not specified')}
            - Weight: {user_profile.get('weight', 'Not specified')} kg
            
            **Today's Food Intake ({date}):**
            - Meals Logged: {len(meals)}
            {"".join([f"  • {meal.meal_name} ({meal.meal_type}): {meal.calories} kcal, {meal.protein}g protein, {meal.carbs}g carbs, {meal.fats}g fat" for meal in meals]) if meals else "  • No meals logged yet"}
            
            **Daily Totals:**
            - Calories: {totals['calories']:.0f} kcal (Goal: {personalized_goals['calories']} kcal)
            - Protein: {totals['protein']:.1f}g (Goal: {personalized_goals['protein']}g)
            - Carbs: {totals['carbs']:.1f}g (Goal: {personalized_goals['carbs']}g)
            - Fats: {totals['fats']:.1f}g (Goal: {personalized_goals['fat']}g)
            - Fiber: {totals['fiber']:.1f}g
            
            **Analysis Required:**
            
            1. **Eating Assessment**: Tell the user if they are eating well or poorly based on their health goals:
               - Compare actual intake with personalized goals
               - Consider their specific health goals ({', '.join(health_goals) if health_goals else 'general health'})
               - Be specific about what's good and what needs improvement
            
            2. **Goal Alignment**: Analyze how well their intake aligns with their goals:
               {"- For muscle gain: Are they getting enough protein and calories?" if any(g in ['muscle_gain', 'weight_gain'] for g in health_goals) else ""}
               {"- For weight loss: Are they in a calorie deficit while maintaining protein?" if any(g in ['weight_loss', 'fat_loss'] for g in health_goals) else ""}
               {"- For general wellness: Is their nutrition balanced?" if 'general_wellness' in health_goals or not health_goals else ""}
            
            3. **Specific Meal Suggestions**: Provide 3-4 specific meal recommendations that:
               - Help them reach their daily goals
               - Align with their dietary preferences ({', '.join(dietary_prefs) if dietary_prefs else 'no restrictions'})
               - Address any nutritional gaps
               - Are practical and easy to prepare
            
            4. **Actionable Feedback**: Give clear, encouraging feedback about:
               - What they're doing well
               - What needs improvement
               - Why these changes matter for their goals
            
            Format your response in a clear, encouraging manner with sections:
            - **📊 Today's Performance**
            - **🎯 Goal Alignment**
            - **🍽️ Meal Suggestions**
            - **💡 Recommendations**
            
            Be honest but encouraging. Use emojis for readability.
            """
            
            # Generate AI analysis
            ai_response = await self.generate_response(analysis_prompt, {})
            
            # Calculate progress percentages
            progress = {
                'calories': round((totals['calories'] / personalized_goals['calories']) * 100, 1),
                'protein': round((totals['protein'] / personalized_goals['protein']) * 100, 1),
                'carbs': round((totals['carbs'] / personalized_goals['carbs']) * 100, 1),
                'fats': round((totals['fats'] / personalized_goals['fat']) * 100, 1)
            }
            
            return {
                "agent": self.name,
                "response": ai_response,
                "analysis_data": {
                    "date": date,
                    "meals_count": len(meals),
                    "totals": totals,
                    "goals": personalized_goals,
                    "progress": progress,
                    "health_goals": health_goals,
                    "dietary_preferences": dietary_prefs
                },
                "status": "success"
            }
            
        except Exception as e:
            self.logger.error(f"Error analyzing daily intake: {e}")
            return {
                "agent": self.name,
                "response": f"I encountered an error analyzing your food intake: {str(e)}",
                "status": "error"
            }
    
    def get_agent_description(self) -> Dict[str, Any]:
        """Get agent description and capabilities"""
        return {
            "name": self.name,
            "role": self.role,
            "capabilities": self.capabilities,
            "protocols": self.communication_protocols
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