"""
Router for PDF parsing endpoints.
"""
import os
import tempfile
import asyncio
from concurrent.futures import ThreadPoolExecutor
from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import List

from schemas import ParsePDFResponse, TransactionData
from parsers.gemini_pdf_parser import create_pdf_parser

router = APIRouter()
# Use Gemini parser if API key is available, otherwise fallback to regex parser
pdf_parser = create_pdf_parser(use_gemini=True)

# Thread pool for running blocking operations
executor = ThreadPoolExecutor(max_workers=4)


@router.post("/pdf", response_model=ParsePDFResponse)
async def parse_pdf(file: UploadFile = File(...)):
    """
    Parse a bank statement PDF and extract transactions.
    
    Args:
        file: Uploaded PDF file
        
    Returns:
        ParsePDFResponse with extracted transactions
    """
    # Validate file type
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="File must be a PDF")
    
    tmp_file_path = None
    
    # Save uploaded file temporarily
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp_file:
            content = await file.read()
            tmp_file.write(content)
            tmp_file_path = tmp_file.name
        
        print(f"📤 Starting PDF parsing for: {file.filename}")
        
        # Parse PDF in a thread pool to avoid blocking the event loop
        loop = asyncio.get_event_loop()
        transactions_data = await loop.run_in_executor(
            executor,
            pdf_parser.parse_pdf,
            tmp_file_path
        )
        
        print(f"📥 Received {len(transactions_data)} transactions from parser")
        
        # Convert to TransactionData objects
        transactions = []
        for trans in transactions_data:
            try:
                transaction = TransactionData(
                    date=trans['date'],
                    amount=trans['amount'],
                    description=trans['description'],
                    type=trans['type']
                )
                transactions.append(transaction)
            except Exception as e:
                print(f"❌ Error creating transaction object: {e}")
                print(f"   Transaction data: {trans}")
                continue
        
        print(f"✅ Returning {len(transactions)} valid transactions to backend")
        
        response = ParsePDFResponse(
            success=True,
            transactions=transactions,
            message=f"Successfully parsed {len(transactions)} transactions"
        )
        
        return response
    
    except Exception as e:
        print(f"❌ PDF parsing error: {e}")
        raise HTTPException(status_code=500, detail=f"Error parsing PDF: {str(e)}")
    
    finally:
        # Clean up temporary file
        if tmp_file_path and os.path.exists(tmp_file_path):
            os.unlink(tmp_file_path)
            print(f"🗑️  Cleaned up temp file")
