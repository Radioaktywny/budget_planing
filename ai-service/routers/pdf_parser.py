"""
Router for PDF parsing endpoints.
"""
import os
import tempfile
from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import List

from schemas import ParsePDFResponse, TransactionData
from parsers.pdf_parser import PDFParser

router = APIRouter()
pdf_parser = PDFParser()


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
    
    # Save uploaded file temporarily
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp_file:
            content = await file.read()
            tmp_file.write(content)
            tmp_file_path = tmp_file.name
        
        # Parse PDF
        transactions_data = pdf_parser.parse_pdf(tmp_file_path)
        
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
                print(f"Error creating transaction object: {e}")
                continue
        
        return ParsePDFResponse(
            success=True,
            transactions=transactions,
            message=f"Successfully parsed {len(transactions)} transactions"
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error parsing PDF: {str(e)}")
    
    finally:
        # Clean up temporary file
        if os.path.exists(tmp_file_path):
            os.unlink(tmp_file_path)
