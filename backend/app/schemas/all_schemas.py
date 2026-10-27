from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Dict, Any, Literal
from datetime import datetime
from app.models.pyobjectid import PyObjectId

# ==========================================
# User Models
# ==========================================
class UserPreferences(BaseModel):
    theme: Literal["light", "dark", "system"] = "dark"
    language: str = "en"
    notifications_enabled: bool = True

class UserCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)
    role: Literal["user", "admin"] = "user"
    preferences: Optional[UserPreferences] = Field(default_factory=UserPreferences)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    preferences: Optional[UserPreferences] = None

class PasswordUpdate(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6, max_length=128)

class UserResponse(BaseModel):
    id: PyObjectId = Field(alias="_id")
    name: str
    email: str
    role: str
    preferences: UserPreferences
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# ==========================================
# Conversation Models
# ==========================================
class ConversationCreate(BaseModel):
    title: Optional[str] = Field("New Conversation", max_length=150)
    tags: Optional[List[str]] = Field(default_factory=list)

class ConversationUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=150)
    status: Optional[Literal["active", "archived"]] = None
    tags: Optional[List[str]] = None

class ConversationResponse(BaseModel):
    id: PyObjectId = Field(alias="_id")
    user_id: PyObjectId
    title: str
    status: str
    tags: List[str]
    message_count: int
    created_at: datetime
    updated_at: datetime
    last_message_at: Optional[datetime] = None

    class Config:
        populate_by_name = True

# ==========================================
# Message Models
# ==========================================
class MessageCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=10000)

class MessageResponse(BaseModel):
    id: PyObjectId = Field(alias="_id")
    conversation_id: PyObjectId
    user_id: PyObjectId
    role: Literal["user", "assistant", "system"]
    content: str
    timestamp: datetime
    response_time_ms: Optional[float] = None
    token_usage: Optional[Dict[str, int]] = None
    model_name: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

    class Config:
        populate_by_name = True

# ==========================================
# Feedback Models
# ==========================================
class FeedbackCreate(BaseModel):
    message_id: str
    conversation_id: str
    rating: Literal["positive", "negative"]
    comment: Optional[str] = Field(None, max_length=1000)

class FeedbackResponse(BaseModel):
    id: PyObjectId = Field(alias="_id")
    message_id: PyObjectId
    conversation_id: PyObjectId
    user_id: PyObjectId
    rating: str
    comment: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True
