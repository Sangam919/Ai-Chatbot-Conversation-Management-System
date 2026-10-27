# Runnable MongoDB Queries & Commands Guide

This guide contains the exact MongoDB shell commands and aggregation pipelines executed in the application.

---

## 1. Index Creation (Unit II & IV)

```javascript
use ai_chatbot_management;

// 1. Unique index on email
db.users.createIndex({ "email": 1 }, { unique: true, name: "idx_users_email_unique" });

// 2. Compound index on conversations (user_id, status, updated_at)
db.conversations.createIndex(
  { "user_id": 1, "status": 1, "updated_at": -1 },
  { name: "idx_conv_user_status_updated" }
);

// 3. Compound index on messages (conversation_id, timestamp)
db.messages.createIndex(
  { "conversation_id": 1, "timestamp": 1 },
  { name: "idx_msg_conv_timestamp" }
);

// 4. Full-Text Search index on message contents
db.messages.createIndex(
  { "content": "text" },
  { name: "idx_msg_content_text", default_language: "english" }
);

// 5. Unique compound index on feedback (one rating per user per message)
db.feedback.createIndex(
  { "user_id": 1, "message_id": 1 },
  { unique: true, name: "idx_feedback_user_msg_unique" }
);
```

---

## 2. Basic CRUD Operations (Unit II)

### Insert Documents
```javascript
// Insert Conversation
db.conversations.insertOne({
  user_id: ObjectId("660000000000000000000001"),
  title: "Exploring MongoDB Indexes",
  status: "active",
  tags: ["mongodb", "indexes"],
  message_count: 0,
  created_at: new Date(),
  updated_at: new Date(),
  is_deleted: false
});

// Insert User Message
db.messages.insertOne({
  conversation_id: ObjectId("660000000000000000000002"),
  user_id: ObjectId("660000000000000000000001"),
  role: "user",
  content: "How does WiredTiger handle indexing?",
  timestamp: new Date()
});
```

### Atomic Updates
```javascript
// Increment message count atomically when sending a message
db.conversations.updateOne(
  { _id: ObjectId("660000000000000000000002") },
  {
    $inc: { message_count: 2 },
    $set: { updated_at: new Date(), last_message_at: new Date() }
  }
);
```

---

## 3. Full-Text Search Query (Unit IV)

```javascript
// Search across message contents using $text index
db.messages.find(
  { $text: { $search: "aggregation" } },
  { score: { $meta: "textScore" } }
).sort({ score: { $meta: "textScore" } });
```

---

## 4. Aggregation Pipelines (Unit IV)

### Pipeline 1: Average Latency by AI Engine
```javascript
db.messages.aggregate([
  { $match: { role: "assistant", response_time_ms: { $exists: true } } },
  {
    $group: {
      _id: "$model_name",
      total_replies: { $sum: 1 },
      avg_latency_ms: { $avg: "$response_time_ms" },
      min_latency_ms: { $min: "$response_time_ms" },
      max_latency_ms: { $max: "$response_time_ms" }
    }
  },
  { $sort: { avg_latency_ms: 1 } }
]);
```

### Pipeline 2: Daily Conversation Growth
```javascript
db.conversations.aggregate([
  {
    $match: {
      is_deleted: { $ne: true },
      created_at: { $gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) }
    }
  },
  {
    $group: {
      _id: { $dateToString: { format: "%Y-%m-%d", date: "$created_at" } },
      conversations: { $sum: 1 }
    }
  },
  { $sort: { _id: 1 } }
]);
```

### Pipeline 3: Multi-Collection Join ($lookup)
```javascript
db.messages.aggregate([
  { $match: { role: "assistant" } },
  { $limit: 10 },
  {
    $lookup: {
      from: "feedback",
      localField: "_id",
      foreignField: "message_id",
      as: "user_feedback"
    }
  },
  {
    $project: {
      content: 1,
      response_time_ms: 1,
      feedback: { $arrayElemAt: ["$user_feedback", 0] }
    }
  }
]);
```

---

## 5. Query Optimization & Explain Plan (Unit IV)

```javascript
// Check execution statistics and index stage
db.messages.find({ conversation_id: ObjectId("660000000000000000000002") })
  .explain("executionStats");
```
*Expected winning plan stage:* **`IXSCAN`** using `idx_msg_conv_timestamp`.
