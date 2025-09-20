"""
Health check endpoints
"""

from fastapi import APIRouter, Depends
from app.core.database import get_db
from app.core.models import ModelManager
from app.core.logging import get_logger

router = APIRouter()
logger = get_logger(__name__)


@router.get("/")
async def health_check():
    """Basic health check"""
    return {
        "status": "healthy",
        "service": "MorphFlux AI Service",
        "version": "1.0.0"
    }


@router.get("/detailed")
async def detailed_health_check(db=Depends(get_db)):
    """Detailed health check with dependencies"""
    try:
        # Check database
        await db.execute("SELECT 1")
        db_status = "healthy"
    except Exception as e:
        logger.error("Database health check failed", error=str(e))
        db_status = "unhealthy"
    
    # Check models (this would be injected from the app state)
    # For now, we'll return a placeholder
    models_status = "healthy"
    
    overall_status = "healthy" if db_status == "healthy" and models_status == "healthy" else "unhealthy"
    
    return {
        "status": overall_status,
        "service": "MorphFlux AI Service",
        "version": "1.0.0",
        "dependencies": {
            "database": db_status,
            "models": models_status
        }
    }
