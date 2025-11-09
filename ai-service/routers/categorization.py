"""
Router for transaction categorization endpoints.
"""
from fastapi import APIRouter, HTTPException

from schemas import CategorizeRequest, CategorizeResponse, CategorySuggestion
from schemas import TrainRequest, TrainResponse

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
    # Placeholder implementation - will be enhanced in future tasks
    # For now, return a basic categorization based on keywords
    
    description_lower = request.description.lower()
    
    # Simple keyword-based categorization
    category_keywords = {
        "Food & Dining": ["grocery", "restaurant", "food", "cafe", "coffee", "lunch", "dinner"],
        "Transportation": ["gas", "fuel", "uber", "lyft", "taxi", "parking", "transit"],
        "Shopping": ["amazon", "walmart", "target", "store", "shop"],
        "Utilities": ["electric", "water", "gas", "internet", "phone", "utility"],
        "Entertainment": ["movie", "netflix", "spotify", "game", "concert"],
        "Healthcare": ["doctor", "pharmacy", "hospital", "medical", "health"],
        "Housing": ["rent", "mortgage", "insurance", "hoa"],
    }
    
    for category, keywords in category_keywords.items():
        for keyword in keywords:
            if keyword in description_lower:
                return CategorizeResponse(
                    success=True,
                    suggestion=CategorySuggestion(
                        category=category,
                        confidence=0.7
                    )
                )
    
    # Default to uncategorized
    return CategorizeResponse(
        success=True,
        suggestion=CategorySuggestion(
            category="Uncategorized",
            confidence=0.3
        )
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
    # Placeholder implementation - will be enhanced in future tasks
    # This will store the training data and update the ML model
    
    return TrainResponse(
        success=True,
        message="Training data recorded successfully"
    )
