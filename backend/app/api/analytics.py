from fastapi import APIRouter, Depends
from pymongo.database import Database
from datetime import datetime, timezone, timedelta
from app.db.mongodb import get_database
from app.api.deps import get_current_user

router = APIRouter(prefix="/analytics", tags=["Analytics & Aggregations"])

@router.get("/dashboard")
def get_dashboard_metrics(
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_database)
):
    """
    Computes real-time analytics using MongoDB Aggregation Pipelines:
    1. Total and active conversations ($match, count)
    2. Message counts and average messages per conversation
    3. Average response time ($avg)
    4. Feedback sentiment distribution ($group by rating)
    5. Daily conversation creation over the last 14 days
    6. Daily message volume over the last 14 days
    7. Most active conversations ($sort by message_count)
    """
    user_id = current_user["_id"]
    is_admin = current_user.get("role") == "admin"

    # User scope match condition
    scope_user_conv = {} if is_admin else {"user_id": user_id}
    scope_user_msg = {} if is_admin else {"user_id": user_id}
    scope_user_fb = {} if is_admin else {"user_id": user_id}

    # 1. Total & Active Conversations
    total_convs = db.conversations.count_documents({**scope_user_conv, "is_deleted": {"$ne": True}})
    active_convs = db.conversations.count_documents({**scope_user_conv, "status": "active", "is_deleted": {"$ne": True}})
    total_messages = db.messages.count_documents(scope_user_msg)
    total_users = db.users.count_documents({}) if is_admin else None

    # 2. Average Response Time via Aggregation Pipeline
    avg_latency_pipeline = [
        {"$match": {**scope_user_msg, "role": "assistant", "response_time_ms": {"$exists": True}}},
        {"$group": {"_id": None, "avg_time": {"$avg": "$response_time_ms"}}}
    ]
    avg_latency_res = list(db.messages.aggregate(avg_latency_pipeline))
    avg_response_time = round(avg_latency_res[0]["avg_time"], 2) if avg_latency_res else 0.0

    # 3. Feedback Sentiment ($group by rating)
    fb_pipeline = [
        {"$match": scope_user_fb},
        {"$group": {"_id": "$rating", "count": {"$sum": 1}}}
    ]
    fb_res = list(db.feedback.aggregate(fb_pipeline))
    feedback_stats = {"positive": 0, "negative": 0}
    for item in fb_res:
        if item["_id"] in feedback_stats:
            feedback_stats[item["_id"]] = item["count"]
    
    total_fb = feedback_stats["positive"] + feedback_stats["negative"]
    positive_ratio = round((feedback_stats["positive"] / total_fb * 100), 1) if total_fb > 0 else 100.0

    # 4. Daily Conversations (Past 14 Days)
    fourteen_days_ago = datetime.now(timezone.utc) - timedelta(days=14)
    daily_conv_pipeline = [
        {"$match": {**scope_user_conv, "created_at": {"$gte": fourteen_days_ago}, "is_deleted": {"$ne": True}}},
        {
            "$group": {
                "_id": {
                    "$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}
                },
                "count": {"$sum": 1}
            }
        },
        {"$sort": {"_id": 1}}
    ]
    daily_convs = [{"date": r["_id"], "conversations": r["count"]} for r in db.conversations.aggregate(daily_conv_pipeline)]

    # 5. Daily Messages (Past 14 Days)
    daily_msg_pipeline = [
        {"$match": {**scope_user_msg, "timestamp": {"$gte": fourteen_days_ago}}},
        {
            "$group": {
                "_id": {
                    "$dateToString": {"format": "%Y-%m-%d", "date": "$timestamp"}
                },
                "count": {"$sum": 1}
            }
        },
        {"$sort": {"_id": 1}}
    ]
    daily_msgs = [{"date": r["_id"], "messages": r["count"]} for r in db.messages.aggregate(daily_msg_pipeline)]

    # 6. Top Most Active Conversations
    top_convs_cursor = db.conversations.find(
        {**scope_user_conv, "is_deleted": {"$ne": True}}
    ).sort("message_count", -1).limit(5)
    
    top_convs = [
        {
            "id": str(c["_id"]),
            "title": c.get("title", "Untitled"),
            "message_count": c.get("message_count", 0),
            "status": c.get("status", "active"),
            "updated_at": c.get("updated_at")
        } for c in top_convs_cursor
    ]

    # 7. Recent Messages with Feedback Join ($lookup demonstration)
    lookup_pipeline = [
        {"$match": {**scope_user_msg, "role": "assistant"}},
        {"$sort": {"timestamp": -1}},
        {"$limit": 5},
        {
            "$lookup": {
                "from": "feedback",
                "localField": "_id",
                "foreignField": "message_id",
                "as": "user_feedback"
            }
        },
        {
            "$project": {
                "_id": 1,
                "content": 1,
                "response_time_ms": 1,
                "timestamp": 1,
                "feedback": {"$arrayElemAt": ["$user_feedback", 0]}
            }
        }
    ]
    recent_responses = []
    for item in db.messages.aggregate(lookup_pipeline):
        recent_responses.append({
            "id": str(item["_id"]),
            "snippet": item.get("content", "")[:80] + "...",
            "response_time_ms": item.get("response_time_ms", 0),
            "timestamp": item.get("timestamp"),
            "rating": item["feedback"].get("rating") if item.get("feedback") else "unrated"
        })

    return {
        "summary": {
            "total_conversations": total_convs,
            "active_conversations": active_convs,
            "total_messages": total_messages,
            "avg_response_time_ms": avg_response_time,
            "positive_feedback_percentage": positive_ratio,
            "total_feedback_count": total_fb,
            "total_registered_users": total_users,
            "is_admin": is_admin
        },
        "charts": {
            "daily_conversations": daily_convs,
            "daily_messages": daily_msgs,
            "feedback_distribution": [
                {"name": "Positive", "value": feedback_stats["positive"]},
                {"name": "Negative", "value": feedback_stats["negative"]}
            ]
        },
        "top_conversations": top_convs,
        "recent_activity": recent_responses
    }
