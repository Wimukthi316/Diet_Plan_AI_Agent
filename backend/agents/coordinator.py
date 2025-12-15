"""
Agent Coordinator - Manages communication and coordination between AI agents
"""

import json
from typing import Dict, Any, List, Optional
from backend.agents.nutrition_calculator import NutritionCalculatorAgent
from backend.agents.recipe_finder import RecipeFinderAgent
from backend.agents.diet_tracker import DietTrackerAgent
from backend.utils.security import sanitize_input, sanitize_dict
import logging
import asyncio

class AgentCoordinator:
    """Coordinates communication between AI agents using MCP-like protocols"""
    
    def __init__(self):
        self.logger = logging.getLogger("agent_coordinator")
        
        # Initialize agents
        self.agents = {
            "nutrition_calculator": NutritionCalculatorAgent(),
            "recipe_finder": RecipeFinderAgent(),
            "diet_tracker": DietTrackerAgent()
        }
        
        # Agent communication protocols
        self.communication_protocols = ["HTTP", "JSON", "A2A"]  # Agent-to-Agent
        
        # Request routing rules
        self.routing_rules = {
            # Nutrition-related keywords
            "nutrition": "nutrition_calculator",
            "calories": "nutrition_calculator", 
            "nutrients": "nutrition_calculator",
            "analyze": "nutrition_calculator",
            "calculate": "nutrition_calculator",
            
            # Recipe-related keywords
            "recipe": "recipe_finder",
            "cooking": "recipe_finder",
            "meal": "recipe_finder",
            "ingredients": "recipe_finder",
            "substitute": "recipe_finder",
            
            # Tracking-related keywords
            "track": "diet_tracker",
            "log": "diet_tracker",
            "progress": "diet_tracker",
            "goal": "diet_tracker",
            "summary": "diet_tracker",
            "insight": "diet_tracker"
        }
    
    async def process_user_request(self, user_id: str, message: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Main entry point for processing user requests"""
        try:
            # Sanitize inputs
            message = sanitize_input(message)
            context = sanitize_dict(context or {})
            context["user_id"] = user_id
            
            # Determine intent and route to appropriate agent(s)
            intent_analysis = await self._analyze_user_intent(message, context)
            
            # Route request to primary agent
            primary_agent = intent_analysis["primary_agent"]
            primary_response = await self._route_to_agent(primary_agent, {
                "message": message,
                "type": intent_analysis.get("request_type", "general")
            }, context)
            
            # Check if collaboration with other agents is needed
            collaboration_needed = intent_analysis.get("collaboration_needed", [])
            collaborations = {}
            
            for agent_name in collaboration_needed:
                if agent_name != primary_agent:
                    collab_response = await self._collaborate_with_agent(
                        agent_name, primary_response, context
                    )
                    collaborations[agent_name] = collab_response
            
            # Compile final response
            final_response = await self._compile_response(
                primary_response, collaborations, intent_analysis, context
            )
            
            # Log interaction
            self._log_interaction(user_id, message, final_response)
            
            return final_response
            
        except Exception as e:
            error_str = str(e)
            self.logger.error(f"Error processing user request: {e}")
            
            # Detect specific error types
            if '429' in error_str or 'quota' in error_str.lower() or 'rate limit' in error_str.lower():
                return {
                    "error": "⚠️ API quota limit reached. The AI service will be restored within 24 hours. You can still use food database lookups!",
                    "status": "quota_exceeded",
                    "coordinator": "AgentCoordinator",
                    "suggestion": "Try searching for specific foods using the nutrition database, or check your API quota at https://ai.google.dev/usage"
                }
            elif 'api key' in error_str.lower() or '401' in error_str or '403' in error_str:
                return {
                    "error": "⚠️ API configuration issue. Please check your API keys in the .env file.",
                    "status": "config_error",
                    "coordinator": "AgentCoordinator"
                }
            else:
                return {
                    "error": "I encountered an error while processing your request. Please try again.",
                    "status": "error",
                    "coordinator": "AgentCoordinator"
                }
    
    async def _analyze_user_intent(self, message: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze user intent to determine routing"""
        message_lower = message.lower()
        
        # Score each agent based on keyword matching
        agent_scores = {agent: 0 for agent in self.agents.keys()}
        
        for keyword, agent in self.routing_rules.items():
            if keyword in message_lower:
                agent_scores[agent] += 1
        
        # Determine primary agent (highest score)
        primary_agent = max(agent_scores, key=agent_scores.get)
        
        # If no clear winner, use context or default to nutrition_calculator
        if agent_scores[primary_agent] == 0:
            primary_agent = "nutrition_calculator"  # Default agent
        
        # Determine request type based on message content
        request_type = self._determine_request_type(message_lower)
        
        # Determine if collaboration is needed
        collaboration_needed = self._determine_collaboration_needs(message_lower, agent_scores)
        
        return {
            "primary_agent": primary_agent,
            "request_type": request_type,
            "collaboration_needed": collaboration_needed,
            "agent_scores": agent_scores
        }
    
    def _determine_request_type(self, message: str) -> str:
        """Determine the specific type of request"""
        type_keywords = {
            "analyze_food": ["analyze", "nutrition", "breakdown"],
            "search_food": ["search", "find food", "lookup"],
            "find_recipes": ["recipe", "cooking", "meal ideas"],
            "log_food": ["log", "add", "record", "ate"],
            "daily_summary": ["summary", "today", "progress"],
            "recommendations": ["suggest", "recommend", "advice"]
        }
        
        for request_type, keywords in type_keywords.items():
            if any(keyword in message for keyword in keywords):
                return request_type
        
        return "general"
    
    def _determine_collaboration_needs(self, message: str, agent_scores: Dict[str, int]) -> List[str]:
        """Determine which agents should collaborate"""
        collaboration_triggers = {
            "meal plan": ["recipe_finder", "nutrition_calculator"],
            "recipe nutrition": ["recipe_finder", "nutrition_calculator"],
            "track recipe": ["recipe_finder", "diet_tracker"],
            "nutritional goal": ["nutrition_calculator", "diet_tracker"],
            "healthy recipe": ["recipe_finder", "nutrition_calculator"]
        }
        
        for trigger, agents in collaboration_triggers.items():
            if trigger in message:
                return agents
        
        # If multiple agents have scores > 0, consider collaboration
        high_scoring_agents = [agent for agent, score in agent_scores.items() if score > 0]
        if len(high_scoring_agents) > 1:
            return high_scoring_agents
        
        return []
    
    async def _route_to_agent(self, agent_name: str, request: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Route request to specific agent"""
        if agent_name not in self.agents:
            return {"error": f"Unknown agent: {agent_name}", "status": "error"}
        
        agent = self.agents[agent_name]
        
        try:
            response = await agent.process_request(request, context)
            response["processed_by"] = agent_name
            return response
        except Exception as e:
            self.logger.error(f"Error routing to {agent_name}: {e}")
            return {
                "error": f"Agent {agent_name} encountered an error",
                "status": "error",
                "agent": agent_name
            }
    
    async def _collaborate_with_agent(self, agent_name: str, primary_response: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Enable collaboration between agents"""
        if agent_name not in self.agents:
            return {"error": f"Unknown agent: {agent_name}"}
        
        agent = self.agents[agent_name]
        
        # Create collaboration request based on primary response
        collab_request = self._create_collaboration_request(primary_response, agent_name, context)
        
        try:
            return await agent.process_request(collab_request, context)
        except Exception as e:
            self.logger.error(f"Error in collaboration with {agent_name}: {e}")
            return {"error": f"Collaboration with {agent_name} failed"}
    
    def _create_collaboration_request(self, primary_response: Dict[str, Any], target_agent: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Create a collaboration request for an agent"""
        primary_agent = primary_response.get("processed_by", "unknown")
        
        # Define collaboration patterns
        if primary_agent == "nutrition_calculator" and target_agent == "recipe_finder":
            # Nutrition → Recipe: Find recipes with specific nutritional profile
            return {
                "message": "Find recipes that match the analyzed nutritional requirements",
                "type": "find_recipes",
                "nutritional_criteria": primary_response.get("food_analysis", {})
            }
        
        elif primary_agent == "recipe_finder" and target_agent == "nutrition_calculator":
            # Recipe → Nutrition: Analyze nutritional content of found recipes
            recipes = primary_response.get("recipes", [])
            if recipes:
                return {
                    "message": "Analyze nutritional content of these recipes",
                    "type": "calculate_recipe",
                    "recipe": recipes[0]  # Analyze first recipe
                }
        
        elif target_agent == "diet_tracker":
            # Any → Tracker: Log or track the information
            return {
                "message": "Track this information for the user",
                "type": "insights",
                "data_to_track": primary_response
            }
        
        # Default collaboration request
        return {
            "message": f"Collaborate with information from {primary_agent}",
            "type": "general",
            "collaboration_data": primary_response
        }
    
    async def _compile_response(self, primary_response: Dict[str, Any], collaborations: Dict[str, Any], intent_analysis: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Compile final response from primary agent and collaborations"""
        final_response = {
            "coordinator": "AgentCoordinator",
            "primary_agent": intent_analysis["primary_agent"],
            "primary_response": primary_response,
            "status": primary_response.get("status", "unknown")
        }
        
        # Add collaboration results if any
        if collaborations:
            final_response["collaborations"] = collaborations
            
            # Generate synthesis if multiple agents contributed
            if len(collaborations) > 0:
                synthesis = await self._synthesize_multi_agent_response(
                    primary_response, collaborations, context
                )
                final_response["synthesis"] = synthesis
        
        # Add agent communication metadata
        final_response["communication"] = {
            "protocols_used": self.communication_protocols,
            "agents_involved": [intent_analysis["primary_agent"]] + list(collaborations.keys()),
            "routing_method": "intent_analysis",
            "collaboration_type": "A2A" if collaborations else "single_agent"
        }
        
        return final_response
    
    async def _synthesize_multi_agent_response(self, primary_response: Dict[str, Any], collaborations: Dict[str, Any], context: Dict[str, Any]) -> str:
        """Synthesize responses from multiple agents into a coherent answer"""
        # Use the nutrition calculator agent's AI to synthesize responses
        nutrition_agent = self.agents["nutrition_calculator"]
        
        synthesis_prompt = f"""
        Synthesize these responses from different AI agents into a coherent, helpful answer:
        
        Primary Response: {json.dumps(primary_response, indent=2)}
        
        Collaboration Responses: {json.dumps(collaborations, indent=2)}
        
        Create a unified response that:
        1. Addresses the user's original question
        2. Integrates insights from all agents
        3. Provides actionable recommendations
        4. Maintains a helpful, conversational tone
        
        Keep it concise but comprehensive.
        """
        
        try:
            synthesis = await nutrition_agent.generate_response(synthesis_prompt, context)
            return synthesis
        except Exception as e:
            self.logger.error(f"Error synthesizing responses: {e}")
            return "Multiple agents have provided information to help answer your question."
    
    def _log_interaction(self, user_id: str, message: str, response: Dict[str, Any]):
        """Log agent interactions for monitoring and analytics"""
        self.logger.info(f"User {user_id}: {message[:100]}...")
        self.logger.info(f"Primary agent: {response.get('primary_agent', 'unknown')}")
        self.logger.info(f"Collaborations: {list(response.get('collaborations', {}).keys())}")
        self.logger.info(f"Status: {response.get('status', 'unknown')}")
    
    async def get_system_status(self) -> Dict[str, Any]:
        """Get system health status"""
        agent_statuses = {}
        
        for agent_name, agent in self.agents.items():
            try:
                agent_statuses[agent_name] = agent.get_health_status()
            except Exception as e:
                agent_statuses[agent_name] = {
                    "status": "error",
                    "error": str(e)
                }
        
        return {
            "coordinator_status": "healthy",
            "total_agents": len(self.agents),
            "communication_protocols": self.communication_protocols,
            "agent_statuses": agent_statuses
        }
    
    async def get_agent_capabilities(self) -> Dict[str, Any]:
        """Get all agent capabilities"""
        capabilities = {}
        
        for agent_name, agent in self.agents.items():
            capabilities[agent_name] = agent.get_agent_description()
        
        return {
            "coordinator": "AgentCoordinator",
            "total_agents": len(self.agents),
            "agent_capabilities": capabilities,
            "routing_rules": self.routing_rules
        }
