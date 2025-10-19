"""
Chat History Model - Store and retrieve user chat messages
"""

from beanie import Document
from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import Field

class ChatMessage(Document):
    """Chat message model for storing conversation history"""
    
    user_id: str = Field(..., description="User ID")
    session_id: Optional[str] = Field(default=None, description="Chat session ID")
    message: str = Field(..., description="User message")
    response: str = Field(..., description="Agent response")
    agent_name: str = Field(..., description="Name of the responding agent")
    timestamp: datetime = Field(default_factory=datetime.now, description="Message timestamp")
    message_type: str = Field(default="chat", description="Type of message")
    metadata: Optional[Dict[str, Any]] = Field(default=None, description="Additional message metadata")
    
    class Settings:
        name = "chat_messages"
        indexes = [
            "user_id",
            "session_id",
            [("user_id", 1), ("timestamp", -1)],  # Compound index for efficient queries
            [("session_id", 1), ("timestamp", 1)],  # For session-based queries
        ]
    
    @classmethod
    async def get_user_history(cls, user_id: str, limit: int = 50):
        """Get recent chat history for a user"""
        return await cls.find(
            cls.user_id == user_id
        ).sort(-cls.timestamp).limit(limit).to_list()
    
    @classmethod
    async def get_session_messages(cls, session_id: str):
        """Get all messages for a specific session"""
        return await cls.find(
            cls.session_id == session_id
        ).sort(cls.timestamp).to_list()
    
    @classmethod
    async def save_chat_interaction(cls, user_id: str, message: str, response: str, agent_name: str, session_id: str = None, metadata: Dict[str, Any] = None):
        """Save a chat interaction"""
        chat_message = cls(
            user_id=user_id,
            session_id=session_id,
            message=message,
            response=response,
            agent_name=agent_name,
            metadata=metadata or {}
        )
        await chat_message.save()
        return chat_message
