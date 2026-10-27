# AI Chatbot Conversation Management System Using MongoDB

A full-stack, production-grade web application designed to demonstrate the practical concepts of all six units of a University B.Tech NoSQL and MongoDB course.

---

## 🌟 Key Highlights

- **Database:** MongoDB Community / MongoDB Atlas with PyMongo.
- **Backend:** FastAPI (Python) with Pydantic v2 schemas and modular routing.
- **Frontend:** React 18/19, TypeScript, Vite, Tailwind CSS, Lucide icons, Recharts, and ReactMarkdown.
- **Security:** Salted `bcrypt` password hashing, signed JWT authentication, and role-based access.
- **AI Engine:** Official OpenAI Python SDK integration (`gpt-4o-mini`, `gpt-4o`, etc.) with an intelligent, topical offline fallback engine.
- **NoSQL Demonstrations:** Interactive Database Explorer with explain plans, aggregation pipelines, and schema modeling comparisons.

---

## 🤖 Configuring the Official OpenAI API

### Step 1: Obtain an API Key
1. Go to the official OpenAI developer platform: [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Create or copy your Secret API Key (`sk-...`).

### Step 2: Configure Environment Variables
Open the root `.env` file in the project root directory and add your key:

```dotenv
# OpenAI Configuration
OPENAI_API_KEY=your_actual_openai_key_here
OPENAI_MODEL=gpt-4o-mini
AI_PROVIDER=openai
AI_REQUEST_TIMEOUT=60
AI_MAX_OUTPUT_TOKENS=1500
ENABLE_OFFLINE_FALLBACK=true
```

> [!IMPORTANT]
> - Never commit `.env` to Git or expose keys to the frontend. `.env` is protected by `.gitignore`.
> - If `OPENAI_API_KEY` is empty, the system will seamlessly run using the **Intelligent Offline Fallback Engine** (clearly badged as `Offline Fallback`).

### Step 3: Restart Backend Server
Restart the FastAPI backend server to load the new environment variables:

```bash
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

---

## 🛠️ Troubleshooting OpenAI Integration

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| **Authentication Error (401)** | Invalid or expired API key | Check `OPENAI_API_KEY` in `.env` for typos or whitespace. |
| **Quota / Billing Exceeded (429)** | OpenAI account has $0 balance or expired trial | Add credits at [https://platform.openai.com/account/billing](https://platform.openai.com/account/billing). |
| **Model Unavailable (404)** | Configured model not permitted on account | Change `OPENAI_MODEL` to `gpt-4o-mini` in `.env`. |
| **Request Timeout** | Network latency or proxy restriction | Increase `AI_REQUEST_TIMEOUT=90` in `.env`. |

---

## 🚀 Quick Start Guide

### Prerequisites
- **Python 3.10+** (Tested on Python 3.14)
- **Node.js v18+** & **npm**
- **MongoDB** running locally on port 27017 or a MongoDB Atlas URI

### 1. Install Backend Dependencies & Seed Database

```bash
# Install Python dependencies
pip install -r requirements.txt

# Run the database seeding script (Creates demo users, 16 conversations, 120+ messages)
python backend/scripts/seed_data.py
```

### 2. Start the Backend API Server

```bash
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
- API Base URL: `http://localhost:8000`
- Interactive Swagger Documentation: `http://localhost:8000/docs`
- Health Endpoint: `http://localhost:8000/health`

### 3. Install Frontend Dependencies & Start Development Server

In a new terminal:

```bash
cd frontend
npm install
npm run dev
```
- Frontend UI: `http://localhost:5173`

---

## 🔐 Demonstration Credentials

The seed script creates two demonstration accounts:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Student / User** | `student@demo.com` | `Student@123456` |
| **Faculty / Admin** | `admin@demo.com` | `Admin@123456` |

*The login modal includes quick-click buttons to auto-populate these credentials.*

---

## 🧪 Running Automated Tests

Run backend integration tests using `pytest`:

```bash
python -m pytest -o pythonpath=backend backend/tests/test_backend_api.py -v
```

---

## 📚 Academic Documentation

- [Syllabus Mapping (Units I to VI)](docs/SYLLABUS_MAPPING.md)
- [System Architecture & Diagrams](docs/ARCHITECTURE.md)
- [Entity-Relationship Diagram (ERD)](docs/ER_DIAGRAM.md)
- [MongoDB Queries & Aggregation Pipelines](docs/MONGODB_QUERIES.md)
- [Viva Examination Questions & Answers](docs/VIVA_QUESTIONS.md)
- [5-Minute Project Demonstration Script](docs/DEMO_SCRIPT.md)
