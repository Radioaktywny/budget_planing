# Security Guide

This document outlines the security features and best practices for the Home Budget Manager application.

## Table of Contents

- [Authentication & Authorization](#authentication--authorization)
- [Data Isolation](#data-isolation)
- [Security Features](#security-features)
- [Best Practices](#best-practices)
- [Production Deployment](#production-deployment)
- [Security Checklist](#security-checklist)

---

## Authentication & Authorization

### JWT-Based Authentication

The application uses JSON Web Tokens (JWT) for secure authentication:

- **Access Tokens**: Short-lived tokens (1 hour default) for API requests
- **Refresh Tokens**: Long-lived tokens (7 days default) for obtaining new access tokens
- **Token Storage**: Tokens are stored in browser localStorage
- **Token Validation**: All protected endpoints verify token signature and expiration

### Password Security

- **Hashing**: Passwords are hashed using bcrypt with 10 salt rounds
- **Strength Requirements**: Minimum 8 characters (enforced on frontend and backend)
- **Password Reset**: Secure token-based password reset flow
- **Account Lockout**: Automatic lockout after 5 failed login attempts (30 minutes)

### Session Management

- **Automatic Refresh**: Tokens are refreshed automatically before expiration
- **Logout**: Invalidates refresh token on server
- **Session Expiry**: Users are redirected to login when tokens expire

---

## Data Isolation

### User-Specific Data Filtering

All database queries are filtered by `userId` to ensure complete data isolation:

- **Accounts**: Users can only access their own accounts
- **Transactions**: Users can only view/edit their own transactions
- **Categories**: Each user has their own category namespace
- **Tags**: Tags are user-specific
- **Documents**: Uploaded files are linked to user's transactions only

### Ownership Verification

Before any update or delete operation, the system verifies:

1. The resource exists
2. The resource belongs to the authenticated user
3. The user has permission to perform the operation

### Cross-User Protection

The system prevents:

- Creating transactions with another user's accounts
- Accessing another user's categories or tags
- Transferring money between different users' accounts
- Viewing or downloading another user's documents

---

## Security Features

### Rate Limiting

Protection against brute force and abuse:

- **Authentication Endpoints**: 5 requests per 15 minutes per IP
  - `/api/auth/login`
  - `/api/auth/register`
  
- **Password Reset**: 3 requests per hour per IP
  - `/api/auth/forgot-password`
  - `/api/auth/reset-password`
  
- **General API**: 100 requests per 15 minutes per IP
  - All other `/api/*` endpoints

### Account Lockout

Automatic protection against credential stuffing:

- **Threshold**: 5 failed login attempts
- **Lockout Duration**: 30 minutes
- **Scope**: Per email address (case-insensitive)
- **Reset**: Cleared on successful login

### Input Sanitization

All user input is sanitized to prevent injection attacks:

- **Null Byte Removal**: Prevents null byte injection
- **XSS Prevention**: Removes `<script>` and `<iframe>` tags
- **NoSQL Injection**: Removes MongoDB operators (e.g., `$where`, `$gt`)
- **Applied To**: Request body, query parameters, and URL parameters

### HTTP Security Headers

Using Helmet middleware for secure HTTP headers:

- **Content Security Policy**: Restricts resource loading
- **X-Frame-Options**: Prevents clickjacking
- **X-Content-Type-Options**: Prevents MIME sniffing
- **Strict-Transport-Security**: Enforces HTTPS (production)
- **X-XSS-Protection**: Enables browser XSS protection

### CORS Configuration

Cross-Origin Resource Sharing is configured based on environment:

- **Development**: All origins allowed for easy testing
- **Production**: Only whitelisted origins in `ALLOWED_ORIGINS`
- **Credentials**: Enabled for cookie-based authentication (future)

### File Upload Security

Protection for document uploads:

- **File Type Validation**: Only PDF, JPEG, and PNG allowed
- **File Size Limit**: 10MB default (configurable)
- **Unique Filenames**: UUID-based naming prevents conflicts
- **Path Traversal Prevention**: Validates file paths
- **Virus Scanning**: Recommended for production (not implemented)

---

## Best Practices

### For Developers

1. **Never Commit Secrets**
   - Use `.env` files (already in `.gitignore`)
   - Never hardcode API keys or passwords
   - Use environment variables for all sensitive data

2. **Validate All Input**
   - Use Zod schemas for request validation
   - Sanitize user input before processing
   - Validate file uploads (type, size, content)

3. **Use Parameterized Queries**
   - Prisma ORM prevents SQL injection by default
   - Never concatenate user input into queries
   - Use prepared statements for raw queries

4. **Handle Errors Securely**
   - Don't expose stack traces in production
   - Log errors server-side, show generic messages to users
   - Use structured error responses

5. **Keep Dependencies Updated**
   - Regularly run `npm audit` and `npm audit fix`
   - Update dependencies to patch security vulnerabilities
   - Review security advisories for critical packages

### For Users

1. **Use Strong Passwords**
   - Minimum 8 characters (enforced)
   - Mix uppercase, lowercase, numbers, and symbols
   - Use a password manager
   - Don't reuse passwords across sites

2. **Enable Two-Factor Authentication**
   - Not yet implemented (planned feature)
   - Use authenticator app when available

3. **Secure Your Email**
   - Email is used for password reset
   - Use strong email password
   - Enable 2FA on email account

4. **Log Out on Shared Devices**
   - Always log out when using public computers
   - Clear browser data after use

5. **Review Account Activity**
   - Check for suspicious transactions
   - Report unauthorized access immediately

### For Administrators

1. **Secure the Server**
   - Use HTTPS in production (SSL/TLS certificates)
   - Keep server OS and software updated
   - Configure firewall rules
   - Disable unnecessary services

2. **Database Security**
   - Use strong database passwords
   - Restrict database access to application only
   - Enable database encryption at rest
   - Regular backups with encryption

3. **Monitor and Log**
   - Enable application logging
   - Monitor for suspicious activity
   - Set up alerts for security events
   - Regularly review logs

4. **Secure File Storage**
   - Restrict file system permissions
   - Use cloud storage with encryption (S3, etc.)
   - Implement virus scanning for uploads
   - Regular cleanup of old files

5. **Environment Isolation**
   - Separate dev, staging, and production environments
   - Use different credentials for each environment
   - Restrict production access

---

## Production Deployment

### Pre-Deployment Checklist

- [ ] Generate new `JWT_SECRET` using `openssl rand -base64 32`
- [ ] Set `NODE_ENV=production`
- [ ] Configure `ALLOWED_ORIGINS` with production URLs
- [ ] Use PostgreSQL instead of SQLite
- [ ] Enable HTTPS with valid SSL certificate
- [ ] Configure email service for password reset
- [ ] Set up database backups
- [ ] Configure file storage (local or cloud)
- [ ] Review and update rate limits
- [ ] Enable application logging
- [ ] Set up monitoring and alerts

### Environment Variables

**Critical Production Variables:**

```env
NODE_ENV=production
JWT_SECRET=<generate-new-secret>
DATABASE_URL=postgresql://user:password@host:5432/db
ALLOWED_ORIGINS=https://yourdomain.com
```

See [ENVIRONMENT_VARIABLES.md](../backend/ENVIRONMENT_VARIABLES.md) for complete documentation.

### HTTPS Configuration

**Required for production:**

1. Obtain SSL certificate (Let's Encrypt, commercial CA)
2. Configure reverse proxy (Nginx, Apache)
3. Redirect HTTP to HTTPS
4. Enable HSTS header
5. Test with SSL Labs

**Example Nginx Configuration:**

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location /api {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

### Database Security

**PostgreSQL Configuration:**

1. Use strong password for database user
2. Restrict network access (bind to localhost or private network)
3. Enable SSL for database connections
4. Regular backups with encryption
5. Limit user permissions (no superuser for application)

**Connection String:**

```env
# With SSL
DATABASE_URL="postgresql://user:password@host:5432/db?sslmode=require"
```

### Secrets Management

**Options for Production:**

1. **Environment Variables** (simplest)
   - Set in hosting platform (Heroku, AWS, etc.)
   - Not committed to version control

2. **Secrets Management Services**
   - AWS Secrets Manager
   - Azure Key Vault
   - HashiCorp Vault
   - Google Secret Manager

3. **Docker Secrets** (for containerized deployments)
   - Store secrets in Docker Swarm or Kubernetes
   - Mount as files in containers

### Monitoring and Logging

**Recommended Tools:**

- **Application Monitoring**: New Relic, Datadog, Sentry
- **Log Management**: ELK Stack, Splunk, CloudWatch
- **Uptime Monitoring**: Pingdom, UptimeRobot
- **Security Scanning**: Snyk, OWASP ZAP

**What to Monitor:**

- Failed login attempts
- Rate limit violations
- API errors and exceptions
- Database connection issues
- File upload failures
- Unusual traffic patterns

---

## Security Checklist

### Development

- [x] Passwords hashed with bcrypt
- [x] JWT tokens for authentication
- [x] Input validation with Zod
- [x] SQL injection prevention (Prisma ORM)
- [x] XSS prevention (input sanitization)
- [x] CSRF protection (token-based auth)
- [x] Rate limiting on auth endpoints
- [x] Account lockout after failed attempts
- [x] Secure HTTP headers (Helmet)
- [x] File upload validation
- [x] Data isolation by userId
- [x] Ownership verification on operations

### Testing

- [x] Data isolation tests
- [x] Authentication tests
- [x] Input sanitization tests
- [ ] Security penetration testing
- [ ] Dependency vulnerability scanning

### Production

- [ ] HTTPS enabled
- [ ] Strong JWT_SECRET generated
- [ ] CORS restricted to production domains
- [ ] PostgreSQL with strong password
- [ ] Database backups configured
- [ ] Email service configured
- [ ] Monitoring and logging enabled
- [ ] Error tracking configured
- [ ] Regular security updates scheduled
- [ ] Incident response plan documented

---

## Reporting Security Issues

If you discover a security vulnerability, please:

1. **Do NOT** open a public GitHub issue
2. Email security concerns to: [security@yourdomain.com]
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We will respond within 48 hours and work with you to address the issue.

---

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [Prisma Security](https://www.prisma.io/docs/concepts/components/prisma-client/security)

---

## License

This security documentation is part of the Home Budget Manager project.
