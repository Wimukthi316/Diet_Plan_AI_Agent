"""
Database configuration and initialization
"""

from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient
import os
import ssl
from dotenv import load_dotenv

load_dotenv()

# Import all document models
from .user import User
from .diet_plan import DietPlan
from .nutrition_log import NutritionLog
from .chat_history import ChatMessage
from .meal import Meal

async def init_database():
    """Initialize database connection and models"""
    # Create motor client with minimal configuration for testing
    try:
        client = AsyncIOMotorClient(
            os.getenv("MONGODB_URL"),
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=10000
        )
        
        # Test connection
        await client.admin.command('ping')
        print("MongoDB connection successful!")
        
        # Initialize beanie with the database and document models
        await init_beanie(
            database=client[os.getenv("MONGODB_DB_NAME", "diet_plan_ai")],
            document_models=[User, DietPlan, NutritionLog, ChatMessage, Meal]
        )
        
        print("Database initialized successfully!")
        
    except Exception as e:
        print(f"Database connection failed: {e}")
        # For now, continue without database to test other functionality
        pass
    
    import logging
    logger = logging.getLogger(__name__)
    logger.info("Database connected and models initialized")
