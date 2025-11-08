# Design Document: Home Budget Manager

## Overview

The Home Budget Manager is a full-stack web application built with a modern architecture that separates concerns between frontend presentation, backend business logic, and AI/ML processing. The system is designed as a single-user application with a data model that supports future multi-user authentication with minimal refactoring.

### Technology Stack

**Frontend:**
- React with TypeScript for type safety and component-based UI
- Tailwind CSS for responsive design
- Chart.js or Recharts for data visualization
- React Router for navigation
- Axios for API communication

**Backend:**
- Node.js with Express for REST API
- TypeScript for type safety
- SQLite for local development (file-based, zero configuration)
- PostgreSQL for production deployment (future)
- Prisma ORM for database access and migrations (supports both SQLite and PostgreSQL)
- Multer for file upload handling

**AI/ML Services:**
- Python-based microservice for document processing
- Tesseract OCR for receipt text extraction with line-item detection
- PyPDF2 or pdfplumber for PDF parsing
- scikit-learn or simple ML model for transaction categorization
- OpenAI API or local LLM for intelligent parsing and itemization (optional enhancement)
- Receipt line-item parser to extract individual products and amounts

**File Storage:**
- Local filesystem storage with organized directory structure
- Future: S3-compatible storage for cloud deployment

**Export Generation:**
- PDFKit or Puppeteer for PDF generation
- ExcelJS for Excel file generation

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Web Browser                          │
│                   (React Frontend)                       │
└────────────────────┬────────────────────────────────────┘
                     │ HTTPS/REST API
┌────────────────────▼────────────────────────────────────┐
│                  Express API Server                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Routes     │  │  Controllers │  │   Services   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│  ┌──────────────┐  ┌──────────────┐                    │
│  │ Prisma ORM   │  │  File Store  │                    │
│  └──────────────┘  └──────────────┘                    │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
┌───────▼──────┐ ┌──▼─────────┐ ┌▼──────────────────┐
│    SQLite    │ │ File System│ │ Python AI Service │
│   Database   │ │  Storage   │ │  (Document Parse) │
│  (dev.db)    │ │            │ │                   │
└──────────────┘ └────────────┘ └───────────────────┘
Note: PostgreSQL for production deployment
```

### Component Interaction Flow

**Transaction Creation Flow:**
1. User submits transaction via React form
2. Frontend validates and sends POST to `/api/transactions`
3. Backend controller receives request
4. Service layer validates business rules
5. Prisma creates transaction record in PostgreSQL
6. Account balance is recalculated
7. Response returned to frontend
8. UI updates with new transaction

**Document Upload and Parse Flow:**
1. User uploads PDF/image via React upload component
2. File sent to `/api/documents/upload` with multipart form data
3. Backend saves file to filesystem with unique ID
4. Backend forwards file to Python AI service via HTTP
5. AI service processes document (OCR/PDF parsing)
6. AI service returns extracted transaction data
7. Backend creates pending transactions in database
8. Frontend displays import review interface
9. User approves/edits transactions
10. Backend finalizes transactions and updates balances

## Components and Interfaces

### Frontend Components

**Page Components:**
- `DashboardPage`: Main overview with summary cards and charts
- `TransactionsPage`: Transaction list with filters and search
- `AccountsPage`: Account management interface
- `CategoriesPage`: Category and tag management
- `ReportsPage`: Report generation and export interface
- `ImportPage`: Document upload and transaction review
- `ImportDataPage`: JSON/YAML file import interface

**Shared Components:**
- `TransactionForm`: Reusable form for creating/editing transactions
- `TransactionTable`: Sortable, filterable transaction list
- `AccountSelector`: Dropdown for selecting accounts
- `CategorySelector`: Hierarchical category picker
- `TagInput`: Multi-tag input with autocomplete
- `ChartCard`: Wrapper for chart visualizations
- `FileUpload`: Drag-and-drop file upload component
- `ImportReview`: Interface for reviewing parsed transactions

### Backend API Endpoints

**Accounts:**
- `GET /api/accounts` - List all accounts
- `POST /api/accounts` - Create new account
- `PUT /api/accounts/:id` - Update account
- `DELETE /api/accounts/:id` - Delete account
- `GET /api/accounts/:id/balance` - Get current balance

**Transactions:**
- `GET /api/transactions` - List transactions with filters (date, account, category, tags)
- `POST /api/transactions` - Create transaction
- `POST /api/transactions/split` - Create split transaction with multiple items
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction (and child items if parent)
- `POST /api/transactions/transfer` - Create transfer between accounts
- `POST /api/transactions/bulk` - Create multiple transactions (for imports)
- `GET /api/transactions/:id/items` - Get split items for a parent transaction

**Categories:**
- `GET /api/categories` - List all categories
- `POST /api/categories` - Create category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category (with reassignment)

**Tags:**
- `GET /api/tags` - List all tags with usage count
- `POST /api/tags` - Create tag
- `DELETE /api/tags/:id` - Delete tag

**Documents:**
- `POST /api/documents/upload` - Upload document (PDF/image)
- `POST /api/documents/parse` - Parse uploaded document
- `GET /api/documents/:id` - Download document
- `GET /api/documents/:id/transactions` - Get transactions linked to document

**Import:**
- `POST /api/import/json` - Import transactions from JSON format
- `POST /api/import/yaml` - Import transactions from YAML format
- `GET /api/import/schema` - Get JSON/YAML schema documentation
- `POST /api/import/validate` - Validate import file before processing

**Reports:**
- `GET /api/reports/summary` - Get summary data for date range
- `GET /api/reports/category-breakdown` - Get expense breakdown by category
- `GET /api/reports/net-balance` - Get net balance over time
- `POST /api/reports/export/pdf` - Generate and download PDF report
- `POST /api/reports/export/excel` - Generate and download Excel report

**AI/Categorization:**
- `POST /api/ai/suggest-category` - Get category suggestion for transaction
- `POST /api/ai/learn` - Update categorization model with user correction

### Python AI Service API

**Internal Service Endpoints:**
- `POST /parse/pdf` - Parse bank statement PDF
- `POST /parse/receipt` - Parse receipt image with OCR
- `POST /categorize` - Suggest category for transaction
- `POST /train` - Update categorization model

## Data Models

### Database Schema (Prisma)

```prisma
model User {
  id        String   @id @default(uuid())
  email     String?  @unique
  name      String?
  createdAt DateTime @default(now())
  
  accounts     Account[]
  transactions Transaction[]
  categories   Category[]
  tags         Tag[]
}

model Account {
  id        String      @id @default(uuid())
  name      String
  type      AccountType
  balance   Decimal     @default(0)
  userId    String
  createdAt DateTime    @default(now())
  updatedAt DateTime    @updatedAt
  
  user         User          @relation(fields: [userId], references: [id])
  transactions Transaction[]
  transfersFrom Transfer[]   @relation("TransferFrom")
  transfersTo   Transfer[]   @relation("TransferTo")
}

enum AccountType {
  CHECKING
  SAVINGS
  CREDIT_CARD
  CASH
}

model Transaction {
  id          String          @id @default(uuid())
  date        DateTime
  amount      Decimal
  type        TransactionType
  description String
  notes       String?
  accountId   String
  categoryId  String?
  userId      String
  documentId  String?
  isParent    Boolean         @default(false)
  parentId    String?
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt
  
  account      Account          @relation(fields: [accountId], references: [id])
  category     Category?        @relation(fields: [categoryId], references: [id])
  user         User             @relation(fields: [userId], references: [id])
  document     Document?        @relation(fields: [documentId], references: [id])
  tags         TransactionTag[]
  transfer     Transfer?
  parent       Transaction?     @relation("TransactionSplit", fields: [parentId], references: [id])
  splitItems   Transaction[]    @relation("TransactionSplit")
}

enum TransactionType {
  INCOME
  EXPENSE
  TRANSFER
}

model Transfer {
  id            String   @id @default(uuid())
  transactionId String   @unique
  fromAccountId String
  toAccountId   String
  createdAt     DateTime @default(now())
  
  transaction Transaction @relation(fields: [transactionId], references: [id])
  fromAccount Account     @relation("TransferFrom", fields: [fromAccountId], references: [id])
  toAccount   Account     @relation("TransferTo", fields: [toAccountId], references: [id])
}

model Category {
  id       String  @id @default(uuid())
  name     String
  parentId String?
  userId   String
  color    String?
  
  parent       Category?     @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children     Category[]    @relation("CategoryHierarchy")
  user         User          @relation(fields: [userId], references: [id])
  transactions Transaction[]
}

model Tag {
  id     String @id @default(uuid())
  name   String
  userId String
  
  user         User             @relation(fields: [userId], references: [id])
  transactions TransactionTag[]
}

model TransactionTag {
  transactionId String
  tagId         String
  
  transaction Transaction @relation(fields: [transactionId], references: [id])
  tag         Tag         @relation(fields: [tagId], references: [id])
  
  @@id([transactionId, tagId])
}

model Document {
  id           String   @id @default(uuid())
  filename     String
  originalName String
  mimeType     String
  size         Int
  path         String
  uploadedAt   DateTime @default(now())
  
  transactions Transaction[]
}

model CategorizationRule {
  id          String   @id @default(uuid())
  pattern     String
  categoryId  String
  confidence  Float
  learnedFrom Int      @default(1)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### Key Data Relationships

- **User → Accounts**: One-to-many (user owns multiple accounts)
- **User → Transactions**: One-to-many (user owns all transactions)
- **Account → Transactions**: One-to-many (account has multiple transactions)
- **Transaction → Category**: Many-to-one (transaction has one category)
- **Transaction → Tags**: Many-to-many (transaction can have multiple tags)
- **Transaction → Document**: Many-to-one (multiple transactions can link to same document)
- **Transaction → Transfer**: One-to-one (transfer transactions have additional metadata)
- **Transaction → Transaction**: Self-referential (parent-child for split transactions)
- **Category → Category**: Self-referential (parent-child hierarchy)

### Split Transactions (Multi-Category Receipts)

**Concept:**
When a receipt contains items from multiple categories (e.g., groceries + electronics + personal care), the system creates a parent transaction with child items.

**Structure:**
- **Parent Transaction**: Represents the total receipt amount
  - `isParent = true`
  - `amount = total of all items`
  - `category = null` (or "Mixed" category)
  - `description = "Store Name - Multiple Items"`
  
- **Child Transactions**: Individual line items
  - `isParent = false`
  - `parentId = parent transaction ID`
  - `amount = item amount`
  - `category = specific category (Food, Electronics, etc.)`
  - `description = item description`

**Example:**
```
Parent: $85.50 - "Walmart Receipt" (Mixed)
  ├─ Child: $35.00 - "Groceries" (Food & Dining)
  ├─ Child: $40.00 - "USB Cable" (Electronics)
  └─ Child: $10.50 - "Shampoo" (Personal Care)
```

**Business Rules:**
- Sum of child amounts must equal parent amount
- All children share the same account and date as parent
- Deleting parent deletes all children
- Parent transaction doesn't count in category breakdowns (only children do)
- Children can have different categories and tags
- Document link is on parent, inherited by children

**UI Behavior:**
- Transaction list shows parent with expandable children
- Charts and reports use child transactions for category breakdown
- Import review allows splitting a single parsed transaction into multiple items
- Manual split option available for any transaction

## Error Handling

### Frontend Error Handling

**Strategy:**
- Use React Error Boundaries for component-level errors
- Display user-friendly error messages with toast notifications
- Implement retry logic for failed API calls
- Validate form inputs before submission
- Show loading states during async operations

**Error Types:**
- Network errors: "Unable to connect. Please check your internet connection."
- Validation errors: Display field-specific error messages
- Server errors: "Something went wrong. Please try again."
- File upload errors: "File type not supported" or "File too large"

### Backend Error Handling

**Strategy:**
- Centralized error handling middleware
- Structured error responses with status codes
- Logging of all errors with context
- Validation using Zod or Joi schemas
- Transaction rollback on database errors

**HTTP Status Codes:**
- 200: Success
- 201: Created
- 400: Bad Request (validation errors)
- 404: Not Found
- 409: Conflict (e.g., duplicate account)
- 500: Internal Server Error
- 503: Service Unavailable (AI service down)

**Error Response Format:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid transaction data",
    "details": [
      {
        "field": "amount",
        "message": "Amount must be greater than 0"
      }
    ]
  }
}
```

### AI Service Error Handling

**Strategy:**
- Graceful degradation when AI service is unavailable
- Fallback to manual categorization if AI fails
- Retry logic with exponential backoff
- Timeout handling for long-running operations
- Return partial results when possible

**Fallback Behaviors:**
- If PDF parsing fails: Allow manual transaction entry
- If OCR fails: Store document but skip extraction
- If categorization fails: Use "Uncategorized" category

## Testing Strategy

### Frontend Testing

**Unit Tests (Jest + React Testing Library):**
- Component rendering and props
- Form validation logic
- Utility functions (date formatting, calculations)
- State management logic

**Integration Tests:**
- User flows (create transaction, upload document)
- API integration with mocked responses
- Form submission and validation

**E2E Tests (Playwright or Cypress):**
- Complete user journeys
- Dashboard navigation
- Transaction creation and editing
- Document upload and import workflow
- Report generation

### Backend Testing

**Unit Tests (Jest):**
- Service layer business logic
- Utility functions
- Validation schemas
- Calculation functions (balance, net income)

**Integration Tests:**
- API endpoint testing with test database
- Database operations via Prisma
- File upload and storage
- AI service integration (mocked)

**API Tests (Supertest):**
- Request/response validation
- Authentication (future)
- Error handling
- Edge cases

### AI Service Testing

**Unit Tests (pytest):**
- PDF parsing functions
- OCR text extraction
- Categorization algorithm
- Data preprocessing

**Integration Tests:**
- End-to-end document processing
- Model training and prediction
- API endpoint testing

### Test Data Strategy

- Use factories for generating test data
- Seed database with realistic sample data
- Use sample PDFs and receipt images for testing
- Mock external services (future: OpenAI API)

### Performance Testing

- Load testing for API endpoints
- Database query optimization
- File upload performance with large files
- Report generation time benchmarks

## Import Data Format

### JSON/YAML Import Schema

Users can import transactions using external AI tools or manual exports. The system accepts both JSON and YAML formats with the following structure:

**JSON Format Example:**
```json
{
  "version": "1.0",
  "source": "external_ai_parser",
  "document": {
    "filename": "bank_statement_jan_2024.pdf",
    "date": "2024-01-31"
  },
  "transactions": [
    {
      "date": "2024-01-15",
      "amount": 50.00,
      "type": "expense",
      "description": "Grocery Store Purchase",
      "category": "Food & Dining",
      "account": "Checking Account",
      "notes": "Weekly groceries"
    },
    {
      "date": "2024-01-20",
      "amount": 3000.00,
      "type": "income",
      "description": "Salary Payment",
      "category": "Salary",
      "account": "Checking Account"
    },
    {
      "date": "2024-01-18",
      "amount": 85.50,
      "type": "expense",
      "description": "Walmart Receipt",
      "account": "Credit Card",
      "split": true,
      "items": [
        {
          "amount": 35.00,
          "description": "Groceries",
          "category": "Food & Dining"
        },
        {
          "amount": 40.00,
          "description": "USB Cable",
          "category": "Electronics"
        },
        {
          "amount": 10.50,
          "description": "Shampoo",
          "category": "Personal Care"
        }
      ]
    }
  ]
}
```

**YAML Format Example:**
```yaml
version: "1.0"
source: "external_ai_parser"
document:
  filename: "bank_statement_jan_2024.pdf"
  date: "2024-01-31"
transactions:
  - date: "2024-01-15"
    amount: 50.00
    type: "expense"
    description: "Grocery Store Purchase"
    category: "Food & Dining"
    account: "Checking Account"
    notes: "Weekly groceries"
  - date: "2024-01-20"
    amount: 3000.00
    type: "income"
    description: "Salary Payment"
    category: "Salary"
    account: "Checking Account"
```

**Field Specifications:**
- `version`: Schema version (currently "1.0")
- `source`: Optional identifier for the parsing tool used
- `document`: Optional metadata about source document
  - `filename`: Original document filename
  - `date`: Document date
- `transactions`: Array of transaction objects
  - `date`: Transaction date (ISO 8601 format: YYYY-MM-DD)
  - `amount`: Transaction amount (positive number)
  - `type`: "income", "expense", or "transfer"
  - `description`: Transaction description (required)
  - `category`: Category name (will be matched or created) - omit for split transactions
  - `account`: Account name (must match existing account)
  - `notes`: Optional additional notes
  - `tags`: Optional array of tag names
  - `split`: Optional boolean, set to true for multi-category transactions
  - `items`: Optional array of line items (required if split=true)
    - `amount`: Item amount (positive number)
    - `description`: Item description
    - `category`: Item category name
    - `notes`: Optional item notes

**Import Processing:**
1. Validate file format and schema
2. Match account names to existing accounts (error if not found)
3. Match or create categories as needed
4. Create or match tags
5. Display preview in import review interface
6. Allow user to edit before final import
7. Create transactions and update balances on approval

**Error Handling:**
- Invalid JSON/YAML: Return parsing error with line number
- Missing required fields: List all validation errors
- Unknown account: Suggest closest match or require user to create
- Invalid date format: Show expected format
- Invalid amount: Must be positive number
- Split transaction validation: Sum of items must equal parent amount
- Missing items array: Required when split=true

## Security Considerations

### Current Implementation (Single User)

- Input validation on all endpoints
- SQL injection prevention via Prisma ORM
- File upload restrictions (type, size)
- Secure file storage with unique IDs
- CORS configuration for frontend

### Future Multi-User Implementation

- JWT-based authentication
- Password hashing with bcrypt
- Row-level security in database
- User-specific data isolation
- Session management
- HTTPS enforcement
- Rate limiting on API endpoints
- CSRF protection

## Deployment Architecture

### Development Environment

- SQLite database (single file: `dev.db`)
- Local file storage
- Python AI service running locally
- Hot reload for frontend and backend
- No database server setup required

**Database Migration Path:**
- Development: SQLite (file-based, zero configuration)
- Production: PostgreSQL (when deploying to server)
- Prisma handles the switch with minimal code changes (just update connection string)

### Production Environment (Future)

- Containerized deployment (Docker)
- PostgreSQL on managed service (e.g., AWS RDS, or keep SQLite for small deployments)
- File storage on S3 or similar
- Python AI service as separate container
- Nginx reverse proxy
- SSL/TLS certificates
- Environment-based configuration

**SQLite vs PostgreSQL:**
- SQLite is perfect for single-user local deployment
- PostgreSQL recommended for multi-user production deployment
- Prisma makes switching databases seamless (just change datasource in schema.prisma)

## Future Enhancements

### Authentication System

- User registration and login
- Email verification
- Password reset flow
- Multi-user data isolation
- Shared budgets (family/partner access)

### Advanced Features

- Recurring transaction templates
- Budget goals and alerts
- Multi-currency support
- Bank API integration (Plaid, Teller)
- Mobile app (React Native)
- Real-time notifications
- Data export/import (CSV, JSON)
- Backup and restore functionality

### AI Improvements

- Better ML models for categorization
- Automatic merchant name normalization
- Anomaly detection for unusual spending
- Predictive budgeting
- Natural language transaction entry
