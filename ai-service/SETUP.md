# AI Service Setup Guide

## Quick Start

### 1. Install Python Dependencies

First, create and activate a virtual environment:

**Windows:**
```bash
python -m venv venv
venv\Scripts\activate
```

**macOS/Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

Then install dependencies:
```bash
pip install -r requirements.txt
```

### 2. Install Tesseract OCR

Tesseract is required for receipt image parsing.

**Windows:**
1. Download installer from: https://github.com/UB-Mannheim/tesseract/wiki
2. Install to default location (usually `C:\Program Files\Tesseract-OCR`)
3. Copy `.env.example` to `.env`
4. Update `TESSERACT_CMD` path in `.env` if needed

**macOS:**
```bash
brew install tesseract
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get update
sudo apt-get install tesseract-ocr
```

### 3. Configure Environment

Copy the example environment file:
```bash
cp .env.example .env
```

Edit `.env` and set the Tesseract path (Windows only):
```
TESSERACT_CMD=C:\Program Files\Tesseract-OCR\tesseract.exe
```

### 4. Run the Service

**Option 1: Using startup script**

Windows:
```bash
start.bat
```

macOS/Linux:
```bash
chmod +x start.sh
./start.sh
```

**Option 2: Direct Python command**
```bash
python main.py
```

**Option 3: With auto-reload (development)**
```bash
uvicorn main:app --reload --port 8001
```

The service will start on `http://localhost:8001`

### 5. Test the Service

Open your browser and navigate to:
- API Documentation: http://localhost:8001/docs
- Health Check: http://localhost:8001/health

## API Endpoints

### PDF Parsing
```bash
POST /parse/pdf
Content-Type: multipart/form-data
Body: file (PDF)
```

### Receipt Parsing
```bash
POST /parse/receipt
Content-Type: multipart/form-data
Body: file (JPEG/PNG)
```

### Categorization
```bash
POST /categorize
Content-Type: application/json
Body: {"description": "Grocery Store", "amount": 50.00}
```

### Training
```bash
POST /train
Content-Type: application/json
Body: {"description": "Grocery Store", "category": "Food & Dining"}
```

## Testing with cURL

**Parse PDF:**
```bash
curl -X POST "http://localhost:8001/parse/pdf" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@statement.pdf"
```

**Parse Receipt:**
```bash
curl -X POST "http://localhost:8001/parse/receipt" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@receipt.jpg"
```

**Categorize Transaction:**
```bash
curl -X POST "http://localhost:8001/categorize" \
  -H "Content-Type: application/json" \
  -d '{"description": "Walmart Grocery", "amount": 85.50}'
```

## Troubleshooting

### Tesseract Not Found Error

If you get an error about Tesseract not being found:

1. Verify Tesseract is installed: `tesseract --version`
2. On Windows, set the path in `.env`:
   ```
   TESSERACT_CMD=C:\Program Files\Tesseract-OCR\tesseract.exe
   ```
3. Restart the service

### Import Errors

If you get import errors, ensure all dependencies are installed:
```bash
pip install -r requirements.txt
```

### Port Already in Use

If port 8001 is already in use, change it in `.env`:
```
PORT=8002
```

Or run with a different port:
```bash
uvicorn main:app --port 8002
```

## Development

### Interactive API Documentation

FastAPI provides automatic interactive API documentation:
- Swagger UI: http://localhost:8001/docs
- ReDoc: http://localhost:8001/redoc

### Adding New Endpoints

1. Create a new router in `routers/`
2. Import and include it in `main.py`
3. Define request/response schemas in `schemas.py`

### Project Structure

```
ai-service/
├── main.py              # FastAPI application entry point
├── schemas.py           # Pydantic models for validation
├── requirements.txt     # Python dependencies
├── routers/            # API endpoint routers
│   ├── pdf_parser.py
│   ├── receipt_parser.py
│   └── categorization.py
├── parsers/            # Document parsing logic
│   ├── pdf_parser.py
│   └── receipt_parser.py
├── models/             # ML models (future)
└── utils/              # Utility functions
```
