# Getting Started with Home Budget Manager

This guide will help you set up and run the Home Budget Manager application on your local machine.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running the Application](#running-the-application)
- [First Steps](#first-steps)
- [Common Tasks](#common-tasks)
- [Troubleshooting](#troubleshooting)
- [Next Steps](#next-steps)

---

## Prerequisites

Before you begin, ensure you have the following installed:

### Required

1. **Node.js 16 or higher**
   - Download from [nodejs.org](https://nodejs.org/)
   - Verify installation: `node --version`

2. **npm** (comes with Node.js)
   - Verify installation: `npm --version`

3. **Python 3.9 or higher**
   - Download from [python.org](https://www.python.org/)
   - Verify installation: `python --version` or `python3 --version`

4. **Tesseract OCR** (for receipt parsing)
   
   **Windows:**
   - Download from [GitHub](https://github.com/UB-Mannheim/tesseract/wiki)
   - Install to default location: `C:\Program Files\Tesseract-OCR`
   
   **macOS:**
   ```bash
   brew install tesseract
   ```
   
   **Linux (Ubuntu/Debian):**
   ```bash
   sudo apt-get update
   sudo apt-get install tesseract-ocr
   ```
   
   Verify installation: `tesseract --version`

### Optional

- **Git** - For cloning the repository
- **VS Code** - Recommended code editor
- **Postman** - For API testing

---

## Installation

### Step 1: Get the Code

Clone or download the repository:

```bash
git clone <repository-url>
cd home-budget-manager
```

### Step 2: Set Up Backend

```bash
cd backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Generate Prisma Client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Seed database with sample data
npm run prisma:seed
```

**Expected output:**
- Dependencies installed
- Prisma Client generated
- Database created (`dev.db`)
- Sample data added (accounts, categories, transactions)

### Step 3: Set Up Frontend

```bash
cd ../frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
```

**Expected output:**
- Dependencies installed
- `.env` file created

### Step 4: Set Up AI Service

```bash
cd ../ai-service

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate

# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
```

**Windows users:** Edit `.env` and set Tesseract path:
```env
TESSERACT_CMD=C:\Program Files\Tesseract-OCR\tesseract.exe
```

**Expected output:**
- Virtual environment created
- Python dependencies installed
- `.env` file created

---

## Running the Application

You need to run all three services. Open **three separate terminal windows**:

### Terminal 1: Backend

```bash
cd backend
npm run dev
```

**Expected output:**
```
Starting Home Budget Manager Backend...
Server running on http://localhost:3001
```

**Or use startup script:**

Windows:
```bash
cd backend
start.bat
```

macOS/Linux:
```bash
cd backend
chmod +x start.sh
./start.sh
```

### Terminal 2: Frontend

```bash
cd frontend
npm start
```

**Expected output:**
```
Compiled successfully!
You can now view frontend in the browser.
  Local:            http://localhost:3000
```

**Or use startup script:**

Windows:
```bash
cd frontend
start.bat
```

macOS/Linux:
```bash
cd frontend
./start.sh
```

### Terminal 3: AI Service

```bash
cd ai-service

# Activate virtual environment first
# Windows:
venv\Scripts\activate

# macOS/Linux:
source venv/bin/activate

# Start service
python main.py
```

**Expected output:**
```
Starting Budget Manager AI Service...
INFO:     Uvicorn running on http://0.0.0.0:8001
```

**Or use startup script:**

Windows:
```bash
cd ai-service
start.bat
```

macOS/Linux:
```bash
cd ai-service
./start.sh
```

### Verify Everything is Running

Open your browser and check:

1. **Frontend**: http://localhost:3000
   - Should show the dashboard
   
2. **Backend API**: http://localhost:3001/api/accounts
   - Should return JSON with accounts
   
3. **AI Service**: http://localhost:8001/docs
   - Should show FastAPI documentation

---

## First Steps

### 1. Explore the Dashboard

Open http://localhost:3000 in your browser.

You should see:
- Total balance across all accounts
- Current month summary (income, expenses, net balance)
- Expense breakdown chart
- Recent transactions

### 2. View Sample Data

The seed script created:
- **4 accounts**: Checking, Savings, Credit Card, Cash
- **Categories**: Food & Dining, Transport, Housing, etc.
- **Sample transactions**: Various income and expenses
- **Tags**: groceries, bills, entertainment

Navigate through the app:
- **Accounts** - View and manage accounts
- **Transactions** - See all transactions
- **Categories** - View category hierarchy
- **Reports** - See charts and analytics

### 3. Create Your First Transaction

1. Click **"Add Transaction"** on the dashboard
2. Fill in the form:
   - Date: Today's date
   - Amount: 50.00
   - Type: Expense
   - Description: Coffee Shop
   - Account: Select an account
   - Category: Select a category
3. Click **"Save"**

Your transaction appears in the list and updates the balance!

### 4. Try Document Upload

1. Go to **Import** page
2. Click **"Upload Document"**
3. Upload a PDF bank statement or receipt image
4. Wait for AI parsing
5. Review and approve transactions

**Note:** For testing, you can use any PDF or image file. The AI will attempt to extract transaction data.

### 5. Generate a Report

1. Go to **Reports** page
2. Select a date range
3. View charts and summaries
4. Click **"Export PDF"** or **"Export Excel"**

---

## Common Tasks

### Adding a New Account

1. Go to **Accounts** page
2. Click **"Add Account"**
3. Enter name and select type
4. Click **"Save"**

### Creating a Transfer

1. Go to **Transactions** page
2. Click **"Add Transaction"** → **"Transfer"**
3. Select from/to accounts
4. Enter amount and date
5. Click **"Save"**

### Creating a Split Transaction

For receipts with multiple categories:

1. Go to **Transactions** page
2. Click **"Add Transaction"** → **"Split Transaction"**
3. Enter total amount and description
4. Add line items with different categories
5. Ensure items sum to total
6. Click **"Save"**

### Importing from JSON/YAML

1. Go to **Import** page
2. Click **"Import from JSON/YAML"**
3. Upload your file
4. Review parsed transactions
5. Edit if needed
6. Click **"Approve All"**

See [Import Guide](../frontend/public/IMPORT_GUIDE.md) for file format details.

### Managing Categories

1. Go to **Categories** page
2. Create parent categories (e.g., "Food & Dining")
3. Create subcategories (e.g., "Groceries", "Restaurants")
4. Assign colors for visual distinction

### Using Tags

Tags provide flexible organization:

1. When creating/editing a transaction
2. Type tag names in the tag field
3. Tags are created automatically
4. Use tags to filter transactions

Examples: `#vacation`, `#tax-deductible`, `#reimbursable`

---

## Troubleshooting

### Frontend shows "Cannot connect to server"

**Problem:** Backend is not running or wrong URL

**Solutions:**
1. Check backend is running: http://localhost:3001/api/accounts
2. Verify `REACT_APP_API_BASE_URL` in `frontend/.env`
3. Check browser console for errors
4. Restart backend server

### Document parsing fails

**Problem:** AI service is not running or Tesseract not found

**Solutions:**
1. Check AI service is running: http://localhost:8001/docs
2. Verify Tesseract installation: `tesseract --version`
3. Check `TESSERACT_CMD` in `ai-service/.env` (Windows)
4. Check AI service logs for errors

### Database errors

**Problem:** Database is corrupted or migrations not applied

**Solutions:**
```bash
cd backend

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Reseed with sample data
npm run prisma:seed
```

### Port already in use

**Problem:** Another application is using the port

**Solutions:**

**Backend (port 3001):**
```bash
# Find and kill process
# Windows:
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# macOS/Linux:
lsof -i :3001
kill -9 <PID>

# Or change port in backend/.env
PORT=3002
```

**Frontend (port 3000):**
- React will automatically suggest port 3001 if 3000 is taken
- Or set `PORT=3002` before running `npm start`

**AI Service (port 8001):**
- Change `PORT` in `ai-service/.env`
- Update `AI_SERVICE_URL` in `backend/.env`

### Python virtual environment issues

**Problem:** Can't activate venv or import errors

**Solutions:**
```bash
cd ai-service

# Delete and recreate venv
rm -rf venv  # or rmdir /s venv on Windows
python -m venv venv

# Activate and reinstall
# Windows:
venv\Scripts\activate

# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
```

### Tesseract not found (Windows)

**Problem:** AI service can't find Tesseract

**Solutions:**
1. Verify installation: `tesseract --version`
2. Find installation path (usually `C:\Program Files\Tesseract-OCR`)
3. Update `ai-service/.env`:
   ```env
   TESSERACT_CMD=C:\Program Files\Tesseract-OCR\tesseract.exe
   ```
4. Restart AI service

### npm install fails

**Problem:** Dependency installation errors

**Solutions:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

---

## Next Steps

### Learn More

- [API Documentation](API.md) - Complete API reference
- [Database Guide](DATABASE.md) - Database schema and management
- [Environment Variables](ENVIRONMENT.md) - Configuration options
- [Import Guide](../frontend/public/IMPORT_GUIDE.md) - JSON/YAML import format

### Customize Your Setup

1. **Add your real accounts**
   - Delete sample accounts
   - Add your actual bank accounts

2. **Customize categories**
   - Modify to match your spending habits
   - Add subcategories as needed

3. **Import your data**
   - Export from your current system
   - Format as JSON/YAML
   - Import and review

4. **Set up regular backups**
   - Backup `backend/dev.db` regularly
   - Export reports periodically

### Development

If you want to modify the application:

1. **Read the documentation**
   - [Backend README](../backend/README.md)
   - [Frontend README](../frontend/README.md)
   - [AI Service README](../ai-service/README.md)

2. **Run tests**
   ```bash
   # Backend
   cd backend
   npm test
   
   # Frontend
   cd frontend
   npm test
   
   # AI Service
   cd ai-service
   pytest
   ```

3. **Make changes**
   - Follow existing code patterns
   - Write tests for new features
   - Update documentation

### Production Deployment

When ready to deploy:

1. Switch to PostgreSQL database
2. Set up proper authentication
3. Configure HTTPS
4. Use environment-specific configs
5. Set up automated backups

See individual service READMEs for deployment details.

---

## Getting Help

### Check Documentation

- [Main README](../README.md) - Project overview
- [API Documentation](API.md) - API endpoints
- [Database Guide](DATABASE.md) - Database management
- [Environment Variables](ENVIRONMENT.md) - Configuration

### Common Issues

Most issues are covered in:
- This guide's [Troubleshooting](#troubleshooting) section
- [Backend README](../backend/README.md#troubleshooting)
- [AI Service Setup](../ai-service/SETUP.md#troubleshooting)

### Report Issues

If you encounter a bug or have a feature request:
1. Check existing issues
2. Create a new issue with:
   - Clear description
   - Steps to reproduce
   - Expected vs actual behavior
   - System information
   - Error messages/logs

---

**Congratulations! You're ready to manage your budget with Home Budget Manager!** 🎉
