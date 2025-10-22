"""
Meal model for tracking individual meals
"""

from beanie import Document
from pydantic import Field, ConfigDict
from typing import Optional
from datetime import datetime
from bson import ObjectId


class Meal(Document):
    """Individual meal entry"""
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    user_id: ObjectId = Field(..., description="Reference to user")
    meal_name: str = Field(..., description="Name of the meal")
    meal_type: str = Field(..., description="Type: breakfast, lunch, dinner, snack")
    
    # Nutritional information
    calories: float = Field(..., description="Calories in kcal")
    protein: float = Field(..., description="Protein in grams")
    carbs: float = Field(..., description="Carbohydrates in grams")
    fats: float = Field(..., description="Fats in grams")
    fiber: Optional[float] = Field(default=0, description="Fiber in grams")
    
    # Additional information
    serving_size: Optional[str] = Field(default=None, description="Serving size description")
    notes: Optional[str] = Field(default=None, description="Additional notes")
    date: str = Field(..., description="Date of the meal (YYYY-MM-DD)")
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "meals"
        indexes = [
            "user_id",
            "date",
            [("user_id", 1), ("date", -1)]
        ]
