"""
Router for PDF parsing endpoints.
"""
import os
import tempfile
import asyncio
from concurrent.futures import ThreadPoolExecutor
from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from typing import List

from schemas import ParsePDFResponse, TransactionData
from parsers.gemini_pdf_parser import create_pdf_parser

router = APIRouter()
# Use Gemini parser if API key is available, otherwise fallback to regex parser
pdf_parser = create_pdf_parser(use_gemini=True)

# Thread pool for running blocking operations
executor = ThreadPoolExecutor(max_workers=4)


@router.post("/pdf", response_model=ParsePDFResponse)
async def parse_pdf(
    file: UploadFile = File(...),
    categories: str = Form(""),
    accounts: str = Form("")
):
    """
    Parse a bank statement PDF and extract transactions.
    
    Args:
        file: Uploaded PDF file
        categories: Comma-separated list of existing category names
        accounts: Comma-separated list of existing account names
        
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
        
        # Parse categories and accounts
        category_list = [c.strip() for c in categories.split(',') if c.strip()] if categories else None
        account_list = [a.strip() for a in accounts.split(',') if a.strip()] if accounts else None
        
        if category_list:
            print(f"📋 Using {len(category_list)} existing categories")
        if account_list:
            print(f"🏦 Using {len(account_list)} existing accounts")
        
        # Parse PDF in a thread pool to avoid blocking the event loop
        loop = asyncio.get_event_loop()
        transactions_data = await loop.run_in_executor(
            executor,
            pdf_parser.parse_pdf,
            tmp_file_path,
            category_list,
            account_list
        )
        
        print(f"📥 Received {len(transactions_data)} transactions from parser")
        
        # Debug: Check first transaction data
        if transactions_data and len(transactions_data) > 0:
            first = transactions_data[0]
            print(f"🔍 First transaction raw: category={first.get('category')}, account={first.get('account')}")
        
        # Convert to TransactionData objects
        transactions = []
        for trans in transactions_data:
            try:
                transaction = TransactionData(
                    date=trans['date'],
                    amount=trans['amount'],
                    description=trans['description'],
                    type=trans['type'],
                    category=trans.get('category'),
                    account=trans.get('account')
                )
                transactions.append(transaction)
            except Exception as e:
                print(f"❌ Error creating transaction object: {e}")
                print(f"   Transaction data: {trans}")
                continue
        
        print(f"✅ Returning {len(transactions)} valid transactions to backend")
        
        # Debug: Log first transaction being returned
        if transactions and len(transactions) > 0:
            first_tx = transactions[0]
            print(f"🚀 Sending to backend - First transaction:")
            print(f"   category={first_tx.category}, account={first_tx.account}")
        
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
