import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

/**
 * Rate limiter for authentication endpoints
 * Prevents brute force attacks on login/register
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many authentication attempts. Please try again later.',
    },
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip rate limiting for successful requests
  skipSuccessfulRequests: true,
});

/**
 * Rate limiter for password reset endpoints
 * Prevents abuse of password reset functionality
 */
export const passwordResetRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 requests per hour
  message: {
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many password reset attempts. Please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * General API rate limiter
 * Prevents API abuse
 */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many requests. Please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Account lockout tracking
 * Tracks failed login attempts and locks accounts after threshold
 */
interface LoginAttempt {
  count: number;
  lastAttempt: Date;
  lockedUntil?: Date;
}

const loginAttempts = new Map<string, LoginAttempt>();

// Clean up old entries every hour
setInterval(() => {
  const now = new Date();
  for (const [email, attempt] of loginAttempts.entries()) {
    // Remove entries older than 1 hour
    if (now.getTime() - attempt.lastAttempt.getTime() > 60 * 60 * 1000) {
      loginAttempts.delete(email);
    }
  }
}, 60 * 60 * 1000);

/**
 * Check if account is locked due to failed login attempts
 */
export function isAccountLocked(email: string): boolean {
  const attempt = loginAttempts.get(email.toLowerCase());
  if (!attempt) return false;

  if (attempt.lockedUntil && new Date() < attempt.lockedUntil) {
    return true;
  }

  // Unlock if lockout period has passed
  if (attempt.lockedUntil && new Date() >= attempt.lockedUntil) {
    loginAttempts.delete(email.toLowerCase());
    return false;
  }

  return false;
}

/**
 * Record failed login attempt
 * Locks account after 5 failed attempts for 30 minutes
 */
export function recordFailedLogin(email: string): void {
  const normalizedEmail = email.toLowerCase();
  const attempt = loginAttempts.get(normalizedEmail) || {
    count: 0,
    lastAttempt: new Date(),
  };

  attempt.count += 1;
  attempt.lastAttempt = new Date();

  // Lock account after 5 failed attempts
  if (attempt.count >= 5) {
    attempt.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
  }

  loginAttempts.set(normalizedEmail, attempt);
}

/**
 * Clear failed login attempts on successful login
 */
export function clearFailedLogins(email: string): void {
  loginAttempts.delete(email.toLowerCase());
}

/**
 * Get remaining lockout time in minutes
 */
export function getLockoutTimeRemaining(email: string): number {
  const attempt = loginAttempts.get(email.toLowerCase());
  if (!attempt || !attempt.lockedUntil) return 0;

  const remaining = attempt.lockedUntil.getTime() - Date.now();
  return Math.ceil(remaining / (60 * 1000)); // Convert to minutes
}

/**
 * Input sanitization middleware
 * Removes potentially dangerous characters from user input
 */
export function sanitizeInput(req: Request, _res: Response, next: NextFunction): void {
  // Sanitize request body
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query parameters
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  // Sanitize URL parameters
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }

  next();
}

/**
 * Recursively sanitize an object
 */
function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  if (obj && typeof obj === 'object') {
    const sanitized: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        // Remove keys that start with $ (MongoDB operators)
        if (!key.startsWith('$')) {
          sanitized[key] = sanitizeObject(obj[key]);
        }
      }
    }
    return sanitized;
  }

  return obj;
}

/**
 * Sanitize a string by removing dangerous characters
 */
function sanitizeString(str: string): string {
  // Remove null bytes
  str = str.replace(/\0/g, '');

  // Remove HTML tags (basic XSS prevention)
  str = str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  str = str.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');

  return str;
}

/**
 * CORS configuration for production
 */
export const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }

    // In production, only allow specific origins
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'http://localhost:5173',
    ];

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};
