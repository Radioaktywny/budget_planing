# Frontend Authentication Implementation

This document describes the authentication implementation in the frontend application.

## Overview

The frontend now includes a complete authentication system with user registration, login, password management, and protected routes. All application routes require authentication except for the login, register, and password reset pages.

## Components Implemented

### 1. Authentication Context (`src/contexts/AuthContext.tsx`)

Provides authentication state and functions throughout the application:
- `user`: Current authenticated user
- `accessToken`: JWT access token
- `isLoading`: Loading state during initialization
- `isAuthenticated`: Boolean indicating if user is logged in
- `login()`: Login with email and password
- `register()`: Register new user account
- `logout()`: Clear session and logout
- `refreshToken()`: Refresh expired access token

Tokens and user data are persisted in localStorage for session management.

### 2. Authentication Service (`src/services/authService.ts`)

API service functions for authentication:
- `login()`: POST /api/auth/login
- `register()`: POST /api/auth/register
- `refreshToken()`: POST /api/auth/refresh
- `logout()`: POST /api/auth/logout
- `forgotPassword()`: POST /api/auth/forgot-password
- `resetPassword()`: POST /api/auth/reset-password
- `changePassword()`: POST /api/auth/change-password

### 3. API Client Updates (`src/services/api.ts`)

Enhanced with authentication features:
- Automatically adds JWT token to all requests via Authorization header
- Intercepts 401 responses and attempts token refresh
- Queues failed requests during token refresh
- Redirects to login page if refresh fails
- Clears tokens on authentication failure

### 4. Authentication Pages

#### LoginPage (`src/pages/LoginPage.tsx`)
- Email and password form
- Email format validation
- Error handling and display
- Link to registration and forgot password
- Redirects to dashboard on success

#### RegisterPage (`src/pages/RegisterPage.tsx`)
- Email, password, confirm password, and optional name fields
- Email format validation
- Password strength validation (min 8 chars, uppercase, lowercase, number)
- Password strength indicator (Weak/Medium/Strong)
- Password confirmation matching
- Redirects to dashboard on success

#### ForgotPasswordPage (`src/pages/ForgotPasswordPage.tsx`)
- Email input form
- Sends password reset email
- Success confirmation screen
- Link back to login

#### ResetPasswordPage (`src/pages/ResetPasswordPage.tsx`)
- New password and confirm password fields
- Token validation from URL query parameter
- Password strength validation and indicator
- Redirects to login on success

#### SettingsPage (`src/pages/SettingsPage.tsx`)
- Displays user profile information (email, name, member since)
- Change password form with current password verification
- Password strength validation and indicator
- Success/error feedback

### 5. Protected Routes (`src/components/ProtectedRoute.tsx`)

Wrapper component that:
- Checks authentication status
- Shows loading spinner during initialization
- Redirects unauthenticated users to login page
- Preserves intended destination for post-login redirect

### 6. Layout Updates (`src/components/Layout.tsx`)

Enhanced navigation with:
- User menu dropdown (desktop)
- Displays current user name/email
- Account Settings link
- Logout button
- Mobile menu includes user info and logout

### 7. App Router Updates (`src/App.tsx`)

Configured routes:
- Public routes: `/login`, `/register`, `/forgot-password`, `/reset-password`
- Protected routes: All application pages wrapped in `<ProtectedRoute>`
- New route: `/settings` for account settings

## Authentication Flow

### Registration Flow
1. User fills registration form
2. Frontend validates email format and password strength
3. POST request to `/api/auth/register`
4. Backend creates user and returns tokens
5. Tokens stored in localStorage
6. User redirected to dashboard

### Login Flow
1. User enters email and password
2. Frontend validates required fields
3. POST request to `/api/auth/login`
4. Backend verifies credentials and returns tokens
5. Tokens stored in localStorage
6. User redirected to dashboard (or intended destination)

### Token Refresh Flow
1. API request receives 401 Unauthorized
2. Interceptor catches error
3. Attempts to refresh token using refresh token
4. If successful, retries original request with new token
5. If failed, clears tokens and redirects to login

### Logout Flow
1. User clicks logout button
2. Tokens cleared from localStorage
3. User state cleared from context
4. User redirected to login page

### Password Reset Flow
1. User requests password reset with email
2. Backend sends reset email with token
3. User clicks link in email (contains token)
4. User enters new password
5. Backend validates token and updates password
6. User redirected to login

## Security Features

- JWT tokens stored in localStorage
- Access tokens expire after 1 hour
- Refresh tokens expire after 7 days
- Automatic token refresh before expiration
- Password strength validation (min 8 chars, mixed case, numbers)
- Password confirmation on registration and reset
- Protected routes require authentication
- API requests include Authorization header
- Failed authentication clears tokens and redirects

## Form Validation

All authentication forms include:
- Real-time validation feedback
- Field-specific error messages
- Password strength indicators
- Email format validation
- Required field validation
- Loading states during submission
- Success/error toast notifications

## User Experience

- Loading spinner during authentication check
- Smooth redirects after login/logout
- Toast notifications for all actions
- Responsive design for mobile and desktop
- Accessible form labels and error messages
- Password visibility toggle (browser default)
- Remember intended destination after login

## Integration with Backend

The frontend expects the following backend endpoints:

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with credentials
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout (optional, for token invalidation)
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `POST /api/auth/change-password` - Change password (authenticated)

All protected API endpoints must accept `Authorization: Bearer <token>` header.

## Testing

To test the authentication system:

1. Start the backend server with authentication enabled
2. Start the frontend development server
3. Navigate to http://localhost:3000
4. You should be redirected to /login
5. Register a new account
6. Verify you're redirected to dashboard
7. Logout and login again
8. Test password reset flow
9. Test account settings password change

## Future Enhancements

Potential improvements:
- Email verification on registration
- Two-factor authentication (2FA)
- Social login (Google, GitHub, etc.)
- Remember me checkbox
- Session timeout warnings
- Password history (prevent reuse)
- Account lockout after failed attempts
- Security audit log
