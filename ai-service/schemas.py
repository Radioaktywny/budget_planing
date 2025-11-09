"""
Pydantic schemas for request/response validation.
"""
from typing import List, Optional
from datetime import date
from pydantic import BaseModel, Field


class TransactionData(BaseModel):
    """Parsed transaction data."""
    date: str = Field(..., description="Transaction date in YYYY-MM-DD format")
    amount: float = Field(..., gt=0, description="Transaction amount")
    description: str = Field(..., description="Transaction description")
    type: str = Field(default="expense", description="Transaction type: income or expense")
    category: Optional[str] = Field(None, description="Suggested category")
    account: Optional[str] = Field(None, description="Detected account name")
    confidence: Optional[float] = Field(None, ge=0, le=1, description="Confidence score for category")


class ParsePDFResponse(BaseModel):
    """Response from PDF parsing."""
    success: bool
    transactions: List[TransactionData]
    message: Optional[str] = None


class ParseReceiptResponse(BaseModel):
    """Response from receipt parsing."""
    success: bool
    transaction: Optional[TransactionData] = None
    items: Optional[List[dict]] = None
    message: Optional[str] = None


class CategorySuggestion(BaseModel):
    """Category suggestion for a transaction."""
    category: str
    confidence: float = Field(..., ge=0, le=1)


class CategorizeRequest(BaseModel):
    """Request to categorize a transaction."""
    description: str
    amount: Optional[float] = None


class CategorizeResponse(BaseModel):
    """Response from categorization."""
    success: bool
    suggestion: Optional[CategorySuggestion] = None
    message: Optional[str] = None


class TrainRequest(BaseModel):
    """Request to train categorization model."""
    description: str
    category: str
    amount: Optional[float] = None


class TrainResponse(BaseModel):
    """Response from training."""
    success: bool
    message: str
