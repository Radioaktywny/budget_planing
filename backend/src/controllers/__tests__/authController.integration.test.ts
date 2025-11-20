import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../../index';
import * as authService from '../../services/authService';

const prisma = new PrismaClient();

describe('Authentication API Integration Tests', () => {
  let testUserId: string;
  let testUserEmail: string;
  let testUserPassword: string;
  let accessToken: string;
  let refreshToken: string;

  beforeAll(async () => {
    // Wait for app initialization
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  afterAll(async () => {
    // Clean up test users
    if (testUserId) {
      await prisma.user.delete({ where: { id: testUserId } }).catch(() => {});
    }
    await prisma.$disconnect();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user with valid credentials', async () => {
      testUserEmail = `test-${Date.now()}@integration.test`;
      testUserPassword = 'TestPassword123';

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: testUserEmail,
          password: testUserPassword,
          name: 'Test User',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'User registered successfully');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).toHaveProperty('email', testUserEmail);
      expect(response.body.user).toHaveProperty('name', 'Test User');
      expect(response.body.user).not.toHaveProperty('password');
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');

      testUserId = response.body.user.id;
      accessToken = response.body.accessToken;
      refreshToken = response.body.refreshToken;
    });

    it('should reject registration with duplicate email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: testUserEmail,
          password: 'AnotherPassword123',
          name: 'Another User',
        });

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'USER_EXISTS');
    });

    it('should reject registration with missing email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          password: 'TestPassword123',
          name: 'Test User',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should reject registration with missing password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          name: 'Test User',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should reject registration with invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'TestPassword123',
          name: 'Test User',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      expect(response.body.error.message).toContain('Invalid email format');
    });

    it('should reject registration with weak password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'weak',
          name: 'Test User',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      expect(response.body.error).toHaveProperty('details');
      expect(response.body.error.details.length).toBeGreaterThan(0);
    });

    it('should register user without name (optional field)', async () => {
      const email = `test-noname-${Date.now()}@integration.test`;
      
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email,
          password: 'TestPassword123',
        });

      expect(response.status).toBe(201);
      expect(response.body.user).toHaveProperty('email', email);
      expect(response.body.user.name).toBeNull();

      // Clean up
      await prisma.user.delete({ where: { id: response.body.user.id } });
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUserEmail,
          password: testUserPassword,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Login successful');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id', testUserId);
      expect(response.body.user).toHaveProperty('email', testUserEmail);
      expect(response.body.user).not.toHaveProperty('password');
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');

      // Update tokens for subsequent tests
      accessToken = response.body.accessToken;
      refreshToken = response.body.refreshToken;
    });

    it('should reject login with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'TestPassword123',
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'INVALID_CREDENTIALS');
    });

    it('should reject login with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUserEmail,
          password: 'WrongPassword123',
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'INVALID_CREDENTIALS');
    });

    it('should reject login with missing email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'TestPassword123',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should reject login with missing password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUserEmail,
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh access token with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Token refreshed successfully');
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');

      // Update tokens
      accessToken = response.body.accessToken;
      refreshToken = response.body.refreshToken;
    });

    it('should reject refresh with invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: 'invalid-token',
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'INVALID_TOKEN');
    });

    it('should reject refresh with missing token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should reject refresh with expired token', async () => {
      // Create an expired token
      const expiredToken = authService.generateTokens(testUserId, testUserEmail).refreshToken;
      
      // Manually expire it by setting expiry in the past
      await prisma.user.update({
        where: { id: testUserId },
        data: {
          refreshToken: expiredToken,
          refreshTokenExpiry: new Date(Date.now() - 1000), // 1 second ago
        },
      });

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: expiredToken,
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'INVALID_TOKEN');

      // Restore valid refresh token for other tests
      await prisma.user.update({
        where: { id: testUserId },
        data: {
          refreshToken,
          refreshTokenExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
    });
  });

  describe('Protected Routes - Token Validation', () => {
    it('should access protected route with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id', testUserId);
      expect(response.body.user).toHaveProperty('email', testUserEmail);
    });

    it('should reject protected route without token', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject protected route with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject protected route with malformed authorization header', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', accessToken); // Missing "Bearer " prefix

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should access other protected routes with valid token', async () => {
      const response = await request(app)
        .get('/api/accounts')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should reject other protected routes without token', async () => {
      const response = await request(app)
        .get('/api/accounts');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully with valid token', async () => {
      // First, login to get fresh tokens
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUserEmail,
          password: testUserPassword,
        });

      const logoutAccessToken = loginResponse.body.accessToken;
      const logoutRefreshToken = loginResponse.body.refreshToken;

      // Logout
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${logoutAccessToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Logout successful');

      // Verify refresh token is invalidated
      const refreshResponse = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: logoutRefreshToken,
        });

      expect(refreshResponse.status).toBe(401);
    });

    it('should reject logout without token', async () => {
      const response = await request(app)
        .post('/api/auth/logout');

      expect(response.status).toBe(401);
    });
  });

  describe('Password Reset Flow', () => {
    let resetToken: string;

    describe('POST /api/auth/forgot-password', () => {
      it('should initiate password reset for existing user', async () => {
        const response = await request(app)
          .post('/api/auth/forgot-password')
          .send({
            email: testUserEmail,
          });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('message');

        // In development, token is returned
        if (process.env.NODE_ENV === 'development') {
          expect(response.body).toHaveProperty('resetToken');
          resetToken = response.body.resetToken;
        } else {
          // Fetch token from database for testing
          const user = await prisma.user.findUnique({
            where: { email: testUserEmail },
          });
          resetToken = user?.resetToken || '';
        }
      });

      it('should return success even for non-existent email (security)', async () => {
        const response = await request(app)
          .post('/api/auth/forgot-password')
          .send({
            email: 'nonexistent@example.com',
          });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('message');
      });

      it('should reject forgot password with missing email', async () => {
        const response = await request(app)
          .post('/api/auth/forgot-password')
          .send({});

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      });

      it('should reject forgot password with invalid email format', async () => {
        const response = await request(app)
          .post('/api/auth/forgot-password')
          .send({
            email: 'invalid-email',
          });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      });
    });

    describe('POST /api/auth/reset-password', () => {
      it('should reset password with valid reset token', async () => {
        const newPassword = 'NewPassword123';

        const response = await request(app)
          .post('/api/auth/reset-password')
          .send({
            resetToken,
            newPassword,
          });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('message', 'Password reset successfully');

        // Verify can login with new password
        const loginResponse = await request(app)
          .post('/api/auth/login')
          .send({
            email: testUserEmail,
            password: newPassword,
          });

        expect(loginResponse.status).toBe(200);

        // Update test password for subsequent tests
        testUserPassword = newPassword;
        accessToken = loginResponse.body.accessToken;
        refreshToken = loginResponse.body.refreshToken;
      });

      it('should reject reset with invalid token', async () => {
        const response = await request(app)
          .post('/api/auth/reset-password')
          .send({
            resetToken: 'invalid-token',
            newPassword: 'NewPassword123',
          });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toHaveProperty('code', 'INVALID_TOKEN');
      });

      it('should reject reset with missing token', async () => {
        const response = await request(app)
          .post('/api/auth/reset-password')
          .send({
            newPassword: 'NewPassword123',
          });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      });

      it('should reject reset with weak password', async () => {
        // Generate a new reset token
        const forgotResponse = await request(app)
          .post('/api/auth/forgot-password')
          .send({
            email: testUserEmail,
          });

        const newResetToken = forgotResponse.body.resetToken || 
          (await prisma.user.findUnique({ where: { email: testUserEmail } }))?.resetToken;

        const response = await request(app)
          .post('/api/auth/reset-password')
          .send({
            resetToken: newResetToken,
            newPassword: 'weak',
          });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
        expect(response.body.error).toHaveProperty('details');
      });

      it('should reject reset with expired token', async () => {
        // Create an expired reset token
        const expiredToken = authService.generateResetToken();
        await prisma.user.update({
          where: { id: testUserId },
          data: {
            resetToken: expiredToken,
            resetTokenExpiry: new Date(Date.now() - 1000), // 1 second ago
          },
        });

        const response = await request(app)
          .post('/api/auth/reset-password')
          .send({
            resetToken: expiredToken,
            newPassword: 'NewPassword123',
          });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toHaveProperty('code', 'INVALID_TOKEN');
      });
    });
  });

  describe('POST /api/auth/change-password', () => {
    it('should change password when logged in', async () => {
      const newPassword = 'ChangedPassword123';

      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: testUserPassword,
          newPassword,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Password changed successfully');

      // Verify can login with new password
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUserEmail,
          password: newPassword,
        });

      expect(loginResponse.status).toBe(200);

      // Update test password
      testUserPassword = newPassword;
      accessToken = loginResponse.body.accessToken;
    });

    it('should reject change password with incorrect current password', async () => {
      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: 'WrongPassword123',
          newPassword: 'NewPassword123',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'INVALID_PASSWORD');
    });

    it('should reject change password without authentication', async () => {
      const response = await request(app)
        .post('/api/auth/change-password')
        .send({
          currentPassword: testUserPassword,
          newPassword: 'NewPassword123',
        });

      expect(response.status).toBe(401);
    });

    it('should reject change password with missing current password', async () => {
      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          newPassword: 'NewPassword123',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should reject change password with weak new password', async () => {
      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: testUserPassword,
          newPassword: 'weak',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      expect(response.body.error).toHaveProperty('details');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should get current user profile', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id', testUserId);
      expect(response.body.user).toHaveProperty('email', testUserEmail);
      expect(response.body.user).toHaveProperty('name');
      expect(response.body.user).toHaveProperty('createdAt');
      expect(response.body.user).not.toHaveProperty('password');
      expect(response.body.user).not.toHaveProperty('refreshToken');
    });

    it('should reject get profile without authentication', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
    });
  });
});
