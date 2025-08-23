"""
User model for the Diet Plan AI system
"""

from beanie import Document
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, List, Dict
from datetime import datetime
from bson import ObjectId

class UserProfile(BaseModel):
    """User profile information"""
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    age: Optional[int] = None
    gender: Optional[str] = None
    weight: Optional[float] = None  # in kg
    height: Optional[float] = None  # in cm
    activity_level: Optional[str] = None  # sedentary, lightly_active, moderately_active, very_active
    dietary_preferences: Optional[List[str]] = []  # vegetarian, vegan, keto, etc.
    allergies: Optional[List[str]] = []
    health_conditions: Optional[List[str]] = []
    health_goals: Optional[List[str]] = []  # weight_loss, muscle_gain, maintenance, etc.

class User(Document):
    """User document model"""
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr = Field(..., unique=True)
    password_hash: str = Field(..., min_length=8)
    profile: UserProfile = Field(default_factory=UserProfile)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # For backward compatibility with main.py
    @property
    def dietary_preferences(self):
        return self.profile.dietary_preferences
    
    @property
    def health_goals(self):
        return self.profile.health_goals
    
    class Settings:
        name = "users"
        indexes = [
            "email",
            "created_at"
        ]
    
    def calculate_bmr(self) -> Optional[float]:
        """Calculate Basal Metabolic Rate using Harris-Benedict equation"""
        if not all([self.profile.weight, self.profile.height, self.profile.age, self.profile.gender]):
            return None
        
        if self.profile.gender.lower() == 'male':
            bmr = 88.362 + (13.397 * self.profile.weight) + (4.799 * self.profile.height) - (5.677 * self.profile.age)
        else:
            bmr = 447.593 + (9.247 * self.profile.weight) + (3.098 * self.profile.height) - (4.330 * self.profile.age)
        
        return bmr
    
    def calculate_daily_calories(self) -> Optional[float]:
        """Calculate daily calorie needs based on activity level"""
        bmr = self.calculate_bmr()
        if not bmr or not self.profile.activity_level:
            return None
        
        activity_multipliers = {
            'sedentary': 1.2,
            'lightly_active': 1.375,
            'moderately_active': 1.55,
            'very_active': 1.725,
            'extra_active': 1.9
        }
        
        multiplier = activity_multipliers.get(self.profile.activity_level, 1.2)
        return bmr * multiplier
