# AI Service Tests

## Running Tests

### Setup

1. Ensure you have Python virtual environment activated:
   ```bash
   # Windows
   venv\Scripts\activate
   
   # macOS/Linux
   source venv/bin/activate
   ```

2. Install test dependencies:
   ```bash
   pip install -r requirements.txt
   ```

### Run All Tests

```bash
pytest
```

### Run Specific Test File

```bash
pytest tests/test_pdf_parser.py
```

### Run with Verbose Output

```bash
pytest -v
```

### Run with Coverage

```bash
pip install pytest-cov
pytest --cov=parsers --cov-report=html
```

## Test Structure

- `test_pdf_parser.py` - Tests for PDF parsing functionality
  - Text extraction from PDFs
  - Transaction pattern recognition
  - Date and amount parsing
  - Structured data output validation

## Test Coverage

The PDF parser tests cover:
- Multiple date formats (MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD)
- Various transaction patterns
- Amount parsing with currency symbols
- Description cleaning and normalization
- Transaction deduplication
- Structured data output validation
- Edge cases (empty text, no transactions, complex statements)
