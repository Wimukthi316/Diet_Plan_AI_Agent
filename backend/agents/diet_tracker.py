"""
Diet Tracker Agent - Tracks daily intake, monitors progress, and provides insights
"""

import json
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from backend.agents.base_agent import BaseAgent
from backend.models.nutrition_log import NutritionLog, FoodEntry, WaterEntry, ExerciseEntry
from backend.models.user import User
from backend.utils.security import sanitize_input
from bson import ObjectId

class DietTrackerAgent(BaseAgent):
    """Agent specialized in diet tracking, progress monitoring, and insights"""
    
    def __init__(self):
        super().__init__(
            name="DietTracker",
            role="Diet tracking, progress monitoring, and behavioral insights specialist",
            model_name="gemini-2.0-flash"
        )
        
        self.capabilities = [
            "Daily food intake tracking",
            "Progress monitoring and analysis",
            "Goal achievement tracking",
            "Behavioral pattern recognition",
            "Personalized recommendations",
            "Motivational coaching",
            "Trend analysis and reporting",
            "Habit formation guidance"
        ]
    
    async def process_request(self, request: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Process diet tracking requests"""
        validation = self.validate_request(request)
        if not validation["valid"]:
            return {"error": validation["error"], "agent": self.name}
        
        message = sanitize_input(request["message"])
        request_type = request.get("type", "general")
        user_id = context.get("user_id")
        
        if not user_id:
            return {"error": "User authentication required", "agent": self.name}
        
        try:
            if request_type == "log_food":
                return await self._log_food_intake(request.get("food_data", {}), user_id, context)
            elif request_type == "log_water":
                return await self._log_water_intake(request.get("water_data", {}), user_id, context)
            elif request_type == "log_exercise":
                return await self._log_exercise(request.get("exercise_data", {}), user_id, context)
            elif request_type == "daily_summary":
                return await self._get_daily_summary(request.get("date"), user_id, context)
            elif request_type == "weekly_progress":
                return await self._get_weekly_progress(user_id, context)
            elif request_type == "goal_tracking":
                return await self._track_goals(user_id, context)
            elif request_type == "insights":
                return await self._generate_insights(request.get("timeframe", "week"), user_id, context)
            elif request_type == "recommendations":
                return await self._generate_recommendations(user_id, context)
            else:
                return await self._general_tracking_query(message, user_id, context)
                
        except Exception as e:
            self.logger.error(f"Error processing request: {e}")
            return {
                "error": "I encountered an error while processing your tracking request.",
                "agent": self.name,
                "status": "error"
            }
    
    async def _log_food_intake(self, food_data: Dict[str, Any], user_id: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Log food intake for the user"""
        try:
            # Get or create today's nutrition log
            today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
            nutrition_log = await NutritionLog.find_one({
                "user_id": ObjectId(user_id),
                "date": today
            })
            
            if not nutrition_log:
                nutrition_log = NutritionLog(
                    user_id=ObjectId(user_id),
                    date=today
                )
            
            # Create food entry
            food_entry = FoodEntry(
                food_name=food_data.get("name", ""),
                food_id=food_data.get("food_id"),
                quantity=food_data.get("quantity", 0),
                unit=food_data.get("unit", "g"),
                calories=food_data.get("calories", 0),
                nutrients=food_data.get("nutrients", {}),
                meal_type=food_data.get("meal_type", "snack")
            )
            
            # Add entry and recalculate totals
            nutrition_log.food_entries.append(food_entry)
            nutrition_log.calculate_daily_totals()
            
            # Save to database
            await nutrition_log.save()
            
            # Generate feedback
            feedback = await self._generate_food_logging_feedback(food_entry, nutrition_log, context)
            
            return {
                "agent": self.name,
                "food_logged": {
                    "name": food_entry.food_name,
                    "calories": food_entry.calories,
                    "meal_type": food_entry.meal_type
                },
                "daily_totals": {
                    "calories": nutrition_log.total_calories_consumed,
                    "water": nutrition_log.total_water_intake
                },
                "feedback": feedback,
                "status": "success"
            }
            
        except Exception as e:
            self.logger.error(f"Error logging food: {e}")
            return {"error": "Failed to log food intake", "agent": self.name}
    
    async def _log_water_intake(self, water_data: Dict[str, Any], user_id: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Log water intake for the user"""
        try:
            # Get or create today's nutrition log
            today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
            nutrition_log = await NutritionLog.find_one({
                "user_id": ObjectId(user_id),
                "date": today
            })
            
            if not nutrition_log:
                nutrition_log = NutritionLog(
                    user_id=ObjectId(user_id),
                    date=today
                )
            
            # Create water entry
            water_entry = WaterEntry(
                amount=water_data.get("amount", 0)  # in ml
            )
            
            # Add entry and recalculate totals
            nutrition_log.water_entries.append(water_entry)
            nutrition_log.calculate_daily_totals()
            
            # Save to database
            await nutrition_log.save()
            
            # Generate feedback
            feedback = await self._generate_water_logging_feedback(nutrition_log, context)
            
            return {
                "agent": self.name,
                "water_logged": water_entry.amount,
                "daily_total": nutrition_log.total_water_intake,
                "feedback": feedback,
                "status": "success"
            }
            
        except Exception as e:
            self.logger.error(f"Error logging water: {e}")
            return {"error": "Failed to log water intake", "agent": self.name}
    
    async def _log_exercise(self, exercise_data: Dict[str, Any], user_id: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Log exercise activity for the user"""
        try:
            # Get or create today's nutrition log
            today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
            nutrition_log = await NutritionLog.find_one({
                "user_id": ObjectId(user_id),
                "date": today
            })
            
            if not nutrition_log:
                nutrition_log = NutritionLog(
                    user_id=ObjectId(user_id),
                    date=today
                )
            
            # Estimate calories burned if not provided
            calories_burned = exercise_data.get("calories_burned")
            if not calories_burned:
                calories_burned = await self._estimate_calories_burned(
                    exercise_data.get("activity", ""),
                    exercise_data.get("duration", 0),
                    context
                )
            
            # Create exercise entry
            exercise_entry = ExerciseEntry(
                activity=exercise_data.get("activity", ""),
                duration=exercise_data.get("duration", 0),
                calories_burned=calories_burned
            )
            
            # Add entry and recalculate totals
            nutrition_log.exercise_entries.append(exercise_entry)
            nutrition_log.calculate_daily_totals()
            
            # Save to database
            await nutrition_log.save()
            
            # Generate feedback
            feedback = await self._generate_exercise_logging_feedback(exercise_entry, nutrition_log, context)
            
            return {
                "agent": self.name,
                "exercise_logged": {
                    "activity": exercise_entry.activity,
                    "duration": exercise_entry.duration,
                    "calories_burned": exercise_entry.calories_burned
                },
                "daily_totals": {
                    "calories_consumed": nutrition_log.total_calories_consumed,
                    "calories_burned": nutrition_log.total_calories_burned,
                    "net_calories": nutrition_log.get_calorie_balance()
                },
                "feedback": feedback,
                "status": "success"
            }
            
        except Exception as e:
            self.logger.error(f"Error logging exercise: {e}")
            return {"error": "Failed to log exercise", "agent": self.name}
    
    async def _get_daily_summary(self, date_str: Optional[str], user_id: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Get daily nutrition summary"""
        try:
            # Parse date or use today
            if date_str:
                target_date = datetime.strptime(date_str, "%Y-%m-%d")
            else:
                target_date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
            
            # Get nutrition log for the date
            nutrition_log = await NutritionLog.find_one({
                "user_id": ObjectId(user_id),
                "date": target_date
            })
            
            if not nutrition_log:
                return {
                    "agent": self.name,
                    "date": target_date.strftime("%Y-%m-%d"),
                    "message": "No data logged for this date",
                    "status": "no_data"
                }
            
            # Get user for goal comparison
            user = await User.get(user_id)
            daily_calorie_goal = user.calculate_daily_calories() if user else None
            
            # Calculate progress
            progress = nutrition_log.get_goal_progress()
            
            # Generate insights
            insights = await self._generate_daily_insights(nutrition_log, user, context)
            
            return {
                "agent": self.name,
                "date": target_date.strftime("%Y-%m-%d"),
                "summary": {
                    "calories_consumed": nutrition_log.total_calories_consumed,
                    "calories_burned": nutrition_log.total_calories_burned,
                    "net_calories": nutrition_log.get_calorie_balance(),
                    "water_intake": nutrition_log.total_water_intake,
                    "meals_logged": len(nutrition_log.food_entries),
                    "exercises_logged": len(nutrition_log.exercise_entries)
                },
                "goals": {
                    "calorie_goal": daily_calorie_goal,
                    "progress": progress
                },
                "insights": insights,
                "status": "success"
            }
            
        except Exception as e:
            self.logger.error(f"Error getting daily summary: {e}")
            return {"error": "Failed to generate daily summary", "agent": self.name}
    
    async def _get_weekly_progress(self, user_id: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Get weekly progress analysis"""
        try:
            # Get last 7 days of data
            end_date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
            start_date = end_date - timedelta(days=6)
            
            nutrition_logs = await NutritionLog.find({
                "user_id": ObjectId(user_id),
                "date": {"$gte": start_date, "$lte": end_date}
            }).to_list()
            
            # Calculate weekly totals and averages
            weekly_stats = self._calculate_weekly_stats(nutrition_logs)
            
            # Generate insights
            insights = await self._generate_weekly_insights(weekly_stats, nutrition_logs, context)
            
            return {
                "agent": self.name,
                "timeframe": "7 days",
                "weekly_stats": weekly_stats,
                "daily_breakdown": [
                    {
                        "date": log.date.strftime("%Y-%m-%d"),
                        "calories": log.total_calories_consumed,
                        "water": log.total_water_intake,
                        "exercise_minutes": sum(ex.duration for ex in log.exercise_entries)
                    }
                    for log in nutrition_logs
                ],
                "insights": insights,
                "status": "success"
            }
            
        except Exception as e:
            self.logger.error(f"Error getting weekly progress: {e}")
            return {"error": "Failed to generate weekly progress", "agent": self.name}
    
    async def _track_goals(self, user_id: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Track progress towards user goals"""
        try:
            user = await User.get(user_id)
            if not user:
                return {"error": "User not found", "agent": self.name}
            
            # Get recent data (last 30 days)
            end_date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
            start_date = end_date - timedelta(days=30)
            
            nutrition_logs = await NutritionLog.find({
                "user_id": ObjectId(user_id),
                "date": {"$gte": start_date, "$lte": end_date}
            }).to_list()
            
            # Analyze goal progress
            goal_analysis = await self._analyze_goal_progress(user, nutrition_logs, context)
            
            return {
                "agent": self.name,
                "user_goals": user.health_goals,
                "goal_analysis": goal_analysis,
                "status": "success"
            }
            
        except Exception as e:
            self.logger.error(f"Error tracking goals: {e}")
            return {"error": "Failed to track goals", "agent": self.name}
    
    async def _generate_insights(self, timeframe: str, user_id: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Generate behavioral insights"""
        try:
            # Get data based on timeframe
            if timeframe == "week":
                days = 7
            elif timeframe == "month":
                days = 30
            else:
                days = 7
            
            end_date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
            start_date = end_date - timedelta(days=days-1)
            
            nutrition_logs = await NutritionLog.find({
                "user_id": ObjectId(user_id),
                "date": {"$gte": start_date, "$lte": end_date}
            }).to_list()
            
            # Generate AI insights
            insights = await self._generate_behavioral_insights(nutrition_logs, timeframe, context)
            
            return {
                "agent": self.name,
                "timeframe": timeframe,
                "insights": insights,
                "data_points": len(nutrition_logs),
                "status": "success"
            }
            
        except Exception as e:
            self.logger.error(f"Error generating insights: {e}")
            return {"error": "Failed to generate insights", "agent": self.name}
    
    async def _generate_recommendations(self, user_id: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Generate personalized recommendations"""
        try:
            user = await User.get(user_id)
            
            # Get recent data
            end_date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
            start_date = end_date - timedelta(days=7)
            
            nutrition_logs = await NutritionLog.find({
                "user_id": ObjectId(user_id),
                "date": {"$gte": start_date, "$lte": end_date}
            }).to_list()
            
            # Generate AI recommendations
            recommendations = await self._generate_ai_recommendations(user, nutrition_logs, context)
            
            return {
                "agent": self.name,
                "recommendations": recommendations,
                "based_on": f"{len(nutrition_logs)} days of data",
                "status": "success"
            }
            
        except Exception as e:
            self.logger.error(f"Error generating recommendations: {e}")
            return {"error": "Failed to generate recommendations", "agent": self.name}
    
    async def _estimate_calories_burned(self, activity: str, duration: int, context: Dict[str, Any]) -> float:
        """Estimate calories burned for an activity"""
        # Simplified estimation - in production, use MET values and user weight
        activity_calories_per_minute = {
            "walking": 5,
            "running": 12,
            "cycling": 8,
            "swimming": 10,
            "weightlifting": 6,
            "yoga": 3,
            "dancing": 7
        }
        
        rate = activity_calories_per_minute.get(activity.lower(), 5)
        return rate * duration
    
    def _calculate_weekly_stats(self, nutrition_logs: List[NutritionLog]) -> Dict[str, Any]:
        """Calculate weekly statistics"""
        if not nutrition_logs:
            return {}
        
        total_calories = sum(log.total_calories_consumed for log in nutrition_logs)
        total_water = sum(log.total_water_intake for log in nutrition_logs)
        total_exercise_minutes = sum(
            sum(ex.duration for ex in log.exercise_entries) for log in nutrition_logs
        )
        
        days_with_data = len(nutrition_logs)
        
        return {
            "total_calories": total_calories,
            "avg_daily_calories": total_calories / days_with_data if days_with_data > 0 else 0,
            "total_water": total_water,
            "avg_daily_water": total_water / days_with_data if days_with_data > 0 else 0,
            "total_exercise_minutes": total_exercise_minutes,
            "avg_daily_exercise": total_exercise_minutes / days_with_data if days_with_data > 0 else 0,
            "days_logged": days_with_data
        }
    
    async def _generate_food_logging_feedback(self, food_entry: FoodEntry, nutrition_log: NutritionLog, context: Dict) -> str:
        """Generate feedback for food logging"""
        prompt = f"""
        User just logged: {food_entry.food_name} ({food_entry.calories} calories) for {food_entry.meal_type}
        
        Their daily totals so far: {nutrition_log.total_calories_consumed} calories
        
        Provide brief, encouraging feedback (1-2 sentences) about this food choice.
        Consider nutritional value and how it fits into their daily goals.
        """
        
        return await self.generate_response(prompt, context)
    
    async def _generate_water_logging_feedback(self, nutrition_log: NutritionLog, context: Dict) -> str:
        """Generate feedback for water logging"""
        prompt = f"""
        User's daily water intake so far: {nutrition_log.total_water_intake}ml
        
        Provide brief, encouraging feedback about their hydration progress.
        """
        
        return await self.generate_response(prompt, context)
    
    async def _generate_exercise_logging_feedback(self, exercise_entry: ExerciseEntry, nutrition_log: NutritionLog, context: Dict) -> str:
        """Generate feedback for exercise logging"""
        prompt = f"""
        User just logged: {exercise_entry.activity} for {exercise_entry.duration} minutes 
        (burned {exercise_entry.calories_burned} calories)
        
        Net calorie balance today: {nutrition_log.get_calorie_balance()} calories
        
        Provide brief, motivational feedback about their exercise.
        """
        
        return await self.generate_response(prompt, context)
    
    async def _generate_daily_insights(self, nutrition_log: NutritionLog, user: User, context: Dict) -> str:
        """Generate insights for daily summary"""
        prompt = f"""
        Analyze this user's daily nutrition data and provide insights:
        
        Daily Summary:
        - Calories consumed: {nutrition_log.total_calories_consumed}
        - Calories burned: {nutrition_log.total_calories_burned}
        - Net calories: {nutrition_log.get_calorie_balance()}
        - Water intake: {nutrition_log.total_water_intake}ml
        - Food entries: {len(nutrition_log.food_entries)}
        - Exercise entries: {len(nutrition_log.exercise_entries)}
        
        User goals: {user.health_goals if user else 'Not specified'}
        
        Provide encouraging insights and practical suggestions for tomorrow.
        """
        
        return await self.generate_response(prompt, context)
    
    async def _general_tracking_query(self, message: str, user_id: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Handle general tracking questions"""
        
        # Get user's recent tracking data for context
        recent_logs = await self._get_recent_user_data(user_id)
        
        prompt = f"""
        Answer this diet tracking question: {message}
        
        User context: {json.dumps(context, indent=2)}
        Recent user data: {json.dumps(recent_logs, indent=2)}
        
        Provide helpful advice about diet tracking, progress monitoring, or goal achievement.
        Use emojis and formatting to make the response engaging.
        Be encouraging and motivational.
        Provide specific, actionable recommendations.
        """
        
        response = await self.generate_response(prompt, context)
        
        return {
            "agent": self.name,
            "response": response,
            "user_data": recent_logs,
            "type": "general_tracking",
            "status": "success"
        }
    
    async def _get_recent_user_data(self, user_id: str) -> Dict[str, Any]:
        """Get recent user tracking data for context"""
        try:
            # Get recent nutrition logs
            recent_logs = await NutritionLog.find(
                {"user_id": ObjectId(user_id)}
            ).sort("-date").limit(7).to_list()
            
            if not recent_logs:
                return {"message": "No recent tracking data found"}
            
            # Summarize recent activity
            summary = {
                "days_tracked": len(recent_logs),
                "avg_calories": sum(log.total_calories_consumed for log in recent_logs) / len(recent_logs) if recent_logs else 0,
                "total_water": sum(log.total_water_intake for log in recent_logs),
                "recent_foods": []
            }
            
            # Get recent foods
            for log in recent_logs[:3]:  # Last 3 days
                for entry in log.food_entries[-5:]:  # Last 5 foods per day
                    summary["recent_foods"].append({
                        "food": entry.food_name,
                        "calories": entry.calories,
                        "date": log.date.strftime("%Y-%m-%d")
                    })
            
            return summary
            
        except Exception as e:
            self.logger.error(f"Error getting user data: {e}")
            return {"message": "Unable to retrieve recent data"}
    
    def get_agent_description(self) -> Dict[str, Any]:
        """Get agent description and capabilities"""
        return {
            "name": self.name,
            "role": self.role,
            "capabilities": self.capabilities,
            "supported_requests": [
                "log_food",
                "log_water", 
                "log_exercise",
                "daily_summary",
                "weekly_progress",
                "goal_tracking",
                "insights",
                "recommendations",
                "general"
            ],
            "data_sources": ["User Logs", "Progress Analytics", "Behavioral Patterns"],
            "protocols": self.communication_protocols
        }
