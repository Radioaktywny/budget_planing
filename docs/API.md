# API Documentation

Base URL: `http://localhost:3001/api`

All endpoints return JSON responses. Error responses follow a consistent format:

```json
{
  "error": "Error message description"
}
```

## Table of Contents

- [Accounts](#accounts)
- [Transactions](#transactions)
- [Categories](#categories)
- [Tags](#tags)
- [Documents](#documents)
- [Import](#import)
- [Reports](#reports)
- [AI/Categorization](#aicategorization)

---

## Accounts

### List All Accounts

```
GET /accounts
```

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Checking Account",
    "type": "CHECKING",
    "balance": "1500.00",
    "userId": "uuid",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
]
```

**Account Types:** `CHECKING`, `SAVINGS`, `CREDIT_CARD`, `CASH`

### Create Account

```
POST /accounts
```

**Request Body:**
```json
{
  "name": "Savings Account",
  "type": "SAVINGS"
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "name": "Savings Account",
  "type": "SAVINGS",
  "balance": "0.00",
  "userId": "uuid",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

### Update Account

```
PUT /accounts/:id
```

**Request Body:**
```json
{
  "name": "Updated Account Name",
  "type": "CHECKING"
}
```

**Response:** `200 OK` (same format as Create)

### Delete Account

```
DELETE /accounts/:id
```

**Response:** `204 No Content`

**Note:** Cannot delete accounts with existing transactions.

### Get Account Balance

```
GET /accounts/:id/balance
```

**Response:**
```json
{
  "accountId": "uuid",
  "balance": "1500.00",
  "lastUpdated": "2024-01-15T10:30:00.000Z"
}
```

---

## Transactions

### List Transactions

```
GET /transactions
```

**Query Parameters:**
- `startDate` (optional): ISO date string (YYYY-MM-DD)
- `endDate` (optional): ISO date string (YYYY-MM-DD)
- `accountId` (optional): Filter by account UUID
- `categoryId` (optional): Filter by category UUID
- `tags` (optional): Comma-separated tag names
- `search` (optional): Search in description
- `type` (optional): `INCOME`, `EXPENSE`, or `TRANSFER`
- `sortBy` (optional): Field to sort by (default: `date`)
- `sortOrder` (optional): `asc` or `desc` (default: `desc`)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50)

**Response:**
```json
{
  "transactions": [
    {
      "id": "uuid",
      "date": "2024-01-15T00:00:00.000Z",
      "amount": "50.00",
      "type": "EXPENSE",
      "description": "Grocery Store",
      "notes": "Weekly shopping",
      "accountId": "uuid",
      "categoryId": "uuid",
      "userId": "uuid",
      "documentId": "uuid",
      "isParent": false,
      "parentId": null,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z",
      "account": {
        "id": "uuid",
        "name": "Checking Account",
        "type": "CHECKING"
      },
      "category": {
        "id": "uuid",
        "name": "Food & Dining",
        "color": "#FF6B6B"
      },
      "tags": [
        {
          "tag": {
            "id": "uuid",
            "name": "groceries"
          }
        }
      ],
      "transfer": null,
      "splitItems": []
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "totalPages": 3
  },
  "summary": {
    "totalIncome": "3000.00",
    "totalExpenses": "1500.00",
    "netBalance": "1500.00"
  }
}
```

### Create Transaction

```
POST /transactions
```

**Request Body:**
```json
{
  "date": "2024-01-15",
  "amount": 50.00,
  "type": "EXPENSE",
  "description": "Grocery Store",
  "notes": "Weekly shopping",
  "accountId": "uuid",
  "categoryId": "uuid",
  "tags": ["groceries", "weekly"]
}
```

**Response:** `201 Created` (transaction object)

### Update Transaction

```
PUT /transactions/:id
```

**Request Body:** Same as Create

**Response:** `200 OK` (updated transaction object)

### Delete Transaction

```
DELETE /transactions/:id
```

**Response:** `204 No Content`

**Note:** Deleting a parent transaction also deletes all child items.

### Create Transfer

```
POST /transactions/transfer
```

**Request Body:**
```json
{
  "date": "2024-01-15",
  "amount": 500.00,
  "description": "Transfer to Savings",
  "fromAccountId": "uuid",
  "toAccountId": "uuid"
}
```

**Response:** `201 Created`
```json
{
  "transfer": {
    "id": "uuid",
    "transactionId": "uuid",
    "fromAccountId": "uuid",
    "toAccountId": "uuid",
    "createdAt": "2024-01-15T10:30:00.000Z"
  },
  "transaction": { /* transaction object */ }
}
```

### Create Split Transaction

```
POST /transactions/split
```

**Request Body:**
```json
{
  "date": "2024-01-15",
  "amount": 85.50,
  "type": "EXPENSE",
  "description": "Walmart Receipt",
  "accountId": "uuid",
  "items": [
    {
      "amount": 35.00,
      "description": "Groceries",
      "categoryId": "uuid"
    },
    {
      "amount": 40.00,
      "description": "USB Cable",
      "categoryId": "uuid"
    },
    {
      "amount": 10.50,
      "description": "Shampoo",
      "categoryId": "uuid"
    }
  ]
}
```

**Response:** `201 Created`
```json
{
  "parent": { /* parent transaction object */ },
  "items": [ /* array of child transaction objects */ ]
}
```

**Note:** Sum of item amounts must equal parent amount.

### Get Split Transaction Items

```
GET /transactions/:id/items
```

**Response:**
```json
{
  "parent": { /* parent transaction object */ },
  "items": [ /* array of child transaction objects */ ]
}
```

### Bulk Create Transactions

```
POST /transactions/bulk
```

**Request Body:**
```json
{
  "transactions": [
    {
      "date": "2024-01-15",
      "amount": 50.00,
      "type": "EXPENSE",
      "description": "Transaction 1",
      "accountId": "uuid",
      "categoryId": "uuid"
    },
    {
      "date": "2024-01-16",
      "amount": 100.00,
      "type": "INCOME",
      "description": "Transaction 2",
      "accountId": "uuid",
      "categoryId": "uuid"
    }
  ]
}
```

**Response:** `201 Created`
```json
{
  "created": 2,
  "transactions": [ /* array of created transaction objects */ ]
}
```

---

## Categories

### List All Categories

```
GET /categories
```

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Food & Dining",
    "parentId": null,
    "userId": "uuid",
    "color": "#FF6B6B",
    "children": [
      {
        "id": "uuid",
        "name": "Groceries",
        "parentId": "parent-uuid",
        "userId": "uuid",
        "color": "#FF8787"
      }
    ]
  }
]
```

### Create Category

```
POST /categories
```

**Request Body:**
```json
{
  "name": "Entertainment",
  "parentId": null,
  "color": "#4ECDC4"
}
```

**Response:** `201 Created` (category object)

### Update Category

```
PUT /categories/:id
```

**Request Body:**
```json
{
  "name": "Updated Name",
  "parentId": "uuid",
  "color": "#95E1D3"
}
```

**Response:** `200 OK` (updated category object)

### Delete Category

```
DELETE /categories/:id
```

**Query Parameters:**
- `reassignTo` (required if category has transactions): UUID of category to reassign transactions to

**Response:** `204 No Content`

---

## Tags

### List All Tags

```
GET /tags
```

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "groceries",
    "userId": "uuid",
    "_count": {
      "transactions": 25
    }
  }
]
```

### Create Tag

```
POST /tags
```

**Request Body:**
```json
{
  "name": "vacation"
}
```

**Response:** `201 Created` (tag object)

### Delete Tag

```
DELETE /tags/:id
```

**Response:** `204 No Content`

**Note:** Deleting a tag removes it from all transactions.

---

## Documents

### Upload Document

```
POST /documents/upload
```

**Content-Type:** `multipart/form-data`

**Form Data:**
- `file`: File to upload (PDF, JPEG, PNG)

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "filename": "generated-filename.pdf",
  "originalName": "bank_statement.pdf",
  "mimeType": "application/pdf",
  "size": 524288,
  "path": "uploads/documents/generated-filename.pdf",
  "uploadedAt": "2024-01-15T10:30:00.000Z"
}
```

**Limits:**
- Max file size: 10MB
- Allowed types: PDF, JPEG, PNG

### Download Document

```
GET /documents/:id
```

**Response:** File download

### Parse Document

```
POST /documents/parse
```

**Request Body:**
```json
{
  "documentId": "uuid",
  "type": "bank_statement"
}
```

**Document Types:** `bank_statement`, `receipt`

**Response:** `200 OK`
```json
{
  "documentId": "uuid",
  "transactions": [
    {
      "date": "2024-01-15",
      "amount": 50.00,
      "description": "Grocery Store",
      "type": "EXPENSE"
    }
  ]
}
```

### Get Document Transactions

```
GET /documents/:id/transactions
```

**Response:**
```json
{
  "document": { /* document object */ },
  "transactions": [ /* array of transaction objects */ ]
}
```

---

## Import

### Import from JSON

```
POST /import/json
```

**Content-Type:** `multipart/form-data`

**Form Data:**
- `file`: JSON file

**Response:** `200 OK`
```json
{
  "transactions": [ /* array of parsed transactions */ ],
  "metadata": {
    "version": "1.0",
    "source": "external_ai_parser"
  }
}
```

### Import from YAML

```
POST /import/yaml
```

**Content-Type:** `multipart/form-data`

**Form Data:**
- `file`: YAML file

**Response:** Same as JSON import

### Get Import Schema

```
GET /import/schema
```

**Response:**
```json
{
  "version": "1.0",
  "schema": { /* JSON schema object */ },
  "examples": {
    "json": "...",
    "yaml": "..."
  }
}
```

### Validate Import File

```
POST /import/validate
```

**Content-Type:** `multipart/form-data`

**Form Data:**
- `file`: JSON or YAML file

**Response:** `200 OK`
```json
{
  "valid": true,
  "errors": [],
  "warnings": [
    "Account 'Unknown Account' not found"
  ],
  "transactionCount": 15
}
```

---

## Reports

### Get Summary Report

```
GET /reports/summary
```

**Query Parameters:**
- `startDate` (required): ISO date string (YYYY-MM-DD)
- `endDate` (required): ISO date string (YYYY-MM-DD)

**Response:**
```json
{
  "period": {
    "startDate": "2024-01-01",
    "endDate": "2024-01-31"
  },
  "summary": {
    "totalIncome": "3000.00",
    "totalExpenses": "1500.00",
    "netBalance": "1500.00",
    "transactionCount": 45
  },
  "accountBalances": [
    {
      "accountId": "uuid",
      "accountName": "Checking Account",
      "balance": "1500.00"
    }
  ]
}
```

### Get Category Breakdown

```
GET /reports/category-breakdown
```

**Query Parameters:**
- `startDate` (required): ISO date string
- `endDate` (required): ISO date string
- `type` (optional): `INCOME` or `EXPENSE` (default: `EXPENSE`)

**Response:**
```json
{
  "period": {
    "startDate": "2024-01-01",
    "endDate": "2024-01-31"
  },
  "breakdown": [
    {
      "categoryId": "uuid",
      "categoryName": "Food & Dining",
      "amount": "450.00",
      "percentage": 30.0,
      "transactionCount": 15
    }
  ],
  "total": "1500.00"
}
```

### Get Net Balance Over Time

```
GET /reports/net-balance
```

**Query Parameters:**
- `startDate` (required): ISO date string
- `endDate` (required): ISO date string
- `interval` (optional): `day`, `week`, `month` (default: `month`)

**Response:**
```json
{
  "period": {
    "startDate": "2024-01-01",
    "endDate": "2024-12-31"
  },
  "data": [
    {
      "period": "2024-01",
      "income": "3000.00",
      "expenses": "1500.00",
      "netBalance": "1500.00"
    }
  ]
}
```

### Export PDF Report

```
POST /reports/export/pdf
```

**Request Body:**
```json
{
  "startDate": "2024-01-01",
  "endDate": "2024-01-31",
  "includeTransactions": true,
  "includeCharts": true
}
```

**Response:** PDF file download

**Content-Type:** `application/pdf`

### Export Excel Report

```
POST /reports/export/excel
```

**Request Body:**
```json
{
  "startDate": "2024-01-01",
  "endDate": "2024-01-31",
  "includeTransactions": true
}
```

**Response:** Excel file download

**Content-Type:** `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`

---

## AI/Categorization

### Suggest Category

```
POST /ai/suggest-category
```

**Request Body:**
```json
{
  "description": "Walmart Grocery",
  "amount": 85.50
}
```

**Response:**
```json
{
  "categoryId": "uuid",
  "categoryName": "Food & Dining",
  "confidence": 0.85
}
```

### Learn from Correction

```
POST /ai/learn
```

**Request Body:**
```json
{
  "description": "Walmart Grocery",
  "categoryId": "uuid",
  "categoryName": "Food & Dining"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Categorization model updated"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Validation error",
  "details": [
    {
      "field": "amount",
      "message": "Amount must be greater than 0"
    }
  ]
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 409 Conflict
```json
{
  "error": "Account with this name already exists"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

### 503 Service Unavailable
```json
{
  "error": "AI service is currently unavailable"
}
```

---

## Rate Limiting

Currently no rate limiting is implemented. This will be added in future versions for production deployment.

## Authentication

The current version uses a default user context. Multi-user authentication with JWT will be added in a future version. See [Authentication Integration Guide](../backend/AUTHENTICATION_INTEGRATION.md) for details on the planned implementation.

## Pagination

List endpoints support pagination with the following query parameters:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 50, max: 100)

Paginated responses include:
```json
{
  "data": [ /* array of items */ ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "totalPages": 3
  }
}
```

## Filtering and Sorting

Most list endpoints support:
- **Filtering**: Use query parameters to filter results
- **Sorting**: Use `sortBy` and `sortOrder` parameters
- **Search**: Use `search` parameter for text search

## Date Formats

All dates should be in ISO 8601 format:
- Date only: `YYYY-MM-DD` (e.g., `2024-01-15`)
- Date and time: `YYYY-MM-DDTHH:mm:ss.sssZ` (e.g., `2024-01-15T10:30:00.000Z`)

## Decimal Precision

All monetary amounts are stored and returned as strings with 2 decimal places to avoid floating-point precision issues.

Example: `"1500.00"` instead of `1500.0`
