"""
Authentication service for user management
"""

from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional
import os
from dotenv import load_dotenv

from backend.models.user import User, UserProfile

load_dotenv()

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

class AuthService:
    """Authentication service class"""
    
    @staticmethod
    def hash_password(password: str) -> str:
        """Hash a password"""
        return pwd_context.hash(password)
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash"""
        return pwd_context.verify(plain_password, hashed_password)
    
    @staticmethod
    def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
        """Create a JWT access token"""
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt
    
    @staticmethod
    def verify_token(token: str) -> Optional[str]:
        """Verify a JWT token and return user ID"""
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            user_id: str = payload.get("sub")
            return user_id
        except JWTError:
            return None
    
    async def register_user(self, user_data: dict) -> User:
        """Register a new user"""
        # Check if user already exists
        existing_user = await User.find_one(User.email == user_data["email"])
        if existing_user:
            raise ValueError("User with this email already exists")
        
        # Hash password
        hashed_password = self.hash_password(user_data["password"])
        
        # Create user profile
        profile_data = user_data.get("profile", {})
        profile = UserProfile(**profile_data)
        
        # Create user
        user = User(
            name=user_data["name"],
            email=user_data["email"],
            password_hash=hashed_password,
            profile=profile
        )
        
        await user.insert()
        return user
    
    async def authenticate_user(self, email: str, password: str) -> str:
        """Authenticate user and return access token"""
        # Find user
        user = await User.find_one(User.email == email)
        if not user:
            raise ValueError("Invalid email or password")
        
        # Verify password
        if not self.verify_password(password, user.password_hash):
            raise ValueError("Invalid email or password")
        
        if not user.is_active:
            raise ValueError("Account is deactivated")
        
        # Create access token
        access_token = self.create_access_token(data={"sub": str(user.id)})
        return access_token
    
    async def get_user_by_token(self, token: str) -> Optional[User]:
        """Get user by JWT token"""
        user_id = self.verify_token(token)
        if not user_id:
            return None
        
        user = await User.get(user_id)
        return user
