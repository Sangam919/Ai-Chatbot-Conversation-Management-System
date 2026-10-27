from pymongo import MongoClient, ASCENDING, DESCENDING, TEXT
from pymongo.database import Database
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class MongoDBManager:
    client: MongoClient = None
    db: Database = None

    @classmethod
    def connect(cls):
        """Establishes connection to MongoDB and initializes collections/indexes."""
        if cls.client is None:
            logger.info(f"Connecting to MongoDB at {settings.MONGODB_URI}...")
            cls.client = MongoClient(settings.MONGODB_URI, serverSelectionTimeoutMS=5000)
            cls.db = cls.client[settings.DATABASE_NAME]
            # Verify connection
            cls.client.admin.command('ping')
            logger.info(f"Successfully connected to MongoDB database: {settings.DATABASE_NAME}")
            cls.init_indexes()

    @classmethod
    def close(cls):
        """Closes the MongoDB client connection."""
        if cls.client:
            cls.client.close()
            cls.client = None
            cls.db = None
            logger.info("MongoDB connection closed.")

    @classmethod
    def get_db(cls) -> Database:
        """Returns the active MongoDB database instance."""
        if cls.db is None:
            cls.connect()
        return cls.db

    @classmethod
    def init_indexes(cls):
        """
        Creates all required MongoDB indexes idempotently.
        Demonstrates Unit II and Unit IV concepts:
        - Unique Indexes
        - Compound Indexes
        - Text Indexes for Full-Text Search
        """
        db = cls.db
        try:
            # 1. Users collection
            db.users.create_index([("email", ASCENDING)], unique=True, name="idx_users_email_unique")
            db.users.create_index([("role", ASCENDING)], name="idx_users_role")

            # 2. Conversations collection
            # Compound index for fast user conversation filtering sorted by recent activity
            db.conversations.create_index(
                [("user_id", ASCENDING), ("status", ASCENDING), ("updated_at", DESCENDING)],
                name="idx_conv_user_status_updated"
            )
            # Text index on title for keyword searching
            db.conversations.create_index([("title", TEXT)], name="idx_conv_title_text")

            # 3. Messages collection
            # Compound index for retrieving ordered messages in a conversation
            db.messages.create_index(
                [("conversation_id", ASCENDING), ("timestamp", ASCENDING)],
                name="idx_msg_conv_timestamp"
            )
            # Index for user activity filtering and analytics
            db.messages.create_index(
                [("user_id", ASCENDING), ("timestamp", DESCENDING)],
                name="idx_msg_user_timestamp"
            )
            # Full-Text Search index on message content
            db.messages.create_index(
                [("content", TEXT)],
                name="idx_msg_content_text",
                default_language="english"
            )

            # 4. Feedback collection
            # Unique compound index to enforce one feedback per user per message
            db.feedback.create_index(
                [("user_id", ASCENDING), ("message_id", ASCENDING)],
                unique=True,
                name="idx_feedback_user_msg_unique"
            )
            db.feedback.create_index([("conversation_id", ASCENDING)], name="idx_feedback_conv")
            db.feedback.create_index([("rating", ASCENDING)], name="idx_feedback_rating")

            logger.info("All MongoDB indexes verified and created successfully.")
        except Exception as e:
            logger.error(f"Error initializing MongoDB indexes: {e}")

# Helper dependency for FastAPI
def get_database() -> Database:
    return MongoDBManager.get_db()
