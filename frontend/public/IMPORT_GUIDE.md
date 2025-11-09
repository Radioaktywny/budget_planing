# JSON/YAML Import Guide

## Overview

The Home Budget Manager supports importing transactions from JSON and YAML files. This feature is useful when you want to:
- Use external AI tools to parse documents and export structured data
- Bulk import transactions from other systems
- Manually create transaction files for batch import

## Accessing the Import Feature

1. Navigate to the "Import" page from the main navigation
2. Click "Import from JSON/YAML" button in the top-right corner
3. Or directly visit `/import-data` route

## File Format

### Required Fields

Every import file must include:
- `version`: Schema version (currently "1.0")
- `transactions`: Array of transaction objects

### Transaction Fields

Each transaction must have:
- `date`: Date in YYYY-MM-DD format (required)
- `amount`: Positive number (required)
- `type`: One of "income", "expense", or "transfer" (required)
- `description`: Transaction description (required)
- `account`: Account name that matches an existing account (required)

Optional fields:
- `category`: Category name (will be created if it doesn't exist)
- `notes`: Additional notes
- `tags`: Array of tag names
- `split`: Boolean for multi-category transactions
- `items`: Array of line items (required if split=true)

### Split Transactions

For receipts with multiple categories, use split transactions:

```json
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
```

**Important**: The sum of item amounts must equal the parent transaction amount.

## Example Files

Example files are provided in the `public` folder:
- `example-import.json` - JSON format example
- `example-import.yaml` - YAML format example

## Import Process

1. **Upload File**: Select a JSON or YAML file from your computer
2. **Validate** (Optional): Click "Validate File" to check for errors before importing
3. **Import and Review**: Click "Import and Review" to parse the file
4. **Review Transactions**: 
   - Edit any transaction details (date, amount, category, etc.)
   - Select/deselect transactions to import
   - Convert regular transactions to split transactions if needed
   - Add or remove split transaction items
5. **Approve**: Click "Approve Selected" or "Approve All" to import

## Validation

The system validates:
- JSON/YAML syntax
- Required fields presence
- Date format (YYYY-MM-DD)
- Amount values (must be positive)
- Transaction type (income/expense/transfer)
- Account existence (must match existing account)
- Split transaction item sums (must equal parent amount)

## Error Handling

If validation fails, you'll see:
- Specific field errors with the field name and error message
- Line numbers for syntax errors
- Warnings for non-critical issues (e.g., account not found)

## Tips

1. **Account Names**: Make sure account names in your import file exactly match your existing accounts
2. **Categories**: Categories will be automatically created if they don't exist
3. **Tags**: Tags will be automatically created if they don't exist
4. **Split Transactions**: Don't add a category to the parent transaction, only to the items
5. **Validation First**: Use the "Validate File" button to catch errors before importing

## Common Errors

### "Account not found"
- The account name in your file doesn't match any existing account
- Create the account first, or fix the account name in your file

### "Invalid date format"
- Dates must be in YYYY-MM-DD format
- Example: "2024-01-15"

### "Sum of item amounts must equal parent amount"
- For split transactions, the items must add up to the total
- Check your math and adjust item amounts

### "Invalid JSON/YAML format"
- Syntax error in your file
- Use a JSON/YAML validator to check your file syntax

## Support

For more information about the schema, click "Show Schema Documentation" on the import page.
