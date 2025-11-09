# Database Maintenance Scripts

This directory contains utility scripts for database maintenance and data analysis.

## Analyze Transfer Transactions

**File:** `fixTransferTransactions.ts`

**Purpose:** Analyzes transactions with "Transfer" category to help you understand how transfers are being handled in your system.

**What it does:**
1. Finds all categories with "transfer" in the name
2. Lists all transactions using those categories
3. Shows breakdown by type (Income/Expense/Transfer)
4. Calculates total amounts
5. Confirms that these transactions are excluded from reports

**How to run:**

```bash
# From the backend directory
npx tsx src/scripts/fixTransferTransactions.ts
```

**When to use:**
- To verify that your transfer transactions are being excluded from reports
- To see how many transfers you have and their total amounts
- To understand which transactions are marked with transfer categories

**Note:** This is an analysis script only - it doesn't modify any data.

## How Transfer Exclusion Works

The report service automatically excludes transactions from income/expense calculations if:
1. The transaction type is `TRANSFER`, OR
2. The transaction has a category containing "transfer" (case-insensitive)

This means:
- You can mark transfers as Income or Expense with a "Transfer" category
- They will still be excluded from your reports
- No need to change transaction types or categories
- Works automatically for both existing and new transactions

## Import Service Auto-Detection

The import service automatically detects transfers based on category name. If a transaction has a category containing "transfer" (case-insensitive), it will:
- Automatically set the type to TRANSFER
- Not assign a category (transfers don't need categories)
- Be excluded from income/expense reports

This means future imports will handle transfers correctly automatically.
