import sys
from pathlib import Path
from datetime import datetime, timezone, timedelta
import random
from pymongo import MongoClient

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.append(str(backend_dir))

from app.core.config import settings
from app.core.security import hash_password

def seed_database():
    print(f"Connecting to MongoDB at {settings.MONGODB_URI}...")
    client = MongoClient(settings.MONGODB_URI)
    db = client[settings.DATABASE_NAME]

    print("Cleaning existing demo data...")
    # Clean collections safely
    db.users.delete_many({"is_demo": True})
    db.conversations.delete_many({"is_demo": True})
    db.messages.delete_many({"is_demo": True})
    db.feedback.delete_many({"is_demo": True})

    # Also clean sample user if exists
    db.users.delete_one({"email": "admin@demo.com"})
    db.users.delete_one({"email": "student@demo.com"})

    print("1. Creating demonstration users...")
    now = datetime.now(timezone.utc)
    
    admin_user = {
        "name": "Prof. Administrator",
        "email": "admin@demo.com",
        "password_hash": hash_password("Admin@123456"),
        "role": "admin",
        "preferences": {"theme": "dark", "language": "en", "notifications_enabled": True},
        "is_active": True,
        "is_demo": True,
        "created_at": now - timedelta(days=20),
        "updated_at": now
    }
    admin_id = db.users.insert_one(admin_user).inserted_id

    student_user = {
        "name": "Alex Mercer (B.Tech CS)",
        "email": "student@demo.com",
        "password_hash": hash_password("Student@123456"),
        "role": "user",
        "preferences": {"theme": "dark", "language": "en", "notifications_enabled": True},
        "is_active": True,
        "is_demo": True,
        "created_at": now - timedelta(days=15),
        "updated_at": now
    }
    student_id = db.users.insert_one(student_user).inserted_id

    print("2. Creating realistic conversations, messages, and feedback records...")
    
    sample_conversations_meta = [
        ("MongoDB Aggregation Pipelines & Stages", ["mongodb", "nosql", "database"], 12),
        ("Designing High-Throughput NoSQL Schemas", ["architecture", "schema-design"], 10),
        ("FastAPI Asynchronous Endpoint Architecture", ["python", "fastapi", "backend"], 8),
        ("BSON vs JSON: Serialization & Performance", ["bson", "mongodb", "types"], 10),
        ("Handling Unbounded Arrays with ObjectId Referencing", ["mongodb", "design-patterns"], 10),
        ("Explaining Compound Indexes & Query Optimizations", ["indexes", "performance", "explain-plan"], 8),
        ("CAP Theorem Trade-Offs in Distributed NoSQL Systems", ["theory", "distributed-systems", "nosql"], 6),
        ("Securing REST APIs with JWT & Bcrypt", ["security", "auth", "jwt"], 8),
        ("Full-Text Search with MongoDB $text Indexes", ["mongodb", "search", "indexing"], 6),
        ("PyMongo Connection Pooling & Best Practices", ["python", "pymongo", "database"], 6),
        ("ACID Transactions vs Eventual Consistency", ["transactions", "nosql", "theory"], 6),
        ("Data Modeling: 1:1, 1:N, and N:M Relationships", ["schema", "database", "university"], 8),
        ("Building Responsive React Dashboards with Recharts", ["frontend", "react", "ui"], 6),
        ("Implementing Thumbs Up/Down Feedback Loops", ["analytics", "product", "feedback"], 6),
        ("University Mini Project Viva Preparation Guide", ["viva", "academic", "project"], 8),
        ("Automated Testing with Pytest and Test DBs", ["testing", "qa", "pytest"], 6),
    ]

    total_messages_created = 0
    total_feedback_created = 0

    for i, (title, tags, msg_count) in enumerate(sample_conversations_meta):
        days_offset = 14 - (i % 14)
        conv_created = now - timedelta(days=days_offset, hours=random.randint(1, 12))
        
        conv_doc = {
            "user_id": student_id if i % 2 == 0 else admin_id,
            "title": title,
            "status": "archived" if i in [5, 11] else "active",
            "tags": tags,
            "message_count": msg_count,
            "created_at": conv_created,
            "updated_at": conv_created + timedelta(hours=random.randint(1, 4)),
            "last_message_at": conv_created + timedelta(hours=random.randint(1, 4)),
            "is_demo": True,
            "is_deleted": False
        }
        conv_id = db.conversations.insert_one(conv_doc).inserted_id

        # Generate conversation message pairs
        for m_idx in range(msg_count // 2):
            msg_time = conv_created + timedelta(minutes=m_idx * 15)
            
            # User message
            user_msg = {
                "conversation_id": conv_id,
                "user_id": conv_doc["user_id"],
                "role": "user",
                "content": f"Can you explain {tags[0]} concepts related to {title.lower()} step {m_idx + 1}?",
                "timestamp": msg_time,
                "is_demo": True,
                "metadata": {}
            }
            db.messages.insert_one(user_msg)
            total_messages_created += 1

            # Assistant message
            latency = round(random.uniform(45.0, 320.0), 2)
            assistant_content = (
                f"### Explanation for {title} (Part {m_idx + 1})\n\n"
                f"When dealing with **{tags[0]}**, it is important to observe NoSQL architectural principles:\n\n"
                f"1. **Access Patterns:** Design your MongoDB document schema around how the application reads data.\n"
                f"2. **Aggregation:** Leverage `$match`, `$group`, and `$sort` stages for analytical reports.\n"
                f"3. **Indexing:** Avoid collection scans (COLLSCAN) by providing compound indexes on frequent filter fields.\n\n"
                f"```json\n"
                f"// Example MongoDB Query\n"
                f"db.{tags[0]}.find({{ 'status': 'active' }}).sort({{ 'updated_at': -1 }})\n"
                f"```"
            )
            asst_time = msg_time + timedelta(seconds=int(latency / 100))
            asst_msg = {
                "conversation_id": conv_id,
                "user_id": conv_doc["user_id"],
                "role": "assistant",
                "content": assistant_content,
                "timestamp": asst_time,
                "response_time_ms": latency,
                "token_usage": {"prompt_tokens": 45, "completion_tokens": 120, "total_tokens": 165},
                "model_name": "Deterministic-Engine-v1.0 (Offline Fallback)",
                "is_demo": True,
                "metadata": {"fallback_engine": True}
            }
            asst_res = db.messages.insert_one(asst_msg)
            asst_id = asst_res.inserted_id
            total_messages_created += 1

            # Create feedback for some assistant messages
            if random.random() > 0.4:
                rating = "positive" if random.random() > 0.15 else "negative"
                fb_doc = {
                    "conversation_id": conv_id,
                    "message_id": asst_id,
                    "user_id": conv_doc["user_id"],
                    "rating": rating,
                    "comment": "Accurate and clear explanation of MongoDB principles." if rating == "positive" else "Needs more code examples.",
                    "created_at": asst_time + timedelta(minutes=1),
                    "updated_at": asst_time + timedelta(minutes=1),
                    "is_demo": True
                }
                db.feedback.insert_one(fb_doc)
                total_feedback_created += 1

    print(f"Database successfully seeded:")
    print(f"- 2 Users created (admin@demo.com / Admin@123456, student@demo.com / Student@123456)")
    print(f"- {len(sample_conversations_meta)} Conversations created")
    print(f"- {total_messages_created} Messages created across 14-day history")
    print(f"- {total_feedback_created} Feedback ratings recorded")

if __name__ == "__main__":
    seed_database()
