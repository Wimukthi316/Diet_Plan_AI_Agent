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
from backend.models.chat_history import ChatMessage
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
    try:
        await init_database()
        logger.info("Database initialized")
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        logger.info("Continuing without database - some features may be limited")
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
    """Root endpoint"""
    return {
        "message": "Diet Plan AI Agents API",
        "status": "active",
        "version": "1.0.0"
    }

@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "message": "Diet Plan AI Agents API is running",
        "version": "1.0.0"
    }

@app.post("/auth/register")
async def register(user_data: dict):
    """User registration endpoint"""
    try:
        # Validate required fields
        required_fields = ["name", "email", "password"]
        for field in required_fields:
            if field not in user_data or not user_data[field]:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Missing required field: {field}"
                )
        
        # Validate password length
        if len(user_data["password"]) < 6:
            raise HTTPException(
                status_code=400, 
                detail="Password must be at least 6 characters long"
            )
        
        # Validate email format (basic check)
        if "@" not in user_data["email"]:
            raise HTTPException(
                status_code=400, 
                detail="Invalid email format"
            )
        
        user = await auth_service.register_user(user_data)
        return {
            "message": "User registered successfully", 
            "user_id": str(user.id),
            "email": user.email
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Registration error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error during registration")

@app.post("/auth/login")
async def login(credentials: dict):
    """User login endpoint"""
    try:
        # Validate required fields
        if not credentials.get("email") or not credentials.get("password"):
            raise HTTPException(
                status_code=400, 
                detail="Email and password are required"
            )
        
        token = await auth_service.authenticate_user(
            credentials.get("email"), 
            credentials.get("password")
        )
        return {
            "access_token": token, 
            "token_type": "bearer",
            "message": "Login successful"
        }
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error during login")

@app.post("/chat")
async def chat_with_agents(
    message: dict, 
    current_user: User = Depends(get_current_user)
):
    """Main chat endpoint for interacting with AI agents"""
    try:
        logger.debug(f"Processing message from user {current_user.email}")
        user_message = message.get("message", "")
        
        response = await agent_coordinator.process_user_request(
            user_id=str(current_user.id),
            message=user_message,
            context=message.get("context", {})
        )
        
        # Save chat interaction to history
        if response and user_message:
            await ChatMessage.save_chat_interaction(
                user_id=str(current_user.id),
                message=user_message,
                response=response.get("response", ""),
                agent_name=response.get("agent", "Unknown"),
                metadata={
                    "status": response.get("status"),
                    "type": response.get("type", "chat")
                }
            )
        
        return response
    except Exception as e:
        logger.error(f"Chat error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/chat/history")
async def get_chat_history(
    limit: int = 50,
    current_user: User = Depends(get_current_user)
):
    """Get user's chat history"""
    try:
        history = await ChatMessage.get_user_history(str(current_user.id), limit)
        return {
            "history": [
                {
                    "id": str(msg.id),
                    "message": msg.message,
                    "response": msg.response,
                    "agent": msg.agent_name,
                    "timestamp": msg.timestamp.isoformat(),
                    "type": msg.message_type
                }
                for msg in history
            ],
            "total": len(history)
        }
    except Exception as e:
        logger.error(f"Error getting chat history: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/chat/history")
async def clear_chat_history(current_user: User = Depends(get_current_user)):
    """Clear user's chat history"""
    try:
        await ChatMessage.find(ChatMessage.user_id == str(current_user.id)).delete()
        return {"message": "Chat history cleared successfully"}
    except Exception as e:
        logger.error(f"Error clearing chat history: {e}")
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
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", 8000)),
        reload=True
    )
