# REST API Plan

## 1. Resources

| Resource            | Database Table                      | Description                                     |
| ------------------- | ----------------------------------- | ----------------------------------------------- |
| Users               | `profiles` (linked to `auth.users`) | User accounts and preferences                   |
| Flashcards          | `flashcards`                        | Educational flashcards (AI-generated or manual) |
| Generation Sessions | `generation_sessions`               | AI flashcard generation history                 |
| Learning Sessions   | `learning_sessions`                 | Spaced repetition study sessions                |
| Flashcard Reviews   | `flashcard_reviews`                 | Individual flashcard review logs                |

---

## 2. Endpoints

### 2.1. Authentication

Authentication is handled by Supabase Auth. The API endpoints below are provided by Supabase SDK and do not require custom implementation.

#### POST `/api/auth/register`

Registers a new user account.

- **Request Payload:**

```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

- **Response Payload (201 Created):**

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "created_at": "2024-01-01T00:00:00Z"
  },
  "session": {
    "access_token": "jwt_token",
    "refresh_token": "refresh_token",
    "expires_at": 1704067200
  }
}
```

- **Error Responses:**
  - `400 Bad Request` – Invalid email format or weak password
  - `409 Conflict` – Email already registered

---

#### POST `/api/auth/login`

Authenticates an existing user.

- **Request Payload:**

```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

- **Response Payload (200 OK):**

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  },
  "session": {
    "access_token": "jwt_token",
    "refresh_token": "refresh_token",
    "expires_at": 1704067200
  }
}
```

- **Error Responses:**
  - `400 Bad Request` – Missing required fields
  - `401 Unauthorized` – Invalid credentials

---

#### POST `/api/auth/logout`

Logs out the current user.

- **Headers:** `Authorization: Bearer <access_token>`

- **Response Payload (200 OK):**

```json
{
  "message": "Successfully logged out"
}
```

- **Error Responses:**
  - `401 Unauthorized` – No valid session

---

#### DELETE `/api/auth/account`

Deletes user account and all associated data (GDPR compliance).

- **Headers:** `Authorization: Bearer <access_token>`

- **Response Payload (200 OK):**

```json
{
  "message": "Account and all associated data deleted successfully"
}
```

- **Error Responses:**
  - `401 Unauthorized` – Not authenticated

---

#### POST `/api/auth/reset-password`

Initiates password reset by sending an email with a reset link.

- **Request Payload:**

```json
{
  "email": "user@example.com"
}
```

- **Response Payload (200 OK):**

```json
{
  "message": "If this email exists, a password reset link has been sent"
}
```

> **Note:** For security reasons, the same success message is returned regardless of whether the email exists in the system. This prevents email enumeration attacks.

- **Error Responses:**
  - `400 Bad Request` – Invalid email format
  - `429 Too Many Requests` – Rate limit exceeded (max 3 requests per hour per email)

---

#### POST `/api/auth/update-password`

Sets a new password using the reset token from the email link. This endpoint is called after the user clicks the reset link and is redirected to the password update page.

- **Headers:** User must be authenticated via the reset token (handled by Supabase Auth callback)

- **Request Payload:**

```json
{
  "password": "newSecurePassword123",
  "confirmPassword": "newSecurePassword123"
}
```

- **Response Payload (200 OK):**

```json
{
  "message": "Password updated successfully"
}
```

- **Error Responses:**
  - `400 Bad Request` – Password doesn't meet requirements or passwords don't match
  - `401 Unauthorized` – Invalid or expired reset token

---

### 2.2. Flashcards

#### GET `/api/flashcards`

Retrieves all flashcards for the authenticated user.

- **Headers:** `Authorization: Bearer <access_token>`

- **Query Parameters:**
  | Parameter | Type | Required | Description |
  |-----------|------|----------|-------------|
  | `page` | integer | No | Page number (default: 1) |
  | `limit` | integer | No | Items per page (default: 20, max: 100) |
  | `source` | string | No | Filter by source: `ai` or `manual` |
  | `sort` | string | No | Sort field: `created_at`, `updated_at`, `next_review_date` |
  | `order` | string | No | Sort order: `asc` or `desc` (default: `desc`) |

- **Response Payload (200 OK):**

```json
{
  "data": [
    {
      "id": "uuid",
      "front": "What is spaced repetition?",
      "back": "A learning technique that incorporates increasing intervals of time between subsequent review of previously learned material.",
      "source": "ai",
      "generation_session_id": "uuid",
      "next_review_date": "2024-01-15",
      "interval": 7,
      "ease_factor": 2.5,
      "repetition_count": 3,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-08T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "total_pages": 8
  }
}
```

- **Error Responses:**
  - `401 Unauthorized` – Not authenticated

---

#### GET `/api/flashcards/:id`

Retrieves a single flashcard by ID.

- **Headers:** `Authorization: Bearer <access_token>`

- **Response Payload (200 OK):**

```json
{
  "id": "uuid",
  "front": "What is spaced repetition?",
  "back": "A learning technique that incorporates increasing intervals of time between subsequent review of previously learned material.",
  "source": "ai",
  "generation_session_id": "uuid",
  "next_review_date": "2024-01-15",
  "interval": 7,
  "ease_factor": 2.5,
  "repetition_count": 3,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-08T00:00:00Z"
}
```

- **Error Responses:**
  - `401 Unauthorized` – Not authenticated
  - `404 Not Found` – Flashcard not found or belongs to another user

---

#### POST `/api/flashcards`

Creates a new flashcard manually.

- **Headers:** `Authorization: Bearer <access_token>`

- **Request Payload:**

```json
{
  "front": "What is the capital of France?",
  "back": "Paris"
}
```

- **Response Payload (201 Created):**

```json
{
  "id": "uuid",
  "front": "What is the capital of France?",
  "back": "Paris",
  "source": "manual",
  "generation_session_id": null,
  "next_review_date": "2024-01-01",
  "interval": 0,
  "ease_factor": 2.5,
  "repetition_count": 0,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

- **Error Responses:**
  - `400 Bad Request` – Missing or invalid `front`/`back` fields
  - `401 Unauthorized` – Not authenticated

---

#### PUT `/api/flashcards/:id`

Updates an existing flashcard.

- **Headers:** `Authorization: Bearer <access_token>`

- **Request Payload:**

```json
{
  "front": "Updated question?",
  "back": "Updated answer"
}
```

- **Response Payload (200 OK):**

```json
{
  "id": "uuid",
  "front": "Updated question?",
  "back": "Updated answer",
  "source": "manual",
  "generation_session_id": null,
  "next_review_date": "2024-01-15",
  "interval": 7,
  "ease_factor": 2.5,
  "repetition_count": 3,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-08T12:00:00Z"
}
```

- **Error Responses:**
  - `400 Bad Request` – Invalid payload
  - `401 Unauthorized` – Not authenticated
  - `404 Not Found` – Flashcard not found or belongs to another user

---

#### DELETE `/api/flashcards/:id`

Permanently deletes a flashcard.

- **Headers:** `Authorization: Bearer <access_token>`

- **Response Payload (200 OK):**

```json
{
  "message": "Flashcard deleted successfully"
}
```

- **Error Responses:**
  - `401 Unauthorized` – Not authenticated
  - `404 Not Found` – Flashcard not found or belongs to another user

---

### 2.3. AI Generation

#### POST `/api/generations`

Generates flashcard suggestions from provided text using AI.

- **Headers:** `Authorization: Bearer <access_token>`

- **Request Payload:**

```json
{
  "source_text": "Long text content between 1000 and 10000 characters..."
}
```

- **Response Payload (201 Created):**

```json
{
  "session_id": "uuid",
  "suggestions": [
    {
      "temp_id": "temp_1",
      "front": "Generated question 1?",
      "back": "Generated answer 1"
    },
    {
      "temp_id": "temp_2",
      "front": "Generated question 2?",
      "back": "Generated answer 2"
    }
  ],
  "generated_count": 5,
  "model_name": "gpt-4o-mini"
}
```

- **Error Responses:**
  - `400 Bad Request` – `source_text` not between 1000-10000 characters
  - `401 Unauthorized` – Not authenticated
  - `502 Bad Gateway` – LLM API error
  - `503 Service Unavailable` – LLM service temporarily unavailable

---

#### POST `/api/generations/:session_id/accept`

Accepts selected flashcard suggestions and saves them to the database.

- **Headers:** `Authorization: Bearer <access_token>`

- **Request Payload:**

```json
{
  "accepted": [
    {
      "temp_id": "temp_1",
      "front": "Generated question 1?",
      "back": "Generated answer 1"
    },
    {
      "temp_id": "temp_3",
      "front": "Edited question 3?",
      "back": "Edited answer 3"
    }
  ],
  "rejected_count": 2
}
```

- **Response Payload (201 Created):**

```json
{
  "flashcards": [
    {
      "id": "uuid",
      "front": "Generated question 1?",
      "back": "Generated answer 1",
      "source": "ai",
      "generation_session_id": "session_uuid",
      "created_at": "2024-01-01T00:00:00Z"
    },
    {
      "id": "uuid",
      "front": "Edited question 3?",
      "back": "Edited answer 3",
      "source": "ai",
      "generation_session_id": "session_uuid",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "accepted_count": 2,
  "rejected_count": 2
}
```

- **Error Responses:**
  - `400 Bad Request` – Invalid payload
  - `401 Unauthorized` – Not authenticated
  - `404 Not Found` – Generation session not found

---

#### GET `/api/generations`

Retrieves generation session history for the authenticated user.

- **Headers:** `Authorization: Bearer <access_token>`

- **Query Parameters:**
  | Parameter | Type | Required | Description |
  |-----------|------|----------|-------------|
  | `page` | integer | No | Page number (default: 1) |
  | `limit` | integer | No | Items per page (default: 20, max: 100) |

- **Response Payload (200 OK):**

```json
{
  "data": [
    {
      "id": "uuid",
      "source_text_preview": "First 200 characters of source text...",
      "model_name": "gpt-4o-mini",
      "generated_count": 10,
      "accepted_count": 7,
      "rejected_count": 3,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 25,
    "total_pages": 2
  }
}
```

- **Error Responses:**
  - `401 Unauthorized` – Not authenticated

---

### 2.4. Learning Sessions

#### POST `/api/learning-sessions`

Starts a new learning session with flashcards due for review.

- **Headers:** `Authorization: Bearer <access_token>`

- **Request Payload (optional):**

```json
{
  "limit": 20
}
```

- **Response Payload (201 Created):**

```json
{
  "session_id": "uuid",
  "flashcards_count": 15,
  "started_at": "2024-01-01T10:00:00Z"
}
```

- **Error Responses:**
  - `401 Unauthorized` – Not authenticated
  - `404 Not Found` – No flashcards due for review

---

#### GET `/api/learning-sessions/:id/next`

Gets the next flashcard to review in the session.

- **Headers:** `Authorization: Bearer <access_token>`

- **Response Payload (200 OK):**

```json
{
  "flashcard": {
    "id": "uuid",
    "front": "What is spaced repetition?",
    "back": "A learning technique..."
  },
  "remaining_count": 14,
  "reviewed_count": 1
}
```

- **Response Payload (200 OK - Session Complete):**

```json
{
  "flashcard": null,
  "remaining_count": 0,
  "reviewed_count": 15,
  "session_complete": true
}
```

- **Error Responses:**
  - `401 Unauthorized` – Not authenticated
  - `404 Not Found` – Session not found

---

#### POST `/api/learning-sessions/:id/review`

Submits a review rating for a flashcard in the learning session.

- **Headers:** `Authorization: Bearer <access_token>`

- **Request Payload:**

```json
{
  "flashcard_id": "uuid",
  "rating": 3
}
```

> **Rating values:** 1 = Again, 2 = Hard, 3 = Good, 4 = Easy (FSRS compatible)

- **Response Payload (200 OK):**

```json
{
  "flashcard_id": "uuid",
  "previous_interval": 7,
  "new_interval": 14,
  "next_review_date": "2024-01-15",
  "ease_factor": 2.6
}
```

- **Error Responses:**
  - `400 Bad Request` – Invalid rating (must be 1-4)
  - `401 Unauthorized` – Not authenticated
  - `404 Not Found` – Session or flashcard not found

---

#### PATCH `/api/learning-sessions/:id/end`

Ends the learning session.

- **Headers:** `Authorization: Bearer <access_token>`

- **Response Payload (200 OK):**

```json
{
  "session_id": "uuid",
  "flashcards_reviewed": 15,
  "started_at": "2024-01-01T10:00:00Z",
  "ended_at": "2024-01-01T10:30:00Z",
  "duration_minutes": 30
}
```

- **Error Responses:**
  - `401 Unauthorized` – Not authenticated
  - `404 Not Found` – Session not found

---

#### GET `/api/learning-sessions`

Retrieves learning session history.

- **Headers:** `Authorization: Bearer <access_token>`

- **Query Parameters:**
  | Parameter | Type | Required | Description |
  |-----------|------|----------|-------------|
  | `page` | integer | No | Page number (default: 1) |
  | `limit` | integer | No | Items per page (default: 20, max: 100) |

- **Response Payload (200 OK):**

```json
{
  "data": [
    {
      "id": "uuid",
      "started_at": "2024-01-01T10:00:00Z",
      "ended_at": "2024-01-01T10:30:00Z",
      "flashcards_reviewed": 15
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "total_pages": 3
  }
}
```

- **Error Responses:**
  - `401 Unauthorized` – Not authenticated

---

### 2.5. Statistics

#### GET `/api/statistics/generations`

Gets AI generation statistics for the authenticated user.

- **Headers:** `Authorization: Bearer <access_token>`

- **Response Payload (200 OK):**

```json
{
  "total_sessions": 25,
  "total_generated": 250,
  "total_accepted": 188,
  "total_rejected": 62,
  "acceptance_rate": 75.2,
  "flashcards_by_source": {
    "ai": 188,
    "manual": 45
  },
  "ai_usage_percentage": 80.7
}
```

- **Error Responses:**
  - `401 Unauthorized` – Not authenticated

---

### 2.6. User Profile

#### GET `/api/profile`

Gets the current user's profile.

- **Headers:** `Authorization: Bearer <access_token>`

- **Response Payload (200 OK):**

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "preferences": {
    "daily_goal": 20,
    "theme": "dark"
  },
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

- **Error Responses:**
  - `401 Unauthorized` – Not authenticated

---

#### PATCH `/api/profile`

Updates user preferences.

- **Headers:** `Authorization: Bearer <access_token>`

- **Request Payload:**

```json
{
  "preferences": {
    "daily_goal": 30,
    "theme": "light"
  }
}
```

- **Response Payload (200 OK):**

```json
{
  "id": "uuid",
  "preferences": {
    "daily_goal": 30,
    "theme": "light"
  },
  "updated_at": "2024-01-08T12:00:00Z"
}
```

- **Error Responses:**
  - `400 Bad Request` – Invalid preferences format
  - `401 Unauthorized` – Not authenticated

---

## 3. Authentication and Authorization

### 3.1. Authentication Mechanism

The API uses **Supabase Auth** with JWT (JSON Web Tokens) for authentication.

- **Token-based authentication:** All protected endpoints require a valid JWT in the `Authorization` header
- **Token format:** `Authorization: Bearer <access_token>`
- **Token lifecycle:** Access tokens expire after 1 hour; refresh tokens can be used to obtain new access tokens
- **Session management:** Supabase handles session persistence and token refresh automatically via SDK

### 3.2. Implementation Details

```typescript
// Middleware for Astro API routes
import { supabase } from "@/db/supabase.client";

export async function authMiddleware(request: Request) {
  const authHeader = request.headers.get("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return { error: "Unauthorized", status: 401 };
  }

  const token = authHeader.replace("Bearer ", "");
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return { error: "Unauthorized", status: 401 };
  }

  return { user };
}
```

### 3.3. Authorization (RLS)

Row Level Security (RLS) is enforced at the database level:

- Users can only access their own data (flashcards, sessions, reviews)
- All queries are automatically filtered by `user_id = auth.uid()`
- Service role bypasses RLS for administrative operations

### 3.4. Security Measures

- **HTTPS only:** All API communication over TLS
- **Rate limiting:** 100 requests per minute per user for standard endpoints; 10 requests per minute for AI generation
- **Input sanitization:** All user inputs validated and sanitized
- **CORS:** Configured for allowed origins only

---

## 4. Validation and Business Logic

### 4.1. Validation Rules

#### Flashcards

| Field    | Validation Rule                                 |
| -------- | ----------------------------------------------- |
| `front`  | Required, non-empty string, max 1000 characters |
| `back`   | Required, non-empty string, max 5000 characters |
| `source` | Must be `ai` or `manual` (auto-set by API)      |

#### Generation Sessions

| Field         | Validation Rule                                |
| ------------- | ---------------------------------------------- |
| `source_text` | Required, string between 1000-10000 characters |

#### Flashcard Reviews

| Field          | Validation Rule                             |
| -------------- | ------------------------------------------- |
| `rating`       | Required, integer between 1-4               |
| `flashcard_id` | Must exist and belong to authenticated user |

#### User Profile

| Field         | Validation Rule   |
| ------------- | ----------------- |
| `preferences` | Valid JSON object |

### 4.2. Business Logic Implementation

#### AI Flashcard Generation Flow

1. Validate `source_text` length (1000-10000 characters)
2. Create `generation_session` record
3. Send text to OpenRouter.ai API with prompt template
4. Parse LLM response into flashcard suggestions
5. Store raw LLM response in `llm_response` field
6. Return suggestions with temporary IDs for frontend tracking

#### Flashcard Acceptance Flow

1. Validate generation session exists and belongs to user
2. For each accepted flashcard:
   - Create flashcard with `source = 'ai'` and `generation_session_id`
   - Initialize spaced repetition fields with defaults
3. Update `generation_session` with `accepted_count` and `rejected_count`

#### Spaced Repetition Algorithm (FSRS Integration)

1. On review submission, retrieve current flashcard state
2. Apply FSRS algorithm based on rating:
   - Calculate new `interval`
   - Adjust `ease_factor` (minimum 1.30)
   - Set `next_review_date`
   - Increment `repetition_count`
3. Create `flashcard_review` record for history
4. Update `learning_session.flashcards_reviewed` counter

#### Learning Session Flow

1. Query flashcards where `next_review_date <= CURRENT_DATE`
2. Order by priority (overdue first, then by ease_factor ascending)
3. Present flashcards sequentially
4. Track reviewed count in session
5. End session when all due cards reviewed or user ends manually

### 4.3. Error Handling

All API endpoints follow consistent error response format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable error message",
    "details": {
      "field": "source_text",
      "reason": "Text must be between 1000 and 10000 characters"
    }
  }
}
```

**Error Codes:**

| Code                  | HTTP Status | Description                              |
| --------------------- | ----------- | ---------------------------------------- |
| `UNAUTHORIZED`        | 401         | Authentication required or invalid token |
| `FORBIDDEN`           | 403         | Access to resource denied                |
| `NOT_FOUND`           | 404         | Resource does not exist                  |
| `VALIDATION_ERROR`    | 400         | Request payload validation failed        |
| `CONFLICT`            | 409         | Resource already exists                  |
| `LLM_ERROR`           | 502         | Error from AI service                    |
| `SERVICE_UNAVAILABLE` | 503         | External service temporarily unavailable |
| `INTERNAL_ERROR`      | 500         | Unexpected server error                  |
