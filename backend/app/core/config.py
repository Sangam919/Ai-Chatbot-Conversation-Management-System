from pydantic_settings import BaseSettings
from typing import List
from pathlib import Path
import os

from dotenv import dotenv_values

# Root directory of the repository (parent of backend)
ROOT_DIR = Path(__file__).resolve().parent.parent.parent.parent
ENV_PATH = ROOT_DIR / ".env"

# Explicitly read .env file values
_file_env = dotenv_values(ENV_PATH) if ENV_PATH.exists() else {}

# If file contains OPENAI_API_KEY, override process environment variable to prevent stale cache
if "OPENAI_API_KEY" in _file_env:
    os.environ["OPENAI_API_KEY"] = _file_env["OPENAI_API_KEY"]

class Settings(BaseSettings):
    APP_NAME: str = _file_env.get("APP_NAME", "AI Chatbot Conversation Management System")
    APP_ENV: str = _file_env.get("APP_ENV", "development")
    PORT: int = int(_file_env.get("PORT", 8000))
    HOST: str = _file_env.get("HOST", "0.0.0.0")
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ]

    # MongoDB
    MONGODB_URI: str = _file_env.get("MONGODB_URI", "mongodb://127.0.0.1:27017")
    DATABASE_NAME: str = _file_env.get("DATABASE_NAME", "ai_chatbot_management")

    # Security
    JWT_SECRET_KEY: str = _file_env.get("JWT_SECRET_KEY", "dev_secret_key_9f83b284c17e4d8a1c93710528ef05b428d9")
    JWT_ALGORITHM: str = _file_env.get("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(_file_env.get("ACCESS_TOKEN_EXPIRE_MINUTES", 1440))

    # AI / OpenAI Configuration (Explicitly reads the latest key saved in .env)
    AI_PROVIDER: str = _file_env.get("AI_PROVIDER", "openai")
    OPENAI_API_KEY: str = _file_env.get("OPENAI_API_KEY", "")
    OPENAI_MODEL: str = _file_env.get("OPENAI_MODEL", "gpt-4o-mini")
    AI_REQUEST_TIMEOUT: int = int(_file_env.get("AI_REQUEST_TIMEOUT", 60))
    AI_MAX_OUTPUT_TOKENS: int = int(_file_env.get("AI_MAX_OUTPUT_TOKENS", 1500))
    MAX_HISTORY_MESSAGES: int = int(_file_env.get("MAX_HISTORY_MESSAGES", 10))
    ENABLE_OFFLINE_FALLBACK: bool = _file_env.get("ENABLE_OFFLINE_FALLBACK", "true").lower() in ("true", "1")

    model_config = {
        "env_file": str(ENV_PATH),
        "extra": "ignore"
    }

settings = Settings()
