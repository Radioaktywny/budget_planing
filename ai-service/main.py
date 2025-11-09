"""
Main FastAPI application for AI document processing service.
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from routers import pdf_parser, receipt_parser, categorization

# Load environment variables
load_dotenv()

app = FastAPI(
    title="Budget Manager AI Service",
    description="AI-powered document parsing and categorization service",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # React dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(pdf_parser.router, prefix="/parse", tags=["PDF Parsing"])
app.include_router(receipt_parser.router, prefix="/parse", tags=["Receipt Parsing"])
app.include_router(categorization.router, prefix="", tags=["Categorization"])

@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "status": "ok",
        "service": "Budget Manager AI Service",
        "version": "1.0.0"
    }

@app.get("/health")
async def health():
    """Detailed health check."""
    return {
        "status": "healthy",
        "services": {
            "pdf_parser": "available",
            "receipt_parser": "available",
            "categorization": "available"
        }
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8001))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run(app, host=host, port=port)
