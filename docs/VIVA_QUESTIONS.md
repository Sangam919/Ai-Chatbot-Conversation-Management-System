# Academic Viva Questions and Answers (35 Questions)

**Course:** NoSQL Database Technologies & Distributed Systems  
**Project:** AI Chatbot Conversation Management System Using MongoDB  

---

### Unit I: Introduction to NoSQL & MongoDB

#### Q1: What is a NoSQL database and how does MongoDB differ from traditional Relational Databases (RDBMS)?
**Answer:** A NoSQL database provides a mechanism for storage and retrieval of data that is modeled in means other than the tabular relations used in relational databases. MongoDB is a document-oriented NoSQL database that stores data in flexible, JSON-like BSON documents. Unlike RDBMS, it does not require fixed column schemas, avoids expensive multi-table joins, and supports horizontal scaling (sharding).

#### Q2: What is BSON and why does MongoDB use it instead of pure JSON?
**Answer:** BSON stands for Binary JSON. It is a binary-encoded serialization of JSON-like documents. MongoDB uses BSON because it is lightweight, traversable, and efficient for encoding/decoding. It also adds data types not natively supported in JSON, such as `Date`, `ObjectId`, and `int64`.

#### Q3: What is the anatomy of a MongoDB `ObjectId`?
**Answer:** An `ObjectId` is a 12-byte BSON type consisting of:
- A 4-byte timestamp value (representing seconds since Unix epoch),
- A 5-byte random value (machine and process unique identifier),
- A 3-byte incrementing counter initialized to a random value.

#### Q4: How does the CAP Theorem apply to MongoDB?
**Answer:** MongoDB is categorized as a **CP (Consistency and Partition Tolerance)** system by default. In a replica set, during a network partition, MongoDB maintains strong consistency by rejecting writes to a minority partition and electing a new primary in the majority partition.

#### Q5: What are the four primary classifications of NoSQL databases?
**Answer:**
1. Document stores (MongoDB, CouchDB),
2. Key-Value stores (Redis, DynamoDB),
3. Wide-Column stores (Apache Cassandra, HBase),
4. Graph databases (Neo4j).

---

### Unit II: MongoDB Basics & CRUD Operations

#### Q6: What is a Collection in MongoDB? What is its SQL equivalent?
**Answer:** A collection is a grouping of MongoDB documents, analogous to a table in a relational database. Unlike SQL tables, collections do not enforce a uniform schema across documents.

#### Q7: What is the difference between `insertOne()` and `insertMany()` in PyMongo?
**Answer:** `insertOne()` inserts a single document into the collection and returns an `InsertOneResult` with `inserted_id`. `insertMany()` takes an iterable of documents and inserts them in a single network round-trip, returning an `InsertManyResult` containing `inserted_ids`.

#### Q8: What does the `$set` operator do in an update operation?
**Answer:** The `$set` operator replaces the value of a specified field with the given value. If the field does not exist, `$set` creates it without altering the rest of the document.

#### Q9: What is an upsert operation and where is it used in this project?
**Answer:** An upsert (`upsert=True`) updates an existing document if it matches the query filter, or inserts a new document if no match is found. In this project, it is used in the `feedback` endpoint to ensure a user can submit or revise their rating for a specific message without creating duplicate records.

#### Q10: How does the project implement atomic increments for message counters?
**Answer:** By utilizing the `$inc` update operator: `db.conversations.updateOne({ _id: conv_id }, { $inc: { message_count: 2 } })`. This ensures thread-safe, concurrency-safe counter increments directly in the database engine without race conditions.

---

### Unit III: Schema Design & Data Modeling

#### Q11: Explain the key difference between Embedding and Referencing in MongoDB.
**Answer:**
- **Embedding:** Storing related data within child subdocuments inside a parent document.
- **Referencing:** Storing related data in separate collections and linking them using document `ObjectId`s.

#### Q12: Why did you use Referencing for Messages and Embedding for User Preferences?
**Answer:**
- **Messages (Referencing):** A conversation can have hundreds or thousands of messages. Embedding messages inside a conversation document would risk hitting MongoDB's **16MB maximum BSON document size limit** and cause write fragmentation.
- **Preferences (Embedding):** User preferences (theme, language) are strictly bounded 1:1 data, always retrieved together with the user profile. Embedding eliminates additional queries.

#### Q13: What is MongoDB's maximum document size limit?
**Answer:** 16 Megabytes (16MB). This limit ensures individual documents cannot use excessive amounts of RAM during memory-mapped operations or bandwidth during network transfer.

#### Q14: How does your project handle soft deletion vs hard deletion?
**Answer:** Soft deletion sets an `is_deleted: true` flag, allowing recovery and excluding the document from standard queries. Hard deletion physically removes the conversation document and cascades to delete all linked messages and feedback records.

---

### Unit IV: Indexing & Aggregations

#### Q15: What is a Compound Index?
**Answer:** A compound index holds references to multiple fields within a collection's documents. The order of fields matters (the Equality, Sort, Range - ESR rule). In our project: `{ user_id: 1, status: 1, updated_at: -1 }`.

#### Q16: What is a Text Index and how is it used in your project?
**Answer:** A Text index tokenizes, stems, and indexes string fields to enable natural language search via the `$text` query operator. It powers the full-text search capability over historical message contents.

#### Q17: What is the difference between `COLLSCAN` and `IXSCAN` in an explain plan?
**Answer:**
- **COLLSCAN (Collection Scan):** MongoDB scans every document sequentially ($O(N)$), which is slow and resource-heavy.
- **IXSCAN (Index Scan):** MongoDB traverses a B-tree index structure ($O(\log N)$), retrieving only matching keys before fetching documents.

#### Q18: What is an Aggregation Pipeline in MongoDB?
**Answer:** A framework for data processing modeled on the concept of data processing pipelines. Documents enter a multi-stage pipeline where each stage transforms the documents (filtering, grouping, reshaping, sorting).

#### Q19: What does the `$match` stage do? Why should it typically be the first stage in a pipeline?
**Answer:** `$match` filters documents using standard query syntax. Placing it first reduces the number of documents passed to subsequent stages and allows MongoDB to leverage indexes.

#### Q20: What does the `$group` stage do?
**Answer:** `$group` separates documents into groups according to a specified group key (`_id`) and applies accumulator expressions (such as `$sum`, `$avg`, `$min`, `$max`) to each group.

#### Q21: What is the purpose of `$lookup` in an aggregation pipeline?
**Answer:** `$lookup` performs a left outer join to an unsharded collection in the same database, bringing in documents from a secondary collection based on matching local and foreign fields.

---

### Unit V: Application Integration & AI Services

#### Q22: What driver is used to connect Python to MongoDB?
**Answer:** `PyMongo`, the official MongoDB driver for Python applications.

#### Q23: How is database connection pooling managed in the application?
**Answer:** The `MongoClient` instance is created once during application startup in the FastAPI lifespan handler and shared across request lifecycles via dependency injection. `MongoClient` automatically maintains an internal thread-safe connection pool.

#### Q24: How does the AI fallback engine work when no external API key is provided?
**Answer:** It uses a deterministic, rule-based inference engine that inspects prompt keywords, explains MongoDB concepts, generates Python/PyMongo code snippets, and returns structured markdown while accurately measuring latency and tokens.

#### Q25: How does the chatbot maintain conversational context without sending infinite history?
**Answer:** The backend loads a bounded window (the last $N$ messages, configurable via `MAX_HISTORY_MESSAGES`) from the active conversation, preventing context overflow and token exhaustion.

---

### Unit VI: Security, Testing, & Production Practices

#### Q26: How are user passwords secured before saving to MongoDB?
**Answer:** Passwords are never saved in plaintext. They are hashed using salted `bcrypt` with 12 salt rounds before insertion.

#### Q27: How does JWT authentication work in this application?
**Answer:** Upon successful credential verification, the backend issues an HMAC-SHA256 signed JSON Web Token containing the user's ID and role. The client sends this token in the `Authorization: Bearer <token>` header for subsequent authenticated requests.

#### Q28: How does the backend prevent NoSQL injection attacks?
**Answer:** Queries are strictly constructed using typed Python dictionaries and validated Pydantic schemas. Unsanitized strings or arbitrary client-submitted JSON objects are never passed directly to database operators.

#### Q29: What automated testing framework was used, and what was tested?
**Answer:** `pytest` with FastAPI's `TestClient`. Tests verify the health endpoint, user registration/login, JWT token verification, conversation creation, message persistence, AI generation, feedback submission, and database explorer routes.

#### Q30: What is the purpose of the database seeding script?
**Answer:** `seed_data.py` populates the database with realistic demonstration users, 16 conversations, 120+ messages, and feedback ratings spanning a 14-day history, enabling analytics and charts to render immediately.

#### Q31: What WiredTiger cache settings are recommended in production?
**Answer:** By default, WiredTiger uses 50% of (total RAM minus 1GB) or 256MB, whichever is larger, allowing the OS to utilize the rest for filesystem cache.

#### Q32: What is the role of the Database Explorer view in the UI?
**Answer:** It provides an educational, read-only interface displaying active collections, document counts, index definitions, and explain plans to demonstrate practical NoSQL concepts.

#### Q33: How does MongoDB handle data consistency during multi-document writes?
**Answer:** In MongoDB 4.0+, multi-document ACID transactions are supported across replica sets using `session.start_transaction()`.

#### Q34: What is the purpose of the compound index on `feedback` (`user_id`, `message_id`)?
**Answer:** It enforces a database-level uniqueness constraint ensuring a user cannot submit multiple conflicting feedback records for the same assistant response.

#### Q35: If the system scaled to 10 million messages, what MongoDB architecture would you adopt?
**Answer:** Horizontal scaling via **Sharding**. A shard cluster consisting of Config Servers, `mongos` query routers, and Shard replica sets partitioned using a compound shard key such as `{ user_id: 1, conversation_id: 1 }`.
