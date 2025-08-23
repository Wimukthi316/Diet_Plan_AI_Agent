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
        
    @abstractmethod
    async def process_request(self, request: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Process a request and return response"""
        pass
    
    @abstractmethod
    def get_agent_description(self) -> Dict[str, Any]:
        """Get agent description and capabilities"""
        pass
    
    async def generate_response(self, prompt: str, context: Dict[str, Any] = None) -> str:
        """Generate AI response using Gemini"""
        try:
            # Prepare the prompt with context
            full_prompt = self._prepare_prompt(prompt, context)
            
            # Generate response
            response = self.model.generate_content(full_prompt)
            return response.text
            
        except Exception as e:
            self.logger.error(f"Error generating response: {e}")
            return f"I apologize, but I encountered an error while processing your request: {str(e)}"
    
    def _prepare_prompt(self, prompt: str, context: Dict[str, Any] = None) -> str:
        """Prepare prompt with agent context and role"""
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

"""
        
        if context:
            base_prompt += f"\nContext: {json.dumps(context, indent=2)}\n"
        
        base_prompt += f"\nUser Request: {prompt}\n"
        base_prompt += "\nProvide a helpful, accurate response:"
        
        return base_prompt
    
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
