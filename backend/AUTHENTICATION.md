# Authentication Implementation

This document describes the authentication system implemented in the Home Budget Manager backend.

## Overview

The authentication system uses JWT (JSON Web Tokens) for stateless authentication with the following features:

- User registration with email and password
- Secure password hashing using bcrypt
- JWT access tokens (1 hour expiry)
- JWT refresh tokens (7 days expiry)
- Password reset functionality
- Password change for logged-in users

## Environment Configuration

Add the following to your `.env` file:

```env
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

**Important:** Use a strong, random secret in production. Generate one using:
```bash
openssl rand -base64 32
```

## API Endpoints

### Public Endpoints (No Authentication Required)

#### Register a New User
```
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123",
  "name": "John Doe" // optional
}

Response (201):
{
  "message": "User registered successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "emailVerified": false
  },
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

#### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123"
}

Response (200):
{
  "message": "Login successful",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "emailVerified": false
  },
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

#### Refresh Access Token
```
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGc..."
}

Response (200):
{
  "message": "Token refreshed successfully",
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

#### Forgot Password
```
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}

Response (200):
{
  "message": "If a user with this email exists, a password reset link has been sent",
  "resetToken": "abc123..." // Only in development mode
}
```

**Note:** In production, the reset token should be sent via email, not returned in the response.

#### Reset Password
```
POST /api/auth/reset-password
Content-Type: application/json

{
  "resetToken": "abc123...",
  "newPassword": "NewSecurePass123"
}

Response (200):
{
  "message": "Password reset successfully"
}
```

### Protected Endpoints (Authentication Required)

All protected endpoints require the `Authorization` header with a valid JWT token:

```
Authorization: Bearer <accessToken>
```

#### Get Current User Profile
```
GET /api/auth/me
Authorization: Bearer <accessToken>

Response (200):
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "emailVerified": false,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Logout
```
POST /api/auth/logout
Authorization: Bearer <accessToken>

Response (200):
{
  "message": "Logout successful"
}
```

**Note:** This invalidates the refresh token. The client should also delete stored tokens.

#### Change Password
```
POST /api/auth/change-password
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "currentPassword": "OldPass123",
  "newPassword": "NewSecurePass123"
}

Response (200):
{
  "message": "Password changed successfully"
}
```

## Protected Routes

All application routes now require authentication:

- `/api/accounts/*` - Account management
- `/api/transactions/*` - Transaction management
- `/api/categories/*` - Category management
- `/api/tags/*` - Tag management
- `/api/documents/*` - Document management
- `/api/ai/*` - AI services
- `/api/import/*` - Import functionality
- `/api/reports/*` - Report generation

## Error Responses

### 400 Bad Request
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email and password are required"
  }
}
```

### 401 Unauthorized
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "No authorization token provided"
  }
}
```

```json
{
  "error": {
    "code": "TOKEN_EXPIRED",
    "message": "Token has expired. Please refresh your token."
  }
}
```

```json
{
  "error": {
    "code": "INVALID_TOKEN",
    "message": "Invalid token"
  }
}
```

### 409 Conflict
```json
{
  "error": {
    "code": "USER_EXISTS",
    "message": "User with this email already exists"
  }
}
```

## Token Management

### Access Token
- **Expiry:** 1 hour
- **Purpose:** Authenticate API requests
- **Storage:** Store in memory or sessionStorage (not localStorage for security)
- **Usage:** Include in Authorization header for all protected requests

### Refresh Token
- **Expiry:** 7 days
- **Purpose:** Obtain new access tokens without re-login
- **Storage:** Store securely (httpOnly cookie recommended, or localStorage with caution)
- **Usage:** Send to `/api/auth/refresh` when access token expires

### Token Refresh Flow

1. Client makes request with access token
2. Server returns 401 with `TOKEN_EXPIRED` code
3. Client sends refresh token to `/api/auth/refresh`
4. Server returns new access and refresh tokens
5. Client retries original request with new access token

## Security Considerations

### Implemented
- ✅ Password hashing with bcrypt (10 salt rounds)
- ✅ JWT token signing and verification
- ✅ Token expiration (access: 1h, refresh: 7d)
- ✅ Password strength validation
- ✅ Email format validation
- ✅ User data isolation (userId in token)
- ✅ Secure token invalidation on logout

### Recommended for Production
- 🔒 HTTPS enforcement
- 🔒 Rate limiting on auth endpoints
- 🔒 Account lockout after failed login attempts
- 🔒 Email verification
- 🔒 Email service integration for password reset
- 🔒 CORS configuration
- 🔒 Security headers (helmet middleware)
- 🔒 Input sanitization
- 🔒 Audit logging

## Database Schema

The User model includes the following authentication fields:

```prisma
model User {
  id                 String    @id @default(uuid())
  email              String?   @unique
  name               String?
  password           String?
  emailVerified      Boolean   @default(false)
  resetToken         String?
  resetTokenExpiry   DateTime?
  refreshToken       String?
  refreshTokenExpiry DateTime?
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @default(now()) @updatedAt
  
  // Relations...
}
```

## Testing

### Manual Testing with curl/PowerShell

**Register:**
```powershell
$body = @{email='test@example.com';password='Test1234';name='Test User'} | ConvertTo-Json
Invoke-WebRequest -Uri http://localhost:3001/api/auth/register -Method POST -Body $body -ContentType 'application/json'
```

**Login:**
```powershell
$body = @{email='test@example.com';password='Test1234'} | ConvertTo-Json
Invoke-WebRequest -Uri http://localhost:3001/api/auth/login -Method POST -Body $body -ContentType 'application/json'
```

**Access Protected Endpoint:**
```powershell
$token = 'your-access-token-here'
Invoke-WebRequest -Uri http://localhost:3001/api/accounts -Method GET -Headers @{Authorization="Bearer $token"}
```

## Migration from Single-User Mode

The previous implementation used `userContextMiddleware` which automatically authenticated a default user. This has been replaced with JWT authentication.

### Frontend Changes Required

1. **Add Authentication Context:**
   - Create AuthContext to manage user state and tokens
   - Implement login, register, and logout functions
   - Store tokens in memory or sessionStorage

2. **Update API Service:**
   - Add Authorization header to all requests
   - Implement token refresh interceptor
   - Handle 401 responses

3. **Add Authentication Pages:**
   - Login page
   - Registration page
   - Forgot password page
   - Reset password page

4. **Implement Protected Routes:**
   - Redirect unauthenticated users to login
   - Check authentication status on app load

### Backward Compatibility

If you need to maintain backward compatibility during migration, you can uncomment the legacy routes in `src/index.ts`:

```typescript
// Legacy routes with userContextMiddleware
app.use('/api/legacy', userContextMiddleware);
app.use('/api/legacy/accounts', accountRoutes);
// ... etc
```

This allows the frontend to gradually migrate to the new authentication system.

## Next Steps

1. Implement frontend authentication (Task 36)
2. Add email service integration for password reset
3. Implement rate limiting
4. Add security headers
5. Set up HTTPS in production
6. Implement audit logging
7. Add account lockout mechanism
8. Implement email verification

## Support

For issues or questions about the authentication system, refer to:
- Requirements: `.kiro/specs/home-budget-manager/requirements.md` (Requirements 19-22)
- Design: `.kiro/specs/home-budget-manager/design.md`
- Tasks: `.kiro/specs/home-budget-manager/tasks.md` (Task 35)
