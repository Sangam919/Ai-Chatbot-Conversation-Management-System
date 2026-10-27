from fastapi import APIRouter, Depends, HTTPException, status
from pymongo.database import Database
from datetime import datetime, timezone
from app.db.mongodb import get_database
from app.core.security import hash_password, verify_password, create_access_token
from app.schemas.all_schemas import (
    UserCreate, UserLogin, UserResponse, TokenResponse, UserUpdate, PasswordUpdate
)
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Database = Depends(get_database)):
    """Registers a new user, hashes password, saves to MongoDB, returns JWT."""
    normalized_email = user_in.email.lower().strip()
    
    # Check if user already exists
    if db.users.find_one({"email": normalized_email}):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists"
        )
    
    now = datetime.now(timezone.utc)
    user_doc = {
        "name": user_in.name,
        "email": normalized_email,
        "password_hash": hash_password(user_in.password),
        "role": user_in.role,
        "preferences": user_in.preferences.model_dump() if user_in.preferences else {
            "theme": "dark",
            "language": "en",
            "notifications_enabled": True
        },
        "is_active": True,
        "created_at": now,
        "updated_at": now
    }
    
    result = db.users.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id
    
    token = create_access_token(data={"sub": str(result.inserted_id), "email": normalized_email, "role": user_in.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user_doc
    }

@router.post("/login", response_model=TokenResponse)
def login(login_in: UserLogin, db: Database = Depends(get_database)):
    """Authenticates credentials against MongoDB bcrypt hashes and issues JWT token."""
    normalized_email = login_in.email.lower().strip()
    user = db.users.find_one({"email": normalized_email})
    
    if not user or not verify_password(login_in.password, user.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.get("is_active", True):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Account is deactivated")
    
    token = create_access_token(data={"sub": str(user["_id"]), "email": normalized_email, "role": user.get("role", "user")})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=UserResponse)
def get_me(current_user: dict = Depends(get_current_user)):
    """Returns the authenticated profile."""
    return current_user

@router.put("/profile", response_model=UserResponse)
def update_profile(
    update_in: UserUpdate,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_database)
):
    """Updates user profile details and UI preferences."""
    updates = {"updated_at": datetime.now(timezone.utc)}
    if update_in.name is not None:
        updates["name"] = update_in.name
    if update_in.preferences is not None:
        updates["preferences"] = update_in.preferences.model_dump()
    
    db.users.update_one({"_id": current_user["_id"]}, {"$set": updates})
    updated_user = db.users.find_one({"_id": current_user["_id"]})
    return updated_user

@router.put("/password")
def change_password(
    pwd_in: PasswordUpdate,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_database)
):
    """Changes password after verifying existing password."""
    if not verify_password(pwd_in.current_password, current_user.get("password_hash", "")):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect")
    
    new_hash = hash_password(pwd_in.new_password)
    db.users.update_one(
        {"_id": current_user["_id"]},
        {"$set": {"password_hash": new_hash, "updated_at": datetime.now(timezone.utc)}}
    )
    return {"message": "Password updated successfully"}
