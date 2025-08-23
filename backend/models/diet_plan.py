"""
Diet Plan model for storing personalized diet plans
"""

from beanie import Document
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict
from datetime import datetime
from bson import ObjectId

class Meal(BaseModel):
    """Individual meal structure"""
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    name: str
    food_items: List[Dict]  # [{name, quantity, unit, calories, nutrients}]
    total_calories: float
    total_nutrients: Dict  # {protein, carbs, fat, fiber, etc.}
    meal_type: str  # breakfast, lunch, dinner, snack
    preparation_time: Optional[int] = None  # in minutes
    recipe_instructions: Optional[str] = None

class DayPlan(BaseModel):
    """Single day diet plan"""
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    date: datetime
    meals: List[Meal]
    total_daily_calories: float
    total_daily_nutrients: Dict
    water_intake_goal: Optional[float] = None  # in liters
    notes: Optional[str] = None

class DietPlan(Document):
    """Diet plan document model"""
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    user_id: ObjectId = Field(..., description="Reference to user")
    plan_name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    start_date: datetime
    end_date: datetime
    days: List[DayPlan]
    goals: Dict  # {target_calories, target_protein, target_carbs, target_fat, etc.}
    restrictions: List[str] = []  # dietary restrictions
    created_by_agent: str = Field(..., description="Which agent created this plan")
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "diet_plans"
        indexes = [
            "user_id",
            "start_date",
            "is_active",
            "created_at"
        ]
