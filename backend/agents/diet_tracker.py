"""
Diet Tracker Agent - Comprehensive diet tracking and progress analysis with chat history
"""

import json
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from backend.agents.base_agent import BaseAgent
from backend.models.nutrition_log import NutritionLog
from backend.models.user import User

class DietTrackerAgent(BaseAgent):
    """Agent specialized in diet tracking, progress analysis, and behavioral insights"""
    
    def __init__(self):
        super().__init__(
            name="DietTracker",
            role="Diet tracking, progress monitoring, and behavioral analysis specialist",
            model_name="gemini-2.0-flash"
        )
        
        self.capabilities = [
            "Daily nutrition tracking",
            "Progress analysis",
            "Goal monitoring",
            "Trend identification",
            "Behavioral insights",
            "Recommendation generation",
            "Weekly/monthly summaries"
        ]
    
    async def process_request(self, request: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Process diet tracking requests with comprehensive analysis"""
        try:
            message = request.get("message", "").strip().lower()
            user_id = context.get("user_id", "")
            
            if not message:
                return await self._provide_tracking_overview(user_id, context)
            
            # Determine request type based on message content
            if any(keyword in message for keyword in ["track", "daily", "progress", "today"]):
                return await self._analyze_daily_progress(user_id, context)
            elif any(keyword in message for keyword in ["week", "weekly", "7 days"]):
                return await self._analyze_weekly_progress(user_id, context)
            elif any(keyword in message for keyword in ["month", "monthly", "30 days"]):
                return await self._analyze_monthly_progress(user_id, context)
            elif any(keyword in message for keyword in ["goal", "target", "objective"]):
                return await self._analyze_goals(user_id, context)
            elif any(keyword in message for keyword in ["trend", "pattern", "habit"]):
                return await self._analyze_trends(user_id, context)
            elif any(keyword in message for keyword in ["log", "add", "record"]):
                return await self._log_food_intake(request, context)
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
        """Provide comprehensive tracking overview"""
        
        # Get recent data
        recent_logs = await self._get_recent_nutrition_logs(user_id, days=7)
        today_logs = await self._get_today_nutrition_logs(user_id)
        
        # Calculate basic stats
        total_calories_today = sum(log.calories for log in today_logs)
        total_protein_today = sum(log.protein for log in today_logs)
        
        # Get chat history for personalized insights
        chat_history = await self._get_chat_history(user_id)
        
        response = f"**📊 Diet Tracking Overview for {datetime.now().strftime('%B %d, %Y')}**\n\n"
        
        if today_logs:
            response += f"**Today's Progress:**\n"
            response += f"🔥 Calories: {total_calories_today} kcal\n"
            response += f"🥩 Protein: {total_protein_today}g\n"
            response += f"📝 Meals logged: {len(today_logs)}\n\n"
        else:
            response += "**Today's Progress:**\n"
            response += "No meals logged yet today. Start tracking your nutrition!\n\n"
        
        if recent_logs:
            avg_calories = sum(log.calories for log in recent_logs) / len(recent_logs)
            response += f"**7-Day Average:**\n"
            response += f"📈 Daily calories: {avg_calories:.0f} kcal\n"
            response += f"📊 Total entries: {len(recent_logs)}\n\n"
        
        # Add personalized insights based on chat history
        if chat_history:
            insights_prompt = f"""
            Based on this user's diet tracking data and chat history, provide 3 personalized insights:
            
            Today's data: {total_calories_today} calories, {total_protein_today}g protein
            Recent logs: {len(recent_logs)} entries in 7 days
            Chat history: {chat_history[-5:] if len(chat_history) > 5 else chat_history}
            
            Provide encouraging, actionable insights in bullet points.
            """
            
            insights = await self.generate_response(insights_prompt, context)
            response += f"**💡 Personalized Insights:**\n{insights}\n\n"
        
        response += "**What I can help you with:**\n"
        response += "• Track daily nutrition progress\n"
        response += "• Analyze weekly/monthly trends\n"
        response += "• Monitor your goals\n"
        response += "• Identify eating patterns\n"
        response += "• Provide behavioral insights\n\n"
        response += "Try asking: *'Show my weekly progress'* or *'What are my eating patterns?'*"
        
        return {
            "agent": self.name,
            "response": response,
            "tracking_data": {
                "today_calories": total_calories_today,
                "today_protein": total_protein_today,
                "meals_today": len(today_logs),
                "recent_entries": len(recent_logs)
            },
            "status": "success"
        }
    
    async def _analyze_daily_progress(self, user_id: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze today's nutrition progress"""
        
        today_logs = await self._get_today_nutrition_logs(user_id)
        yesterday_logs = await self._get_nutrition_logs_for_date(user_id, datetime.now() - timedelta(days=1))
        
        if not today_logs:
            return {
                "agent": self.name,
                "response": "**📅 Daily Progress - No Data Yet**\n\nYou haven't logged any meals today. Start tracking your nutrition to see your progress!\n\n**Quick Tips:**\n• Log your breakfast to start the day right\n• Track portion sizes for accurate data\n• Include snacks and beverages\n\nTry saying: *'Log my breakfast'* or ask about nutrition in specific foods.",
                "status": "no_data"
            }
        
        # Calculate totals
        totals = self._calculate_nutrition_totals(today_logs)
        yesterday_totals = self._calculate_nutrition_totals(yesterday_logs) if yesterday_logs else None
        
        # Format detailed analysis
        response = f"**📅 Daily Progress - {datetime.now().strftime('%A, %B %d')}**\n\n"
        
        response += f"**🍽️ Today's Intake:**\n"
        response += f"🔥 Calories: {totals['calories']} kcal\n"
        response += f"🥩 Protein: {totals['protein']}g\n"
        response += f"🍞 Carbs: {totals['carbs']}g\n"
        response += f"🧈 Fat: {totals['fat']}g\n"
        response += f"🌾 Fiber: {totals['fiber']}g\n"
        response += f"🧂 Sodium: {totals['sodium']}mg\n\n"
        
        # Compare with yesterday if available
        if yesterday_totals:
            cal_diff = totals['calories'] - yesterday_totals['calories']
            cal_trend = "📈" if cal_diff > 0 else "📉" if cal_diff < 0 else "➡️"
            response += f"**📊 vs Yesterday:**\n"
            response += f"{cal_trend} Calories: {cal_diff:+.0f} kcal\n"
            response += f"🥩 Protein: {totals['protein'] - yesterday_totals['protein']:+.1f}g\n\n"
        
        # Meal breakdown
        meal_breakdown = self._group_logs_by_meal(today_logs)
        if meal_breakdown:
            response += f"**🍽️ Meals Today ({len(today_logs)} entries):**\n"
            for meal_type, logs in meal_breakdown.items():
                meal_calories = sum(log.calories for log in logs)
                response += f"• {meal_type.title()}: {meal_calories} kcal ({len(logs)} items)\n"
            response += "\n"
        
        # Generate AI insights
        insights_prompt = f"""
        Analyze this daily nutrition data and provide insights:
        
        Today's nutrition: {json.dumps(totals, indent=2)}
        Yesterday's nutrition: {json.dumps(yesterday_totals, indent=2) if yesterday_totals else 'No data'}
        Meals: {list(meal_breakdown.keys()) if meal_breakdown else 'None logged'}
        
        Provide 3-4 actionable insights about their nutrition today.
        """
        
        insights = await self.generate_response(insights_prompt, context)
        response += f"**💡 Daily Insights:**\n{insights}"
        
        return {
            "agent": self.name,
            "response": response,
            "daily_data": totals,
            "status": "success"
        }
    
    async def _analyze_weekly_progress(self, user_id: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze weekly nutrition trends"""
        
        logs = await self._get_recent_nutrition_logs(user_id, days=7)
        
        if not logs:
            return {
                "agent": self.name,
                "response": "**📊 Weekly Progress - No Data**\n\nNo nutrition data found for the past 7 days. Start logging your meals to see weekly trends!\n\n**Get Started:**\n• Log today's meals\n• Track consistently for better insights\n• Ask me to analyze specific foods",
                "status": "no_data"
            }
        
        # Group by day and calculate daily totals
        daily_data = self._group_logs_by_day(logs)
        
        # Calculate weekly averages
        total_days = len(daily_data)
        weekly_avg = {
            'calories': sum(day['calories'] for day in daily_data.values()) / total_days,
            'protein': sum(day['protein'] for day in daily_data.values()) / total_days,
            'carbs': sum(day['carbs'] for day in daily_data.values()) / total_days,
            'fat': sum(day['fat'] for day in daily_data.values()) / total_days
        }
        
        response = f"**📊 Weekly Progress ({total_days} days tracked)**\n\n"
        
        response += f"**📈 Daily Averages:**\n"
        response += f"🔥 Calories: {weekly_avg['calories']:.0f} kcal/day\n"
        response += f"🥩 Protein: {weekly_avg['protein']:.1f}g/day\n"
        response += f"🍞 Carbs: {weekly_avg['carbs']:.1f}g/day\n"
        response += f"🧈 Fat: {weekly_avg['fat']:.1f}g/day\n\n"
        
        # Show daily breakdown
        response += f"**📅 Daily Breakdown:**\n"
        for date_str, data in sorted(daily_data.items()):
            date_obj = datetime.strptime(date_str, '%Y-%m-%d')
            day_name = date_obj.strftime('%A')
            response += f"• {day_name}: {data['calories']:.0f} kcal ({data['entries']} entries)\n"
        
        response += "\n"
        
        # Generate weekly insights
        insights_prompt = f"""
        Analyze this weekly nutrition data and identify patterns:
        
        Weekly averages: {json.dumps(weekly_avg, indent=2)}
        Daily data: {json.dumps(daily_data, indent=2)}
        Total tracking days: {total_days}/7
        
        Provide insights about:
        1. Consistency patterns
        2. Nutritional balance
        3. Areas for improvement
        4. Positive trends
        """
        
        insights = await self.generate_response(insights_prompt, context)
        response += f"**💡 Weekly Insights:**\n{insights}"
        
        return {
            "agent": self.name,
            "response": response,
            "weekly_data": {
                "averages": weekly_avg,
                "daily_breakdown": daily_data,
                "tracking_consistency": f"{total_days}/7 days"
            },
            "status": "success"
        }
    
    async def _analyze_monthly_progress(self, user_id: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze monthly nutrition trends"""
        
        logs = await self._get_recent_nutrition_logs(user_id, days=30)
        
        if not logs:
            return {
                "agent": self.name,
                "response": "**📊 Monthly Progress - No Data**\n\nNo nutrition data found for the past 30 days. Start logging consistently to see monthly trends!",
                "status": "no_data"
            }
        
        # Calculate monthly statistics
        total_entries = len(logs)
        unique_days = len(set(log.date.strftime('%Y-%m-%d') for log in logs))
        
        monthly_avg = {
            'calories': sum(log.calories for log in logs) / unique_days,
            'protein': sum(log.protein for log in logs) / unique_days,
            'entries_per_day': total_entries / unique_days
        }
        
        response = f"**📊 Monthly Progress (30 days)**\n\n"
        response += f"**📈 Summary:**\n"
        response += f"📝 Total entries: {total_entries}\n"
        response += f"📅 Days tracked: {unique_days}/30\n"
        response += f"🔥 Daily avg calories: {monthly_avg['calories']:.0f} kcal\n"
        response += f"🥩 Daily avg protein: {monthly_avg['protein']:.1f}g\n"
        response += f"📊 Avg entries/day: {monthly_avg['entries_per_day']:.1f}\n\n"
        
        # Weekly comparison
        weeks_data = self._analyze_weekly_trends(logs)
        if len(weeks_data) >= 2:
            response += f"**📊 Weekly Trends:**\n"
            for i, week in enumerate(weeks_data):
                response += f"• Week {i+1}: {week['avg_calories']:.0f} kcal/day\n"
            response += "\n"
        
        # Generate monthly insights
        insights_prompt = f"""
        Analyze this monthly nutrition data:
        
        Monthly averages: {json.dumps(monthly_avg, indent=2)}
        Tracking consistency: {unique_days}/30 days
        Total entries: {total_entries}
        Weekly trends: {json.dumps(weeks_data, indent=2) if weeks_data else 'Insufficient data'}
        
        Provide comprehensive monthly insights about progress, consistency, and recommendations.
        """
        
        insights = await self.generate_response(insights_prompt, context)
        response += f"**💡 Monthly Insights:**\n{insights}"
        
        return {
            "agent": self.name,
            "response": response,
            "monthly_data": {
                "averages": monthly_avg,
                "tracking_days": f"{unique_days}/30",
                "total_entries": total_entries
            },
            "status": "success"
        }
    
    async def _analyze_goals(self, user_id: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze progress toward nutrition goals"""
        
        # Get user data and recent logs
        recent_logs = await self._get_recent_nutrition_logs(user_id, days=7)
        
        # Default goals (could be customized per user)
        daily_goals = {
            'calories': 2000,
            'protein': 150,
            'carbs': 250,
            'fat': 65,
            'fiber': 25
        }
        
        if not recent_logs:
            response = f"**🎯 Goal Analysis - No Recent Data**\n\n"
            response += f"**Daily Targets:**\n"
            response += f"🔥 Calories: {daily_goals['calories']} kcal\n"
            response += f"🥩 Protein: {daily_goals['protein']}g\n"
            response += f"🍞 Carbs: {daily_goals['carbs']}g\n"
            response += f"🧈 Fat: {daily_goals['fat']}g\n"
            response += f"🌾 Fiber: {daily_goals['fiber']}g\n\n"
            response += "Start logging your meals to track progress toward these goals!"
            
            return {
                "agent": self.name,
                "response": response,
                "status": "no_data"
            }
        
        # Calculate averages from recent data
        daily_data = self._group_logs_by_day(recent_logs)
        avg_daily = {
            'calories': sum(day['calories'] for day in daily_data.values()) / len(daily_data),
            'protein': sum(day['protein'] for day in daily_data.values()) / len(daily_data),
            'carbs': sum(day['carbs'] for day in daily_data.values()) / len(daily_data),
            'fat': sum(day['fat'] for day in daily_data.values()) / len(daily_data)
        }
        
        response = f"**🎯 Goal Analysis (7-day average)**\n\n"
        
        # Calculate goal percentages
        for nutrient, goal in daily_goals.items():
            if nutrient in avg_daily:
                current = avg_daily[nutrient]
                percentage = (current / goal) * 100
                status = "🎯" if 90 <= percentage <= 110 else "📈" if percentage < 90 else "📉"
                
                response += f"{status} **{nutrient.title()}:** {current:.0f}/{goal} ({percentage:.0f}%)\n"
        
        response += "\n"
        
        # Generate goal insights
        insights_prompt = f"""
        Analyze goal progress based on this data:
        
        Daily goals: {json.dumps(daily_goals, indent=2)}
        Current averages: {json.dumps(avg_daily, indent=2)}
        Tracking days: {len(daily_data)}
        
        Provide specific recommendations for reaching nutrition goals.
        """
        
        insights = await self.generate_response(insights_prompt, context)
        response += f"**💡 Goal Insights:**\n{insights}"
        
        return {
            "agent": self.name,
            "response": response,
            "goal_data": {
                "targets": daily_goals,
                "current_averages": avg_daily,
                "tracking_days": len(daily_data)
            },
            "status": "success"
        }
    
    async def _analyze_trends(self, user_id: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze eating patterns and trends"""
        
        logs = await self._get_recent_nutrition_logs(user_id, days=14)
        
        if not logs:
            return {
                "agent": self.name,
                "response": "**📈 Trend Analysis - Insufficient Data**\n\nI need at least 2 weeks of data to identify meaningful patterns. Keep logging your meals!",
                "status": "no_data"
            }
        
        # Analyze patterns
        patterns = self._identify_eating_patterns(logs)
        
        response = f"**📈 Eating Patterns & Trends (14 days)**\n\n"
        
        # Most active meal times
        if patterns['meal_distribution']:
            response += f"**🕐 Meal Timing Patterns:**\n"
            for meal, count in patterns['meal_distribution'].items():
                response += f"• {meal.title()}: {count} entries\n"
            response += "\n"
        
        # Calorie trends
        if patterns['calorie_trend']:
            trend_direction = "increasing" if patterns['calorie_trend'] > 0 else "decreasing"
            response += f"**📊 Calorie Trend:** {trend_direction.title()} by {abs(patterns['calorie_trend']):.0f} kcal/day\n\n"
        
        # Weekly comparison
        week1_avg = patterns.get('week1_avg', 0)
        week2_avg = patterns.get('week2_avg', 0)
        if week1_avg and week2_avg:
            diff = week2_avg - week1_avg
            trend = "📈" if diff > 0 else "📉"
            response += f"**📅 Weekly Comparison:**\n"
            response += f"Week 1: {week1_avg:.0f} kcal/day\n"
            response += f"Week 2: {week2_avg:.0f} kcal/day\n"
            response += f"{trend} Change: {diff:+.0f} kcal/day\n\n"
        
        # Generate trend insights
        insights_prompt = f"""
        Analyze these eating patterns and trends:
        
        Patterns data: {json.dumps(patterns, indent=2)}
        Total entries: {len(logs)}
        Time period: 14 days
        
        Provide insights about:
        1. Eating consistency
        2. Meal timing patterns
        3. Nutritional trends
        4. Behavioral observations
        """
        
        insights = await self.generate_response(insights_prompt, context)
        response += f"**💡 Pattern Insights:**\n{insights}"
        
        return {
            "agent": self.name,
            "response": response,
            "trend_data": patterns,
            "status": "success"
        }
    
    async def _log_food_intake(self, request: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Help user log food intake"""
        
        message = request.get("message", "")
        
        response = f"**📝 Food Logging Assistant**\n\n"
        response += "I can help you log your food intake! However, for accurate tracking, I recommend using the nutrition calculator first to analyze specific foods.\n\n"
        response += "**How to log foods:**\n"
        response += "1. Ask me to *'analyze nutrition in [food]'* first\n"
        response += "2. The nutrition data will be automatically saved\n"
        response += "3. Check your progress with *'track my daily progress'*\n\n"
        response += "**Example:**\n"
        response += "• 'Analyze nutrition in two eggs'\n"
        response += "• 'What's in a banana?'\n"
        response += "• 'Calories in 100g chicken breast'\n\n"
        response += "Try asking about a specific food item!"
        
        return {
            "agent": self.name,
            "response": response,
            "status": "info"
        }
    
    async def _general_tracking_response(self, message: str, user_id: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Handle general tracking questions with AI"""
        
        # Get recent data for context
        recent_logs = await self._get_recent_nutrition_logs(user_id, days=7)
        chat_history = await self._get_chat_history(user_id)
        
        prompt = f"""
        Answer this diet tracking question: {message}
        
        User's recent nutrition data: {len(recent_logs)} entries in past 7 days
        Recent chat history: {chat_history[-3:] if chat_history else 'None'}
        
        Provide helpful, personalized advice about diet tracking, nutrition monitoring, or progress analysis.
        Use emojis and be encouraging. Keep responses concise but informative.
        """
        
        try:
            response = await self.generate_response(prompt, context)
            
            return {
                "agent": self.name,
                "response": response,
                "type": "general_tracking",
                "status": "success"
            }
        except Exception as e:
            self.logger.error(f"Error generating AI response: {e}")
            return {
                "agent": self.name,
                "response": "I can help you track your diet progress! Try asking about your daily progress, weekly trends, or nutrition goals.",
                "status": "success"
            }
    
    # Helper methods for data retrieval and analysis
    
    async def _get_today_nutrition_logs(self, user_id: str) -> List[NutritionLog]:
        """Get today's nutrition logs"""
        try:
            today = datetime.now().date()
            logs = await NutritionLog.find(
                NutritionLog.user_id == user_id,
                NutritionLog.date >= today,
                NutritionLog.date < today + timedelta(days=1)
            ).to_list()
            return logs
        except Exception as e:
            self.logger.error(f"Error getting today's logs: {e}")
            return []
    
    async def _get_nutrition_logs_for_date(self, user_id: str, date: datetime) -> List[NutritionLog]:
        """Get nutrition logs for specific date"""
        try:
            target_date = date.date()
            logs = await NutritionLog.find(
                NutritionLog.user_id == user_id,
                NutritionLog.date >= target_date,
                NutritionLog.date < target_date + timedelta(days=1)
            ).to_list()
            return logs
        except Exception as e:
            self.logger.error(f"Error getting logs for date {date}: {e}")
            return []
    
    async def _get_recent_nutrition_logs(self, user_id: str, days: int = 7) -> List[NutritionLog]:
        """Get recent nutrition logs"""
        try:
            start_date = datetime.now() - timedelta(days=days)
            logs = await NutritionLog.find(
                NutritionLog.user_id == user_id,
                NutritionLog.date >= start_date
            ).sort(-NutritionLog.date).to_list()
            return logs
        except Exception as e:
            self.logger.error(f"Error getting recent logs: {e}")
            return []
    
    def _calculate_nutrition_totals(self, logs: List[NutritionLog]) -> Dict[str, float]:
        """Calculate nutrition totals from logs"""
        return {
            'calories': sum(log.calories for log in logs),
            'protein': sum(log.protein for log in logs),
            'carbs': sum(log.carbs for log in logs),
            'fat': sum(log.fat for log in logs),
            'fiber': sum(log.fiber for log in logs),
            'sodium': sum(log.sodium for log in logs)
        }
    
    def _group_logs_by_meal(self, logs: List[NutritionLog]) -> Dict[str, List[NutritionLog]]:
        """Group logs by meal type"""
        meal_groups = {}
        for log in logs:
            meal_type = log.meal_type or 'snack'
            if meal_type not in meal_groups:
                meal_groups[meal_type] = []
            meal_groups[meal_type].append(log)
        return meal_groups
    
    def _group_logs_by_day(self, logs: List[NutritionLog]) -> Dict[str, Dict[str, Any]]:
        """Group logs by day and calculate daily totals"""
        daily_data = {}
        for log in logs:
            date_str = log.date.strftime('%Y-%m-%d')
            if date_str not in daily_data:
                daily_data[date_str] = {
                    'calories': 0, 'protein': 0, 'carbs': 0, 'fat': 0, 'entries': 0
                }
            
            daily_data[date_str]['calories'] += log.calories
            daily_data[date_str]['protein'] += log.protein
            daily_data[date_str]['carbs'] += log.carbs
            daily_data[date_str]['fat'] += log.fat
            daily_data[date_str]['entries'] += 1
        
        return daily_data
    
    def _analyze_weekly_trends(self, logs: List[NutritionLog]) -> List[Dict[str, Any]]:
        """Analyze weekly trends from logs"""
        if len(logs) < 7:
            return []
        
        # Sort logs by date
        sorted_logs = sorted(logs, key=lambda x: x.date)
        
        # Group into weeks
        weeks = []
        current_week = []
        
        for log in sorted_logs:
            if not current_week:
                current_week = [log]
            elif (log.date - current_week[0].date).days < 7:
                current_week.append(log)
            else:
                # Process completed week
                if len(current_week) >= 3:  # At least 3 days of data
                    week_totals = self._calculate_nutrition_totals(current_week)
                    week_days = len(set(log.date.date() for log in current_week))
                    weeks.append({
                        'avg_calories': week_totals['calories'] / week_days,
                        'avg_protein': week_totals['protein'] / week_days,
                        'days_tracked': week_days
                    })
                current_week = [log]
        
        # Process final week
        if len(current_week) >= 3:
            week_totals = self._calculate_nutrition_totals(current_week)
            week_days = len(set(log.date.date() for log in current_week))
            weeks.append({
                'avg_calories': week_totals['calories'] / week_days,
                'avg_protein': week_totals['protein'] / week_days,
                'days_tracked': week_days
            })
        
        return weeks
    
    def _identify_eating_patterns(self, logs: List[NutritionLog]) -> Dict[str, Any]:
        """Identify eating patterns from logs"""
        if not logs:
            return {}
        
        # Meal distribution
        meal_distribution = {}
        for log in logs:
            meal_type = log.meal_type or 'snack'
            meal_distribution[meal_type] = meal_distribution.get(meal_type, 0) + 1
        
        # Calorie trend (simple linear trend)
        daily_calories = {}
        for log in logs:
            date_str = log.date.strftime('%Y-%m-%d')
            daily_calories[date_str] = daily_calories.get(date_str, 0) + log.calories
        
        calorie_trend = 0
        if len(daily_calories) >= 2:
            dates = sorted(daily_calories.keys())
            first_half = dates[:len(dates)//2]
            second_half = dates[len(dates)//2:]
            
            first_avg = sum(daily_calories[d] for d in first_half) / len(first_half)
            second_avg = sum(daily_calories[d] for d in second_half) / len(second_half)
            calorie_trend = second_avg - first_avg
        
        # Weekly comparison for 14-day data
        week1_avg = week2_avg = 0
        if len(daily_calories) >= 14:
            sorted_dates = sorted(daily_calories.keys())
            week1_dates = sorted_dates[:7]
            week2_dates = sorted_dates[7:14]
            
            week1_avg = sum(daily_calories[d] for d in week1_dates) / 7
            week2_avg = sum(daily_calories[d] for d in week2_dates) / 7
        
        return {
            'meal_distribution': meal_distribution,
            'calorie_trend': calorie_trend,
            'week1_avg': week1_avg,
            'week2_avg': week2_avg,
            'total_days': len(daily_calories)
        }
    
    def get_agent_description(self) -> Dict[str, Any]:
        """Get agent description and capabilities"""
        return {
            "name": self.name,
            "role": self.role,
            "capabilities": self.capabilities,
            "protocols": self.communication_protocols
        }
