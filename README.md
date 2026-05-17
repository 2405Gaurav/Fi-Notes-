# 📝 Fi Money Notes App

A production-grade, multi-user notes application with sharing, versioning, and full-text search — built as a backend API with a React frontend.

> **Backend**: Node.js · Express · TypeScript · Prisma · PostgreSQL  
> **Frontend**: React · Vite · Zustand · Framer Motion

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL database (or [Neon](https://neon.tech) serverless)

### Server Setup

```bash
cd server
npm install
cp .env.example .env     # Configure your database URL and JWT secret
npx prisma db push       # Create tables
npx tsx src/scripts/seed.ts  # (Optional) Seed test data
npm run dev              # Start on http://localhost:3000
```

### 🔑 Demo Credentials

After running the seed script, use these accounts to test:

| Email | Password | Notes |
|---|---|---|
| `alice@test.com` | `password123` | 5 notes, shares "Project Roadmap Q3" with Bob |
| `bob@test.com` | `password123` | 4 notes, has READ access to Alice's roadmap |
| `charlie@test.com` | `password123` | 6 notes |

> Or register a new account via `POST /register` with any `{email, password}`.

### 🔐 Authentication Flow

1. **Register** → `POST /register` with `{email, password}` → `201 Created`
2. **Login** → `POST /login` with `{email, password}` → `200 OK` with `{access_token}`
3. **Use token** → Add `Authorization: Bearer <access_token>` header to all protected endpoints
4. **Token expiry** → JWT expires after **7 days** (configurable via `JWT_EXPIRES_IN` env var)
5. **On expiry** → Client gets `401 Unauthorized`, redirects to login

> **Note**: This app uses a single JWT access token (no refresh token). The 7-day expiry provides a good balance between security and convenience for this use case.

### Client Setup

```bash
cd client
npm install
npm run dev              # Start on http://localhost:5173
```

### Environment Variables (`server/.env`)

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `DIRECT_URL` | Optional Prisma direct connection string; falls back to `DATABASE_URL` |
| `JWT_SECRET` | Secret key for signing JWT tokens |
| `PORT` | Server port (default: 3000) |
| `CORS_ORIGIN` | Comma-separated allowed CORS origins |

---

## 📡 API Endpoints

### Authentication

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/register` | Register a new user | No |
| `POST` | `/login` | Authenticate and get JWT | No |

**Register** — `POST /register`
```json
// Request
{ "email": "user@example.com", "password": "mypassword" }
// Response: 201 Created
{ "message": "User registered successfully" }
```

**Login** — `POST /login`
```json
// Request
{ "email": "user@example.com", "password": "mypassword" }
// Response: 200 OK
{ "access_token": "eyJhbGciOiJIUzI1NiIs..." }
```

### Notes CRUD

All note endpoints require `Authorization: Bearer <token>` header.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/notes` | Get all notes (flat array) |
| `GET` | `/notes?page=1&limit=20` | Get paginated notes |
| `GET` | `/notes/:id` | Get a specific note |
| `POST` | `/notes` | Create a new note |
| `PUT` | `/notes/:id` | Update a note |
| `DELETE` | `/notes/:id` | Soft-delete (move to trash) |

**Create Note** — `POST /notes`
```json
// Request
{ "title": "Meeting Notes", "content": "Discussed Q3 goals" }
// Response: 201 Created
{
  "id": "uuid",
  "title": "Meeting Notes",
  "content": "Discussed Q3 goals",
  "created_at": "2026-05-17T05:26:16.627Z",
  "updated_at": "2026-05-17T05:26:16.627Z"
}
```

**Get All Notes** — `GET /notes`
```json
// Response: 200 OK (flat array)
[
  {
    "id": "uuid",
    "title": "Meeting Notes",
    "content": "Discussed Q3 goals",
    "created_at": "2026-05-17T...",
    "updated_at": "2026-05-17T..."
  }
]
```

### Sharing & Collaboration

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/notes/:id/share` | Share a note with another user |
| `PATCH` | `/notes/:id/share/:userId` | Update share permission |
| `DELETE` | `/notes/:id/share/:userId` | Revoke access |
| `GET` | `/notes/:id/collaborators` | List collaborators |

**Share Note** — `POST /notes/:id/share`
```json
// Request
{ "share_with_email": "other@example.com", "permission": "EDIT" }
// Response: 200 OK
{ "message": "Note shared successfully" }
```

### Trash & Restore

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/notes?deleted=true` | List trashed notes |
| `POST` | `/notes/:id/restore` | Restore from trash |
| `DELETE` | `/notes/:id/permanent` | Permanently delete |

### Version History

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/notes/:id/versions` | Paginated version history |

### Search

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/search?q=keyword` | Full-text search across notes |

### Meta

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/about` | API information |
| `GET` | `/openapi.json` | OpenAPI 3.0 specification |
| `GET` | `/api-docs` | Swagger UI |
| `GET` | `/` | Health check |

---

## ✨ Bonus Features

### 1. Role-Based Note Sharing (Custom Feature)
Notes can be shared with granular permissions:
- **READ** — View only. Cannot modify the note.
- **EDIT** — Can update title and content. Cannot pin/archive/delete/share.
- **OWNER** — Full control including sharing and deletion.

The permission matrix is enforced at the service layer. The frontend dynamically shows/hides UI controls based on the user's permission level.

### 2. Note Version History
Every edit creates an immutable snapshot of the previous state. Users can browse paginated version history to see what a note looked like before each change. Versions are stored in a separate `note_versions` table with auto-incrementing version numbers.

### 3. Soft Delete & Restore
Notes are soft-deleted first (moved to trash). From the trash view, users can:
- **Restore** — Move back to active notes
- **Delete forever** — Permanently remove (with confirmation dialog)

Permanent deletion cascades to all shared access and version history.

### 4. Paginated API
All list endpoints support pagination via `?page=&limit=` query params. The `GET /notes` endpoint returns a flat array by default (spec-compatible) and the paginated format `{notes, meta}` when pagination params are provided.

### 5. Full-Text Search
`GET /search?q=keyword` searches across titles and content with case-insensitive matching. Results include both owned and shared notes, with pagination support.

### 6. Rate Limiting
Global rate limiting via `express-rate-limit`:
- **100 requests per 15 minutes** per IP
- Returns `429 Too Many Requests` with `Retry-After` header
- Frontend parses the header and shows a human-readable wait time

### 7. Simple Node Deployment
Deploy the backend as a standard Node service:
```bash
cd server
npm run build
npm start
```

Set these environment variables in your host:
- `DATABASE_URL`
- `JWT_SECRET`
- `CORS_ORIGIN`
- optional `DIRECT_URL` for Prisma CLI tasks

If the database is brand new, run `npm run db:push` once after the first deploy.

### 8. Frontend (React)
A Google Keep-inspired dark-mode UI built with:
- **React + Vite** — Fast development and builds
- **Zustand** — Lightweight state management
- **Framer Motion** — Smooth animations and transitions
- **DM Sans / DM Mono** — Clean typography

Features: note cards with masonry grid, inline composer, modal editing, sharing modal with permission selector, trash view with restore/delete, version history viewer, search with results highlighting, and toast notifications.

---

## 🏗️ Architecture

```
server/
├── src/
│   ├── config/          # Environment config
│   ├── constants/       # HTTP status codes, pagination defaults
│   ├── controllers/     # Thin request handlers
│   ├── docs/            # Swagger/OpenAPI config
│   ├── lib/             # Prisma client instance
│   ├── middleware/       # Auth JWT + global error handler
│   ├── routes/          # Express route definitions with JSDoc
│   ├── scripts/         # Database seed script
│   ├── services/        # Business logic layer
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Password hashing, JWT signing
│   └── validators/      # Zod schemas for request validation
├── prisma/
│   └── schema.prisma    # Database schema

client/
├── src/
│   ├── api/             # API client functions
│   ├── components/      # React components (notes, auth, UI)
│   ├── context/         # Zustand store
│   └── App.tsx          # Root component
└── index.html
```

### Request Flow
```
Client Request → Rate Limiter → CORS → JSON Parser → Auth Middleware → Route → Controller → Zod Validation → Service (Business Logic) → Prisma → PostgreSQL
                                                                                                                      ↓ (on error)
                                                                                                              Global Error Handler → JSON Response
```

---

## 🔒 Security

- **Password hashing** — bcryptjs with salt rounds
- **JWT authentication** — Signed tokens with configurable expiry
- **Input validation** — Zod schemas on every endpoint
- **Rate limiting** — 100 req/15min per IP
- **CORS** — Configurable allowed origins
- **SQL injection prevention** — Prisma parameterized queries
- **Authorization** — Service-layer permission checks (owner vs shared user)

---

## 🧪 Edge Cases Handled

| Scenario | Response |
|---|---|
| Register with existing email | `409: Email already registered` |
| Login with wrong password | `401: Invalid email or password` |
| Access another user's note | `403: You do not have access` |
| Share with non-existent email | `404: No user found with that email` |
| Share note with yourself | `400: You cannot share a note with yourself` |
| Delete already-trashed note | `400: Note is already in trash` |
| Restore a non-trashed note | `400: Note is not in trash` |
| Permanent delete non-trashed note | `400: Must be in trash first` |
| Shared user tries to delete/share | `403: Only the owner can...` |
| EDIT user tries to pin/archive | `403: Shared users can only edit title and content` |
| Invalid UUID in path | `404: Note not found` |
| Missing auth header | `401: No token provided` |
| Expired JWT | `401: Invalid or expired token` |
| Empty request body | `400: At least one field must be provided` |
| Rate limit exceeded | `429: Too many requests` with retry time |

---

## 📦 Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20 |
| Framework | Express 5 |
| Language | TypeScript (strict mode) |
| ORM | Prisma 7 |
| Database | PostgreSQL (NeonDB serverless) |
| Auth | JWT (jsonwebtoken) |
| Validation | Zod 4 |
| Rate Limiting | express-rate-limit |
| API Docs | Swagger UI + swagger-jsdoc |
| Frontend | React 19 + Vite |
| State | Zustand |
| Animations | Framer Motion |
| Deployment | Node.js + Render |
