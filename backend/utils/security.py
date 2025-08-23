"""
Security utilities for input validation and sanitization
"""

import re
import html
from typing import Any, Dict, List
from jose import jwt, JWTError
import os
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

def sanitize_input(text: str) -> str:
    """Sanitize user input to prevent XSS and injection attacks"""
    if not isinstance(text, str):
        return str(text)
    
    # HTML escape
    sanitized = html.escape(text)
    
    # Remove potentially dangerous characters
    sanitized = re.sub(r'[<>"\']', '', sanitized)
    
    # Limit length
    sanitized = sanitized[:1000]
    
    return sanitized.strip()

def validate_email(email: str) -> bool:
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password: str) -> Dict[str, Any]:
    """Validate password strength"""
    errors = []
    
    if len(password) < 8:
        errors.append("Password must be at least 8 characters long")
    
    if not re.search(r'[A-Z]', password):
        errors.append("Password must contain at least one uppercase letter")
    
    if not re.search(r'[a-z]', password):
        errors.append("Password must contain at least one lowercase letter")
    
    if not re.search(r'\d', password):
        errors.append("Password must contain at least one digit")
    
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        errors.append("Password must contain at least one special character")
    
    return {
        "is_valid": len(errors) == 0,
        "errors": errors
    }

def sanitize_dict(data: Dict[str, Any]) -> Dict[str, Any]:
    """Recursively sanitize dictionary values"""
    sanitized = {}
    
    for key, value in data.items():
        # Sanitize key
        clean_key = sanitize_input(str(key))
        
        # Sanitize value based on type
        if isinstance(value, str):
            sanitized[clean_key] = sanitize_input(value)
        elif isinstance(value, dict):
            sanitized[clean_key] = sanitize_dict(value)
        elif isinstance(value, list):
            sanitized[clean_key] = [
                sanitize_input(item) if isinstance(item, str) 
                else sanitize_dict(item) if isinstance(item, dict)
                else item
                for item in value
            ]
        else:
            sanitized[clean_key] = value
    
    return sanitized

def verify_token(token: str) -> str:
    """Verify JWT token and return user ID"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            return None
        return user_id
    except JWTError:
        return None

def validate_nutrition_data(nutrition_data: Dict[str, Any]) -> Dict[str, Any]:
    """Validate nutrition data inputs"""
    errors = []
    
    # Check required fields
    required_fields = ['calories', 'protein', 'carbs', 'fat']
    for field in required_fields:
        if field not in nutrition_data:
            errors.append(f"Missing required field: {field}")
        elif not isinstance(nutrition_data[field], (int, float)) or nutrition_data[field] < 0:
            errors.append(f"Invalid value for {field}: must be a positive number")
    
    # Validate quantity and unit
    if 'quantity' in nutrition_data:
        if not isinstance(nutrition_data['quantity'], (int, float)) or nutrition_data['quantity'] <= 0:
            errors.append("Quantity must be a positive number")
    
    if 'unit' in nutrition_data:
        valid_units = ['g', 'kg', 'mg', 'cup', 'tbsp', 'tsp', 'piece', 'slice', 'ml', 'l']
        if nutrition_data['unit'] not in valid_units:
            errors.append(f"Invalid unit. Must be one of: {', '.join(valid_units)}")
    
    return {
        "is_valid": len(errors) == 0,
        "errors": errors
    }

def rate_limit_key(user_id: str, endpoint: str) -> str:
    """Generate rate limiting key"""
    return f"rate_limit:{user_id}:{endpoint}"

class InputValidator:
    """Class for validating various types of input"""
    
    @staticmethod
    def validate_user_profile(profile_data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate user profile data"""
        errors = []
        
        # Age validation
        if 'age' in profile_data:
            age = profile_data['age']
            if not isinstance(age, int) or age < 13 or age > 120:
                errors.append("Age must be between 13 and 120")
        
        # Weight validation
        if 'weight' in profile_data:
            weight = profile_data['weight']
            if not isinstance(weight, (int, float)) or weight < 20 or weight > 500:
                errors.append("Weight must be between 20 and 500 kg")
        
        # Height validation
        if 'height' in profile_data:
            height = profile_data['height']
            if not isinstance(height, (int, float)) or height < 100 or height > 250:
                errors.append("Height must be between 100 and 250 cm")
        
        # Gender validation
        if 'gender' in profile_data:
            gender = profile_data['gender']
            if gender not in ['male', 'female', 'other']:
                errors.append("Gender must be 'male', 'female', or 'other'")
        
        # Activity level validation
        if 'activity_level' in profile_data:
            activity = profile_data['activity_level']
            valid_levels = ['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extra_active']
            if activity not in valid_levels:
                errors.append(f"Activity level must be one of: {', '.join(valid_levels)}")
        
        return {
            "is_valid": len(errors) == 0,
            "errors": errors
        }
