"""
Nutrition Log model for tracking daily food intake
"""

from beanie import Document
from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime
from bson import ObjectId

class FoodEntry(BaseModel):
    """Individual food entry"""
    food_name: str
    food_id: Optional[str] = None  # USDA food ID if available
    quantity: float
    unit: str  # grams, cups, pieces, etc.
    calories: float
    nutrients: Dict  # detailed nutrient breakdown
    meal_type: str  # breakfast, lunch, dinner, snack
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class WaterEntry(BaseModel):
    """Water intake entry"""
    amount: float  # in ml
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class ExerciseEntry(BaseModel):
    """Exercise entry"""
    activity: str
    duration: int  # in minutes
    calories_burned: Optional[float] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class NutritionLog(Document):
    """Daily nutrition log document"""
    user_id: ObjectId = Field(..., description="Reference to user")
    date: datetime = Field(..., description="Date of the log (date only)")
    food_entries: List[FoodEntry] = []
    water_entries: List[WaterEntry] = []
    exercise_entries: List[ExerciseEntry] = []
    
    # Daily totals (calculated)
    total_calories_consumed: float = 0.0
    total_calories_burned: float = 0.0
    total_water_intake: float = 0.0  # in ml
    daily_nutrients: Dict = {}  # aggregated nutrients
    
    # Goals vs actual
    calorie_goal: Optional[float] = None
    water_goal: Optional[float] = None
    nutrient_goals: Dict = {}
    
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "nutrition_logs"
        indexes = [
            "user_id",
            "date",
            ("user_id", "date"),  # compound index
            "created_at"
        ]
    
    def calculate_daily_totals(self):
        """Calculate daily totals from entries"""
        # Calculate total calories from food
        self.total_calories_consumed = sum(entry.calories for entry in self.food_entries)
        
        # Calculate total calories burned from exercise
        self.total_calories_burned = sum(
            entry.calories_burned for entry in self.exercise_entries 
            if entry.calories_burned
        )
        
        # Calculate total water intake
        self.total_water_intake = sum(entry.amount for entry in self.water_entries)
        
        # Aggregate nutrients
        nutrients = {}
        for entry in self.food_entries:
            for nutrient, value in entry.nutrients.items():
                nutrients[nutrient] = nutrients.get(nutrient, 0) + value
        self.daily_nutrients = nutrients
    
    def get_calorie_balance(self) -> float:
        """Get net calorie balance (consumed - burned)"""
        return self.total_calories_consumed - self.total_calories_burned
    
    def get_goal_progress(self) -> Dict:
        """Get progress towards daily goals"""
        progress = {}
        
        if self.calorie_goal:
            progress['calories'] = {
                'goal': self.calorie_goal,
                'actual': self.total_calories_consumed,
                'percentage': (self.total_calories_consumed / self.calorie_goal) * 100
            }
        
        if self.water_goal:
            progress['water'] = {
                'goal': self.water_goal,
                'actual': self.total_water_intake,
                'percentage': (self.total_water_intake / self.water_goal) * 100
            }
        
        for nutrient, goal in self.nutrient_goals.items():
            actual = self.daily_nutrients.get(nutrient, 0)
            progress[nutrient] = {
                'goal': goal,
                'actual': actual,
                'percentage': (actual / goal) * 100 if goal > 0 else 0
            }
        
        return progress
