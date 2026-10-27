# University Syllabus Mapping: NoSQL and MongoDB (Units I to VI)

**Project Title:** AI Chatbot Conversation Management System Using MongoDB  
**Degree / Program:** B.Tech Computer Science and Engineering  
**Primary Database:** MongoDB NoSQL (Community / Atlas)  
**Backend Framework:** Python FastAPI + PyMongo  
**Frontend Stack:** React, TypeScript, Vite, Tailwind CSS  

---

## Unit I — Introduction to NoSQL and MongoDB

### 1. SQL vs. NoSQL Comparison
* **Relational Databases (SQL):** Fixed table schemas, strict relational normalization, heavy foreign key JOIN overhead, vertical scaling bottleneck when handling high volumes of unstructured or rapidly growing message streams.
* **Document-Oriented NoSQL (MongoDB):** Flexible schema models stored as binary JSON (BSON), native horizontal scaling via sharding, high write throughput, and nested subdocument support.

### 2. Document-Oriented Database Model
* Uniquely maps real-world conversation entities into self-describing BSON documents.
* Eliminates object-relational impedance mismatch by allowing natural JSON mappings directly inside Python and TypeScript layers.

### 3. MongoDB Architecture & BSON Data Types
* **Engine:** WiredTiger storage engine with document-level concurrency control and compression.
* **BSON Types Implemented:** `ObjectId` (12-byte unique identifier), `string`, `int32`/`int64`, `double` (response latency ms), `ISODate` (UTC timestamps), `bool`, `Array` (tags), and `Object` (embedded preferences).

### 4. CAP Theorem & Distributed Trade-offs
* MongoDB is categorized primarily as a **CP (Consistency & Partition Tolerance)** system under default configurations.
* **Trade-Offs:** Write concern (`w: "majority"`) and read concern (`"majority"`) guarantee strict consistency across replica sets during network partitions, prioritizing data integrity over stale availability.

### 5. Categorization of NoSQL Systems
* **Key-Value:** Redis, DynamoDB (fast single-key lookups).
* **Column-Family:** Apache Cassandra, HBase (high-volume time-series write models).
* **Document:** MongoDB, CouchDB (hierarchical, multi-attribute indexed entities).
* **Graph:** Neo4j (relationship-heavy networks).

---

## Unit II — MongoDB Basics and CRUD Operations

### 1. Database and Collection Creation
* Database: `ai_chatbot_management`
* Collections: `users`, `conversations`, `messages`, `feedback`
* Implemented in [`backend/app/db/mongodb.py`](file:///d:/AI%20Chatbot%20Conversation%20Management%20System/backend/app/db/mongodb.py).

### 2. Practical CRUD Demonstrations
* **Create (Insert):**
  - `db.conversations.insert_one(conv_doc)`
  - `db.messages.insert_one(user_msg)` & `db.messages.insert_one(assistant_msg)`
* **Read (Find & Filter):**
  - `db.conversations.find({"user_id": oid, "status": "active"}).sort("updated_at", -1)`
  - Cursor-based limit and skip pagination implemented in [`backend/app/api/conversations.py`](file:///d:/AI%20Chatbot%20Conversation%20Management%20System/backend/app/api/conversations.py).
* **Update (Atomic Operators):**
  - `$set` for conversation titles, tags, and archive status.
  - `$inc: {"message_count": 2}` for thread-safe atomic counter increments.
  - `$setOnInsert` and `upsert=True` for single-record feedback enforcement in [`backend/app/api/feedback.py`](file:///d:/AI%20Chatbot%20Conversation%20Management%20System/backend/app/api/feedback.py).
* **Delete:**
  - Soft-delete: `$set: {"is_deleted": True}`.
  - Hard-delete with cascading cleanup: purging `feedback` $\rightarrow$ `messages` $\rightarrow$ `conversations`.

---

## Unit III — Schema Design and Modeling Best Practices

### 1. Embedding vs. Referencing
| Approach | Collection Used | Justification |
| :--- | :--- | :--- |
| **Embedding** | `users.preferences` | Bounded 1:1 nested structure. Always retrieved with the user document; zero risk of exceeding the 16MB limit. |
| **Referencing** | `messages` $\rightarrow$ `conversations` | 1:N relationship with unbounded growth. Messages could easily exceed 16MB if embedded inside a single array. Referencing guarantees predictable memory usage. |

### 2. Schema Validation
* Pydantic v2 application-level validation ensures strict type casting and length boundaries before database writes.
* BSON `PyObjectId` validator enforces valid 24-character hexadecimal format.

---

## Unit IV — Indexing and Aggregation Pipelines

### 1. Implemented Index Hierarchy
1. **Unique Index:** `users.email` (`idx_users_email_unique`)
2. **Compound Index:** `conversations.(user_id, status, updated_at)` (`idx_conv_user_status_updated`)
3. **Compound Index:** `messages.(conversation_id, timestamp)` (`idx_msg_conv_timestamp`)
4. **Full-Text Search Index:** `messages.content` (`idx_msg_content_text`)
5. **Unique Compound Index:** `feedback.(user_id, message_id)` (`idx_feedback_user_msg_unique`)

### 2. Query Explain Plan Comparison
* Executed via `db.command('explain', ...)` in [`backend/app/api/db_explorer.py`](file:///d:/AI%20Chatbot%20Conversation%20Management%20System/backend/app/api/db_explorer.py).
* **IXSCAN (Index Scan):** Keys examined matches documents returned ($O(\log N)$).
* **COLLSCAN (Collection Scan):** Full collection scan required if index is absent ($O(N)$), causing severe latency at scale.

### 3. Aggregation Pipelines Implemented
* **Daily Conversation Frequency:** `$match` (date range) $\rightarrow$ `$group` (`$dateToString`) $\rightarrow$ `$sort`.
* **Average Response Latency:** `$match` (`role: 'assistant'`) $\rightarrow$ `$group: { avg_time: { $avg: "$response_time_ms" } }`.
* **Cross-Collection Join ($lookup):** Joins `messages` collection with `feedback` collection on `_id` $\leftrightarrow$ `message_id`.

---

## Unit V — MongoDB Integration with Application Frameworks

### 1. PyMongo Connection Management
* Implemented persistent connection pooling using `MongoClient`.
* Resilient connection lifecycle with FastAPI's `asynccontextmanager` (`lifespan`).
* Dependency injection via `Depends(get_database)`.

### 2. AI Chatbot Integration
* Hybrid AI engine supporting external LLM APIs (OpenAI / Groq) with an offline Deterministic Heuristic AI Fallback engine.
* Automatic latency calculation, token estimations, and prompt tracking stored in MongoDB message metadata.

---

## Unit VI — Production Practices, Testing, and Security

### 1. Security Architecture
* Passwords hashed using salted `bcrypt` (cost factor 12). Plaintext passwords never persisted.
* Stateless authentication using signed JWT bearer tokens (`HS256`).
* Granular role-based access control (`user` vs `admin`).
* Strict NoSQL query injection prevention using typed parameter dictionaries instead of dynamic code execution.

### 2. Automated Quality Assurance
* Automated test suite executed using `pytest`.
* Verifies health status, user registration/login, message creation, cascades, feedback upserts, and aggregation metrics.
