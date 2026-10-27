from fastapi import APIRouter, Depends, HTTPException, Query, status
from pymongo.database import Database
from bson import ObjectId
from datetime import datetime, timezone
from typing import List, Optional
from app.db.mongodb import get_database
from app.api.deps import get_current_user
from app.schemas.all_schemas import (
    ConversationCreate, ConversationUpdate, ConversationResponse
)

router = APIRouter(prefix="/conversations", tags=["Conversations"])

@router.post("", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
def create_conversation(
    conv_in: ConversationCreate,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_database)
):
    """Creates a new conversation session associated with the authenticated user."""
    now = datetime.now(timezone.utc)
    conv_doc = {
        "user_id": current_user["_id"],
        "title": conv_in.title or "New Conversation",
        "status": "active",
        "tags": conv_in.tags or [],
        "message_count": 0,
        "created_at": now,
        "updated_at": now,
        "last_message_at": None,
        "is_deleted": False
    }
    result = db.conversations.insert_one(conv_doc)
    conv_doc["_id"] = result.inserted_id
    return conv_doc

@router.get("", response_model=List[ConversationResponse])
def list_conversations(
    status: Optional[str] = Query("active", description="Filter by status: active, archived, all"),
    search: Optional[str] = Query(None, description="Search keyword in title"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_database)
):
    """Lists conversations owned by the user, sorted by last updated descending."""
    query = {"user_id": current_user["_id"], "is_deleted": {"$ne": True}}
    
    if status and status != "all":
        query["status"] = status
        
    if search and search.strip():
        # Title regex search (case insensitive)
        query["title"] = {"$regex": search.strip(), "$options": "i"}

    cursor = db.conversations.find(query).sort("updated_at", -1).skip(skip).limit(limit)
    return list(cursor)

@router.get("/{conv_id}", response_model=ConversationResponse)
def get_conversation(
    conv_id: str,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_database)
):
    """Retrieves a single conversation ensuring user ownership."""
    if not ObjectId.is_valid(conv_id):
        raise HTTPException(status_code=400, detail="Invalid conversation ID")
    
    conv = db.conversations.find_one({
        "_id": ObjectId(conv_id),
        "user_id": current_user["_id"],
        "is_deleted": {"$ne": True}
    })
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conv

@router.put("/{conv_id}", response_model=ConversationResponse)
def update_conversation(
    conv_id: str,
    conv_in: ConversationUpdate,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_database)
):
    """Updates title, tags, or archive status."""
    if not ObjectId.is_valid(conv_id):
        raise HTTPException(status_code=400, detail="Invalid conversation ID")

    updates = {"updated_at": datetime.now(timezone.utc)}
    if conv_in.title is not None:
        updates["title"] = conv_in.title
    if conv_in.status is not None:
        updates["status"] = conv_in.status
    if conv_in.tags is not None:
        updates["tags"] = conv_in.tags

    result = db.conversations.find_one_and_update(
        {"_id": ObjectId(conv_id), "user_id": current_user["_id"], "is_deleted": {"$ne": True}},
        {"$set": updates},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return result

@router.delete("/{conv_id}")
def delete_conversation(
    conv_id: str,
    permanent: bool = Query(False, description="True for hard delete, False for soft delete"),
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_database)
):
    """Deletes conversation. Hard delete cascades and purges associated messages & feedback."""
    if not ObjectId.is_valid(conv_id):
        raise HTTPException(status_code=400, detail="Invalid conversation ID")
    
    oid = ObjectId(conv_id)
    conv = db.conversations.find_one({"_id": oid, "user_id": current_user["_id"]})
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    if permanent:
        # Cascade delete messages and feedback
        db.feedback.delete_many({"conversation_id": oid})
        db.messages.delete_many({"conversation_id": oid})
        db.conversations.delete_one({"_id": oid})
        return {"message": "Conversation and associated messages permanently deleted"}
    else:
        # Soft delete
        db.conversations.update_one(
            {"_id": oid},
            {"$set": {"is_deleted": True, "updated_at": datetime.now(timezone.utc)}}
        )
        return {"message": "Conversation moved to trash (soft deleted)"}

@router.post("/{conv_id}/restore", response_model=ConversationResponse)
def restore_conversation(
    conv_id: str,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_database)
):
    """Restores a soft-deleted conversation."""
    if not ObjectId.is_valid(conv_id):
        raise HTTPException(status_code=400, detail="Invalid conversation ID")
    
    oid = ObjectId(conv_id)
    result = db.conversations.find_one_and_update(
        {"_id": oid, "user_id": current_user["_id"]},
        {"$set": {"is_deleted": False, "status": "active", "updated_at": datetime.now(timezone.utc)}},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return result
