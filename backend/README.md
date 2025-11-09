# Home Budget Manager - Backend

Express-based REST API server for the Home Budget Manager application.

## Features

- RESTful API with TypeScript
- Prisma ORM for type-safe database access
- SQLite (development) / PostgreSQL (production)
- File upload handling with Multer
- PDF and Excel report generation
- Integration with Python AI service
- Comprehensive test coverage

## Quick Start

### Prerequisites

- Node.js 16+ and npm
- Python AI service running (for document parsing)

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` if needed (see [Environment Variables](#environment-variables))

3. **Generate Prisma client:**
   ```bash
   npm run prisma:generate
   ```

4. **Run database migrations:**
   ```bash
   npm run prisma:migrate
   ```

5. **Seed the database** (optional but recommended):
   ```bash
   npm run prisma:seed
   ```

### Running the Server

**Development mode** (with hot reload):
```bash
npm run dev
```

**Using startup script:**

Windows:
```bash
start.bat
```

macOS/Linux:
```bash
chmod +x start.sh
./start.sh
```

The API will be available at `http://localhost:3001`

## Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma       # Database schema
│   ├── migrations/         # Database migrations
│   └── seed.ts            # Seed data script
├── src/
│   ├── controllers/        # Request handlers
│   │   ├── accountController.ts
│   │   ├── transactionController.ts
│   │   ├── categoryController.ts
│   │   ├── tagController.ts
│   │   ├── documentController.ts
│   │   ├── importController.ts
│   │   ├── reportController.ts
│   │   └── aiController.ts
│   ├── routes/            # API route definitions
│   │   ├── accountRoutes.ts
│   │   ├── transactionRoutes.ts
│   │   ├── categoryRoutes.ts
│   │   ├── tagRoutes.ts
│   │   ├── documentRoutes.ts
│   │   ├── importRoutes.ts
│   │   └── reportRoutes.ts
│   ├── services/          # Business logic
│   │   ├── accountService.ts
│   │   ├── transactionService.ts
│   │   ├── categoryService.ts
│   │   ├── tagService.ts
│   │   ├── documentService.ts
│   │   ├── parsingService.ts
│   │   ├── importService.ts
│   │   ├── reportService.ts
│   │   ├── pdfService.ts
│   │   ├── excelService.ts
│   │   └── aiService.ts
│   ├── middleware/        # Express middleware
│   │   ├── auth.ts
│   │   └── userContext.ts
│   ├── utils/             # Utility functions
│   └── index.ts           # Application entry point
├── uploads/               # File upload storage
│   └── documents/         # Uploaded documents
├── dist/                  # Compiled JavaScript (generated)
├── dev.db                 # SQLite database (generated)
├── .env                   # Environment variables (create from .env.example)
├── .env.example           # Environment variables template
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
└── jest.config.js         # Jest test configuration
```

## Database

This project uses **Prisma ORM** with:
- **SQLite** for development (zero configuration)
- **PostgreSQL** for production (recommended)

### Database Commands

```bash
# Generate Prisma Client (after schema changes)
npm run prisma:generate

# Create and apply migrations
npm run prisma:migrate

# Open Prisma Studio (database GUI)
npm run prisma:studio

# Seed the database with sample data
npm run prisma:seed

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

### Prisma Studio

Visual database editor at http://localhost:5555:
```bash
npm run prisma:studio
```

For more details, see [Database Guide](../docs/DATABASE.md)

## API Endpoints

Complete API documentation: [API.md](../docs/API.md)

### Quick Reference

**Accounts:**
- `GET /api/accounts` - List all accounts
- `POST /api/accounts` - Create account
- `PUT /api/accounts/:id` - Update account
- `DELETE /api/accounts/:id` - Delete account

**Transactions:**
- `GET /api/transactions` - List transactions (with filters)
- `POST /api/transactions` - Create transaction
- `POST /api/transactions/transfer` - Create transfer
- `POST /api/transactions/split` - Create split transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction

**Categories:**
- `GET /api/categories` - List categories
- `POST /api/categories` - Create category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

**Tags:**
- `GET /api/tags` - List tags
- `POST /api/tags` - Create tag
- `DELETE /api/tags/:id` - Delete tag

**Documents:**
- `POST /api/documents/upload` - Upload document
- `POST /api/documents/parse` - Parse document
- `GET /api/documents/:id` - Download document

**Import:**
- `POST /api/import/json` - Import from JSON
- `POST /api/import/yaml` - Import from YAML
- `GET /api/import/schema` - Get schema documentation

**Reports:**
- `GET /api/reports/summary` - Get summary report
- `GET /api/reports/category-breakdown` - Category breakdown
- `POST /api/reports/export/pdf` - Export PDF report
- `POST /api/reports/export/excel` - Export Excel report

**AI:**
- `POST /api/ai/suggest-category` - Get category suggestion
- `POST /api/ai/learn` - Train categorization model

## Environment Variables

Create `.env` from `.env.example`:

```env
# Database
DATABASE_URL="file:./dev.db"

# Server
PORT=3001
NODE_ENV=development

# AI Service
AI_SERVICE_URL=http://localhost:8001
AI_SERVICE_TIMEOUT=30000

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
```

For detailed documentation, see [Environment Variables Guide](../docs/ENVIRONMENT.md)

## Testing

### Run Tests

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# With coverage
npm run test:coverage
```

### Test Structure

```
src/
├── controllers/
│   └── __tests__/
│       └── *.test.ts          # Controller integration tests
└── services/
    └── __tests__/
        └── *.test.ts          # Service unit tests
```

### Writing Tests

Tests use Jest and are located alongside the code they test:

```typescript
// Example: src/services/__tests__/accountService.test.ts
import { accountService } from '../accountService';

describe('Account Service', () => {
  it('should create an account', async () => {
    const account = await accountService.createAccount({
      name: 'Test Account',
      type: 'CHECKING',
      userId: 'user-id'
    });
    
    expect(account.name).toBe('Test Account');
  });
});
```

## Development

### Hot Reload

The development server uses `ts-node-dev` for automatic reloading:
```bash
npm run dev
```

Changes to TypeScript files will automatically restart the server.

### Building for Production

```bash
# Compile TypeScript to JavaScript
npm run build

# Run production server
npm start
```

### Code Style

- Use TypeScript strict mode
- Follow existing patterns
- Write tests for new features
- Use Prisma for all database operations
- Handle errors appropriately

## Dependencies

### Core Dependencies

- **express**: Web framework
- **@prisma/client**: Database ORM
- **typescript**: Type safety
- **dotenv**: Environment variables
- **cors**: Cross-origin resource sharing
- **multer**: File upload handling
- **axios**: HTTP client (for AI service)
- **pdfkit**: PDF generation
- **exceljs**: Excel generation
- **js-yaml**: YAML parsing
- **zod**: Schema validation
- **uuid**: Unique ID generation

### Dev Dependencies

- **ts-node-dev**: Development server with hot reload
- **jest**: Testing framework
- **@types/***: TypeScript type definitions
- **prisma**: Database toolkit

## Troubleshooting

### Server won't start

**Check port availability:**
```bash
# Windows
netstat -ano | findstr :3001

# macOS/Linux
lsof -i :3001
```

**Solution:** Change `PORT` in `.env` or kill the process using port 3001

### Database errors

**Regenerate Prisma Client:**
```bash
npm run prisma:generate
```

**Reset database:**
```bash
npx prisma migrate reset
npm run prisma:seed
```

### AI Service connection errors

**Verify AI service is running:**
```bash
curl http://localhost:8001/health
```

**Check configuration:**
- Verify `AI_SERVICE_URL` in `.env`
- Ensure AI service is running on correct port

### File upload errors

**Check upload directory:**
```bash
# Should exist and be writable
ls -la uploads/
```

**Create if missing:**
```bash
mkdir -p uploads/documents
```

### Migration errors

**Check migration status:**
```bash
npx prisma migrate status
```

**Apply pending migrations:**
```bash
npm run prisma:migrate
```

## Production Deployment

### Database

Switch to PostgreSQL:

1. Update `.env`:
   ```env
   DATABASE_URL="postgresql://user:password@host:5432/budget_manager"
   ```

2. Run migrations:
   ```bash
   npx prisma migrate deploy
   ```

### Build and Run

```bash
# Build
npm run build

# Set environment
export NODE_ENV=production

# Run
npm start
```

### Environment Variables

Update for production:
- Use PostgreSQL connection string
- Set `NODE_ENV=production`
- Use production AI service URL
- Configure proper file storage (consider S3)

### Security Considerations

- Enable HTTPS
- Set up proper CORS configuration
- Implement rate limiting
- Use strong database credentials
- Regular backups
- Monitor logs

## Additional Resources

- [API Documentation](../docs/API.md)
- [Database Guide](../docs/DATABASE.md)
- [Environment Variables](../docs/ENVIRONMENT.md)
- [Authentication Integration](AUTHENTICATION_INTEGRATION.md)
- [Main README](../README.md)

## Support

For issues or questions, please check:
1. This README
2. [Troubleshooting](#troubleshooting) section
3. [Database Guide](../docs/DATABASE.md)
4. Open an issue on the repository
