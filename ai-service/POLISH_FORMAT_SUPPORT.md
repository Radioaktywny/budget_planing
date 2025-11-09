# Polish Format Support for PDF Parsing

The PDF parser now supports Polish bank statement formats in addition to English formats.

## Supported Polish Formats

### Date Formats
- `DD.MM.YYYY` (e.g., `15.01.2024`)
- `DD.MM.YY` (e.g., `15.01.24`)

### Amount Formats
- Comma as decimal separator: `149,06 zł`
- Space as thousands separator: `1 234,56 zł`
- Period as thousands separator: `1.234,56 zł`
- Currency symbols: `zł`, `PLN`

### Examples

**Polish Format:**
```
15.01.2024  Zakup w sklepie  149,06 zł
20.01.2024  Przelew         1 234,56 PLN
```

**English Format (still supported):**
```
01/15/2024  Store purchase  $149.06
01/20/2024  Transfer        $1,234.56
```

## How It Works

### Amount Parsing Logic

1. **Comma with 2 digits after**: Treated as decimal separator
   - `149,06` → `149.06`
   - `10,00` → `10.00`

2. **Period with 2 digits after**: Treated as decimal separator
   - `149.06` → `149.06`

3. **Comma with more than 2 digits**: Treated as thousands separator
   - `1,234` → `1234`

4. **Period with more than 2 digits**: Treated as thousands separator
   - `1.234` → `1234`

5. **Both comma and period**: Last one determines decimal separator
   - `1.234,56` → `1234.56` (Polish format)
   - `1,234.56` → `1234.56` (English format)

6. **Spaces removed**: Polish uses spaces in large numbers
   - `1 234,56` → `1234.56`

### Date Parsing

The parser tries multiple date formats in order:
1. Polish: `DD.MM.YYYY`, `DD.MM.YY`
2. English: `MM/DD/YYYY`, `DD/MM/YYYY`, etc.
3. ISO: `YYYY-MM-DD`

## Testing

To test Polish amount parsing:

```bash
cd ai-service/parsers
python test_polish_amounts.py
```

## Troubleshooting

### Wrong amounts (e.g., 14906 instead of 149.06)

This was caused by treating the comma as a thousands separator. The updated parser now:
- Checks the number of digits after comma/period
- If exactly 2 digits follow, treats it as decimal separator
- If more than 2 digits, treats it as thousands separator

### Missing categories

The AI categorization model may need more training data for Polish transaction descriptions. Consider:
1. Manually categorizing a few transactions
2. The AI will learn from your categorizations
3. Over time, accuracy will improve

### Wrong transaction types

Polish bank statements may use different indicators for income/expense. The parser looks for:
- Negative amounts or minus signs for expenses
- Positive amounts or plus signs for income

If your bank uses different conventions, you can manually adjust after import.

## Future Improvements

Potential enhancements for Polish support:
- Better recognition of Polish merchant names
- Polish-specific transaction type keywords
- Support for more Polish banks' specific formats
- Training the AI model on Polish transaction data
