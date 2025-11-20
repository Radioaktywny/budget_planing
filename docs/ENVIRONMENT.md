# Environment Variables

This document describes all environment variables used across the Home Budget Manager application.

## Table of Contents

- [Backend Environment Variables](#backend-environment-variables)
- [Frontend Environment Variables](#frontend-environment-variables)
- [AI Service Environment Variables](#ai-service-environment-variables)
- [Setup Instructions](#setup-instructions)

---

## Backend Environment Variables

Location: `backend/.env`

### Database Configuration

#### `DATABASE_URL`
- **Description**: Connection string for the database
- **Required**: Yes
- **Default**: `file:./dev.db`
- **Format**: 
  - SQLite (development): `file:./dev.db`
  - PostgreSQL (production): `postgresql://user:password@localhost:5432/dbname`
- **Example**: 
  ```
  DATABASE_URL="file:./dev.db"
  ```
- **Notes**: 
  - SQLite is recommended for development (zero configuration)
  - PostgreSQL is recommended for production deployment
  - Prisma ORM supports both with minimal code changes

### Server Configuration

#### `PORT`
- **Description**: Port number for the Express server
- **Required**: No
- **Default**: `3001`
- **Example**: 
  ```
  PORT=3001
  ```
- **Notes**: Frontend expects backend on port 3001 by default

#### `NODE_ENV`
- **Description**: Node environment mode
- **Required**: No
- **Default**: `development`
- **Values**: `development`, `production`, `test`
- **Example**: 
  ```
  NODE_ENV=development
  ```
- **Notes**: Affects logging, error messages, and CORS settings

### AI Service Configuration

#### `AI_SERVICE_URL`
- **Description**: Base URL for the Python AI service
- **Required**: Yes
- **Default**: `http://localhost:8001`
- **Example**: 
  ```
  AI_SERVICE_URL=http://localhost:8001
  ```
- **Notes**: Must match the AI service port configuration

#### `AI_SERVICE_TIMEOUT`
- **Description**: Timeout for AI service requests in milliseconds
- **Required**: No
- **Default**: `30000` (30 seconds)
- **Example**: 
  ```
  AI_SERVICE_TIMEOUT=30000
  ```
- **Notes**: Increase for large document processing

### Authentication Configuration

#### `JWT_SECRET`
- **Description**: Secret key for signing JWT tokens
- **Required**: Yes
- **Security**: **CRITICAL - Must be changed in production!**
- **Generation**: Use `openssl rand -base64 32`
- **Example**: 
  ```
  JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
  ```
- **Notes**: 
  - Must be at least 32 characters long
  - Use different secrets for each environment
  - Never commit production secrets to version control
  - Changing this will invalidate all existing tokens

#### `ACCESS_TOKEN_EXPIRY`
- **Description**: Expiration time for JWT access tokens
- **Required**: No
- **Default**: `1h` (1 hour)
- **Format**: Time string (e.g., `15m`, `1h`, `2h`, `1d`)
- **Example**: 
  ```
  ACCESS_TOKEN_EXPIRY=1h
  ```
- **Notes**: Shorter expiry is more secure but requires more frequent refreshes

#### `REFRESH_TOKEN_EXPIRY`
- **Description**: Expiration time for JWT refresh tokens
- **Required**: No
- **Default**: `7d` (7 days)
- **Format**: Time string (e.g., `1d`, `7d`, `30d`)
- **Example**: 
  ```
  REFRESH_TOKEN_EXPIRY=7d
  ```
- **Notes**: Longer expiry provides better UX but less security

### Security Configuration

#### `ALLOWED_ORIGINS`
- **Description**: Comma-separated list of allowed CORS origins
- **Required**: No (only for production)
- **Default**: `http://localhost:3000,http://localhost:5173`
- **Example**: 
  ```
  ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
  ```
- **Notes**: 
  - Only enforced when `NODE_ENV=production`
  - In development, all origins are allowed
  - Include all frontend URLs that need API access

### Email Service Configuration

Email configuration is required for password reset functionality.

#### `EMAIL_SERVICE`
- **Description**: Email service provider (e.g., gmail, outlook)
- **Required**: No (optional for password reset)
- **Example**: 
  ```
  EMAIL_SERVICE=gmail
  ```

#### `EMAIL_USER`
- **Description**: Email account username
- **Required**: If using email service
- **Example**: 
  ```
  EMAIL_USER=your-email@gmail.com
  ```

#### `EMAIL_PASSWORD`
- **Description**: Email account password or app-specific password
- **Required**: If using email service
- **Security**: **SENSITIVE - Never commit to version control**
- **Example**: 
  ```
  EMAIL_PASSWORD=your-app-specific-password
  ```
- **Notes**: For Gmail, use app-specific password with 2FA enabled

#### `EMAIL_FROM`
- **Description**: Email address for "From" field
- **Required**: If using email service
- **Example**: 
  ```
  EMAIL_FROM=noreply@yourdomain.com
  ```

#### Alternative: SMTP Configuration

Instead of `EMAIL_SERVICE`, you can use SMTP:

- `SMTP_HOST`: SMTP server hostname (e.g., `smtp.gmail.com`)
- `SMTP_PORT`: SMTP port (e.g., `587` for TLS, `465` for SSL)
- `SMTP_SECURE`: Use SSL (`true` or `false`)
- `SMTP_USER`: SMTP username
- `SMTP_PASSWORD`: SMTP password
- `EMAIL_FROM`: From email address

### File Upload Configuration

#### `UPLOAD_DIR`
- **Description**: Directory path for storing uploaded files
- **Required**: No
- **Default**: `./uploads`
- **Example**: 
  ```
  UPLOAD_DIR=./uploads
  ```
- **Notes**: 
  - Path is relative to backend root
  - Directory is created automatically if it doesn't exist
  - Ensure sufficient disk space for documents

#### `MAX_FILE_SIZE`
- **Description**: Maximum file upload size in bytes
- **Required**: No
- **Default**: `10485760` (10MB)
- **Example**: 
  ```
  MAX_FILE_SIZE=10485760
  ```
- **Notes**: 
  - 10MB = 10 * 1024 * 1024 bytes
  - Adjust based on expected document sizes
  - Consider server memory when increasing

### Complete Backend .env Example

**Development:**
```env
# Database
DATABASE_URL="file:./dev.db"

# Server
PORT=3001
NODE_ENV=development

# Authentication
JWT_SECRET=dev-secret-key-change-in-production-a1b2c3d4e5f6g7h8i9j0
ACCESS_TOKEN_EXPIRY=1h
REFRESH_TOKEN_EXPIRY=7d

# AI Service
AI_SERVICE_URL=http://localhost:8001
AI_SERVICE_TIMEOUT=30000

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# Security
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Email (optional - for password reset)
# EMAIL_SERVICE=gmail
# EMAIL_USER=your-email@gmail.com
# EMAIL_PASSWORD=your-app-specific-password
# EMAIL_FROM=noreply@localhost
```

**Production:**
```env
# Database
DATABASE_URL="postgresql://user:password@db-host:5432/budget_db"

# Server
PORT=3001
NODE_ENV=production

# Authentication - GENERATE NEW SECRET!
JWT_SECRET=<use-openssl-rand-base64-32>
ACCESS_TOKEN_EXPIRY=1h
REFRESH_TOKEN_EXPIRY=7d

# AI Service
AI_SERVICE_URL=https://ai-service.yourdomain.com
AI_SERVICE_TIMEOUT=30000

# File Upload
UPLOAD_DIR=/var/app/uploads
MAX_FILE_SIZE=10485760

# Security
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Email
EMAIL_SERVICE=gmail
EMAIL_USER=noreply@yourdomain.com
EMAIL_PASSWORD=<app-specific-password>
EMAIL_FROM=noreply@yourdomain.com
```

---

## Frontend Environment Variables

Location: `frontend/.env`

### API Configuration

#### `REACT_APP_API_BASE_URL`
- **Description**: Base URL for the backend API
- **Required**: Yes
- **Default**: `http://localhost:3001/api`
- **Example**: 
  ```
  REACT_APP_API_BASE_URL=http://localhost:3001/api
  ```
- **Notes**: 
  - Must include `/api` path
  - Update for production deployment
  - Used by axios client in `src/services/api.ts`

### Complete Frontend .env Example

```env
# API Configuration
REACT_APP_API_BASE_URL=http://localhost:3001/api
```

### React Environment Variable Rules

- All custom environment variables must start with `REACT_APP_`
- Variables are embedded at build time (not runtime)
- Restart development server after changing `.env`
- Never commit sensitive data to `.env` files

---

## AI Service Environment Variables

Location: `ai-service/.env`

### Server Configuration

#### `PORT`
- **Description**: Port number for the FastAPI server
- **Required**: No
- **Default**: `8001`
- **Example**: 
  ```
  PORT=8001
  ```
- **Notes**: Must match `AI_SERVICE_URL` in backend

#### `HOST`
- **Description**: Host address to bind the server
- **Required**: No
- **Default**: `0.0.0.0`
- **Example**: 
  ```
  HOST=0.0.0.0
  ```
- **Notes**: 
  - `0.0.0.0` allows external connections
  - `127.0.0.1` for localhost only

### OCR Configuration

#### `TESSERACT_CMD`
- **Description**: Path to Tesseract OCR executable
- **Required**: Windows only
- **Default**: System PATH
- **Example**: 
  ```
  TESSERACT_CMD=C:\Program Files\Tesseract-OCR\tesseract.exe
  ```
- **Notes**: 
  - Required on Windows if Tesseract is not in PATH
  - Not needed on macOS/Linux (uses system installation)
  - Verify path matches your Tesseract installation

### Logging Configuration

#### `LOG_LEVEL`
- **Description**: Logging verbosity level
- **Required**: No
- **Default**: `INFO`
- **Values**: `DEBUG`, `INFO`, `WARNING`, `ERROR`, `CRITICAL`
- **Example**: 
  ```
  LOG_LEVEL=INFO
  ```
- **Notes**: 
  - Use `DEBUG` for development troubleshooting
  - Use `WARNING` or `ERROR` for production

### Complete AI Service .env Example

**Windows:**
```env
# AI Service Configuration
PORT=8001
HOST=0.0.0.0

# Tesseract OCR path (Windows)
TESSERACT_CMD=C:\Program Files\Tesseract-OCR\tesseract.exe

# Logging
LOG_LEVEL=INFO
```

**macOS/Linux:**
```env
# AI Service Configuration
PORT=8001
HOST=0.0.0.0

# Logging
LOG_LEVEL=INFO
```

---

## Setup Instructions

### Initial Setup

1. **Backend Setup**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your preferred settings
   ```

2. **Frontend Setup**
   ```bash
   cd frontend
   cp .env.example .env
   # Edit .env if backend URL is different
   ```

3. **AI Service Setup**
   ```bash
   cd ai-service
   cp .env.example .env
   # Edit .env (Windows: set TESSERACT_CMD path)
   ```

### Verifying Configuration

**Backend:**
```bash
cd backend
npm run dev
# Should start on http://localhost:3001
```

**Frontend:**
```bash
cd frontend
npm start
# Should start on http://localhost:3000
# Check browser console for API connection
```

**AI Service:**
```bash
cd ai-service
# Activate venv first
python main.py
# Should start on http://localhost:8001
# Visit http://localhost:8001/docs for API docs
```

### Common Issues

#### Backend can't connect to database
- Check `DATABASE_URL` format
- Ensure database file exists (run migrations)
- Verify file permissions

#### Frontend can't reach backend
- Verify backend is running on correct port
- Check `REACT_APP_API_BASE_URL` matches backend
- Check browser console for CORS errors

#### AI Service errors
- Verify Tesseract is installed: `tesseract --version`
- Check `TESSERACT_CMD` path (Windows)
- Ensure port 8001 is not in use
- Check Python dependencies are installed

#### Port conflicts
- Change `PORT` in respective `.env` file
- Update dependent services (e.g., backend's `AI_SERVICE_URL`)
- Restart all services

### Production Deployment

#### Backend Production Variables

```env
# Database - Use PostgreSQL
DATABASE_URL="postgresql://user:password@db-host:5432/budget_manager"

# Server
PORT=3001
NODE_ENV=production

# AI Service - Use production URL
AI_SERVICE_URL=https://ai-service.yourdomain.com
AI_SERVICE_TIMEOUT=30000

# File Upload - Use absolute path or cloud storage
UPLOAD_DIR=/var/app/uploads
MAX_FILE_SIZE=10485760
```

#### Frontend Production Variables

```env
# API Configuration - Use production URL
REACT_APP_API_BASE_URL=https://api.yourdomain.com/api
```

#### AI Service Production Variables

```env
# Server
PORT=8001
HOST=0.0.0.0

# Logging - Reduce verbosity
LOG_LEVEL=WARNING

# Tesseract - Ensure system installation
# TESSERACT_CMD not needed if in PATH
```

### Security Best Practices

1. **Never commit `.env` files to version control**
   - Use `.env.example` as template
   - Add `.env` to `.gitignore`

2. **Use strong database credentials in production**
   - Generate random passwords
   - Use environment-specific credentials

3. **Restrict file upload sizes**
   - Set reasonable `MAX_FILE_SIZE`
   - Monitor disk usage

4. **Use HTTPS in production**
   - Update all URLs to use `https://`
   - Configure SSL certificates

5. **Limit AI service access**
   - Use firewall rules
   - Consider API authentication

6. **Regular backups**
   - Backup database regularly
   - Backup uploaded documents

### Environment-Specific Configurations

#### Development
- SQLite database (easy setup)
- Verbose logging
- CORS enabled for localhost
- Hot reload enabled

#### Testing
- Separate test database
- Mock AI service (optional)
- Faster timeouts
- Isolated file storage

#### Production
- PostgreSQL database
- Error-level logging only
- Restricted CORS
- Optimized builds
- Cloud storage (optional)

### Troubleshooting Environment Issues

#### Check environment variables are loaded
```bash
# Backend
cd backend
node -e "require('dotenv').config(); console.log(process.env.PORT)"

# Frontend (during build)
npm run build
# Check build output for embedded variables
```

#### Verify service connectivity
```bash
# Test backend
curl http://localhost:3001/api/accounts

# Test AI service
curl http://localhost:8001/health
```

#### Reset to defaults
```bash
# Restore from examples
cp .env.example .env
# Edit as needed
```

---

## Additional Resources

- [Backend README](../backend/README.md)
- [Frontend README](../frontend/README.md)
- [AI Service Setup Guide](../ai-service/SETUP.md)
- [Database Guide](DATABASE.md)
- [API Documentation](API.md)
