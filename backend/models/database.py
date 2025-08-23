"""
Database configuration and initialization
"""

from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

# Import all document models
from .user import User
from .diet_plan import DietPlan
from .nutrition_log import NutritionLog

async def init_database():
    """Initialize database connection and models"""
    # Create motor client
    client = AsyncIOMotorClient(os.getenv("MONGODB_URL"))
    
    # Initialize beanie with the database and document models
    await init_beanie(
        database=client[os.getenv("MONGODB_DB_NAME", "diet_plan_ai")],
        document_models=[User, DietPlan, NutritionLog]
    )
    
    import logging
    logger = logging.getLogger(__name__)
    logger.info("Database connected and models initialized")
