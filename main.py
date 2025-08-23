"""
Diet Plan AI Agents - Main Application
A multi-agent AI system for diet planning, nutrition calculation, and recipe recommendations.
"""

from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from contextlib import asynccontextmanager
import uvicorn
import os
import logging
from dotenv import load_dotenv

from backend.models.database import init_database
from backend.models.user import User
from backend.services.auth import AuthService
from backend.agents.coordinator import AgentCoordinator
from backend.utils.security import verify_token

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize security
security = HTTPBearer()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    await init_database()
    logger.info("Database initialized")
    logger.info("Diet Plan AI Agents system started")
    yield
    # Shutdown
    logger.info("Shutting down Diet Plan AI Agents system")

# Initialize FastAPI app
app = FastAPI(
    title="Diet Plan AI Agents",
    description="A multi-agent AI system for personalized diet planning and nutrition management",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # React dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
auth_service = AuthService()
agent_coordinator = AgentCoordinator()

# Dependency for authentication
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current authenticated user"""
    token = credentials.credentials
    user_id = verify_token(token)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )
    user = await User.get(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "Diet Plan AI Agents API",
        "status": "active",
        "version": "1.0.0"
    }

@app.post("/auth/register")
async def register(user_data: dict):
    """User registration endpoint"""
    try:
        user = await auth_service.register_user(user_data)
        return {"message": "User registered successfully", "user_id": str(user.id)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/auth/login")
async def login(credentials: dict):
    """User login endpoint"""
    try:
        token = await auth_service.authenticate_user(
            credentials.get("email"), 
            credentials.get("password")
        )
        return {"access_token": token, "token_type": "bearer"}
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

@app.post("/chat")
async def chat_with_agents(
    message: dict, 
    current_user: User = Depends(get_current_user)
):
    """Main chat endpoint for interacting with AI agents"""
    try:
        logger.debug(f"Processing message from user {current_user.email}")
        response = await agent_coordinator.process_user_request(
            user_id=str(current_user.id),
            message=message.get("message"),
            context=message.get("context", {})
        )
        return response
    except Exception as e:
        logger.error(f"Chat error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/user/profile")
async def get_user_profile(current_user: User = Depends(get_current_user)):
    """Get user profile"""
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "name": current_user.name,
        "dietary_preferences": current_user.dietary_preferences,
        "health_goals": current_user.health_goals
    }

@app.put("/user/profile")
async def update_user_profile(
    profile_data: dict, 
    current_user: User = Depends(get_current_user)
):
    """Update user profile"""
    try:
        await current_user.update({"$set": profile_data})
        return {"message": "Profile updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=os.getenv("HOST", "localhost"),
        port=int(os.getenv("PORT", 8000)),
        reload=True
    )
