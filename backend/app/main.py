from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.mongodb import MongoDBManager
from app.api import auth, conversations, messages, feedback, analytics, db_explorer
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("app.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize MongoDB connection & indexes
    logger.info("Initializing MongoDB connection and indexes...")
    MongoDBManager.connect()
    yield
    # Shutdown
    logger.info("Closing MongoDB connections...")
    MongoDBManager.close()

app = FastAPI(
    title="AI Chatbot Conversation Management System API",
    description="Production-grade FastAPI backend integrated with MongoDB NoSQL database.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(conversations.router, prefix="/api/v1")
app.include_router(messages.router, prefix="/api/v1")
app.include_router(feedback.router, prefix="/api/v1")
app.include_router(analytics.router, prefix="/api/v1")
app.include_router(db_explorer.router, prefix="/api/v1")

@app.get("/health", tags=["Health"])
def health_check():
    """Health & Readiness check endpoint for uptime monitors."""
    db_ok = False
    try:
        db = MongoDBManager.get_db()
        db.command('ping')
        db_ok = True
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        db_ok = False

    return {
        "status": "healthy" if db_ok else "degraded",
        "database": "connected" if db_ok else "disconnected",
        "app_env": settings.APP_ENV,
        "ai_provider": settings.AI_PROVIDER
    }
