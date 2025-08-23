"""
Base AI Agent class for the Diet Plan AI system
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
import google.generativeai as genai
import os
from dotenv import load_dotenv
import json
import logging
from datetime import datetime

load_dotenv()

# Configure Gemini AI
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

class BaseAgent(ABC):
    """Base class for all AI agents"""
    
    def __init__(self, name: str, role: str, model_name: str = "gemini-2.0-flash"):
        self.name = name
        self.role = role
        self.model = genai.GenerativeModel(model_name)
        self.logger = logging.getLogger(f"agent.{name}")
        
        # Agent capabilities
        self.capabilities = []
        self.communication_protocols = ["HTTP", "JSON"]
        
        # Chat history storage (in production, this should be in a database)
        self.chat_histories = {}
        
    def _get_chat_history(self, user_id: str) -> List[Dict[str, Any]]:
        """Get chat history for a user"""
        return self.chat_histories.get(user_id, [])
    
    def _add_to_chat_history(self, user_id: str, message: str, response: str, metadata: Dict = None):
        """Add interaction to chat history"""
        if user_id not in self.chat_histories:
            self.chat_histories[user_id] = []
        
        self.chat_histories[user_id].append({
            "timestamp": datetime.now().isoformat(),
            "user_message": message,
            "agent_response": response,
            "agent": self.name,
            "metadata": metadata or {}
        })
        
        # Keep only last 50 interactions per user
        if len(self.chat_histories[user_id]) > 50:
            self.chat_histories[user_id] = self.chat_histories[user_id][-50:]
        
    @abstractmethod
    async def process_request(self, request: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Process a request and return response"""
        pass
    
    @abstractmethod
    def get_agent_description(self) -> Dict[str, Any]:
        """Get agent description and capabilities"""
        pass
    
    async def generate_response(self, prompt: str, context: Dict[str, Any] = None) -> str:
        """Generate AI response using Gemini with chat history"""
        try:
            user_id = context.get("user_id") if context else None
            
            # Prepare the prompt with context and history
            full_prompt = self._prepare_prompt_with_history(prompt, context, user_id)
            
            # Log the prompt for debugging
            self.logger.info(f"Generating response for prompt: {prompt[:100]}...")
            
            # Generate response
            response = self.model.generate_content(full_prompt)
            
            # Check if response is valid
            if not response or not hasattr(response, 'text') or not response.text:
                self.logger.error("No valid response from Gemini API")
                return "I apologize, but I couldn't generate a response at this time. Please try again."
            
            response_text = response.text.strip()
            self.logger.info(f"Generated response: {response_text[:100]}...")
            
            # Add to chat history if user_id is available
            if user_id:
                self._add_to_chat_history(user_id, prompt, response_text, context)
            
            return response_text
            
        except Exception as e:
            self.logger.error(f"Error generating response: {e}")
            return f"I apologize, but I encountered an error while processing your request. Please check your internet connection and try again."
    
    def _prepare_prompt_with_history(self, prompt: str, context: Dict[str, Any] = None, user_id: str = None) -> str:
        """Prepare prompt with agent context, role, and chat history"""
        base_prompt = f"""
You are {self.name}, a specialized AI agent for diet planning and nutrition management.
Your role: {self.role}
Your capabilities: {', '.join(self.capabilities)}

You must:
1. Provide accurate, science-based nutrition information
2. Be helpful and supportive
3. Consider user's dietary restrictions and preferences
4. Respond in a structured, actionable format
5. Be transparent about limitations
6. Prioritize user safety and health
7. Maintain conversation context from previous interactions

"""
        
        # Add chat history context
        if user_id:
            history = self._get_chat_history(user_id)
            if history:
                base_prompt += "\n--- Recent Conversation History ---\n"
                # Include last 5 interactions for context
                recent_history = history[-5:] if len(history) > 5 else history
                for interaction in recent_history:
                    base_prompt += f"User: {interaction['user_message']}\n"
                    base_prompt += f"You ({self.name}): {interaction['agent_response'][:200]}...\n\n"
                base_prompt += "--- End of History ---\n\n"
        
        if context:
            base_prompt += f"Current Context: {json.dumps(context, indent=2)}\n\n"
        
        base_prompt += f"Current User Request: {prompt}\n\n"
        base_prompt += "Provide a helpful, accurate response that considers the conversation history:"
        
        return base_prompt
    
    def _prepare_prompt(self, prompt: str, context: Dict[str, Any] = None) -> str:
        """Prepare prompt with agent context and role (legacy method)"""
        return self._prepare_prompt_with_history(prompt, context, context.get("user_id") if context else None)
    
    def validate_request(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """Validate incoming request"""
        if not isinstance(request, dict):
            return {"valid": False, "error": "Request must be a dictionary"}
        
        if "message" not in request:
            return {"valid": False, "error": "Request must contain 'message' field"}
        
        return {"valid": True}
    
    async def communicate_with_agent(self, target_agent: str, message: Dict[str, Any]) -> Dict[str, Any]:
        """Communicate with another agent (Agent-to-Agent communication)"""
        # This would be implemented with the coordinator
        return {
            "status": "forwarded",
            "target": target_agent,
            "message": message,
            "from": self.name
        }
    
    def log_interaction(self, request: Dict[str, Any], response: Dict[str, Any]):
        """Log agent interactions for monitoring"""
        self.logger.info(f"Request processed: {request.get('message', 'N/A')[:100]}...")
        self.logger.info(f"Response generated: {response.get('message', 'N/A')[:100]}...")
    
    def get_health_status(self) -> Dict[str, Any]:
        """Get agent health status"""
        return {
            "agent": self.name,
            "status": "healthy",
            "capabilities": self.capabilities,
            "protocols": self.communication_protocols
        }
