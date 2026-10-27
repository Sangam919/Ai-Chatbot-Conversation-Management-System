# 5-Minute Project Demonstration Script

Follow this structured sequence to demonstrate the **AI Chatbot Conversation Management System** to examiners or project evaluators.

---

### Step 1: System Startup & Architecture Overview (Minute 1)
1. **Show Terminal Running Backend & Frontend:**
   - Backend: `uvicorn app.main:app --port 8000 --reload`
   - Frontend: `npm run dev`
2. **Open Swagger API Docs:**
   - Navigate to `http://localhost:8000/docs`
   - Point out modular routers: `/auth`, `/conversations`, `/messages`, `/feedback`, `/analytics`, `/db-explorer`.
3. **Open Application in Browser:**
   - Navigate to `http://localhost:5173`.

---

### Step 2: Authentication & Multi-Role Access (Minute 2)
1. In the login modal, point out the **Quick Demo Logins** (`Student Demo` and `Admin / Faculty`).
2. Click **Student Demo** (`student@demo.com`) and log in.
3. Show the dynamic UI theme toggle (Light / Dark mode) in the sidebar header and explain how preferences are embedded in the MongoDB `users` document.

---

### Step 3: Main Chat Workspace & AI Engine (Minute 3)
1. Click **New Conversation** or select an existing conversation from the sidebar.
2. Type a prompt in the message composer:
   - *"Explain how MongoDB aggregation pipeline handles $group and $match."*
   - Hit **Enter** to send.
3. Show:
   - User message bubble with timestamp.
   - Assistant message bubble with response text.
   - Latency tag (`X ms`) and total token counter computed dynamically.
   - Deterministic Fallback label explaining that no paid API key is required.
4. Click **Copy** to verify clipboard copy.
5. Click **Thumbs Up** on the response and add an optional comment ("Very clear!") to demonstrate MongoDB upsert feedback.

---

### Step 4: Conversation Management & Search (Minute 4)
1. Hover over a conversation in the sidebar:
   - Click the **Edit / Rename** icon and change the title.
   - Click the **Archive** icon to toggle status between active and archived.
2. Use the **Search bar** in the sidebar to search conversations by title.
3. Switch filters between `Active`, `Archived`, and `All`.

---

### Step 5: Real-Time Analytics Dashboard (Minute 5)
1. Click the **Analytics** tab in the sidebar.
2. Point out:
   - Metric cards: Total Conversations, Total Messages, Average Latency, and Positive Feedback Percentage.
   - **Daily Conversation Chart (Recharts):** Calculated live from MongoDB using `$group` by date.
   - **Message Volume Line Chart:** Calculated using `$dateToString` aggregation pipeline.
   - **Top Active Conversations Table:** Sorted by `message_count` in descending order.

---

### Step 6: Database Explorer & NoSQL Academic Showcase (Conclusion)
1. Click the **Explorer** tab in the sidebar.
2. Point out:
   - **Collections & Indexes:** Document counts and active indexes (`idx_users_email_unique`, `idx_msg_conv_timestamp`, `idx_msg_content_text`).
   - **Embedding vs. Referencing explanation:** Explaining why messages reference conversations while preferences are embedded.
   - **Query Explain Plan:** Live comparison displaying the winning stage (`IXSCAN` vs `COLLSCAN`), execution time in milliseconds, and total keys examined.
