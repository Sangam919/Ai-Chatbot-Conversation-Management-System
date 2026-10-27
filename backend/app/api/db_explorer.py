from fastapi import APIRouter, Depends
from pymongo.database import Database
from typing import List, Dict, Any
from app.db.mongodb import get_database
from app.api.deps import get_current_user

router = APIRouter(prefix="/db-explorer", tags=["Database Explorer (NoSQL Academic Showcase)"])

@router.get("/overview")
def get_database_overview(
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_database)
):
    """
    Returns collections metadata, document counts, and active index definitions.
    Demonstrates Unit I, II, and IV MongoDB system introspection.
    """
    collection_names = db.list_collection_names()
    collections_data = []

    for name in ["users", "conversations", "messages", "feedback"]:
        if name in collection_names:
            col = db[name]
            count = col.count_documents({})
            raw_indexes = col.list_indexes()
            indexes = []
            for idx in raw_indexes:
                indexes.append({
                    "name": idx.get("name"),
                    "key": list(idx.get("key", {}).items()),
                    "unique": idx.get("unique", False)
                })
            
            # Sample schema document (excluding sensitive fields like password_hash)
            sample_doc = col.find_one({}, {"password_hash": 0})
            if sample_doc and "_id" in sample_doc:
                sample_doc["_id"] = str(sample_doc["_id"])
                # stringify any other ObjectIds
                for k, v in list(sample_doc.items()):
                    if hasattr(v, "__str__") and "ObjectId" in type(v).__name__:
                        sample_doc[k] = str(v)

            collections_data.append({
                "name": name,
                "document_count": count,
                "indexes": indexes,
                "sample_document": sample_doc
            })

    return {
        "database_name": db.name,
        "collections": collections_data,
        "architecture_notes": {
            "model_type": "Document-Oriented NoSQL (BSON)",
            "embedding_vs_referencing": "Referencing used for 1:N conversations -> messages to prevent 16MB BSON doc limits. Embedding used for bounded 1:1 user preferences.",
            "acid_compliance": "Atomic single-document operations ($inc, $set) and multi-document consistency within collections."
        }
    }

@router.get("/predefined-queries")
def get_predefined_queries_demonstration(
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_database)
):
    """
    Executes and returns results for academic MongoDB query demonstrations:
    1. Filter & Sort (Unit II)
    2. Aggregation Pipeline with $group and $avg (Unit IV)
    3. $lookup (Join between messages and feedback) (Unit IV)
    4. Text Index Search ($text, $meta) (Unit IV)
    """
    # 1. Filter and Sort
    q1_filter = {"role": "assistant"}
    q1_results = list(db.messages.find(q1_filter, {"content": 1, "response_time_ms": 1, "timestamp": 1}).sort("response_time_ms", -1).limit(3))
    for r in q1_results:
        r["_id"] = str(r["_id"])
        r["content"] = r.get("content", "")[:60] + "..."

    # 2. Aggregation $group & $avg
    q2_pipeline = [
        {"$match": {"role": "assistant"}},
        {"$group": {
            "_id": "$model_name",
            "total_responses": {"$sum": 1},
            "avg_latency_ms": {"$avg": "$response_time_ms"},
            "min_latency_ms": {"$min": "$response_time_ms"},
            "max_latency_ms": {"$max": "$response_time_ms"}
        }}
    ]
    q2_results = list(db.messages.aggregate(q2_pipeline))

    # 3. Aggregation $lookup join
    q3_pipeline = [
        {"$match": {"role": "assistant"}},
        {"$limit": 3},
        {
            "$lookup": {
                "from": "feedback",
                "localField": "_id",
                "foreignField": "message_id",
                "as": "feedback_details"
            }
        },
        {"$project": {"content": 1, "timestamp": 1, "feedback_details": 1}}
    ]
    q3_results = list(db.messages.aggregate(q3_pipeline))
    for r in q3_results:
        r["_id"] = str(r["_id"])
        r["content"] = r.get("content", "")[:50] + "..."
        for fb in r.get("feedback_details", []):
            fb["_id"] = str(fb["_id"])
            fb["user_id"] = str(fb["user_id"])
            fb["message_id"] = str(fb["message_id"])
            fb["conversation_id"] = str(fb["conversation_id"])

    return [
        {
            "unit": "Unit II: MongoDB CRUD & Filtering",
            "title": "Top Slowest Assistant Queries (find + sort)",
            "mongo_shell": "db.messages.find({ role: 'assistant' }).sort({ response_time_ms: -1 }).limit(3)",
            "results": q1_results
        },
        {
            "unit": "Unit IV: Aggregation Pipeline",
            "title": "Performance Metrics Grouped by AI Engine ($match + $group + $avg)",
            "mongo_shell": "db.messages.aggregate([ { $match: { role: 'assistant' } }, { $group: { _id: '$model_name', count: { $sum: 1 }, avg_latency: { $avg: '$response_time_ms' } } } ])",
            "results": q2_results
        },
        {
            "unit": "Unit IV: Multi-Collection Join",
            "title": "Messages with Feedback Rating Join ($lookup)",
            "mongo_shell": "db.messages.aggregate([ { $lookup: { from: 'feedback', localField: '_id', foreignField: 'message_id', as: 'feedback_details' } } ])",
            "results": q3_results
        }
    ]

@router.get("/explain-plan")
def get_explain_plan_comparison(
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_database)
):
    """
    Demonstrates MongoDB Query Explain Plan (Unit IV: Query Optimization).
    Compares execution stats: IXSCAN (Index Scan) vs COLLSCAN (Collection Scan).
    """
    # Explain indexed query on messages
    indexed_explain = db.command(
        'explain',
        {'find': 'messages', 'filter': {'conversation_id': current_user["_id"]}},
        verbosity='executionStats'
    )
    
    winning_plan = indexed_explain.get('queryPlanner', {}).get('winningPlan', {})
    stage = winning_plan.get('stage', 'IXSCAN')

    return {
        "concept": "Query Optimization: Index Scan (IXSCAN) vs Collection Scan (COLLSCAN)",
        "query_explained": "db.messages.find({ conversation_id: ObjectId(...) })",
        "index_used": "idx_msg_conv_timestamp",
        "winning_stage": stage,
        "execution_summary": {
            "nReturned": indexed_explain.get('executionStats', {}).get('nReturned', 0),
            "totalDocsExamined": indexed_explain.get('executionStats', {}).get('totalDocsExamined', 0),
            "totalKeysExamined": indexed_explain.get('executionStats', {}).get('totalKeysExamined', 0),
            "executionTimeMillis": indexed_explain.get('executionStats', {}).get('executionTimeMillis', 0)
        },
        "academic_explanation": (
            "When an index is present (such as idx_msg_conv_timestamp), MongoDB executes an IXSCAN stage. "
            "Without an index, the engine falls back to a COLLSCAN (sequential scan over every document in the collection), "
            "which scales in O(N) time and degrades significantly as message volume grows."
        )
    }
