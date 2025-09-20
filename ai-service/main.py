"""
MorphFlux Studio AI Service
FastAPI-based service for AI-powered image transformations
"""

import os
import logging
import asyncio
from contextlib import asynccontextmanager
from typing import Dict, Any, Optional
import uvicorn
from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
import structlog

from app.core.config import settings
from app.core.database import init_db
from app.core.logging import setup_logging
from app.api.v1.api import api_router
from app.core.exceptions import MorphFluxException
from app.core.middleware import add_middleware

# Setup structured logging
setup_logging()
logger = structlog.get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    logger.info("Starting MorphFlux AI Service", version=settings.VERSION)
    
    # Initialize database
    await init_db()
    logger.info("Database initialized")
    
    # Load AI models
    from app.core.models import ModelManager
    model_manager = ModelManager()
    await model_manager.load_models()
    app.state.model_manager = model_manager
    logger.info("AI models loaded")
    
    yield
    
    # Shutdown
    logger.info("Shutting down MorphFlux AI Service")


# Create FastAPI application
app = FastAPI(
    title="MorphFlux Studio AI Service",
    description="AI-powered image transformation service",
    version=settings.VERSION,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    lifespan=lifespan
)

# Add middleware
add_middleware(app)

# Include API routes
app.include_router(api_router, prefix="/api/v1")


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "MorphFlux Studio AI Service",
        "version": settings.VERSION,
        "status": "healthy",
        "endpoints": {
            "health": "/health",
            "docs": "/docs" if settings.DEBUG else "disabled",
            "api": "/api/v1"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Check database connection
        from app.core.database import get_db
        db = await get_db()
        await db.execute("SELECT 1")
        
        # Check model manager
        model_manager = app.state.model_manager
        model_status = model_manager.get_status()
        
        return {
            "status": "healthy",
            "database": "connected",
            "models": model_status,
            "version": settings.VERSION
        }
    except Exception as e:
        logger.error("Health check failed", error=str(e))
        raise HTTPException(status_code=503, detail="Service unhealthy")


@app.exception_handler(MorphFluxException)
async def morphflux_exception_handler(request, exc: MorphFluxException):
    """Handle custom MorphFlux exceptions"""
    logger.error(
        "MorphFlux exception",
        error=exc.message,
        status_code=exc.status_code,
        path=request.url.path
    )
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.message,
            "code": exc.code,
            "details": exc.details
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc: Exception):
    """Handle general exceptions"""
    logger.error(
        "Unhandled exception",
        error=str(exc),
        path=request.url.path,
        exc_info=True
    )
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "code": "INTERNAL_ERROR"
        }
    )


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="info" if not settings.DEBUG else "debug"
    )
