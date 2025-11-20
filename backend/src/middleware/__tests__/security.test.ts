/**
 * Security Middleware Tests
 */

import {
  isAccountLocked,
  recordFailedLogin,
  clearFailedLogins,
  getLockoutTimeRemaining,
  sanitizeInput,
} from '../security';
import { Request, Response, NextFunction } from 'express';

describe('Security Middleware', () => {
  describe('Account Lockout', () => {
    const testEmail = 'test@example.com';

    beforeEach(() => {
      // Clear any existing lockout
      clearFailedLogins(testEmail);
    });

    it('should not lock account initially', () => {
      expect(isAccountLocked(testEmail)).toBe(false);
    });

    it('should not lock account after 4 failed attempts', () => {
      for (let i = 0; i < 4; i++) {
        recordFailedLogin(testEmail);
      }
      expect(isAccountLocked(testEmail)).toBe(false);
    });

    it('should lock account after 5 failed attempts', () => {
      for (let i = 0; i < 5; i++) {
        recordFailedLogin(testEmail);
      }
      expect(isAccountLocked(testEmail)).toBe(true);
    });

    it('should return remaining lockout time', () => {
      for (let i = 0; i < 5; i++) {
        recordFailedLogin(testEmail);
      }
      const remaining = getLockoutTimeRemaining(testEmail);
      expect(remaining).toBeGreaterThan(0);
      expect(remaining).toBeLessThanOrEqual(30);
    });

    it('should clear failed attempts on successful login', () => {
      recordFailedLogin(testEmail);
      recordFailedLogin(testEmail);
      clearFailedLogins(testEmail);
      expect(isAccountLocked(testEmail)).toBe(false);
    });

    it('should be case-insensitive for email', () => {
      recordFailedLogin('Test@Example.COM');
      recordFailedLogin('test@example.com');
      recordFailedLogin('TEST@EXAMPLE.COM');
      expect(isAccountLocked('test@example.com')).toBe(false);
      expect(isAccountLocked('Test@Example.COM')).toBe(false);
    });
  });

  describe('Input Sanitization', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
      mockReq = {
        body: {},
        query: {},
        params: {},
      };
      mockRes = {};
      mockNext = jest.fn();
    });

    it('should remove null bytes from strings', () => {
      mockReq.body = {
        name: 'test\x00name',
      };

      sanitizeInput(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.body.name).toBe('testname');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should remove script tags', () => {
      mockReq.body = {
        description: 'Hello <script>alert("xss")</script> World',
      };

      sanitizeInput(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.body.description).toBe('Hello  World');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should remove iframe tags', () => {
      mockReq.body = {
        content: 'Test <iframe src="evil.com"></iframe> content',
      };

      sanitizeInput(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.body.content).toBe('Test  content');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should remove MongoDB operators from keys', () => {
      mockReq.body = {
        $where: 'malicious code',
        name: 'valid',
        nested: {
          $gt: 100,
          value: 50,
        },
      };

      sanitizeInput(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.body.$where).toBeUndefined();
      expect(mockReq.body.name).toBe('valid');
      expect(mockReq.body.nested.$gt).toBeUndefined();
      expect(mockReq.body.nested.value).toBe(50);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should sanitize arrays', () => {
      mockReq.body = {
        items: ['test\x00', '<script>alert(1)</script>', 'valid'],
      };

      sanitizeInput(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.body.items[0]).toBe('test');
      expect(mockReq.body.items[1]).toBe('');
      expect(mockReq.body.items[2]).toBe('valid');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should sanitize query parameters', () => {
      mockReq.query = {
        search: 'test<script>alert(1)</script>',
      };

      sanitizeInput(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.query.search).toBe('test');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should sanitize URL parameters', () => {
      mockReq.params = {
        id: 'abc\x00123',
      };

      sanitizeInput(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.params.id).toBe('abc123');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle non-string values', () => {
      mockReq.body = {
        number: 123,
        boolean: true,
        null: null,
        undefined: undefined,
      };

      sanitizeInput(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.body.number).toBe(123);
      expect(mockReq.body.boolean).toBe(true);
      expect(mockReq.body.null).toBeNull();
      expect(mockReq.body.undefined).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
    });
  });
});
