# Environment Variables Documentation

This document describes all environment variables used by the Home Budget Manager backend application.

## Required Variables

### DATABASE_URL
- **Description**: Database connection string
- **Type**: String
- **Default**: `file:./dev.db` (SQLite)
- **Example**: 
  - SQLite: `file:./dev.db`
  - PostgreSQL: `postgresql://user:password@localhost:5432/budget_db`
- **Notes**: 
  - For development, SQLite is recommended (no setup required)
  - For production, PostgreSQL is recommended for better performance and multi-user support

### JWT_SECRET
- **Description**: Secret key used to sign JWT tokens
- **Type**: String
- **Required**: Yes
- **Security**: **CRITICAL - Must be changed in production!**
- **Generation**: Use `openssl rand -base64 32` to generate a secure random key
- **Example**: `your-super-secret-jwt-key-change-this-in-production`
- **Notes**: 
  - Must be at least 32 characters long
  - Should be different for each environment (dev, staging, production)
  - Never commit production secrets to version control

## Optional Variables

### Server Configuration

#### PORT
- **Description**: Port number for the API server
- **Type**: Number
- **Default**: `3001`
- **Example**: `3001`

#### NODE_ENV
- **Description**: Application environment
- **Type**: String
- **Default**: `development`
- **Values**: `development`, `production`, `test`
- **Notes**: Affects logging, error messages, and security settings

### Authentication Configuration

#### ACCESS_TOKEN_EXPIRY
- **Description**: Expiration time for JWT access tokens
- **Type**: String (time format)
- **Default**: `1h` (1 hour)
- **Examples**: `15m`, `1h`, `2h`, `1d`
- **Notes**: Shorter expiry is more secure but requires more frequent refreshes

#### REFRESH_TOKEN_EXPIRY
- **Description**: Expiration time for JWT refresh tokens
- **Type**: String (time format)
- **Default**: `7d` (7 days)
- **Examples**: `1d`, `7d`, `30d`
- **Notes**: Longer expiry provides better user experience but less security

### AI Service Configuration

#### AI_SERVICE_URL
- **Description**: URL of the Python AI service for document parsing
- **Type**: String (URL)
- **Default**: `http://127.0.0.1:8001`
- **Example**: `http://localhost:8001`
- **Notes**: Must be accessible from the backend server

#### AI_SERVICE_TIMEOUT
- **Description**: Timeout for AI service requests in milliseconds
- **Type**: Number
- **Default**: `30000` (30 seconds)
- **Example**: `60000` (60 seconds)
- **Notes**: Increase for large documents or slow processing

### File Upload Configuration

#### UPLOAD_DIR
- **Description**: Directory path for storing uploaded files
- **Type**: String (path)
- **Default**: `./uploads`
- **Example**: `./uploads` or `/var/app/uploads`
- **Notes**: 
  - Directory will be created if it doesn't exist
  - Ensure proper permissions for the application to write files

#### MAX_FILE_SIZE
- **Description**: Maximum file size for uploads in bytes
- **Type**: Number
- **Default**: `10485760` (10 MB)
- **Example**: `20971520` (20 MB)
- **Notes**: Adjust based on your needs and server capacity

### Security Configuration

#### ALLOWED_ORIGINS
- **Description**: Comma-separated list of allowed CORS origins
- **Type**: String (comma-separated URLs)
- **Default**: `http://localhost:3000,http://localhost:5173`
- **Example**: `https://yourdomain.com,https://www.yourdomain.com`
- **Notes**: 
  - Only used in production (NODE_ENV=production)
  - In development, all origins are allowed
  - Include all frontend URLs that need to access the API

### Email Service Configuration

Email configuration is required for password reset functionality. Choose one of the following methods:

#### Method 1: Email Service Provider (e.g., Gmail)

##### EMAIL_SERVICE
- **Description**: Email service provider name
- **Type**: String
- **Example**: `gmail`, `outlook`, `yahoo`
- **Notes**: Uses nodemailer's built-in service configurations

##### EMAIL_USER
- **Description**: Email account username
- **Type**: String
- **Example**: `your-email@gmail.com`

##### EMAIL_PASSWORD
- **Description**: Email account password or app-specific password
- **Type**: String
- **Security**: **SENSITIVE - Never commit to version control**
- **Notes**: 
  - For Gmail, use an app-specific password (not your regular password)
  - Enable 2FA and generate app password in Google Account settings

##### EMAIL_FROM
- **Description**: Email address to use in the "From" field
- **Type**: String
- **Example**: `noreply@yourdomain.com`

#### Method 2: SMTP Configuration

##### SMTP_HOST
- **Description**: SMTP server hostname
- **Type**: String
- **Example**: `smtp.gmail.com`, `smtp.sendgrid.net`

##### SMTP_PORT
- **Description**: SMTP server port
- **Type**: Number
- **Default**: `587` (TLS) or `465` (SSL)
- **Example**: `587`

##### SMTP_SECURE
- **Description**: Use SSL/TLS for SMTP connection
- **Type**: Boolean
- **Default**: `false` (use STARTTLS)
- **Values**: `true` (SSL), `false` (STARTTLS)

##### SMTP_USER
- **Description**: SMTP authentication username
- **Type**: String
- **Example**: `your-email@gmail.com`

##### SMTP_PASSWORD
- **Description**: SMTP authentication password
- **Type**: String
- **Security**: **SENSITIVE - Never commit to version control**

##### EMAIL_FROM
- **Description**: Email address to use in the "From" field
- **Type**: String
- **Example**: `noreply@yourdomain.com`

## Environment-Specific Configuration

### Development Environment

```env
NODE_ENV=development
DATABASE_URL="file:./dev.db"
JWT_SECRET=dev-secret-key-change-in-production
PORT=3001
AI_SERVICE_URL=http://127.0.0.1:8001
UPLOAD_DIR=./uploads
```

### Production Environment

```env
NODE_ENV=production
DATABASE_URL="postgresql://user:password@db-host:5432/budget_db"
JWT_SECRET=<generate-with-openssl-rand-base64-32>
PORT=3001
AI_SERVICE_URL=http://ai-service:8001
UPLOAD_DIR=/var/app/uploads
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
EMAIL_SERVICE=gmail
EMAIL_USER=noreply@yourdomain.com
EMAIL_PASSWORD=<app-specific-password>
EMAIL_FROM=noreply@yourdomain.com
```

### Test Environment

```env
NODE_ENV=test
DATABASE_URL="file:./test.db"
JWT_SECRET=test-secret-key
PORT=3002
```

## Security Best Practices

1. **Never commit sensitive values** to version control
   - Use `.env` for local development (already in `.gitignore`)
   - Use environment variables or secrets management in production

2. **Generate strong secrets**
   - Use `openssl rand -base64 32` for JWT_SECRET
   - Use different secrets for each environment

3. **Rotate secrets regularly**
   - Change JWT_SECRET periodically (will invalidate all tokens)
   - Update email passwords if compromised

4. **Use environment-specific configurations**
   - Different database for each environment
   - Stricter CORS in production
   - Enable all security features in production

5. **Protect production secrets**
   - Use environment variables in hosting platform
   - Use secrets management services (AWS Secrets Manager, Azure Key Vault, etc.)
   - Limit access to production environment variables

## Validation

The application validates required environment variables on startup:

- **JWT_SECRET**: Must be set, or the application will fail to start
- **DATABASE_URL**: Must be a valid connection string
- **PORT**: Must be a valid port number

If any required variable is missing or invalid, the application will log an error and exit.

## Troubleshooting

### "JWT_SECRET is not configured"
- Ensure `JWT_SECRET` is set in your `.env` file
- Check that `.env` file is in the backend root directory
- Verify the file is not named `.env.txt` or similar

### "Database connection failed"
- Check `DATABASE_URL` format
- For SQLite, ensure write permissions in the directory
- For PostgreSQL, verify connection details and network access

### "Email sending failed"
- Verify email service credentials
- For Gmail, ensure app-specific password is used
- Check SMTP settings and firewall rules

### "CORS error in browser"
- Add your frontend URL to `ALLOWED_ORIGINS`
- Ensure `NODE_ENV` is set correctly
- Check browser console for specific CORS error details
