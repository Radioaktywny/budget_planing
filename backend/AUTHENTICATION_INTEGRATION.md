# Authentication Integration Guide

This document describes how to integrate multi-user authentication into the Home Budget Manager application.

## Current Implementation (Single-User Mode)

The application currently operates in single-user mode with the following architecture:

### User Context Middleware

Location: `backend/src/middleware/userContext.ts`

The `userContextMiddleware` function:
- Looks up the default user by email (`user@budgetmanager.local`)
- Attaches `userId` to the Express request object (`req.userId`)
- Applied globally to all `/api/*` routes in `backend/src/index.ts`

### Default User

- Email: `user@budgetmanager.local`
- Name: `Default User`
- Created automatically on application startup via `ensureDefaultUser()`
- Also created/updated by the database seed script (`backend/prisma/seed.ts`)

### Controller Pattern

All controllers use the centralized `getUserId(req)` helper function from `userContext.ts`:

```typescript
import { getUserId } from '../middleware/userContext';

export async function someController(req: Request, res: Response): Promise<void> {
  const userId = getUserId(req);
  // Use userId for database queries
}
```

## Authentication Integration Steps

### 1. Install Required Dependencies

```bash
npm install jsonwebtoken bcrypt
npm install --save-dev @types/jsonwebtoken @types/bcrypt
```

### 2. Update User Model

Add password field to the User model in `backend/prisma/schema.prisma`:

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  password  String   // Hashed password
  emailVerified Boolean @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // ... existing relations
}
```

Run migration:
```bash
npx prisma migrate dev --name add-user-authentication
```

### 3. Create Authentication Service

Create `backend/src/services/authService.ts`:

```typescript
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = '1h';
const REFRESH_TOKEN_EXPIRES_IN = '7d';

export async function registerUser(email: string, password: string, name?: string) {
  // Check if user exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error('User already exists');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
    },
  });

  // Generate tokens
  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

  return { user, accessToken, refreshToken };
}

export async function loginUser(email: string, password: string) {
  // Find user
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.password) {
    throw new Error('Invalid credentials');
  }

  // Verify password
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    throw new Error('Invalid credentials');
  }

  // Generate tokens
  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

  return { user, accessToken, refreshToken };
}

function generateAccessToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function generateRefreshToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
}

export function verifyToken(token: string): { userId: string } {
  return jwt.verify(token, JWT_SECRET) as { userId: string };
}
```

### 4. Implement Authentication Middleware

Update `backend/src/middleware/auth.ts` with actual implementation:

```typescript
import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/authService';

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'No token provided',
        },
      });
      return;
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = verifyToken(token);

    // Attach userId to request
    req.userId = decoded.userId;

    next();
  } catch (error) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired token',
      },
    });
  }
}
```

### 5. Create Authentication Routes

Create `backend/src/routes/authRoutes.ts`:

```typescript
import { Router } from 'express';
import * as authController from '../controllers/authController';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh', authController.refreshToken);
router.post('/logout', authController.logout);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

export default router;
```

### 6. Create Authentication Controller

Create `backend/src/controllers/authController.ts`:

```typescript
import { Request, Response } from 'express';
import * as authService from '../services/authService';

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { email, password, name } = req.body;

    // Validate input
    if (!email || !password) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email and password are required',
        },
      });
      return;
    }

    const result = await authService.registerUser(email, password, name);

    res.status(201).json({
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
      },
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'User already exists') {
      res.status(409).json({
        error: {
          code: 'CONFLICT',
          message: error.message,
        },
      });
      return;
    }

    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to register user',
      },
    });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email and password are required',
        },
      });
      return;
    }

    const result = await authService.loginUser(email, password);

    res.json({
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
      },
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Invalid credentials') {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: error.message,
        },
      });
      return;
    }

    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to login',
      },
    });
  }
}

// Implement other auth endpoints (refresh, logout, forgot-password, etc.)
```

### 7. Update Main Application File

In `backend/src/index.ts`, replace `userContextMiddleware` with `requireAuth`:

```typescript
// Remove this line:
// app.use('/api', userContextMiddleware);

// Add authentication routes (no auth required)
app.use('/api/auth', authRoutes);

// Apply authentication middleware to all other API routes
app.use('/api', requireAuth);
```

### 8. Update Frontend

#### Install Dependencies

```bash
cd frontend
npm install
```

#### Create Auth Context

Create `frontend/src/contexts/AuthContext.tsx`:

```typescript
import React, { createContext, useContext, useState, useEffect } from 'react';
import * as authService from '../services/authService';

interface User {
  id: string;
  email: string;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored token on mount
    const token = localStorage.getItem('accessToken');
    if (token) {
      // Verify token and load user
      authService.verifyToken(token)
        .then(user => setUser(user))
        .catch(() => localStorage.removeItem('accessToken'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const result = await authService.login(email, password);
    localStorage.setItem('accessToken', result.accessToken);
    localStorage.setItem('refreshToken', result.refreshToken);
    setUser(result.user);
  };

  const register = async (email: string, password: string, name?: string) => {
    const result = await authService.register(email, password, name);
    localStorage.setItem('accessToken', result.accessToken);
    localStorage.setItem('refreshToken', result.refreshToken);
    setUser(result.user);
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

#### Update API Service

Update `frontend/src/services/api.ts` to include Authorization header:

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
});

// Add token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Try to refresh token
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const response = await axios.post('/api/auth/refresh', { refreshToken });
          localStorage.setItem('accessToken', response.data.accessToken);
          // Retry original request
          error.config.headers.Authorization = `Bearer ${response.data.accessToken}`;
          return axios(error.config);
        } catch {
          // Refresh failed, logout
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
```

#### Create Login/Register Pages

Create `frontend/src/pages/LoginPage.tsx` and `RegisterPage.tsx` with forms for authentication.

#### Add Protected Routes

Update `frontend/src/App.tsx`:

```typescript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
// ... other imports

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            {/* All protected routes */}
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
```

## Environment Variables

Add to `.env`:

```
JWT_SECRET=your-very-secure-random-secret-key-here
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_EXPIRES_IN=7d
```

## Security Checklist

- [ ] Use strong JWT secret (at least 32 characters, random)
- [ ] Store JWT secret in environment variable, never commit to git
- [ ] Use HTTPS in production
- [ ] Implement rate limiting on auth endpoints
- [ ] Add CSRF protection for cookie-based auth (if used)
- [ ] Validate and sanitize all user inputs
- [ ] Implement account lockout after failed login attempts
- [ ] Log authentication events for security monitoring
- [ ] Implement email verification
- [ ] Add password strength requirements
- [ ] Implement password reset functionality
- [ ] Use secure password hashing (bcrypt with salt rounds >= 10)
- [ ] Set appropriate token expiration times
- [ ] Implement token refresh mechanism
- [ ] Add logout functionality that invalidates tokens
- [ ] Consider implementing token blacklist for logout

## Testing

After implementing authentication:

1. Test user registration
2. Test user login
3. Test token refresh
4. Test protected routes without token (should return 401)
5. Test protected routes with valid token (should work)
6. Test protected routes with expired token (should refresh or return 401)
7. Test logout functionality
8. Test password reset flow
9. Test that users can only access their own data

## Migration from Single-User to Multi-User

If you have existing data in single-user mode:

1. All existing data is already associated with the default user
2. New users will start with empty accounts/transactions
3. Consider adding a data migration script if needed
4. The default user can continue to be used or can be converted to a regular authenticated user

## Additional Features to Consider

- Email verification
- Two-factor authentication (2FA)
- OAuth integration (Google, GitHub, etc.)
- Password strength meter
- Account recovery options
- Session management dashboard
- Login history
- Device management
- API key generation for third-party integrations
