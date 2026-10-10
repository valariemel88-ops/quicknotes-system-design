# QuickNotes API Design

## 1. Overview

The QuickNotes API allows users to create, retrieve, update, and delete notes. It also supports organizing notes with tags and managing user accounts.

The API follows REST (Representational State Transfer) principles and uses HTTP methods to perform operations on resources.

### Base URL

```text
https://api.quicknotes.example.com/v1
```

This is a proposed API URL for the system design. It is not the JSONPlaceholder API used by the current frontend.

### Data Format

The API uses JSON for request and response bodies.

Requests that contain JSON should include the following header:

```http
Content-Type: application/json
```

Protected endpoints require an authentication token:

```http
Authorization: Bearer <access_token>
```

### Main Resources

* Users
* Notes
* Tags
* Note-tag relationships

---

## 2. API Endpoints

The following endpoints describe the proposed QuickNotes API.

### Endpoint 1: Get All Notes

**Method:** `GET`

**Path:** `/notes`

**Purpose:** Retrieve the authenticated user's notes.

**Example request:**

```http
GET /v1/notes?page=1&limit=10 HTTP/1.1
Host: api.quicknotes.example.com
Authorization: Bearer <access_token>
```

The `page` parameter identifies the requested page, while `limit` specifies the maximum number of notes returned.

**Example response — 200 OK:**

```json
{
  "data": [
    {
      "id": "note_101",
      "title": "My Learning Goals",
      "body": "Learn HTML, CSS, JavaScript, and API development.",
      "createdAt": "2026-10-10T08:00:00Z",
      "updatedAt": "2026-10-10T08:00:00Z"
    },
    {
      "id": "note_102",
      "title": "Project Planning",
      "body": "Break large projects into manageable tasks.",
      "createdAt": "2026-10-10T09:00:00Z",
      "updatedAt": "2026-10-10T09:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalItems": 2,
    "totalPages": 1
  }
}
```

**Possible status codes:**

* `200 OK` — Notes retrieved successfully.
* `401 Unauthorized` — Authentication is missing or invalid.
* `500 Internal Server Error` — An unexpected server error occurred.

---

### Endpoint 2: Get One Note

**Method:** `GET`

**Path:** `/notes/{id}`

**Purpose:** Retrieve a specific note belonging to the authenticated user.

**Example request:**

```http
GET /v1/notes/note_101 HTTP/1.1
Host: api.quicknotes.example.com
Authorization: Bearer <access_token>
```

**Example response — 200 OK:**

```json
{
  "data": {
    "id": "note_101",
    "title": "My Learning Goals",
    "body": "Learn HTML, CSS, JavaScript, and API development.",
    "createdAt": "2026-10-10T08:00:00Z",
    "updatedAt": "2026-10-10T08:00:00Z"
  }
}
```

**Possible status codes:**

* `200 OK` — Note retrieved successfully.
* `401 Unauthorized` — Authentication is missing or invalid.
* `404 Not Found` — The note does not exist or is not accessible to the user.

---

### Endpoint 3: Create a Note

**Method:** `POST`

**Path:** `/notes`

**Purpose:** Create a new note for the authenticated user.

**Example request:**

```http
POST /v1/notes HTTP/1.1
Host: api.quicknotes.example.com
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request body:**

```json
{
  "title": "My First API Note",
  "body": "I am learning how to build applications using APIs."
}
```

The server identifies the user from the authentication token rather than trusting a user ID supplied in the request body.

**Example response — 201 Created:**

```json
{
  "data": {
    "id": "note_103",
    "title": "My First API Note",
    "body": "I am learning how to build applications using APIs.",
    "createdAt": "2026-10-10T10:00:00Z",
    "updatedAt": "2026-10-10T10:00:00Z"
  }
}
```

**Possible status codes:**

* `201 Created` — Note created successfully.
* `400 Bad Request` — The request contains invalid data.
* `401 Unauthorized` — Authentication is missing or invalid.
* `422 Unprocessable Content` — The title fails validation.
* `500 Internal Server Error` — An unexpected server error occurred.

---

### Endpoint 4: Update a Note

**Method:** `PATCH`

**Path:** `/notes/{id}`

**Purpose:** Update one or more fields of an existing note.

**Example request:**

```http
PATCH /v1/notes/note_103 HTTP/1.1
Host: api.quicknotes.example.com
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request body:**

```json
{
  "title": "My Updated API Note"
}
```

Only the supplied field is changed. The existing note body remains unchanged.

**Example response — 200 OK:**

```json
{
  "data": {
    "id": "note_103",
    "title": "My Updated API Note",
    "body": "I am learning how to build applications using APIs.",
    "createdAt": "2026-10-10T10:00:00Z",
    "updatedAt": "2026-10-10T10:30:00Z"
  }
}
```

**Possible status codes:**

* `200 OK` — Note updated successfully.
* `400 Bad Request` — Invalid request data.
* `401 Unauthorized` — Authentication is missing or invalid.
* `404 Not Found` — The note does not exist or is not accessible to the user.
* `422 Unprocessable Content` — Validation failed.

---

### Endpoint 5: Delete a Note

**Method:** `DELETE`

**Path:** `/notes/{id}`

**Purpose:** Delete a note belonging to the authenticated user.

**Example request:**

```http
DELETE /v1/notes/note_103 HTTP/1.1
Host: api.quicknotes.example.com
Authorization: Bearer <access_token>
```

**Example response — 204 No Content:**

The server returns the status code `204 No Content` with an empty response body.

**Possible status codes:**

* `204 No Content` — Note deleted successfully.
* `401 Unauthorized` — Authentication is missing or invalid.
* `404 Not Found` — The note does not exist or is not accessible to the user.
* `500 Internal Server Error` — An unexpected server error occurred.

---

### Endpoint 6: Get All Tags

**Method:** `GET`

**Path:** `/tags`

**Purpose:** Retrieve the tags available to the authenticated user.

**Example request:**

```http
GET /v1/tags HTTP/1.1
Host: api.quicknotes.example.com
Authorization: Bearer <access_token>
```

**Example response — 200 OK:**

```json
{
  "data": [
    {
      "id": "tag_1",
      "name": "Work"
    },
    {
      "id": "tag_2",
      "name": "Learning"
    },
    {
      "id": "tag_3",
      "name": "Personal"
    }
  ]
}
```

**Possible status codes:**

* `200 OK` — Tags retrieved successfully.
* `401 Unauthorized` — Authentication is missing or invalid.
* `500 Internal Server Error` — An unexpected server error occurred.

---

### Endpoint 7: Create a Tag

**Method:** `POST`

**Path:** `/tags`

**Purpose:** Create a tag to help organize notes.

**Example request:**

```http
POST /v1/tags HTTP/1.1
Host: api.quicknotes.example.com
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request body:**

```json
{
  "name": "School"
}
```

**Example response — 201 Created:**

```json
{
  "data": {
    "id": "tag_4",
    "name": "School"
  }
}
```

**Possible status codes:**

* `201 Created` — Tag created successfully.
* `400 Bad Request` — Invalid request data.
* `401 Unauthorized` — Authentication is missing or invalid.
* `409 Conflict` — A tag with that name already exists for the user.
* `422 Unprocessable Content` — Tag validation failed.

---

### Endpoint 8: Add a Tag to a Note

**Method:** `PUT`

**Path:** `/notes/{id}/tags/{tagId}`

**Purpose:** Associate a tag with a note.

**Example request:**

```http
PUT /v1/notes/note_101/tags/tag_2 HTTP/1.1
Host: api.quicknotes.example.com
Authorization: Bearer <access_token>
```

**Example response — 200 OK:**

```json
{
  "data": {
    "noteId": "note_101",
    "tagId": "tag_2",
    "message": "Tag associated with note successfully."
  }
}
```

**Possible status codes:**

* `200 OK` — Tag association created or already exists.
* `401 Unauthorized` — Authentication is missing or invalid.
* `404 Not Found` — The note or tag does not exist or is not accessible to the user.

---

### Endpoint 9: Get the Current User

**Method:** `GET`

**Path:** `/users/me`

**Purpose:** Retrieve the profile of the currently authenticated user.

**Example request:**

```http
GET /v1/users/me HTTP/1.1
Host: api.quicknotes.example.com
Authorization: Bearer <access_token>
```

**Example response — 200 OK:**

```json
{
  "data": {
    "id": "user_1",
    "name": "Alex",
    "email": "alex@example.com",
    "createdAt": "2026-10-01T08:00:00Z"
  }
}
```

**Possible status codes:**

* `200 OK` — User profile retrieved successfully.
* `401 Unauthorized` — Authentication is missing or invalid.
* `500 Internal Server Error` — An unexpected server error occurred.

---

## 3. Error Response Format

The API should return consistent error responses so that frontend applications can handle failures predictably.

**Example response — 422 Unprocessable Content:**

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request contains invalid data.",
    "details": [
      {
        "field": "title",
        "message": "The title is required and must not exceed 100 characters."
      }
    ]
  }
}
```

### Common HTTP Status Codes

| Status code                 | Meaning                                   | Example                          |
| --------------------------- | ----------------------------------------- | -------------------------------- |
| `200 OK`                    | Request completed successfully            | Retrieve or update a note        |
| `201 Created`               | A resource was created                    | Create a note                    |
| `204 No Content`            | Request succeeded without a response body | Delete a note                    |
| `400 Bad Request`           | Request is malformed or invalid           | Invalid JSON                     |
| `401 Unauthorized`          | Authentication is missing or invalid      | Missing access token             |
| `403 Forbidden`             | User lacks permission                     | Access to a restricted operation |
| `404 Not Found`             | Resource is unavailable                   | Note does not exist              |
| `409 Conflict`              | Request conflicts with existing data      | Duplicate tag                    |
| `422 Unprocessable Content` | Request fails validation                  | Empty title                      |
| `429 Too Many Requests`     | Rate limit exceeded                       | Too many requests                |
| `500 Internal Server Error` | Unexpected server error                   | Database operation fails         |

---

## 4. Validation Rules

The API should validate incoming data before saving it.

### Note Validation

* The title is required.
* The title must not exceed 100 characters.
* The body is optional.
* The body must be a string when provided.
* The authenticated user must own the note before updating or deleting it.
* User input must be handled safely to reduce injection and cross-site scripting risks.

### Tag Validation

* The tag name is required.
* The tag name must not be empty.
* Duplicate tag names should be rejected for the same user.
* Users must only associate tags they are authorized to use.

Validation should happen on the server even when the frontend performs its own checks.

---

## 5. Authentication and Security

The proposed API should use the following security measures:

1. **Authentication:** Require a valid access token for protected endpoints.
2. **Authorization:** Verify that users can only access their own notes and permitted tags.
3. **Input validation:** Validate all incoming data on the server.
4. **HTTPS:** Encrypt network traffic between clients and the API.
5. **Rate limiting:** Limit excessive requests to protect the service.
6. **Safe error messages:** Avoid exposing passwords, access tokens, database credentials, or internal implementation details.
7. **Secure password storage:** If the application manages passwords, store salted password hashes rather than plaintext passwords.
8. **Data protection:** Use appropriate access controls, backups, and encryption for sensitive stored data.

---

## 6. Pagination and Performance

The notes endpoint supports pagination through query parameters.

Example:

```text
GET /v1/notes?page=2&limit=20
```

The server should enforce a maximum page size to prevent clients from requesting excessively large responses.

For large datasets, cursor-based pagination may be more efficient than page-number pagination because it can reduce the cost of retrieving later pages.

The API should also use database indexes for frequently queried fields, including the user ID and note creation date.

---

## 7. REST Design Principles

The proposed API follows these principles:

* **Resource-based URLs:** Resources use nouns such as `/notes`, `/tags`, and `/users/me`.
* **HTTP methods:** GET retrieves resources, POST creates resources, PATCH updates selected fields, PUT creates or replaces a resource or relationship, and DELETE removes resources.
* **Stateless requests:** Each request contains the authentication information and other context needed to process it.
* **Consistent responses:** Responses use JSON except when an operation, such as DELETE, returns `204 No Content`.
* **Appropriate status codes:** HTTP status codes communicate success or failure.
* **Separation of concerns:** The frontend handles the interface, while the API validates requests, enforces permissions, and manages data.

---

## 8. Relationship to the Current Project

The current QuickNotes frontend uses JSONPlaceholder for practice:

```text
https://jsonplaceholder.typicode.com/posts
```

It demonstrates GET, POST, and DELETE requests using JavaScript's Fetch API.

JSONPlaceholder is a mock REST API. It simulates creating and deleting posts but does not permanently save those changes.

The endpoints documented in this file describe a proposed production QuickNotes API. They are a system design specification, not endpoints currently implemented by the frontend.

---

## Conclusion

This API design provides a foundation for a QuickNotes application that supports note management, tagging, authentication, validation, and consistent error handling.

The design can be extended with search, note sharing, collaboration, and additional features as the application grows.
