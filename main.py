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
from datetime import datetime
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

def format_response_for_history(response_data: dict) -> str:
    """Format the multi-agent response for chat history storage"""
    if not response_data:
        return ""
    
    if response_data.get("error"):
        return f"Sorry, I encountered an error: {response_data['error']}"
    
    content = ""
    agent_name = "AI Assistant"
    
    # Get the primary agent name
    if response_data.get("primary_agent"):
        agent_names = {
            'nutrition_calculator': 'Nutrition Calculator',
            'recipe_finder': 'Recipe Finder', 
            'diet_tracker': 'Diet Tracker'
        }
        agent_name = agent_names.get(response_data["primary_agent"], 'AI Assistant')
    
    # Add agent identifier
    content += f"*Processed by: {agent_name}*\n\n"
    
    # Primary response
    if response_data.get("primary_response"):
        primary_resp = response_data["primary_response"]
        if primary_resp.get("response"):
            content += primary_resp["response"]
        elif isinstance(primary_resp, str):
            content += primary_resp
        else:
            # Try to extract meaningful content from structured data
            if primary_resp.get("food_analysis"):
                analysis = primary_resp["food_analysis"]
                content += f"**Nutrition Analysis for {analysis.get('food_name', 'Food')}**\n\n"
                content += f"🔥 **Calories:** {analysis.get('calories', 0)} kcal\n"
                content += f"🥩 **Protein:** {analysis.get('protein', 0)}g\n"
                content += f"🍞 **Carbs:** {analysis.get('carbs', 0)}g\n"
                content += f"🧈 **Fat:** {analysis.get('fat', 0)}g\n"
            elif primary_resp.get("recipes"):
                content += "**Recipe Suggestions Found**\n\n"
                for i, recipe in enumerate(primary_resp["recipes"][:3], 1):
                    content += f"{i}. **{recipe.get('title', 'Recipe')}**\n"
                    if recipe.get('ready_in_minutes'):
                        content += f"   ⏱️ {recipe['ready_in_minutes']} minutes\n"
                    content += "\n"
            else:
                content += str(primary_resp)
    
    # Add synthesis if available
    if response_data.get("synthesis"):
        if content and not content.endswith("\n\n"):
            content += "\n\n---\n\n"
        content += response_data["synthesis"]
    
    return content or "Response processed successfully"

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
            # Format the response for chat history storage
            response_text = format_response_for_history(response)
            agent_name = response.get("primary_agent", "Unknown")
            
            await ChatMessage.save_chat_interaction(
                user_id=str(current_user.id),
                message=user_message,
                response=response_text,
                agent_name=agent_name,
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
        "profile": {
            "age": current_user.profile.age,
            "gender": current_user.profile.gender,
            "weight": current_user.profile.weight,
            "height": current_user.profile.height,
            "activity_level": current_user.profile.activity_level,
            "dietary_preferences": current_user.profile.dietary_preferences or [],
            "allergies": current_user.profile.allergies or [],
            "health_conditions": current_user.profile.health_conditions or [],
            "health_goals": current_user.profile.health_goals or []
        }
    }

@app.put("/user/profile")
async def update_user_profile(
    profile_data: dict, 
    current_user: User = Depends(get_current_user)
):
    """Update user profile"""
    try:
        # Validate profile data
        from backend.utils.security import InputValidator
        validation_result = InputValidator.validate_user_profile(profile_data)
        
        if not validation_result["is_valid"]:
            raise HTTPException(
                status_code=400, 
                detail=f"Validation failed: {', '.join(validation_result['errors'])}"
            )
        
        # Update the nested profile fields
        update_data = {}
        for key, value in profile_data.items():
            update_data[f"profile.{key}"] = value
        
        # Also update the updated_at timestamp
        update_data["updated_at"] = datetime.utcnow()
        
        await current_user.update({"$set": update_data})
        
        # Return updated profile
        updated_user = await User.get(current_user.id)
        return {
            "message": "Profile updated successfully",
            "profile": {
                "age": updated_user.profile.age,
                "gender": updated_user.profile.gender,
                "weight": updated_user.profile.weight,
                "height": updated_user.profile.height,
                "activity_level": updated_user.profile.activity_level,
                "dietary_preferences": updated_user.profile.dietary_preferences or [],
                "allergies": updated_user.profile.allergies or [],
                "health_conditions": updated_user.profile.health_conditions or [],
                "health_goals": updated_user.profile.health_goals or []
            }
        }
    except Exception as e:
        logger.error(f"Error updating profile: {e}")
        raise HTTPException(status_code=400, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", 8000)),
        reload=True
    )
