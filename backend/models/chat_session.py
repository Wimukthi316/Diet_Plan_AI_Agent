"""
Chat Session Model - Manage conversation sessions like ChatGPT
"""

from beanie import Document
from datetime import datetime
from typing import Optional
from pydantic import Field

class ChatSession(Document):
    """Chat session model for grouping conversations"""
    
    user_id: str = Field(..., description="User ID")
    title: str = Field(default="New Chat", description="Session title")
    created_at: datetime = Field(default_factory=datetime.now, description="Session creation time")
    updated_at: datetime = Field(default_factory=datetime.now, description="Last update time")
    message_count: int = Field(default=0, description="Number of messages in session")
    is_active: bool = Field(default=True, description="Is this the active session")
    
    class Settings:
        name = "chat_sessions"
        indexes = [
            "user_id",
            [("user_id", 1), ("updated_at", -1)],  # Compound index for efficient queries
            [("user_id", 1), ("is_active", 1)],
        ]
    
    @classmethod
    async def get_user_sessions(cls, user_id: str, limit: int = 50):
        """Get all sessions for a user, ordered by most recent"""
        return await cls.find(
            cls.user_id == user_id
        ).sort(-cls.updated_at).limit(limit).to_list()
    
    @classmethod
    async def get_active_session(cls, user_id: str):
        """Get the active session for a user"""
        return await cls.find_one(
            cls.user_id == user_id,
            cls.is_active == True
        )
    
    @classmethod
    async def create_new_session(cls, user_id: str, title: str = "New Chat"):
        """Create a new session and deactivate others"""
        # Deactivate all other sessions for this user
        await cls.find(
            cls.user_id == user_id,
            cls.is_active == True
        ).update({"$set": {"is_active": False}})
        
        # Create new session
        session = cls(
            user_id=user_id,
            title=title,
            is_active=True
        )
        await session.save()
        return session
    
    async def set_active(self):
        """Make this session active and deactivate others"""
        # Deactivate all other sessions
        await ChatSession.find(
            ChatSession.user_id == self.user_id,
            ChatSession.is_active == True,
            ChatSession.id != self.id
        ).update({"$set": {"is_active": False}})
        
        # Activate this session
        self.is_active = True
        await self.save()
    
    async def update_title_from_message(self, first_message: str):
        """Auto-generate title from first message"""
        # Take first 50 characters or first sentence
        title = first_message[:50].strip()
        if len(first_message) > 50:
            title += "..."
        self.title = title
        await self.save()
    
    async def increment_message_count(self):
        """Increment message count and update timestamp"""
        self.message_count += 1
        self.updated_at = datetime.now()
        await self.save()
