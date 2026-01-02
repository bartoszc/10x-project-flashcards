# Authentication API Testing

This document contains curl examples for testing the authentication endpoints.

## Base URL

```
http://localhost:4321
```

---

## 1. Register User

**Endpoint:** `POST /api/auth/register`

```bash
# Successful registration
curl -X POST http://localhost:4321/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword123"
  }'
```

**Expected Response (201 Created):**

```json
{
  "user": {
    "id": "uuid",
    "email": "test@example.com",
    "created_at": "2024-01-01T00:00:00Z"
  },
  "session": {
    "access_token": "jwt_token",
    "refresh_token": "refresh_token",
    "expires_at": 1704067200
  }
}
```

### Error Cases

```bash
# Invalid email format (400)
curl -X POST http://localhost:4321/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "invalid-email", "password": "testpassword123"}'

# Password too short (400)
curl -X POST http://localhost:4321/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "short"}'

# Email already registered (409)
curl -X POST http://localhost:4321/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "existing@example.com", "password": "testpassword123"}'
```

---

## 2. Login User

**Endpoint:** `POST /api/auth/login`

```bash
# Successful login
curl -X POST http://localhost:4321/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword123"
  }'
```

**Expected Response (200 OK):**

```json
{
  "user": {
    "id": "uuid",
    "email": "test@example.com",
    "created_at": "2024-01-01T00:00:00Z"
  },
  "session": {
    "access_token": "jwt_token",
    "refresh_token": "refresh_token",
    "expires_at": 1704067200
  }
}
```

### Error Cases

```bash
# Invalid credentials (401)
curl -X POST http://localhost:4321/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "wrongpassword"}'

# Missing password (400)
curl -X POST http://localhost:4321/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": ""}'
```

---

## 3. Logout User

**Endpoint:** `POST /api/auth/logout`

```bash
# Successful logout (requires valid access_token from login response)
curl -X POST http://localhost:4321/api/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Response (200 OK):**

```json
{
  "message": "Successfully logged out"
}
```

### Error Cases

```bash
# Not authenticated (401)
curl -X POST http://localhost:4321/api/auth/logout

# Invalid token (401)
curl -X POST http://localhost:4321/api/auth/logout \
  -H "Authorization: Bearer invalid_token"
```

---

## 4. Delete Account

**Endpoint:** `DELETE /api/auth/account`

```bash
# Delete account (requires valid access_token)
curl -X DELETE http://localhost:4321/api/auth/account \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Response (200 OK):**

```json
{
  "message": "Account and all associated data deleted successfully"
}
```

### Error Cases

```bash
# Not authenticated (401)
curl -X DELETE http://localhost:4321/api/auth/account

# Invalid token (401)
curl -X DELETE http://localhost:4321/api/auth/account \
  -H "Authorization: Bearer invalid_token"
```

---

## Complete Test Flow

```bash
# 1. Register a new user
RESPONSE=$(curl -s -X POST http://localhost:4321/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "testflow@example.com", "password": "testpassword123"}')

echo "Register response: $RESPONSE"

# 2. Extract access token (requires jq)
TOKEN=$(echo $RESPONSE | jq -r '.session.access_token')
echo "Access token: $TOKEN"

# 3. Logout
curl -X POST http://localhost:4321/api/auth/logout \
  -H "Authorization: Bearer $TOKEN"

# 4. Login again
RESPONSE=$(curl -s -X POST http://localhost:4321/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "testflow@example.com", "password": "testpassword123"}')

TOKEN=$(echo $RESPONSE | jq -r '.session.access_token')
echo "New access token: $TOKEN"

# 5. Delete account
curl -X DELETE http://localhost:4321/api/auth/account \
  -H "Authorization: Bearer $TOKEN"
```
