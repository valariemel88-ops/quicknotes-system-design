# QuickNotes System Design

QuickNotes is a notes application that demonstrates frontend development, REST API integration, database design, and scalable system architecture.

The application allows users to load notes from an API, create new notes, and delete notes. The project also documents how a production notes platform could be designed to support one million registered users.

## Features

* Load notes from a REST API.
* Create notes using HTTP POST requests.
* Delete notes using HTTP DELETE requests.
* Display loading, success, error, and empty states.
* Validate note titles.
* Handle API errors.
* Use responsive HTML and CSS.
* Document REST API endpoints.
* Design a relational database schema.
* Plan a scalable backend architecture.

## Technologies Used

* HTML5
* CSS3
* JavaScript
* Fetch API
* JSONPlaceholder
* PostgreSQL
* REST API concepts
* Git and GitHub

## How to Run the Project

### 1. Clone the repository

```bash
git clone https://github.com/valariemel88-ops/quicknotes-system-design.git
```

### 2. Open the project folder

```bash
cd quicknotes-system-design
```

### 3. Run the application

Open `index.html` in your browser.

Alternatively, use the Live Server extension in Visual Studio Code.

**Note:** An internet connection is required to communicate with the JSONPlaceholder API.

## API Behavior

The frontend uses JSONPlaceholder, a free API for testing and learning.

It supports simulated note creation, retrieval, and deletion.

**Important:** JSONPlaceholder does not permanently save created notes or delete existing server records. Changes made through the application are demonstrations of API behavior, not permanent database changes.

The proposed production API is documented separately.

## Project Documentation

Explore the design documents:

* [API Design](docs/api-design.md) — REST endpoints, request and response examples, validation, and HTTP status codes.
* [Data Model](docs/data-model.md) — Database tables, relationships, SQL queries, indexes, and SQL versus NoSQL.
* [System Architecture](docs/architecture.md) — Architecture for a system designed to support one million registered users, including caching, load balancing, databases, queues, and background workers.

## What I Learned

1. **REST API integration:** How to use JavaScript's Fetch API with GET, POST, and DELETE requests, including error handling and response processing.
2. **Database design:** How to model users, notes, and tags using relational tables, foreign keys, indexes, and SQL queries.
3. **System design and scalability:** How load balancers, stateless application servers, caching, database replicas, and background workers can help a system handle increased traffic.

## Future Improvements

* Add user registration and authentication.
* Connect the application to a persistent database.
* Implement editing and tagging.
* Add pagination and search.
* Introduce automated tests.
* Deploy the application to a hosting platform.

## Project Status

The frontend API client and system design documentation are implemented as a learning project. The production architecture described in the documentation is a proposed design, not a deployed backend.

---

Created as a software engineering learning project.
