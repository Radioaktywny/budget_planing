"""
Router for receipt OCR parsing endpoints.
"""
import os
import tempfile
from fastapi import APIRouter, UploadFile, File, HTTPException

from schemas import ParseReceiptResponse, TransactionData
from parsers.receipt_parser import ReceiptParser

router = APIRouter()
receipt_parser = ReceiptParser()


@router.post("/receipt", response_model=ParseReceiptResponse)
async def parse_receipt(file: UploadFile = File(...)):
    """
    Parse a receipt image using OCR and extract transaction data.
    
    Args:
        file: Uploaded image file (JPEG, PNG)
        
    Returns:
        ParseReceiptResponse with extracted transaction and items
    """
    # Validate file type
    allowed_extensions = ['.jpg', '.jpeg', '.png']
    file_ext = os.path.splitext(file.filename)[1].lower()
    
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail="File must be a JPEG or PNG image"
        )
    
    # Save uploaded file temporarily
    tmp_file_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as tmp_file:
            content = await file.read()
            tmp_file.write(content)
            tmp_file_path = tmp_file.name
        
        # Parse receipt
        result = receipt_parser.parse_receipt(tmp_file_path)
        
        # Convert transaction data
        transaction_data = result.get('transaction')
        if transaction_data:
            transaction = TransactionData(
                date=transaction_data['date'],
                amount=transaction_data['amount'],
                description=transaction_data['description'],
                type=transaction_data['type']
            )
        else:
            transaction = None
        
        items = result.get('items', [])
        
        return ParseReceiptResponse(
            success=True,
            transaction=transaction,
            items=items,
            message=f"Successfully parsed receipt with {len(items)} items"
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error parsing receipt: {str(e)}"
        )
    
    finally:
        # Clean up temporary file
        if tmp_file_path and os.path.exists(tmp_file_path):
            os.unlink(tmp_file_path)
