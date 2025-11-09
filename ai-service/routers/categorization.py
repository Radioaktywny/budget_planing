"""
Router for transaction categorization endpoints.
"""
from fastapi import APIRouter, HTTPException

from schemas import CategorizeRequest, CategorizeResponse, CategorySuggestion
from schemas import TrainRequest, TrainResponse
from models.categorizer import get_categorizer

router = APIRouter()


@router.post("/categorize", response_model=CategorizeResponse)
async def categorize_transaction(request: CategorizeRequest):
    """
    Suggest a category for a transaction based on description.
    
    Args:
        request: CategorizeRequest with transaction description
        
    Returns:
        CategorizeResponse with category suggestion
    """
    try:
        categorizer = get_categorizer()
        category, confidence = categorizer.categorize(
            description=request.description,
            amount=request.amount
        )
        
        return CategorizeResponse(
            success=True,
            suggestion=CategorySuggestion(
                category=category,
                confidence=confidence
            )
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Categorization failed: {str(e)}"
        )


@router.post("/train", response_model=TrainResponse)
async def train_categorization(request: TrainRequest):
    """
    Train the categorization model with user feedback.
    
    Args:
        request: TrainRequest with transaction description and correct category
        
    Returns:
        TrainResponse indicating success
    """
    try:
        categorizer = get_categorizer()
        success = categorizer.learn(
            description=request.description,
            category=request.category,
            amount=request.amount
        )
        
        if success:
            return TrainResponse(
                success=True,
                message="Training data recorded successfully"
            )
        else:
            return TrainResponse(
                success=False,
                message="Failed to record training data"
            )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Training failed: {str(e)}"
        )
