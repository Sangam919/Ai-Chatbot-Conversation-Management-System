from fastapi import APIRouter, Depends, HTTPException, status
from pymongo.database import Database
from bson import ObjectId
from datetime import datetime, timezone
from typing import List, Optional
from app.db.mongodb import get_database
from app.api.deps import get_current_user
from app.schemas.all_schemas import FeedbackCreate, FeedbackResponse

router = APIRouter(prefix="/feedback", tags=["Feedback"])

@router.post("", response_model=FeedbackResponse, status_code=status.HTTP_201_CREATED)
def submit_feedback(
    fb_in: FeedbackCreate,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_database)
):
    """
    Submits thumbs up/down rating and comment for an assistant message.
    Enforces one feedback record per user per message via upsert.
    """
    if not ObjectId.is_valid(fb_in.message_id) or not ObjectId.is_valid(fb_in.conversation_id):
        raise HTTPException(status_code=400, detail="Invalid message or conversation ID")

    msg_oid = ObjectId(fb_in.message_id)
    conv_oid = ObjectId(fb_in.conversation_id)

    # Verify message exists and belongs to conversation
    msg = db.messages.find_one({"_id": msg_oid, "conversation_id": conv_oid})
    if not msg:
        raise HTTPException(status_code=404, detail="Target message not found")
    if msg.get("role") != "assistant":
        raise HTTPException(status_code=400, detail="Feedback can only be submitted for assistant responses")

    now = datetime.now(timezone.utc)
    # Upsert pattern in PyMongo
    filter_query = {
        "user_id": current_user["_id"],
        "message_id": msg_oid
    }
    update_doc = {
        "$set": {
            "conversation_id": conv_oid,
            "rating": fb_in.rating,
            "comment": fb_in.comment,
            "updated_at": now
        },
        "$setOnInsert": {
            "created_at": now
        }
    }
    db.feedback.update_one(filter_query, update_doc, upsert=True)
    saved = db.feedback.find_one(filter_query)
    return saved

@router.get("/message/{msg_id}", response_model=Optional[FeedbackResponse])
def get_message_feedback(
    msg_id: str,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_database)
):
    """Retrieves existing feedback submitted by current user for a message."""
    if not ObjectId.is_valid(msg_id):
        raise HTTPException(status_code=400, detail="Invalid message ID")

    fb = db.feedback.find_one({
        "message_id": ObjectId(msg_id),
        "user_id": current_user["_id"]
    })
    return fb
