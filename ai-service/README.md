# AI Service for Home Budget Manager

Python-based microservice for document processing and AI-powered categorization.

## Features

- PDF bank statement parsing
- Receipt OCR with Tesseract
- Transaction categorization using ML

## Setup

### Prerequisites

- Python 3.9 or higher
- Tesseract OCR installed on your system

#### Installing Tesseract

**Windows:**
Download and install from: https://github.com/UB-Mannheim/tesseract/wiki

**macOS:**
```bash
brew install tesseract
```

**Linux:**
```bash
sudo apt-get install tesseract-ocr
```

### Installation

1. Create a virtual environment:
```bash
python -m venv venv
```

2. Activate the virtual environment:

**Windows:**
```bash
venv\Scripts\activate
```

**macOS/Linux:**
```bash
source venv/bin/activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Copy `.env.example` to `.env` and configure:
```bash
cp .env.example .env
```

5. On Windows, update the `TESSERACT_CMD` path in `.env` if needed.

## Running the Service

```bash
python main.py
```

The service will start on `http://localhost:8001`

## API Endpoints

- `POST /parse/pdf` - Parse bank statement PDF
- `POST /parse/receipt` - Parse receipt image with OCR
- `POST /categorize` - Suggest category for transaction
- `POST /train` - Update categorization model

## Development

Run with auto-reload:
```bash
uvicorn main:app --reload --port 8001
```
