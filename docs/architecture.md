# QuickNotes System Architecture

## 1. Overview

QuickNotes is a notes application that allows users to create, view, update, and delete notes. This document describes a scalable architecture designed to support approximately one million registered users.

The architecture separates the frontend, application servers, database, caching layer, and background processing so that each component can scale independently.

The architecture below is a proposed design for a production version of QuickNotes. The current learning application uses JSONPlaceholder as a mock API and does not implement this entire infrastructure.

## 2. Functional Requirements

The system must allow users to:

* Register and sign in securely.
* Create a note with a title and optional content.
* View a list of their notes.
* Retrieve an individual note.
* Update an existing note.
* Delete a note.
* Organize notes using tags.
* Access only notes they are authorized to view.

## 3. Non-Functional Requirements

The system should provide:

* **Scalability:** Support one million registered users and increased traffic.
* **Availability:** Continue operating when an application server fails.
* **Performance:** Return common note queries quickly.
* **Security:** Protect accounts and note content through authentication, authorization, encryption, and input validation.
* **Durability:** Store notes reliably and maintain backups.
* **Maintainability:** Allow components to be updated independently.
* **Observability:** Collect logs, metrics, and alerts to identify failures.

## 4. High-Level Architecture Diagram

```text
                         USERS
                           |
                           v
                    +-------------+
                    | Web Browser |
                    +-------------+
                           |
                           v
                    +-------------+
                    |    DNS      |
                    +-------------+
                           |
                           v
                    +-------------+
                    |    CDN      |
                    +-------------+
                           |
                           v
                    +----------------+
                    | Load Balancer  |
                    +----------------+
                       /          \
                      v            v
             +----------------+  +----------------+
             | Application    |  | Application    |
             | Server 1       |  | Server 2       |
             +----------------+  +----------------+
                       \          /
                        \        /
                         v      v
                    +----------------+
                    | Cache (Redis)  |
                    +----------------+
                           |
                           v
                    +----------------+
                    | Primary        |
                    | Database       |
                    +----------------+
                           |
                           v
                    +----------------+
                    | Read Replica   |
                    +----------------+

                    Application Servers
                           |
                           v
                    +----------------+
                    | Message Queue  |
                    +----------------+
                           |
                           v
                    +----------------+
                    | Background     |
                    | Worker Servers |
                    +----------------+
                           |
                           v
                    +----------------+
                    | Email, Cleanup,|
                    | and Other Jobs |
                    +----------------+
```

**Important:** This diagram is a logical overview. In a real deployment, read queries are routed to the cache or read replica where appropriate, while writes go to the primary database. The message queue is used for asynchronous work.

## 5. Capacity Estimates for One Million Users

Capacity estimates help determine the resources required to support expected traffic. These numbers are planning assumptions, not measured usage.

### 5.1 Assumptions

Assume the system has:

* 1,000,000 registered users.
* 100,000 daily active users.
* 50 API requests per active user per day.
* 90% read requests and 10% write requests.
* A peak traffic period five times higher than average.
* An average stored note size of 2 KB, including its text and basic metadata.
* Each daily active user creates an average of 2 notes per day.

### 5.2 Requests Per Day

Total requests per day:

100,000 active users × 50 requests per user

= **5,000,000 requests per day**

### 5.3 Average Reads Per Second

Assume 90% of requests are reads.

5,000,000 × 0.90 = 4,500,000 reads per day

Average reads per second:

4,500,000 ÷ 86,400

= **approximately 52 reads per second**

At five times average traffic:

52 × 5 = **approximately 260 peak reads per second**

### 5.4 Average Writes Per Second

Assume 10% of API requests are writes.

5,000,000 × 0.10 = 500,000 writes per day

Average writes per second:

500,000 ÷ 86,400

= **approximately 6 writes per second**

At five times average traffic:

6 × 5 = **approximately 30 peak writes per second**

These estimates include all API requests classified as writes, such as creating, updating, or deleting notes. The actual distribution will depend on user behavior.

### 5.5 Storage Required Per Year

Assume each of the 100,000 daily active users creates two notes per day.

Daily note creation:

100,000 × 2 = 200,000 notes per day

Annual note creation:

200,000 × 365 = 73,000,000 notes per year

Assume each note requires an average of 2 KB.

Annual raw note storage:

73,000,000 × 2 KB = 146,000,000 KB

Using decimal storage units, this is approximately **146 GB of new note data per year**.

This estimate excludes indexes, database overhead, replicas, backups, and historical versions. Actual storage requirements will be higher. Note edits and deletions may also affect retained storage.

### 5.6 Capacity Summary

| Metric             |   Average estimate | Five-times peak estimate |
| ------------------ | -----------------: | -----------------------: |
| Total API requests | 58 requests/second |      290 requests/second |
| Reads              |    52 reads/second |         260 reads/second |
| Writes             |    6 writes/second |         30 writes/second |

**Annual new note storage:** approximately 146 GB before database overhead, replicas, and backups.

The total API request rate is based on 5,000,000 requests per day divided by 86,400 seconds. The read and write estimates are rounded, so totals may differ slightly.

These estimates are starting points. Production monitoring and load testing should be used to validate them.

## 6. Architecture Components and Their Responsibilities

### 6.1 Web Browser

The browser displays the user interface and sends HTTPS requests to the application.

It allows users to create, view, edit, and delete notes without directly accessing the database.

### 6.2 DNS (Domain Name System)

DNS translates the application's domain name into the appropriate network destination.

It allows users to access the application using a readable domain name instead of remembering an IP address.

A reliable DNS provider and suitable health-aware routing can help direct traffic toward available infrastructure where supported.

### 6.3 Content Delivery Network (CDN)

A CDN caches eligible static files, such as JavaScript, CSS, images, and fonts, at geographically distributed locations.

This reduces latency for users and decreases the amount of static traffic reaching the origin servers.

Private note data must not be cached publicly. Cache rules must protect authenticated and sensitive responses.

### 6.4 Load Balancer

The load balancer distributes incoming requests across healthy application servers.

It prevents a single server from receiving all traffic and can stop sending requests to an unhealthy server.

Multiple application servers and health checks help reduce the risk that one application server becomes a single point of failure.

### 6.5 Application Servers

Application servers implement the business logic and API endpoints.

They authenticate users, validate input, check authorization, and coordinate database operations.

At least two application servers are deployed so that the application can continue operating if one server fails. Additional instances can be added as traffic increases.

Application servers should be stateless: durable user and note data belongs in shared storage rather than in the memory of one server.

### 6.6 Cache

A shared cache such as Redis stores frequently accessed data temporarily.

It can reduce repeated database reads and improve response times for common queries.

Cache entries should expire or be invalidated when relevant data changes. The database remains the durable source of truth.

If the cache fails, the application should be able to fall back to the database, subject to capacity limits.

### 6.7 Primary Database

The primary relational database stores durable application data, including users, notes, tags, and relationships between notes and tags.

A relational database such as PostgreSQL is suitable because the application requires structured records, relationships, constraints, and transactions.

Writes are sent to the primary database to maintain a consistent source of truth.

### 6.8 Read Replica

A read replica receives replicated data from the primary database and can serve suitable read queries.

It reduces read pressure on the primary database and allows read capacity to scale separately.

Replication may be delayed. Therefore, operations requiring immediate read-after-write consistency should read from the primary database when necessary.

A replica alone is not a complete backup or disaster-recovery solution.

### 6.9 Message Queue

The message queue stores tasks that can be processed asynchronously.

Examples include sending notifications, generating reports, and scheduling cleanup jobs.

The queue separates background work from the immediate user request, helping API responses remain responsive.

Production systems should use retries, failure handling, and idempotent job processing to avoid duplicate effects.

### 6.10 Background Worker Servers

Worker servers consume tasks from the queue and execute them independently of the main API request.

Workers can scale separately from application servers when background workloads increase.

Failed jobs should be retried according to a defined policy. Repeated failures should be recorded and moved to a dead-letter queue or equivalent mechanism for investigation.

### 6.11 Monitoring, Logging, and Alerts

Monitoring collects metrics such as request latency, error rates, CPU usage, memory consumption, and database load.

Centralized logs help developers investigate errors across multiple application servers.

Alerts notify operators when the service approaches capacity limits or experiences failures.

### 6.12 Backups and Recovery

Automated database backups and point-in-time recovery protect against accidental deletion, data corruption, and infrastructure failures.

Backups should be stored separately from the primary database environment and periodically tested through restoration exercises.

## 7. Request Flow: GET /notes

The following steps describe how a user retrieves their notes.

1. The user opens QuickNotes in a browser.
2. DNS resolves the application's domain name.
3. The browser downloads eligible static assets through the CDN.
4. The browser sends an authenticated HTTPS request to `GET /notes`.
5. The load balancer forwards the request to a healthy application server.
6. The application server validates the user's authentication and authorization.
7. The application checks the cache for the requested user's notes.
8. If a valid cache entry exists, the application can return the cached result.
9. If the cache does not contain the result, the application queries the appropriate database. A read replica may serve this query when replication consistency requirements permit it.
10. The application returns the notes as a JSON response.
11. The browser displays the notes to the user.
12. If appropriate, the application caches the result for a limited period.

The application must ensure that cached responses are scoped to the correct user. One user's private notes must never be returned to another user.

## 8. Request Flow: POST /notes

The following steps describe how a user creates a note.

1. The user submits the note form in the browser.
2. The browser sends an authenticated HTTPS `POST /notes` request with the note data in JSON.
3. DNS resolves the application's domain name, and the request reaches the load balancer.
4. The load balancer forwards the request to a healthy application server.
5. The application server authenticates the user and validates the submitted title and content.
6. The application checks whether the user is authorized to create the note and whether applicable limits are satisfied.
7. The application inserts the note into the primary database using a transaction where appropriate.
8. The database confirms the successful write.
9. The application invalidates or updates affected cache entries.
10. If follow-up work is needed, such as sending a notification, the application publishes a task to the message queue.
11. The application returns `201 Created` with the newly created note, normally including its identifier.
12. A background worker processes the queued task independently.

The note should not be reported as successfully created until its durable database write succeeds.

## 9. Scaling Strategy

### Horizontal Application Scaling

Add application server instances as request volume increases. The load balancer distributes traffic across healthy instances.

Because the application servers are stateless, any healthy instance can process an authenticated request.

### Database Scaling

Use indexes for common queries, connection pooling, query optimization, and read replicas to improve database performance.

If write volume grows beyond a single primary database's capacity, evaluate partitioning or sharding based on measured bottlenecks and access patterns.

### Cache Scaling

Cache frequently requested data where safe. Use expiration policies and invalidation rules to prevent stale or incorrectly shared data.

### Background Processing Scaling

Increase worker capacity when the queue grows. Monitor queue depth, task latency, and retry rates to detect processing bottlenecks.

### Static Asset Scaling

Serve cacheable frontend assets through a CDN to reduce origin traffic and improve delivery performance.

## 10. Trade-Offs

### Trade-Off 1: Caching Versus Freshness

**Benefit:** Caching reduces database load and can improve response times.

**Cost:** Cached results may become stale or require careful invalidation.

**Decision:** Cache suitable read data with controlled expiration and invalidate affected entries when notes change. Avoid publicly caching private note responses.

### Trade-Off 2: Read Replicas Versus Consistency

**Benefit:** Read replicas can increase read capacity.

**Cost:** Replication delay can cause recently written data to appear missing temporarily.

**Decision:** Use replicas for queries that tolerate replication lag. Route operations requiring immediate consistency to the primary database.

### Trade-Off 3: Asynchronous Processing Versus Simplicity

**Benefit:** Queues keep non-essential background work out of the main request path.

**Cost:** Queues and workers introduce additional infrastructure, monitoring, and failure-handling requirements.

**Decision:** Use a queue for tasks that do not need to finish before the API response is returned. Keep the initial implementation simple until asynchronous processing is needed.

### Trade-Off 4: More Infrastructure Versus Operating Cost

**Benefit:** Multiple servers, replicas, caches, and queues can improve scalability and availability.

**Cost:** Each component increases operating costs and system complexity.

**Decision:** Start with a smaller reliable deployment and add infrastructure when measurements and requirements justify it.

## 11. Avoiding Single Points of Failure

A single point of failure is a component whose failure can bring down the entire service.

The proposed architecture reduces this risk through the following measures:

* **Application servers:** Deploy multiple instances across separate failure domains where possible.
* **Load balancer:** Use a managed or redundant load-balancing service rather than relying on one manually maintained instance.
* **Database:** Configure automated backups, recovery procedures, and an appropriate failover strategy.
* **Read replica:** Use replication to support read scaling and, where appropriately configured, disaster recovery.
* **Cache:** Allow database fallback when the cache is unavailable, while protecting the database from sudden overload.
* **Message queue:** Use a durable queue with appropriate availability guarantees and retry policies.
* **Background workers:** Run multiple workers so one failed worker does not stop all background processing.
* **DNS:** Use a reliable provider and maintain access to domain-management and recovery procedures.
* **Monitoring:** Alert on failures and regularly test recovery plans.

Redundancy alone does not guarantee availability. Failover procedures, capacity planning, backups, and regular recovery tests are also necessary.

## 12. Security Considerations

* Require HTTPS for communication between clients and the application.
* Authenticate users and authorize every request involving private notes.
* Validate and limit user input on the server.
* Use parameterized SQL queries to reduce SQL injection risk.
* Store passwords using an appropriate password-hashing algorithm if authentication is managed by the application.
* Encrypt sensitive data in transit and use appropriate encryption at rest.
* Store secrets outside source code.
* Apply least-privilege access to databases, workers, and infrastructure.
* Rate-limit sensitive endpoints to reduce abuse.
* Avoid logging passwords, access tokens, or private note content unnecessarily.
* Restrict access to backups and test restoration procedures.
* Keep dependencies and infrastructure components patched.

## 13. Conclusion

This architecture separates user-facing requests, durable data storage, caching, and background processing.

For the assumed workload of one million registered users, the initial estimates are approximately 52 average reads per second, 6 average writes per second, and 146 GB of new note data per year before database overhead and additional copies.

Multiple application servers, a load balancer, database replication, caching, durable queues, monitoring, and tested recovery procedures provide a foundation for growth. These choices should be validated and refined through production metrics and load testing rather than treated as fixed requirements.
