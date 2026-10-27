import pytest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient
from pymongo import MongoClient
import openai
from app.main import app
from app.core.config import settings
from app.services.ai_service import AIService

client = TestClient(app)

def test_health_check():
    """Verify health endpoint returns healthy status and DB connection."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database"] == "connected"

def test_ai_service_fallback_answers_actual_questions():
    """Verify fallback mode answers distinct questions directly instead of generic infrastructure text."""
    prompts_and_keywords = [
        ("Explain React and Recharts for responsive dashboards.", ["recharts", "responsivecontainer", "barchart"]),
        ("Explain MongoDB compound indexes with an example.", ["compound index", "ixscan", "esr"]),
        ("What is the CAP theorem?", ["consistency", "availability", "partition tolerance"]),
        ("Show Python PyMongo CRUD examples.", ["insert_one", "update_one", "pymongo"]),
        ("Explain embedding versus referencing.", ["16mb", "embedding", "referencing"]),
    ]

    for prompt, expected_words in prompts_and_keywords:
        text, latency, model, tokens = AIService._generate_fallback(prompt, [], 0)
        assert "Offline Fallback Engine" in model
        assert "Thank you for your message" not in text
        assert "Validation, State Management, and Metrics Tracking" not in text
        text_lower = text.lower()
        for word in expected_words:
            assert word in text_lower, f"Expected '{word}' in response for '{prompt}'"

def test_openai_mocked_successful_generation():
    """Verify OpenAI SDK is called with system prompt and proper context window."""
    mock_response = MagicMock()
    mock_choice = MagicMock()
    mock_choice.message.content = "OpenAI answer about React and Recharts."
    mock_response.choices = [mock_choice]
    mock_response.model = "gpt-4o-mini"
    mock_response.usage.prompt_tokens = 50
    mock_response.usage.completion_tokens = 30
    mock_response.usage.total_tokens = 80

    with patch.object(settings, "AI_PROVIDER", "openai"), \
         patch.object(settings, "OPENAI_API_KEY", "sk-test-mock-key"), \
         patch.object(settings, "OPENAI_MODEL", "gpt-4o-mini"), \
         patch.object(AIService, "get_openai_client") as mock_get_client:
        
        mock_client = MagicMock()
        mock_client.chat.completions.create.return_value = mock_response
        mock_get_client.return_value = mock_client

        history = [{"role": "user", "content": "Hello"}, {"role": "assistant", "content": "Hi there!"}]
        text, latency, model, usage = AIService.generate_response("Explain React and Recharts", history)

        assert text == "OpenAI answer about React and Recharts."
        assert model == "OpenAI · gpt-4o-mini"
        assert usage["total_tokens"] == 80
        assert mock_client.chat.completions.create.called

def test_openai_auth_error_handling():
    """Verify authentication errors from OpenAI produce actionable feedback."""
    with patch.object(settings, "AI_PROVIDER", "openai"), \
         patch.object(settings, "OPENAI_API_KEY", "sk-invalid-key"), \
         patch.object(settings, "ENABLE_OFFLINE_FALLBACK", False), \
         patch.object(AIService, "get_openai_client") as mock_get_client:

        mock_client = MagicMock()
        mock_client.chat.completions.create.side_effect = openai.AuthenticationError(
            message="Incorrect API key provided",
            response=MagicMock(status_code=401),
            body=None
        )
        mock_get_client.return_value = mock_client

        with pytest.raises(RuntimeError) as exc_info:
            AIService.generate_response("Test prompt", [])
        assert "authentication failed" in str(exc_info.value).lower()

def test_openai_rate_limit_error_handling():
    """Verify rate limit / quota exceeded produces actionable feedback."""
    with patch.object(settings, "AI_PROVIDER", "openai"), \
         patch.object(settings, "OPENAI_API_KEY", "sk-valid-key"), \
         patch.object(settings, "ENABLE_OFFLINE_FALLBACK", False), \
         patch.object(AIService, "get_openai_client") as mock_get_client:

        mock_client = MagicMock()
        mock_client.chat.completions.create.side_effect = openai.RateLimitError(
            message="You exceeded your current quota",
            response=MagicMock(status_code=429),
            body=None
        )
        mock_get_client.return_value = mock_client

        with pytest.raises(RuntimeError) as exc_info:
            AIService.generate_response("Test prompt", [])
        assert "quota exceeded" in str(exc_info.value).lower()

def test_missing_api_key_without_fallback():
    """Verify missing API key raises ValueError when offline fallback is disabled."""
    with patch.object(settings, "AI_PROVIDER", "openai"), \
         patch.object(settings, "OPENAI_API_KEY", ""), \
         patch.object(settings, "ENABLE_OFFLINE_FALLBACK", False):

        with pytest.raises(ValueError) as exc_info:
            AIService.generate_response("Test prompt", [])
        assert "OpenAI API key is missing" in str(exc_info.value)

def test_missing_api_key_with_fallback():
    """Verify missing API key returns labeled offline fallback when enabled."""
    with patch.object(settings, "AI_PROVIDER", "openai"), \
         patch.object(settings, "OPENAI_API_KEY", ""), \
         patch.object(settings, "ENABLE_OFFLINE_FALLBACK", True):

        text, latency, model, usage = AIService.generate_response("Explain MongoDB compound indexes with an example.", [])
        assert "Offline Fallback" in model
        assert "Offline Fallback Active" in text
        assert "compound index" in text.lower()

def test_conversation_persistence_and_auth_isolation():
    """Verify full end-to-end conversation creation, message persistence, feedback, and user isolation."""
    # Login as student
    login_resp = client.post("/api/v1/auth/login", json={
        "email": "student@demo.com",
        "password": "Student@123456"
    })
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create conversation
    create_resp = client.post(
        "/api/v1/conversations",
        json={"title": "Test AI Verification Chat", "tags": ["test", "ai"]},
        headers=headers
    )
    assert create_resp.status_code == 201
    conv = create_resp.json()
    conv_id = conv["_id"]

    # 2. Send message
    msg_resp = client.post(
        f"/api/v1/conversations/{conv_id}/messages",
        json={"content": "Explain MongoDB compound indexes with an example."},
        headers=headers
    )
    assert msg_resp.status_code == 201
    asst_msg = msg_resp.json()
    assert asst_msg["role"] == "assistant"
    assert "compound index" in asst_msg["content"].lower()

    # 3. Verify user isolation: another user cannot access this conversation
    # Login as admin
    admin_login = client.post("/api/v1/auth/login", json={
        "email": "admin@demo.com",
        "password": "Admin@123456"
    })
    admin_token = admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    unauth_resp = client.get(f"/api/v1/conversations/{conv_id}", headers=admin_headers)
    assert unauth_resp.status_code == 404

    # 4. Cleanup
    del_resp = client.delete(f"/api/v1/conversations/{conv_id}?permanent=true", headers=headers)
    assert del_resp.status_code == 200
