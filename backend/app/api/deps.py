from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from bson import ObjectId
from pymongo.database import Database
from app.core.security import decode_access_token
from app.db.mongodb import get_database

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Database = Depends(get_database)) -> dict:
    """Validates JWT bearer token and retrieves user document from MongoDB."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
    user_id_str: str = payload.get("sub")
    if user_id_str is None or not ObjectId.is_valid(user_id_str):
        raise credentials_exception
    
    user = db.users.find_one({"_id": ObjectId(user_id_str)})
    if user is None:
        raise credentials_exception
    if not user.get("is_active", True):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user account")
    
    return user

def get_current_admin(current_user: dict = Depends(get_current_user)) -> dict:
    """Verifies that the authenticated user possesses the admin role."""
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrative privileges required"
        )
    return current_user
