from fastapi import APIRouter, Depends, HTTPException, Query, status
from pymongo.database import Database
from bson import ObjectId
from datetime import datetime, timezone
from typing import List, Optional
import logging
from app.db.mongodb import get_database
from app.api.deps import get_current_user
from app.schemas.all_schemas import MessageCreate, MessageResponse
from app.services.ai_service import AIService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/conversations/{conv_id}/messages", tags=["Messages"])

@router.get("", response_model=List[MessageResponse])
def get_messages(
    conv_id: str,
    limit: int = Query(100, ge=1, le=500),
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_database)
):
    """Retrieves all messages for a given conversation in chronological order."""
    if not ObjectId.is_valid(conv_id):
        raise HTTPException(status_code=400, detail="Invalid conversation ID")

    # Verify conversation ownership
    conv = db.conversations.find_one({"_id": ObjectId(conv_id), "user_id": current_user["_id"]})
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found or unauthorized")

    cursor = db.messages.find({"conversation_id": ObjectId(conv_id)}).sort("timestamp", 1).limit(limit)
    return list(cursor)

@router.post("", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
def send_message(
    conv_id: str,
    msg_in: MessageCreate,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_database)
):
    """
    Submits a user message, stores it in MongoDB, generates an assistant response,
    stores assistant response, and atomically updates conversation statistics.
    """
    if not ObjectId.is_valid(conv_id):
        raise HTTPException(status_code=400, detail="Invalid conversation ID")

    conv_oid = ObjectId(conv_id)
    conv = db.conversations.find_one({"_id": conv_oid, "user_id": current_user["_id"]})
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found or unauthorized")

    now = datetime.now(timezone.utc)
    
    # 1. Insert user message
    user_msg_doc = {
        "conversation_id": conv_oid,
        "user_id": current_user["_id"],
        "role": "user",
        "content": msg_in.content,
        "timestamp": now,
        "metadata": {}
    }
    db.messages.insert_one(user_msg_doc)

    # 2. Update conversation title if first message
    new_title = None
    if conv.get("message_count", 0) == 0:
        # Generate title from first message preview
        snippet = msg_in.content.strip()
        new_title = snippet[:35] + ("..." if len(snippet) > 35 else "")

    # 3. Retrieve recent conversation history for bounded context
    recent_msgs = list(db.messages.find({"conversation_id": conv_oid}).sort("timestamp", 1).limit(10))
    history_tuples = [{"role": m["role"], "content": m["content"]} for m in recent_msgs]

    # 4. Generate AI response (using OpenAI SDK or labeled Offline Fallback)
    try:
        ai_text, latency, model_name, tokens = AIService.generate_response(msg_in.content, history_tuples)
    except Exception as e:
        logger.error(f"AI response generation failed: {e}")
        # Note: user_msg is stored, but assistant message failed. Return a clean HTTP 502/500 with helpful detail
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(e)
        )

    # 5. Insert assistant response
    is_fallback = "Offline Fallback" in model_name or "Deterministic" in model_name
    assistant_msg_doc = {
        "conversation_id": conv_oid,
        "user_id": current_user["_id"],
        "role": "assistant",
        "content": ai_text,
        "timestamp": datetime.now(timezone.utc),
        "response_time_ms": latency,
        "token_usage": tokens,
        "model_name": model_name,
        "metadata": {
            "fallback_engine": is_fallback,
            "provider": "openai" if not is_fallback else "offline_fallback"
        }
    }
    result_asst = db.messages.insert_one(assistant_msg_doc)
    assistant_msg_doc["_id"] = result_asst.inserted_id

    # 6. Update conversation atomically ($inc message_count by 2, update last_message_at)
    update_ops = {
        "$inc": {"message_count": 2},
        "$set": {
            "updated_at": datetime.now(timezone.utc),
            "last_message_at": datetime.now(timezone.utc)
        }
    }
    if new_title:
        update_ops["$set"]["title"] = new_title

    db.conversations.update_one({"_id": conv_oid}, update_ops)

    return assistant_msg_doc

@router.get("/search/text", response_model=List[MessageResponse])
def search_messages(
    query: str = Query(..., min_length=1, description="Keyword search query using MongoDB $text index"),
    limit: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_database)
):
    """
    Searches message contents using MongoDB Text Index ($text operator).
    Demonstrates Unit IV Text Indexing capability.
    """
    cursor = db.messages.find({
        "user_id": current_user["_id"],
        "$text": {"$search": query}
    }, {
        "score": {"$meta": "textScore"}
    }).sort([("score", {"$meta": "textScore"})]).limit(limit)

    return list(cursor)
