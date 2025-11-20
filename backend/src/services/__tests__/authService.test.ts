import { PrismaClient } from '@prisma/client';
import * as authService from '../authService';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// Set JWT_SECRET for testing
process.env.JWT_SECRET = 'test-secret-key-for-unit-tests';

// Test user data
const testUserEmail = 'test@authservice.test';
const testUserPassword = 'TestPassword123';
const testUserName = 'Test User';

beforeAll(async () => {
  // Clean up any existing test users
  await prisma.user.deleteMany({
    where: {
      email: {
        in: [testUserEmail, 'duplicate@authservice.test', 'reset@authservice.test'],
      },
    },
  });
});

afterAll(async () => {
  // Clean up test data
  await prisma.user.deleteMany({
    where: {
      email: {
        in: [testUserEmail, 'duplicate@authservice.test', 'reset@authservice.test'],
      },
    },
  });
  await prisma.$disconnect();
});

afterEach(async () => {
  // Clean up users after each test
  await prisma.user.deleteMany({
    where: {
      email: {
        in: [testUserEmail, 'duplicate@authservice.test', 'reset@authservice.test'],
      },
    },
  });
});

describe('Authentication Service', () => {
  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'MyPassword123';
      const hashed = await authService.hashPassword(password);

      expect(hashed).toBeDefined();
      expect(hashed).not.toBe(password);
      expect(hashed.length).toBeGreaterThan(0);
    });

    it('should generate different hashes for same password', async () => {
      const password = 'SamePassword123';
      const hash1 = await authService.hashPassword(password);
      const hash2 = await authService.hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching password', async () => {
      const password = 'CorrectPassword123';
      const hashed = await authService.hashPassword(password);

      const isMatch = await authService.comparePassword(password, hashed);
      expect(isMatch).toBe(true);
    });

    it('should return false for non-matching password', async () => {
      const password = 'CorrectPassword123';
      const wrongPassword = 'WrongPassword123';
      const hashed = await authService.hashPassword(password);

      const isMatch = await authService.comparePassword(wrongPassword, hashed);
      expect(isMatch).toBe(false);
    });
  });

  describe('generateTokens', () => {
    it('should generate access and refresh tokens', () => {
      const userId = 'test-user-id';
      const email = 'test@example.com';

      const tokens = authService.generateTokens(userId, email);

      expect(tokens).toBeDefined();
      expect(tokens.accessToken).toBeDefined();
      expect(tokens.refreshToken).toBeDefined();
      expect(typeof tokens.accessToken).toBe('string');
      expect(typeof tokens.refreshToken).toBe('string');
    });

    it('should generate valid JWT tokens', () => {
      const userId = 'test-user-id';
      const email = 'test@example.com';

      const tokens = authService.generateTokens(userId, email);

      // Verify access token
      const accessDecoded = jwt.verify(tokens.accessToken, process.env.JWT_SECRET!) as any;
      expect(accessDecoded.userId).toBe(userId);
      expect(accessDecoded.email).toBe(email);

      // Verify refresh token
      const refreshDecoded = jwt.verify(tokens.refreshToken, process.env.JWT_SECRET!) as any;
      expect(refreshDecoded.userId).toBe(userId);
      expect(refreshDecoded.email).toBe(email);
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const userId = 'test-user-id';
      const email = 'test@example.com';
      const tokens = authService.generateTokens(userId, email);

      const payload = authService.verifyToken(tokens.accessToken);

      expect(payload).toBeDefined();
      expect(payload.userId).toBe(userId);
      expect(payload.email).toBe(email);
    });

    it('should throw error for invalid token', () => {
      const invalidToken = 'invalid.token.here';

      expect(() => authService.verifyToken(invalidToken)).toThrow();
    });

    it('should throw error for expired token', () => {
      const userId = 'test-user-id';
      const email = 'test@example.com';

      // Generate token with immediate expiry
      const expiredToken = jwt.sign(
        { userId, email },
        process.env.JWT_SECRET!,
        { expiresIn: '0s' }
      );

      // Wait a moment to ensure expiry
      setTimeout(() => {
        expect(() => authService.verifyToken(expiredToken)).toThrow();
      }, 100);
    });
  });

  describe('generateResetToken', () => {
    it('should generate a reset token', () => {
      const token = authService.generateResetToken();

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('should generate unique tokens', () => {
      const token1 = authService.generateResetToken();
      const token2 = authService.generateResetToken();

      expect(token1).not.toBe(token2);
    });
  });

  describe('registerUser', () => {
    it('should register a new user with valid data', async () => {
      const result = await authService.registerUser(
        testUserEmail,
        testUserPassword,
        testUserName
      );

      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.tokens).toBeDefined();
      expect(result.user.email).toBe(testUserEmail);
      expect(result.user.name).toBe(testUserName);
      expect(result.user).not.toHaveProperty('password');
      expect(result.tokens.accessToken).toBeDefined();
      expect(result.tokens.refreshToken).toBeDefined();
    });

    it('should hash password during registration', async () => {
      await authService.registerUser(
        testUserEmail,
        testUserPassword,
        testUserName
      );

      // Fetch user from database
      const user = await prisma.user.findUnique({
        where: { email: testUserEmail },
      });

      expect(user).toBeDefined();
      expect(user!.password).toBeDefined();
      expect(user!.password).not.toBe(testUserPassword);
    });

    it('should register user without name', async () => {
      const result = await authService.registerUser(testUserEmail, testUserPassword);

      expect(result.user.email).toBe(testUserEmail);
      expect(result.user.name).toBeNull();
    });

    it('should throw error for duplicate email', async () => {
      // Register first user
      await authService.registerUser(testUserEmail, testUserPassword);

      // Try to register with same email
      await expect(
        authService.registerUser(testUserEmail, 'DifferentPassword123')
      ).rejects.toThrow('User with this email already exists');
    });

    it('should set emailVerified to false by default', async () => {
      await authService.registerUser(testUserEmail, testUserPassword);

      const user = await prisma.user.findUnique({
        where: { email: testUserEmail },
      });

      expect(user!.emailVerified).toBe(false);
    });

    it('should store refresh token in database', async () => {
      const result = await authService.registerUser(testUserEmail, testUserPassword);

      const user = await prisma.user.findUnique({
        where: { email: testUserEmail },
      });

      expect(user!.refreshToken).toBe(result.tokens.refreshToken);
      expect(user!.refreshTokenExpiry).toBeDefined();
    });
  });

  describe('loginUser', () => {
    beforeEach(async () => {
      // Create a test user for login tests
      await authService.registerUser(testUserEmail, testUserPassword, testUserName);
    });

    it('should login with correct credentials', async () => {
      const result = await authService.loginUser(testUserEmail, testUserPassword);

      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.tokens).toBeDefined();
      expect(result.user.email).toBe(testUserEmail);
      expect(result.user).not.toHaveProperty('password');
      expect(result.tokens.accessToken).toBeDefined();
      expect(result.tokens.refreshToken).toBeDefined();
    });

    it('should throw error for incorrect password', async () => {
      await expect(
        authService.loginUser(testUserEmail, 'WrongPassword123')
      ).rejects.toThrow('Invalid email or password');
    });

    it('should throw error for non-existent email', async () => {
      await expect(
        authService.loginUser('nonexistent@test.com', testUserPassword)
      ).rejects.toThrow('Invalid email or password');
    });

    it('should update refresh token on login', async () => {
      const result1 = await authService.loginUser(testUserEmail, testUserPassword);
      
      // Wait a moment to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const result2 = await authService.loginUser(testUserEmail, testUserPassword);

      expect(result1.tokens.refreshToken).not.toBe(result2.tokens.refreshToken);
    });

    it('should generate valid JWT tokens on login', async () => {
      const result = await authService.loginUser(testUserEmail, testUserPassword);

      const payload = authService.verifyToken(result.tokens.accessToken);
      expect(payload.email).toBe(testUserEmail);
    });
  });

  describe('refreshAccessToken', () => {
    let refreshToken: string;
    let userId: string;

    beforeEach(async () => {
      const result = await authService.registerUser(testUserEmail, testUserPassword);
      refreshToken = result.tokens.refreshToken;
      userId = result.user.id;
    });

    it('should refresh access token with valid refresh token', async () => {
      // Wait a moment to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newTokens = await authService.refreshAccessToken(refreshToken);

      expect(newTokens).toBeDefined();
      expect(newTokens.accessToken).toBeDefined();
      expect(newTokens.refreshToken).toBeDefined();
      expect(newTokens.refreshToken).not.toBe(refreshToken);
    });

    it('should throw error for invalid refresh token', async () => {
      await expect(
        authService.refreshAccessToken('invalid.token.here')
      ).rejects.toThrow('Invalid or expired refresh token');
    });

    it('should throw error for mismatched refresh token', async () => {
      // Generate a different valid token
      const differentTokens = authService.generateTokens('different-user', 'different@test.com');

      await expect(
        authService.refreshAccessToken(differentTokens.refreshToken)
      ).rejects.toThrow('Invalid refresh token');
    });

    it('should throw error for expired refresh token', async () => {
      // Manually expire the refresh token
      await prisma.user.update({
        where: { id: userId },
        data: {
          refreshTokenExpiry: new Date(Date.now() - 1000), // 1 second ago
        },
      });

      await expect(
        authService.refreshAccessToken(refreshToken)
      ).rejects.toThrow('Refresh token has expired');
    });
  });

  describe('logoutUser', () => {
    let userId: string;

    beforeEach(async () => {
      const result = await authService.registerUser(testUserEmail, testUserPassword);
      userId = result.user.id;
    });

    it('should clear refresh token on logout', async () => {
      await authService.logoutUser(userId);

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      expect(user!.refreshToken).toBeNull();
      expect(user!.refreshTokenExpiry).toBeNull();
    });
  });

  describe('initiatePasswordReset', () => {
    beforeEach(async () => {
      await authService.registerUser(testUserEmail, testUserPassword);
    });

    it('should generate reset token for existing user', async () => {
      const resetToken = await authService.initiatePasswordReset(testUserEmail);

      expect(resetToken).toBeDefined();
      expect(typeof resetToken).toBe('string');
      expect(resetToken.length).toBeGreaterThan(0);
    });

    it('should store reset token in database', async () => {
      const resetToken = await authService.initiatePasswordReset(testUserEmail);

      const user = await prisma.user.findUnique({
        where: { email: testUserEmail },
      });

      expect(user!.resetToken).toBe(resetToken);
      expect(user!.resetTokenExpiry).toBeDefined();
      expect(user!.resetTokenExpiry!.getTime()).toBeGreaterThan(Date.now());
    });

    it('should throw error for non-existent email', async () => {
      await expect(
        authService.initiatePasswordReset('nonexistent@test.com')
      ).rejects.toThrow();
    });
  });

  describe('resetPassword', () => {
    let resetToken: string;

    beforeEach(async () => {
      await authService.registerUser(testUserEmail, testUserPassword);
      resetToken = await authService.initiatePasswordReset(testUserEmail);
    });

    it('should reset password with valid token', async () => {
      const newPassword = 'NewPassword456';

      await authService.resetPassword(resetToken, newPassword);

      // Try to login with new password
      const result = await authService.loginUser(testUserEmail, newPassword);
      expect(result.user.email).toBe(testUserEmail);
    });

    it('should hash new password', async () => {
      const newPassword = 'NewPassword456';

      await authService.resetPassword(resetToken, newPassword);

      const user = await prisma.user.findUnique({
        where: { email: testUserEmail },
      });

      expect(user!.password).not.toBe(newPassword);
    });

    it('should clear reset token after successful reset', async () => {
      const newPassword = 'NewPassword456';

      await authService.resetPassword(resetToken, newPassword);

      const user = await prisma.user.findUnique({
        where: { email: testUserEmail },
      });

      expect(user!.resetToken).toBeNull();
      expect(user!.resetTokenExpiry).toBeNull();
    });

    it('should throw error for invalid reset token', async () => {
      await expect(
        authService.resetPassword('invalid-token', 'NewPassword456')
      ).rejects.toThrow('Invalid or expired reset token');
    });

    it('should throw error for expired reset token', async () => {
      // Manually expire the reset token
      const user = await prisma.user.findUnique({
        where: { email: testUserEmail },
      });

      await prisma.user.update({
        where: { id: user!.id },
        data: {
          resetTokenExpiry: new Date(Date.now() - 1000), // 1 second ago
        },
      });

      await expect(
        authService.resetPassword(resetToken, 'NewPassword456')
      ).rejects.toThrow('Invalid or expired reset token');
    });
  });

  describe('changePassword', () => {
    let userId: string;

    beforeEach(async () => {
      const result = await authService.registerUser(testUserEmail, testUserPassword);
      userId = result.user.id;
    });

    it('should change password with correct current password', async () => {
      const newPassword = 'NewPassword789';

      await authService.changePassword(userId, testUserPassword, newPassword);

      // Try to login with new password
      const result = await authService.loginUser(testUserEmail, newPassword);
      expect(result.user.email).toBe(testUserEmail);
    });

    it('should throw error for incorrect current password', async () => {
      await expect(
        authService.changePassword(userId, 'WrongPassword123', 'NewPassword789')
      ).rejects.toThrow('Current password is incorrect');
    });

    it('should throw error for non-existent user', async () => {
      await expect(
        authService.changePassword('non-existent-id', testUserPassword, 'NewPassword789')
      ).rejects.toThrow('User not found');
    });

    it('should hash new password', async () => {
      const newPassword = 'NewPassword789';

      await authService.changePassword(userId, testUserPassword, newPassword);

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      expect(user!.password).not.toBe(newPassword);
    });
  });

  describe('validatePasswordStrength', () => {
    it('should validate strong password', () => {
      const result = authService.validatePasswordStrength('StrongPass123');

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject password shorter than 8 characters', () => {
      const result = authService.validatePasswordStrength('Short1A');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });

    it('should reject password without uppercase letter', () => {
      const result = authService.validatePasswordStrength('lowercase123');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should reject password without lowercase letter', () => {
      const result = authService.validatePasswordStrength('UPPERCASE123');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    it('should reject password without number', () => {
      const result = authService.validatePasswordStrength('NoNumbersHere');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('should return multiple errors for weak password', () => {
      const result = authService.validatePasswordStrength('weak');

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe('validateEmail', () => {
    it('should validate correct email format', () => {
      expect(authService.validateEmail('test@example.com')).toBe(true);
      expect(authService.validateEmail('user.name@domain.co.uk')).toBe(true);
      expect(authService.validateEmail('user+tag@example.com')).toBe(true);
    });

    it('should reject invalid email format', () => {
      expect(authService.validateEmail('invalid')).toBe(false);
      expect(authService.validateEmail('invalid@')).toBe(false);
      expect(authService.validateEmail('@invalid.com')).toBe(false);
      expect(authService.validateEmail('invalid@domain')).toBe(false);
      expect(authService.validateEmail('invalid domain@test.com')).toBe(false);
    });
  });
});
