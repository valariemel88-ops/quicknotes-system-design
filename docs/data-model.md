# QuickNotes Data Model

## 1. Overview

The QuickNotes system needs a database to store user accounts, notes, tags, and the relationships between notes and tags.

The database must keep information organized, protect users' data, and support efficient operations as the number of users grows.

This document describes a proposed relational database design using PostgreSQL.

## 2. Database Requirements

The database should support:

* Storing user account information.
* Allowing each user to create multiple notes.
* Allowing notes to have titles and optional bodies.
* Organizing notes using tags.
* Allowing multiple tags per note.
* Allowing the same tag to be associated with multiple notes.
* Retrieving, creating, updating, and deleting notes.
* Preventing users from accessing other users' private notes.
* Efficiently searching and retrieving notes as the system grows.

## 3. Entity Relationship Overview

The database contains four main tables:

1. `users`
2. `notes`
3. `tags`
4. `note_tags`

The relationships are:

* One user can own many notes.
* One user can create many tags.
* One note can have many tags.
* One tag can be associated with many notes.
* The `note_tags` table resolves the many-to-many relationship between notes and tags.

### Relationship Diagram

```text
+------------------+
|      users       |
+------------------+
| id (PK)          |
| name             |
| email            |
| password_hash    |
| created_at       |
+------------------+
         |
         | 1
         |
         | Many
+------------------+
|      notes       |
+------------------+
| id (PK)          |
| user_id (FK)     |
| title            |
| body             |
| created_at       |
| updated_at       |
+------------------+
         |
         | 1
         |
         | Many
+------------------+
|    note_tags     |
+------------------+
| note_id (PK, FK) |
| tag_id (PK, FK)  |
+------------------+
         |
         | Many
         |
         | 1
+------------------+
|       tags       |
+------------------+
| id (PK)          |
| user_id (FK)     |
| name             |
| created_at       |
+------------------+
```

**Key:**

* PK = Primary Key.
* FK = Foreign Key.
* One-to-many relationships allow one record to be associated with multiple records in another table.
* The `note_tags` table implements a many-to-many relationship.

## 4. Database Tables

### 4.1 Users Table

The `users` table stores account information.

| Column        | Data type    | Constraints                     | Purpose                |
| ------------- | ------------ | ------------------------------- | ---------------------- |
| id            | BIGINT       | Primary key, generated identity | Unique user identifier |
| name          | VARCHAR(100) | NOT NULL                        | User's display name    |
| email         | VARCHAR(255) | NOT NULL, UNIQUE                | User's email address   |
| password_hash | TEXT         | NOT NULL                        | Secure password hash   |
| created_at    | TIMESTAMPTZ  | NOT NULL, default current time  | Account creation time  |

Passwords must never be stored as plaintext. A secure password-hashing algorithm should be used.

### 4.2 Notes Table

The `notes` table stores notes created by users.

| Column     | Data type    | Constraints                     | Purpose                |
| ---------- | ------------ | ------------------------------- | ---------------------- |
| id         | BIGINT       | Primary key, generated identity | Unique note identifier |
| user_id    | BIGINT       | Foreign key, NOT NULL           | Owner of the note      |
| title      | VARCHAR(100) | NOT NULL                        | Note title             |
| body       | TEXT         | Nullable                        | Note content           |
| created_at | TIMESTAMPTZ  | NOT NULL, default current time  | Creation time          |
| updated_at | TIMESTAMPTZ  | NOT NULL, default current time  | Last update time       |

Each note belongs to one user.

The `user_id` foreign key ensures that a note references an existing user. Application authorization must also verify ownership before allowing a note to be retrieved, updated, or deleted.

### 4.3 Tags Table

The `tags` table stores labels used to organize notes.

| Column     | Data type   | Constraints                     | Purpose               |
| ---------- | ----------- | ------------------------------- | --------------------- |
| id         | BIGINT      | Primary key, generated identity | Unique tag identifier |
| user_id    | BIGINT      | Foreign key, NOT NULL           | Owner of the tag      |
| name       | VARCHAR(50) | NOT NULL                        | Tag name              |
| created_at | TIMESTAMPTZ | NOT NULL, default current time  | Creation time         |

A unique constraint on `(user_id, name)` prevents the same user from creating duplicate tag names.

Different users can create tags with the same name.

### 4.4 Note_Tags Table

The `note_tags` table connects notes with tags.

| Column  | Data type | Constraints           | Purpose         |
| ------- | --------- | --------------------- | --------------- |
| note_id | BIGINT    | Foreign key, NOT NULL | Associated note |
| tag_id  | BIGINT    | Foreign key, NOT NULL | Associated tag  |

The combination of `note_id` and `tag_id` forms the composite primary key.

This prevents the same tag from being associated with the same note more than once.

Both foreign keys should use cascading deletion so that removing a note or tag also removes its relationship records.

The application must verify that the note and tag belong to the same user before creating an association.

## 5. SQL Schema

The following PostgreSQL schema implements the proposed design.

```sql
CREATE TABLE users (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notes (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    body TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tags (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, name)
);

CREATE TABLE note_tags (
    note_id BIGINT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    tag_id BIGINT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (note_id, tag_id)
);
```

The `updated_at` column needs application logic or a database trigger to update automatically whenever a note changes. The default value only sets its initial value.

## 6. Example SQL Queries

### 6.1 Create a Note

```sql
INSERT INTO notes (user_id, title, body)
VALUES (
    1,
    'My Learning Goals',
    'Learn HTML, CSS, JavaScript, and API development.'
)
RETURNING id, title, body, created_at;
```

This creates a note for user `1` and returns the newly created record.

### 6.2 Retrieve a User's Notes

```sql
SELECT id, title, body, created_at, updated_at
FROM notes
WHERE user_id = 1
ORDER BY created_at DESC
LIMIT 10;
```

This retrieves the ten most recently created notes belonging to a user.

In a production application, the user ID must come from the authenticated server-side identity rather than being trusted from arbitrary client input.

### 6.3 Retrieve One Note

```sql
SELECT id, title, body, created_at, updated_at
FROM notes
WHERE id = 101
  AND user_id = 1;
```

Including `user_id` helps ensure that the query only retrieves a note owned by the specified user.

### 6.4 Update a Note

```sql
UPDATE notes
SET
    title = 'Updated Learning Goals',
    body = 'Practise programming and database design.',
    updated_at = CURRENT_TIMESTAMP
WHERE id = 101
  AND user_id = 1
RETURNING id, title, body, updated_at;
```

This updates the note only if it belongs to the specified user.

If no row is returned, the note was not found for that user.

### 6.5 Delete a Note

```sql
DELETE FROM notes
WHERE id = 101
  AND user_id = 1
RETURNING id;
```

The query deletes the specified user's note. Related records in `note_tags` are deleted through the foreign-key cascade.

### 6.6 Create a Tag

```sql
INSERT INTO tags (user_id, name)
VALUES (1, 'Learning')
RETURNING id, name;
```

The unique constraint prevents a user from creating the same tag name more than once.

### 6.7 Retrieve Notes with Their Tags

```sql
SELECT
    n.id,
    n.title,
    n.body,
    t.name AS tag_name
FROM notes AS n
LEFT JOIN note_tags AS nt
    ON n.id = nt.note_id
LEFT JOIN tags AS t
    ON nt.tag_id = t.id
WHERE n.user_id = 1
ORDER BY n.created_at DESC;
```

The `LEFT JOIN` allows notes without tags to appear in the results.

A note associated with several tags will appear in multiple result rows. The application can group those rows by note ID.

## 7. Database Indexes

Indexes improve query performance by helping the database find records without scanning every row.

The following indexes support common QuickNotes operations:

```sql
CREATE INDEX idx_notes_user_created
ON notes (user_id, created_at DESC);

CREATE INDEX idx_note_tags_tag
ON note_tags (tag_id);
```

### Why These Indexes Matter

**`idx_notes_user_created`**

Supports retrieving a user's notes ordered by creation time. This is likely to be a frequent operation.

**`idx_note_tags_tag`**

Supports finding notes associated with a particular tag. The composite primary key on `note_tags(note_id, tag_id)` already helps lookups that begin with `note_id`, while this additional index supports lookups that begin with `tag_id`.

The unique constraints on `users.email` and `tags(user_id, name)` also create indexes in PostgreSQL.

Indexes require storage and add work to insert, update, and delete operations. They should be selected based on actual query patterns and measured performance.

## 8. SQL vs. NoSQL Databases

SQL and NoSQL databases offer different advantages.

| Feature        | SQL database                                             | NoSQL database                                                  |
| -------------- | -------------------------------------------------------- | --------------------------------------------------------------- |
| Data model     | Tables and relationships                                 | Document, key-value, wide-column, or graph models               |
| Schema         | Structured schema                                        | Often more flexible                                             |
| Relationships  | Foreign keys and joins                                   | Often handled through embedded data or application logic        |
| Transactions   | Strong transaction support                               | Depends on the database and operation                           |
| Data integrity | Constraints and relational rules                         | Depends on the database's features and application design       |
| Scaling        | Vertical and horizontal options, depending on the system | Often designed for distributed scaling, depending on the system |
| Best fit       | Structured data with clear relationships                 | Workloads benefiting from flexible or specialized data models   |

### Why PostgreSQL Is a Good Choice

PostgreSQL is suitable for QuickNotes because:

* Users own multiple notes.
* Notes and tags have a many-to-many relationship.
* Foreign keys help maintain data integrity.
* Transactions can keep related database operations consistent.
* Unique constraints help prevent duplicate emails and tag names.
* Indexes support common retrieval patterns.

A NoSQL database could also work, particularly if the system later required specialized document storage or a flexible data model. The choice should depend on workload requirements rather than assuming one database type is always better.

## 9. Data Integrity and Security

The database design supports data integrity and security through:

1. **Primary keys:** Every user, note, and tag has a unique identifier.
2. **Foreign keys:** Notes and tags reference existing users.
3. **Unique constraints:** Emails are unique, and each user cannot create duplicate tag names.
4. **Composite keys:** A note-tag association cannot be duplicated.
5. **Ownership checks:** Database queries and server-side authorization restrict access to the owner's records.
6. **Password hashing:** Passwords are stored as secure hashes, not plaintext.
7. **Parameterized queries:** Database operations use parameters rather than constructing SQL statements through unsafe string concatenation.
8. **Least privilege:** The application's database account receives only the permissions it needs.
9. **Backups:** Regular backups and tested recovery procedures protect against data loss.

For a production deployment, database connections should use encrypted transport where appropriate, and sensitive credentials should be stored securely.

## 10. Future Improvements

The database can be extended to support:

* Note search and filtering.
* Archived notes and a recycle bin.
* Note sharing and collaboration.
* Attachments.
* Note revision history.
* Full-text search.
* Audit logs.
* Soft deletion and data-retention policies.

Any new feature should be designed with its data requirements, authorization rules, and expected query patterns in mind.

## Conclusion

This data model provides a structured foundation for QuickNotes.

PostgreSQL is a practical choice because the system has clear relationships among users, notes, and tags. Primary keys, foreign keys, constraints, indexes, and ownership checks help maintain data integrity, security, and performance as the application grows.
