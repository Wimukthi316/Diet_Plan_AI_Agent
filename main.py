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
from backend.models.chat_session import ChatSession
from backend.models.meal import Meal
from backend.services.auth import AuthService
from backend.agents.coordinator import AgentCoordinator
from backend.agents.diet_tracker import DietTrackerAgent
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
diet_tracker_agent = DietTrackerAgent()

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
        email = credentials.get("email", "").strip()
        password = credentials.get("password", "")
        
        if not email:
            raise HTTPException(
                status_code=400, 
                detail="Please enter your email address"
            )
        
        if not password:
            raise HTTPException(
                status_code=400, 
                detail="Please enter your password"
            )
            
        # Basic email format validation
        if "@" not in email:
            raise HTTPException(
                status_code=400, 
                detail="Please enter a valid email address"
            )
        
        token = await auth_service.authenticate_user(email, password)
        return {
            "access_token": token, 
            "token_type": "bearer",
            "message": "Login successful"
        }
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(status_code=500, detail="Something went wrong. Please try again or contact support if the problem persists.")

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
        session_id = message.get("session_id")
        
        # Get or create active session
        if not session_id:
            active_session = await ChatSession.get_active_session(str(current_user.id))
            if not active_session:
                active_session = await ChatSession.create_new_session(str(current_user.id))
            session_id = str(active_session.id)
        else:
            active_session = await ChatSession.get(session_id)
            if not active_session:
                raise HTTPException(status_code=404, detail="Session not found")
            await active_session.set_active()
        
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
                session_id=session_id,
                message=user_message,
                response=response_text,
                agent_name=agent_name,
                metadata={
                    "status": response.get("status"),
                    "type": response.get("type", "chat")
                }
            )
            
            # Update session
            await active_session.increment_message_count()
            
            # Auto-generate title from first message if still default
            if active_session.message_count == 1 and active_session.title == "New Chat":
                await active_session.update_title_from_message(user_message)
        
        # Include session_id in response
        response["session_id"] = session_id
        
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

# =====================================================
# CHAT SESSION ENDPOINTS (ChatGPT-style sessions)
# =====================================================

@app.get("/chat/sessions")
async def get_chat_sessions(current_user: User = Depends(get_current_user)):
    """Get all chat sessions for the user"""
    try:
        sessions = await ChatSession.get_user_sessions(str(current_user.id))
        return {
            "sessions": [
                {
                    "id": str(session.id),
                    "title": session.title,
                    "message_count": session.message_count,
                    "created_at": session.created_at.isoformat(),
                    "updated_at": session.updated_at.isoformat(),
                    "is_active": session.is_active
                }
                for session in sessions
            ],
            "total": len(sessions)
        }
    except Exception as e:
        logger.error(f"Error getting chat sessions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat/sessions")
async def create_chat_session(
    session_data: dict,
    current_user: User = Depends(get_current_user)
):
    """Create a new chat session"""
    try:
        title = session_data.get("title", "New Chat")
        session = await ChatSession.create_new_session(str(current_user.id), title)
        return {
            "id": str(session.id),
            "title": session.title,
            "message_count": session.message_count,
            "created_at": session.created_at.isoformat(),
            "updated_at": session.updated_at.isoformat(),
            "is_active": session.is_active
        }
    except Exception as e:
        logger.error(f"Error creating chat session: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/chat/sessions/{session_id}/messages")
async def get_session_messages(
    session_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get all messages for a specific session"""
    try:
        # Verify session belongs to user
        session = await ChatSession.get(session_id)
        if not session or session.user_id != str(current_user.id):
            raise HTTPException(status_code=404, detail="Session not found")
        
        messages = await ChatMessage.get_session_messages(session_id)
        return {
            "messages": [
                {
                    "id": str(msg.id),
                    "message": msg.message,
                    "response": msg.response,
                    "agent": msg.agent_name,
                    "timestamp": msg.timestamp.isoformat(),
                    "type": msg.message_type
                }
                for msg in messages
            ],
            "session": {
                "id": str(session.id),
                "title": session.title,
                "message_count": session.message_count
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting session messages: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/chat/sessions/{session_id}/activate")
async def activate_session(
    session_id: str,
    current_user: User = Depends(get_current_user)
):
    """Make a session active"""
    try:
        session = await ChatSession.get(session_id)
        if not session or session.user_id != str(current_user.id):
            raise HTTPException(status_code=404, detail="Session not found")
        
        await session.set_active()
        return {
            "message": "Session activated",
            "session_id": str(session.id)
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error activating session: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/chat/sessions/{session_id}")
async def delete_session(
    session_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a chat session and all its messages"""
    try:
        session = await ChatSession.get(session_id)
        if not session or session.user_id != str(current_user.id):
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Delete all messages in this session
        await ChatMessage.find(ChatMessage.session_id == session_id).delete()
        
        # Delete the session
        await session.delete()
        
        return {"message": "Session deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting session: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/chat/sessions/{session_id}/title")
async def update_session_title(
    session_id: str,
    title_data: dict,
    current_user: User = Depends(get_current_user)
):
    """Update session title"""
    try:
        session = await ChatSession.get(session_id)
        if not session or session.user_id != str(current_user.id):
            raise HTTPException(status_code=404, detail="Session not found")
        
        new_title = title_data.get("title", "").strip()
        if not new_title:
            raise HTTPException(status_code=400, detail="Title cannot be empty")
        
        session.title = new_title
        await session.save()
        
        return {
            "message": "Title updated",
            "title": session.title
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating session title: {e}")
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

# =====================================================
# MEAL TRACKING ENDPOINTS
# =====================================================

@app.post("/nutrition/meals")
async def add_meal(meal_data: dict, current_user: User = Depends(get_current_user)):
    """Add a new meal entry"""
    try:
        # Create meal document
        meal = Meal(
            user_id=current_user.id,
            meal_name=meal_data.get("meal_name"),
            meal_type=meal_data.get("meal_type", "snack"),
            calories=float(meal_data.get("calories", 0)),
            protein=float(meal_data.get("protein", 0)),
            carbs=float(meal_data.get("carbs", 0)),
            fats=float(meal_data.get("fats", 0)),
            fiber=float(meal_data.get("fiber", 0)),
            serving_size=meal_data.get("serving_size"),
            notes=meal_data.get("notes"),
            date=meal_data.get("date", datetime.utcnow().strftime("%Y-%m-%d"))
        )
        
        await meal.insert()
        
        return {
            "message": "Meal added successfully",
            "meal": {
                "id": str(meal.id),
                "meal_name": meal.meal_name,
                "meal_type": meal.meal_type,
                "calories": meal.calories,
                "protein": meal.protein,
                "carbs": meal.carbs,
                "fats": meal.fats,
                "fiber": meal.fiber,
                "serving_size": meal.serving_size,
                "notes": meal.notes,
                "date": meal.date
            }
        }
    except Exception as e:
        logger.error(f"Error adding meal: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to add meal: {str(e)}")

@app.get("/nutrition/meals")
async def get_meals(date: str = None, current_user: User = Depends(get_current_user)):
    """Get meals for a specific date or all meals"""
    try:
        query = {"user_id": current_user.id}
        
        if date:
            query["date"] = date
        
        meals = await Meal.find(query).sort("-created_at").to_list()
        
        return [
            {
                "id": str(meal.id),
                "_id": str(meal.id),
                "meal_name": meal.meal_name,
                "meal_type": meal.meal_type,
                "calories": meal.calories,
                "protein": meal.protein,
                "carbs": meal.carbs,
                "fats": meal.fats,
                "fiber": meal.fiber,
                "serving_size": meal.serving_size,
                "notes": meal.notes,
                "date": meal.date,
                "created_at": meal.created_at.isoformat()
            }
            for meal in meals
        ]
    except Exception as e:
        logger.error(f"Error fetching meals: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch meals: {str(e)}")

@app.delete("/nutrition/meals/{meal_id}")
async def delete_meal(meal_id: str, current_user: User = Depends(get_current_user)):
    """Delete a meal entry"""
    try:
        from bson import ObjectId
        
        meal = await Meal.get(ObjectId(meal_id))
        
        if not meal:
            raise HTTPException(status_code=404, detail="Meal not found")
        
        # Verify the meal belongs to the current user
        if meal.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to delete this meal")
        
        await meal.delete()
        
        return {"message": "Meal deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting meal: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete meal: {str(e)}")

@app.get("/nutrition/meals/summary/{date}")
async def get_daily_summary(date: str, current_user: User = Depends(get_current_user)):
    """Get nutritional summary for a specific date"""
    try:
        meals = await Meal.find({"user_id": current_user.id, "date": date}).to_list()
        
        if not meals:
            return {
                "date": date,
                "total_calories": 0,
                "total_protein": 0,
                "total_carbs": 0,
                "total_fats": 0,
                "total_fiber": 0,
                "meal_count": 0
            }
        
        summary = {
            "date": date,
            "total_calories": sum(meal.calories for meal in meals),
            "total_protein": sum(meal.protein for meal in meals),
            "total_carbs": sum(meal.carbs for meal in meals),
            "total_fats": sum(meal.fats for meal in meals),
            "total_fiber": sum(meal.fiber for meal in meals),
            "meal_count": len(meals)
        }
        
        return summary
    except Exception as e:
        logger.error(f"Error getting daily summary: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get summary: {str(e)}")

@app.post("/nutrition/analyze-and-suggest")
async def analyze_and_suggest_meals(
    request_data: dict,
    current_user: User = Depends(get_current_user)
):
    """
    Analyze user's daily food intake against their health goals and provide suggestions.
    This endpoint uses AI to evaluate eating patterns and recommend improvements.
    """
    try:
        date = request_data.get("date", datetime.utcnow().strftime("%Y-%m-%d"))
        
        # Use the diet tracker agent to analyze intake and suggest meals
        analysis = await diet_tracker_agent.analyze_daily_intake_and_suggest(
            user_id=str(current_user.id),
            date=date
        )
        
        return analysis
        
    except Exception as e:
        logger.error(f"Error analyzing daily intake: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to analyze daily intake: {str(e)}"
        )

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", 8000)),
        reload=True
    )
