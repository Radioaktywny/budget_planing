# Database Guide

This guide covers database setup, schema, migrations, and management for the Home Budget Manager application.

## Table of Contents

- [Overview](#overview)
- [Database Setup](#database-setup)
- [Schema](#schema)
- [Migrations](#migrations)
- [Seeding](#seeding)
- [Prisma Commands](#prisma-commands)
- [Backup and Restore](#backup-and-restore)
- [Troubleshooting](#troubleshooting)

---

## Overview

The Home Budget Manager uses **Prisma ORM** for database management, which provides:
- Type-safe database access
- Automatic migrations
- Database GUI (Prisma Studio)
- Support for multiple databases

### Database Options

**Development:**
- **SQLite** (recommended): File-based, zero configuration
- Location: `backend/dev.db`
- Perfect for local development and testing

**Production:**
- **PostgreSQL** (recommended): Robust, scalable
- Supports concurrent users
- Better performance for large datasets

**Switching databases** requires only changing the connection string in `.env` - Prisma handles the rest!

---

## Database Setup

### Initial Setup

1. **Install dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Configure database connection**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env`:
   ```env
   # SQLite (development)
   DATABASE_URL="file:./dev.db"
   
   # PostgreSQL (production)
   # DATABASE_URL="postgresql://user:password@localhost:5432/budget_manager"
   ```

3. **Generate Prisma Client**
   ```bash
   npm run prisma:generate
   ```
   
   This creates the TypeScript client based on your schema.

4. **Run migrations**
   ```bash
   npm run prisma:migrate
   ```
   
   This creates the database and all tables.

5. **Seed the database** (optional)
   ```bash
   npm run prisma:seed
   ```
   
   This adds sample data for testing.

### Verification

Check that everything is set up correctly:

```bash
# Open Prisma Studio (database GUI)
npm run prisma:studio
```

Visit http://localhost:5555 to browse your database.

---

## Schema

The database schema is defined in `backend/prisma/schema.prisma`.

### Entity Relationship Diagram

```
User
 ├─► Account (1:N)
 ├─► Transaction (1:N)
 ├─► Category (1:N)
 └─► Tag (1:N)

Account
 └─► Transaction (1:N)

Transaction
 ├─► Account (N:1)
 ├─► Category (N:1)
 ├─► Document (N:1)
 ├─► Transfer (1:1)
 ├─► TransactionTag (1:N)
 ├─► Parent Transaction (N:1) [for splits]
 └─► Child Transactions (1:N) [for splits]

Category
 ├─► Parent Category (N:1)
 └─► Child Categories (1:N)

Tag
 └─► TransactionTag (1:N)

Document
 └─► Transaction (1:N)
```

### Core Models

#### User
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
```

**Purpose**: Represents a user of the application. Currently single-user, designed for future multi-user support.

#### Account
```prisma
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
```

**Purpose**: Represents financial accounts (bank accounts, credit cards, cash).

**Fields:**
- `type`: Account type (checking, savings, credit card, cash)
- `balance`: Current balance (calculated from transactions)

#### Transaction
```prisma
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
```

**Purpose**: Represents financial transactions (income, expenses, transfers).

**Fields:**
- `type`: Transaction type (income, expense, transfer)
- `isParent`: True for split transactions (parent)
- `parentId`: Reference to parent transaction (for split items)
- `documentId`: Link to source document (receipt, statement)

**Split Transactions:**
- Parent transaction: `isParent = true`, `parentId = null`
- Child items: `isParent = false`, `parentId = parent.id`
- Sum of child amounts must equal parent amount

#### Transfer
```prisma
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
```

**Purpose**: Additional metadata for transfer transactions.

**Fields:**
- `fromAccountId`: Source account
- `toAccountId`: Destination account
- `transactionId`: Link to the transaction record

#### Category
```prisma
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
```

**Purpose**: Hierarchical categories for organizing transactions.

**Features:**
- Supports parent-child relationships
- Optional color coding
- User-specific categories

#### Tag
```prisma
model Tag {
  id     String @id @default(uuid())
  name   String
  userId String
  
  user         User             @relation(fields: [userId], references: [id])
  transactions TransactionTag[]
}
```

**Purpose**: Flexible tagging system for transactions.

#### TransactionTag
```prisma
model TransactionTag {
  transactionId String
  tagId         String
  
  transaction Transaction @relation(fields: [transactionId], references: [id])
  tag         Tag         @relation(fields: [tagId], references: [id])
  
  @@id([transactionId, tagId])
}
```

**Purpose**: Many-to-many relationship between transactions and tags.

#### Document
```prisma
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
```

**Purpose**: Stores metadata for uploaded documents (receipts, statements).

**Fields:**
- `filename`: Generated unique filename
- `originalName`: User's original filename
- `path`: File system path
- `size`: File size in bytes

#### CategorizationRule
```prisma
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

**Purpose**: Stores learned patterns for AI categorization.

**Fields:**
- `pattern`: Text pattern to match
- `categoryId`: Suggested category
- `confidence`: Confidence score (0-1)
- `learnedFrom`: Number of times this pattern was confirmed

---

## Migrations

Prisma migrations track database schema changes over time.

### Creating a Migration

When you modify `schema.prisma`:

```bash
npm run prisma:migrate
```

This will:
1. Detect schema changes
2. Prompt for a migration name
3. Generate SQL migration file
4. Apply the migration to your database

**Example:**
```bash
$ npm run prisma:migrate
✔ Enter a name for the new migration: › add_notes_to_transactions
```

Migration files are stored in `backend/prisma/migrations/`.

### Applying Migrations

Migrations are automatically applied when you run:
```bash
npm run prisma:migrate
```

For production deployment:
```bash
npx prisma migrate deploy
```

### Viewing Migration Status

```bash
npx prisma migrate status
```

Shows:
- Applied migrations
- Pending migrations
- Migration history

### Rolling Back Migrations

Prisma doesn't support automatic rollback. To undo a migration:

1. **Manually revert the schema change** in `schema.prisma`
2. **Create a new migration** with the reverted schema
3. **Or reset the database** (development only):
   ```bash
   npx prisma migrate reset
   ```

### Migration Best Practices

1. **Always commit migrations** to version control
2. **Test migrations** on a copy of production data
3. **Never edit applied migrations** - create new ones instead
4. **Backup before migrating** in production
5. **Use descriptive names** for migrations

---

## Seeding

Seed data provides initial data for development and testing.

### Running the Seed Script

```bash
npm run prisma:seed
```

This runs `backend/prisma/seed.ts` which creates:
- Default user
- Sample accounts (Checking, Savings, Credit Card, Cash)
- Sample categories (Food & Dining, Transport, Housing, etc.)
- Sample transactions
- Sample tags

### Customizing Seed Data

Edit `backend/prisma/seed.ts` to add or modify seed data:

```typescript
// Example: Add a new category
await prisma.category.create({
  data: {
    name: 'My Custom Category',
    userId: user.id,
    color: '#FF5733'
  }
});
```

### When to Seed

- **Initial setup**: After first migration
- **After reset**: When you reset the database
- **Testing**: Before running integration tests
- **Demo**: When preparing demo environments

---

## Prisma Commands

### Essential Commands

```bash
# Generate Prisma Client (after schema changes)
npm run prisma:generate

# Create and apply migrations
npm run prisma:migrate

# Open Prisma Studio (database GUI)
npm run prisma:studio

# Seed the database
npm run prisma:seed

# View migration status
npx prisma migrate status

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Format schema file
npx prisma format

# Validate schema
npx prisma validate

# Pull schema from existing database
npx prisma db pull

# Push schema without migrations (dev only)
npx prisma db push
```

### Prisma Studio

Prisma Studio is a visual database editor:

```bash
npm run prisma:studio
```

Features:
- Browse all tables
- View and edit records
- Filter and search data
- Create new records
- Delete records

Access at: http://localhost:5555

---

## Backup and Restore

### SQLite Backup

**Backup:**
```bash
# Simple file copy
cp backend/dev.db backend/dev.db.backup

# With timestamp
cp backend/dev.db backend/dev.db.$(date +%Y%m%d_%H%M%S)
```

**Restore:**
```bash
cp backend/dev.db.backup backend/dev.db
```

### PostgreSQL Backup

**Backup:**
```bash
pg_dump -U username -d budget_manager > backup.sql

# With compression
pg_dump -U username -d budget_manager | gzip > backup.sql.gz
```

**Restore:**
```bash
psql -U username -d budget_manager < backup.sql

# From compressed
gunzip -c backup.sql.gz | psql -U username -d budget_manager
```

### Automated Backups

**Linux/macOS cron job:**
```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * cp /path/to/backend/dev.db /path/to/backups/dev.db.$(date +\%Y\%m\%d)
```

**Windows Task Scheduler:**
Create a batch script and schedule it:
```batch
@echo off
set BACKUP_DIR=C:\backups
set DB_FILE=C:\path\to\backend\dev.db
copy "%DB_FILE%" "%BACKUP_DIR%\dev.db.%date:~-4,4%%date:~-10,2%%date:~-7,2%"
```

---

## Troubleshooting

### Database Connection Errors

**Error:** `Can't reach database server`

**Solutions:**
- Check `DATABASE_URL` in `.env`
- Verify database server is running (PostgreSQL)
- Check network connectivity
- Verify credentials

### Migration Errors

**Error:** `Migration failed to apply`

**Solutions:**
- Check migration SQL for errors
- Verify database permissions
- Check for conflicting data
- Reset database (development only)

### Schema Sync Issues

**Error:** `Schema is out of sync`

**Solutions:**
```bash
# Regenerate Prisma Client
npm run prisma:generate

# Apply pending migrations
npm run prisma:migrate

# Or reset (development only)
npx prisma migrate reset
```

### Prisma Client Not Found

**Error:** `Cannot find module '@prisma/client'`

**Solutions:**
```bash
# Install dependencies
npm install

# Generate Prisma Client
npm run prisma:generate
```

### Database Locked (SQLite)

**Error:** `database is locked`

**Solutions:**
- Close Prisma Studio
- Stop all backend processes
- Check for zombie processes
- Restart your computer (last resort)

### Slow Queries

**Solutions:**
- Add indexes to frequently queried fields
- Use `select` to limit returned fields
- Implement pagination
- Consider PostgreSQL for better performance

### Data Integrity Issues

**Solutions:**
```bash
# Validate schema
npx prisma validate

# Check migration status
npx prisma migrate status

# Reset and reseed (development only)
npx prisma migrate reset
npm run prisma:seed
```

---

## Switching from SQLite to PostgreSQL

When moving to production:

1. **Install PostgreSQL**
   ```bash
   # macOS
   brew install postgresql
   
   # Ubuntu
   sudo apt-get install postgresql
   ```

2. **Create database**
   ```bash
   createdb budget_manager
   ```

3. **Update connection string**
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/budget_manager"
   ```

4. **Run migrations**
   ```bash
   npm run prisma:migrate
   ```

5. **Seed database** (optional)
   ```bash
   npm run prisma:seed
   ```

**Note:** Prisma handles the database differences automatically!

---

## Performance Tips

1. **Use indexes** for frequently queried fields
2. **Implement pagination** for large datasets
3. **Use `select`** to limit returned fields
4. **Batch operations** when possible
5. **Use transactions** for related operations
6. **Monitor query performance** with Prisma logging

### Enable Query Logging

In `backend/src/index.ts`:
```typescript
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});
```

---

## Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Prisma Client API](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
- [Backend README](../backend/README.md)
- [Environment Variables](ENVIRONMENT.md)
